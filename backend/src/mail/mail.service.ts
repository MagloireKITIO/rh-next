import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailConfiguration } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { Company } from '../companies/entities/company.entity';

export interface CreateMailConfigDto {
  provider_type?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure?: boolean;
  smtp_require_tls?: boolean;
  from_email: string;
  from_name: string;
  is_active?: boolean;
  is_default?: boolean;
  company_id?: string;
}

export interface UpdateMailConfigDto extends Partial<CreateMailConfigDto> {}

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(MailConfiguration)
    private mailConfigRepository: Repository<MailConfiguration>,
    @InjectRepository(MailConfigurationCompany)
    private mailConfigCompanyRepository: Repository<MailConfigurationCompany>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private configService: ConfigService,
  ) {}

  // CRUD Operations
  async getAllConfigurations(): Promise<MailConfiguration[]> {
    return this.mailConfigRepository.find({
      relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
      order: { created_at: 'DESC' },
    });
  }

  async getConfigurationById(id: string): Promise<MailConfiguration> {
    const config = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
    });

    if (!config) {
      throw new NotFoundException('Configuration mail introuvable');
    }

    return config;
  }

  async createConfiguration(createDto: CreateMailConfigDto): Promise<MailConfiguration> {
    // Vérifier si une configuration par défaut existe déjà si on essaie d'en créer une
    if (createDto.is_default) {
      const existingDefault = await this.mailConfigRepository.findOne({
        where: { is_default: true }
      });

      if (existingDefault) {
        existingDefault.is_default = false;
        await this.mailConfigRepository.save(existingDefault);
      }
    }

    const config = this.mailConfigRepository.create({
      ...createDto,
      provider_type: 'smtp'
    });

    return this.mailConfigRepository.save(config);
  }

  async updateConfiguration(id: string, updateDto: UpdateMailConfigDto): Promise<MailConfiguration> {
    const config = await this.getConfigurationById(id);

    // Si on définit cette config comme par défaut, enlever le flag des autres
    if (updateDto.is_default && !config.is_default) {
      await this.mailConfigRepository.update(
        { is_default: true },
        { is_default: false }
      );
    }

    Object.assign(config, updateDto);
    return this.mailConfigRepository.save(config);
  }

  async deleteConfiguration(id: string): Promise<void> {
    const config = await this.getConfigurationById(id);
    
    if (config.is_default) {
      throw new BadRequestException('Impossible de supprimer la configuration par défaut');
    }

    await this.mailConfigRepository.remove(config);
  }

  async toggleConfigurationStatus(id: string): Promise<MailConfiguration> {
    const config = await this.getConfigurationById(id);
    config.is_active = !config.is_active;
    return this.mailConfigRepository.save(config);
  }

  // Company Assignment Operations
  async assignCompaniesToConfiguration(configId: string, companyIds: string[]): Promise<void> {
    const config = await this.getConfigurationById(configId);

    // Supprimer les anciennes assignations
    await this.mailConfigCompanyRepository.delete({ configuration_id: configId });

    // Créer les nouvelles assignations
    if (companyIds.length > 0) {
      const assignments = companyIds.map(companyId => ({
        configuration_id: configId,
        company_id: companyId
      }));

      await this.mailConfigCompanyRepository.save(assignments);
    }
  }

  async getConfigurationCompanies(configId: string): Promise<MailConfigurationCompany[]> {
    return this.mailConfigCompanyRepository.find({
      where: { configuration_id: configId },
      relations: ['company']
    });
  }

  // Mail Operations
  async getConfigurationForCompany(companyId?: string): Promise<MailConfiguration | null> {
    let config: MailConfiguration | null = null;

    if (companyId) {
      // Chercher une configuration spécifique à l'entreprise
      const companyConfig = await this.mailConfigCompanyRepository.findOne({
        where: { company_id: companyId },
        relations: ['configuration']
      });

      if (companyConfig?.configuration?.is_active) {
        config = companyConfig.configuration;
      }

      // Si pas trouvé, chercher avec l'ancien système (company_id direct)
      if (!config) {
        config = await this.mailConfigRepository.findOne({
          where: { company_id: companyId, is_active: true }
        });
      }
    }

    // Si pas de config spécifique trouvée, prendre la config par défaut
    if (!config) {
      config = await this.mailConfigRepository.findOne({
        where: { is_default: true, is_active: true }
      });
    }

    // En dernier recours, prendre la première config active
    if (!config) {
      config = await this.mailConfigRepository.findOne({
        where: { is_active: true },
        order: { created_at: 'ASC' }
      });
    }

    return config;
  }

  async createTransporter(config?: MailConfiguration): Promise<nodemailer.Transporter> {
    if (!config) {
      config = await this.getConfigurationForCompany();
    }

    if (!config) {
      throw new BadRequestException('Aucune configuration mail disponible');
    }

    const transporterConfig: any = {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      requireTLS: config.smtp_require_tls,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    };

    return nodemailer.createTransport(transporterConfig);
  }

  async sendTestEmail(testEmail: string, companyId?: string): Promise<void> {
    const config = await this.getConfigurationForCompany(companyId);
    
    if (!config) {
      throw new BadRequestException('Aucune configuration mail trouvée');
    }

    const transporter = await this.createTransporter(config);

    const mailOptions = {
      from: `${config.from_name} <${config.from_email}>`,
      to: testEmail,
      subject: 'Test de configuration SMTP - RH Analytics Pro',
      html: `
        <h2>Test de configuration SMTP</h2>
        <p>Ce message confirme que votre configuration SMTP fonctionne correctement.</p>
        <p><strong>Configuration utilisée :</strong></p>
        <ul>
          <li>Serveur : ${config.smtp_host}:${config.smtp_port}</li>
          <li>Utilisateur : ${config.smtp_user}</li>
          <li>SSL : ${config.smtp_secure ? 'Oui' : 'Non'}</li>
          <li>TLS Requis : ${config.smtp_require_tls ? 'Oui' : 'Non'}</li>
        </ul>
        <p>Envoyé depuis RH Analytics Pro</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur envoi email test:', error);
      throw new BadRequestException(`Erreur lors de l'envoi: ${error.message}`);
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    companyId?: string;
  }): Promise<void> {
    const config = await this.getConfigurationForCompany(options.companyId);
    
    if (!config) {
      throw new BadRequestException('Aucune configuration mail trouvée');
    }

    const transporter = await this.createTransporter(config);

    const mailOptions = {
      from: `${config.from_name} <${config.from_email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à ${options.to}`);
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new BadRequestException(`Erreur lors de l'envoi: ${error.message}`);
    }
  }

  /**
   * Envoie un email avec un template
   */
  async sendWithTemplate(
    recipient: string,
    template: any,
    context: Record<string, any>,
    companyId?: string
  ): Promise<void> {
    const config = await this.getConfigurationForCompany(companyId);
    
    if (!config) {
      throw new BadRequestException('Aucune configuration mail trouvée');
    }

    const transporter = await this.createTransporter(config);

    // Remplacer les variables dans le template
    let subject = template.subject;
    let htmlBody = template.html_body;
    let textBody = template.text_body || '';

    // Remplacer les variables {{variable}} par les valeurs du contexte
    Object.keys(context).forEach(key => {
      const value = context[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlBody = htmlBody.replace(regex, value);
      textBody = textBody.replace(regex, value);
    });

    const mailOptions = {
      from: `${config.from_name} <${config.from_email}>`,
      to: recipient,
      subject,
      html: htmlBody,
      text: textBody || undefined,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ [MAIL] Email sent successfully to ${recipient} with template "${template.subject}"`);
    } catch (error) {
      console.error(`❌ [MAIL] Error sending email to ${recipient}:`, error);
      throw new BadRequestException(`Erreur lors de l'envoi de l'email : ${error.message}`);
    }
  }
}