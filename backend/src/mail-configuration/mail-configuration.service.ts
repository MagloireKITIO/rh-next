import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

import { MailConfiguration, MailProviderType } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { CreateMailConfigurationDto } from './dto/create-mail-configuration.dto';
import { UpdateMailConfigurationDto } from './dto/update-mail-configuration.dto';
import { TestMailDto } from './dto/test-mail.dto';

@Injectable()
export class MailConfigurationService {
  private supabase;
  private encryptionKey: string;

  constructor(
    @InjectRepository(MailConfiguration)
    private mailConfigRepository: Repository<MailConfiguration>,
    @InjectRepository(MailConfigurationCompany)
    private mailConfigCompanyRepository: Repository<MailConfigurationCompany>,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
    
    this.encryptionKey = this.configService.get('ENCRYPTION_KEY') || 'default-key-change-in-production';
  }

  /**
   * Chiffrer une valeur sensible
   */
  private encrypt(text: string): string {
    if (!text) return '';
    
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      return '';
    }
  }

  /**
   * Déchiffrer une valeur sensible
   */
  private decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    console.log('🔓 [DECRYPT] Tentative déchiffrement:', {
      encryptedText_length: encryptedText.length,
      encryptionKey_length: this.encryptionKey?.length || 0,
      encryptedText_format: encryptedText.includes(':') ? 'IV:ENCRYPTED' : 'FORMAT_INVALIDE'
    });
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        console.error('🔓 [DECRYPT] Format invalide - parties:', parts.length);
        return '';
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log('✅ [DECRYPT] Déchiffrement réussi, longueur:', decrypted.length);
      return decrypted;
    } catch (error) {
      console.error('❌ [DECRYPT] Erreur de déchiffrement:', error.message);
      return '';
    }
  }

  /**
   * Créer ou mettre à jour la configuration mail
   */
  async createOrUpdate(createDto: CreateMailConfigurationDto): Promise<MailConfiguration> {
    console.log('🔧 [MAIL CONFIG] Création/mise à jour configuration:', {
      provider: createDto.provider_type,
      from_email: createDto.from_email,
      is_default: createDto.is_default,
      company_id: createDto.company_id
    });

    // Si c'est une configuration par défaut, désactiver les autres configs par défaut
    if (createDto.is_default) {
      await this.mailConfigRepository.update(
        { is_default: true },
        { is_default: false }
      );
      console.log('📝 [MAIL CONFIG] Configurations par défaut précédentes désactivées');
    }

    // Chiffrer les données sensibles
    console.log('🔐 [MAIL CONFIG] Chiffrement des données sensibles:', {
      smtp_password_original: createDto.smtp_password ? 'PRÉSENT' : 'ABSENT',
      smtp_password_length: createDto.smtp_password?.length || 0
    });

    const encryptedPassword = createDto.smtp_password ? this.encrypt(createDto.smtp_password) : undefined;
    
    console.log('🔒 [MAIL CONFIG] Résultat chiffrement:', {
      smtp_password_encrypted: encryptedPassword ? 'PRÉSENT (chiffré)' : 'ÉCHEC/ABSENT',
      encrypted_length: encryptedPassword?.length || 0
    });

    const encryptedData = {
      ...createDto,
      smtp_password: encryptedPassword,
      api_key: createDto.api_key ? this.encrypt(createDto.api_key) : undefined,
      api_secret: createDto.api_secret ? this.encrypt(createDto.api_secret) : undefined,
    };

    // Vérifier si une configuration existe déjà
    // Pour l'admin global, on cherche la config par défaut globale (company_id = null)
    console.log('🔍 [MAIL CONFIG] Recherche config existante avec:', {
      company_id: createDto.company_id || null,
      is_default: createDto.is_default ?? true
    });
    
    // Construire la condition WHERE correctement pour NULL
    const whereCondition: any = { is_default: true };
    
    if (createDto.company_id) {
      whereCondition.company_id = createDto.company_id;
    } else {
      // Pour rechercher company_id IS NULL, utiliser IsNull de TypeORM
      whereCondition.company_id = IsNull();
    }
    
    let existingConfig = await this.mailConfigRepository.findOne({
      where: whereCondition,
      relations: ['company']
    });
    
    console.log('🔍 [MAIL CONFIG] Config existante trouvée:', existingConfig ? existingConfig.id : 'AUCUNE');

    if (existingConfig) {
      // Mettre à jour la configuration existante
      console.log('📝 [MAIL CONFIG] Mise à jour configuration existante:', existingConfig.id);
      Object.assign(existingConfig, encryptedData);
      if (encryptedData.company_id === null) {
        existingConfig.company_id = null;
      }
      existingConfig.updated_at = new Date();
      const saved = await this.mailConfigRepository.save(existingConfig);
      console.log('✅ [MAIL CONFIG] Configuration mise à jour avec succès');
      return saved;
    } else {
      // Créer une nouvelle configuration
      console.log('🆕 [MAIL CONFIG] Création nouvelle configuration');
      const newConfig = this.mailConfigRepository.create({
        ...encryptedData,
        is_default: createDto.company_id ? false : true, // Par défaut global si pas de company_id
      });
      const saved = await this.mailConfigRepository.save(newConfig);
      console.log('✅ [MAIL CONFIG] Nouvelle configuration créée:', saved.id);
      return saved;
    }
  }

  /**
   * Récupérer la configuration mail active
   */
  async getActiveConfiguration(companyId?: string): Promise<MailConfiguration> {
    console.log('🔍 [MAIL CONFIG] Recherche configuration active, companyId:', companyId);
    
    // Priorité 1: Configuration spécifique à l'entreprise
    if (companyId) {
      console.log('🏢 [MAIL CONFIG] Recherche config entreprise');
      const companyConfig = await this.mailConfigRepository.findOne({
        where: { 
          company_id: companyId,
          is_active: true
        },
        relations: ['company'],
        select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default', 'created_at', 'updated_at']
      });
      if (companyConfig) {
        console.log('✅ [MAIL CONFIG] Config entreprise trouvée:', companyConfig.provider_type);
        return this.decryptSensitiveData(companyConfig);
      }
    }

    // Priorité 2: Configuration par défaut globale
    console.log('🌍 [MAIL CONFIG] Recherche config par défaut globale');
    const defaultConfig = await this.mailConfigRepository.findOne({
      where: { 
        is_default: true,
        is_active: true
      },
      select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default', 'created_at', 'updated_at']
    });

    if (defaultConfig) {
      console.log('✅ [MAIL CONFIG] Config par défaut trouvée:', {
        id: defaultConfig.id,
        provider: defaultConfig.provider_type,
        from_email: defaultConfig.from_email
      });
      return this.decryptSensitiveData(defaultConfig);
    }

    // Priorité 3: Toute configuration globale active (même si pas par défaut)
    console.log('🔍 [MAIL CONFIG] Recherche toute config globale active');
    const anyGlobalConfig = await this.mailConfigRepository.findOne({
      where: {
        company_id: IsNull(),
        is_active: true
      },
      order: { updated_at: 'DESC' },
      select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default', 'created_at', 'updated_at']
    });

    if (anyGlobalConfig) {
      console.log('✅ [MAIL CONFIG] Config globale active trouvée:', {
        id: anyGlobalConfig.id,
        provider: anyGlobalConfig.provider_type,
        from_email: anyGlobalConfig.from_email
      });
      return this.decryptSensitiveData(anyGlobalConfig);
    }

    // Priorité 4: Configuration Supabase par défaut (fallback)
    console.log('⚠️ [MAIL CONFIG] Aucune config trouvée, utilisation fallback Supabase');
    return {
      id: 'supabase-default',
      provider_type: MailProviderType.SUPABASE,
      from_email: this.configService.get('DEFAULT_FROM_EMAIL') || 'noreply@rh-analytics.com',
      from_name: 'RH Analytics Pro',
      is_active: true,
      is_default: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as MailConfiguration;
  }

  /**
   * Déchiffrer les données sensibles pour utilisation interne
   */
  private decryptSensitiveData(config: MailConfiguration): MailConfiguration {
    console.log('🔐 [MAIL CONFIG] Déchiffrement données sensibles:', {
      id: config.id,
      smtp_password_encrypted: config.smtp_password ? 'PRÉSENT (chiffré)' : 'ABSENT',
      smtp_password_length: config.smtp_password?.length || 0
    });

    const decryptedPassword = config.smtp_password ? this.decrypt(config.smtp_password) : undefined;
    
    console.log('🔓 [MAIL CONFIG] Résultat déchiffrement:', {
      smtp_password_decrypted: decryptedPassword ? 'PRÉSENT (déchiffré)' : 'ÉCHEC/ABSENT',
      decrypted_length: decryptedPassword?.length || 0
    });

    return {
      ...config,
      smtp_password: decryptedPassword,
      api_key: config.api_key ? this.decrypt(config.api_key) : undefined,
      api_secret: config.api_secret ? this.decrypt(config.api_secret) : undefined,
    };
  }

  /**
   * Récupérer la configuration pour l'interface (sans données sensibles)
   */
  async getConfigurationForUI(): Promise<MailConfiguration> {
    console.log('📱 [MAIL CONFIG] Récupération config pour UI');
    const config = await this.getActiveConfiguration();
    
    // Retourner la configuration sans les données sensibles
    const uiConfig = {
      ...config,
      smtp_password: config.smtp_password ? '••••••••' : undefined,
      api_key: config.api_key ? '••••••••••••••••••••' : undefined,
      api_secret: config.api_secret ? '••••••••••••••••••••' : undefined,
    };
    
    console.log('📱 [MAIL CONFIG] Config retournée à l\'UI:', {
      provider_type: uiConfig.provider_type,
      from_email: uiConfig.from_email,
      id: uiConfig.id
    });
    
    return uiConfig;
  }

  /**
   * Tester la configuration mail
   */
  async testConfiguration(testDto: TestMailDto): Promise<{ success: boolean; message: string }> {
    console.log('🧪 [MAIL CONFIG] Test de configuration pour:', testDto.email, 'company_id:', testDto.company_id);
    const config = await this.getActiveConfiguration(testDto.company_id);
    
    console.log('📧 [MAIL CONFIG] Configuration utilisée pour le test:', {
      provider: config.provider_type,
      from_email: config.from_email,
      id: config.id
    });
    
    try {
      switch (config.provider_type) {
        case MailProviderType.SUPABASE:
          console.log('📮 [MAIL CONFIG] Utilisation test Supabase');
          return await this.testSupabaseConfiguration(testDto.email, config);
        
        case MailProviderType.SMTP:
          console.log('📮 [MAIL CONFIG] Utilisation test SMTP');
          return await this.testSMTPConfiguration(testDto.email, config);
        
        case MailProviderType.SENDGRID:
          console.log('📮 [MAIL CONFIG] Utilisation test SendGrid');
          return await this.testSendGridConfiguration(testDto.email, config);
        
        default:
          throw new BadRequestException('Type de fournisseur non supporté pour le test');
      }
    } catch (error) {
      console.error('❌ [MAIL CONFIG] Erreur lors du test:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du test de configuration'
      };
    }
  }

  /**
   * Tester la configuration Supabase
   */
  private async testSupabaseConfiguration(email: string, config: MailConfiguration) {
    try {
      const { error } = await this.supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            test: true,
            from_admin: true
          },
          redirectTo: 'https://example.com'
        }
      );

      if (error) {
        return {
          success: false,
          message: `Erreur Supabase: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Email de test envoyé avec succès via Supabase'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du test Supabase: ${error.message}`
      };
    }
  }

  /**
   * Tester la configuration SMTP
   */
  private async testSMTPConfiguration(email: string, config: MailConfiguration) {
    try {
      console.log('🔍 [MAIL CONFIG] Configuration SMTP détaillée:', {
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_user: config.smtp_user,
        smtp_password: config.smtp_password ? '***PRÉSENT***' : 'MANQUANT',
        smtp_secure: config.smtp_secure,
        from_email: config.from_email,
        from_name: config.from_name
      });

      if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
        return {
          success: false,
          message: `Configuration SMTP incomplète: ${!config.smtp_host ? 'host manquant' : ''} ${!config.smtp_user ? 'user manquant' : ''} ${!config.smtp_password ? 'password manquant' : ''}`
        };
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false, // SSL pour port 465
        requireTLS: config.smtp_require_tls || false, // TLS pour port 587
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      });

      // Vérifier la connexion
      await transporter.verify();

      // Envoyer l'email de test
      await transporter.sendMail({
        from: `${config.from_name} <${config.from_email}>`,
        to: email,
        subject: 'Test de Configuration Mail - RH Analytics Pro',
        html: `
          <h2>Test de Configuration Mail</h2>
          <p>Cet email confirme que la configuration SMTP fonctionne correctement.</p>
          <p>Serveur: ${config.smtp_host}:${config.smtp_port}</p>
          <p>Envoyé le: ${new Date().toLocaleString('fr-FR')}</p>
        `,
        text: `Test de Configuration Mail - La configuration SMTP fonctionne correctement.`
      });

      return {
        success: true,
        message: 'Email de test envoyé avec succès via SMTP'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur SMTP: ${error.message}`
      };
    }
  }

  /**
   * Tester la configuration SendGrid (exemple)
   */
  private async testSendGridConfiguration(email: string, config: MailConfiguration) {
    // TODO: Implémenter le test SendGrid
    return {
      success: false,
      message: 'Test SendGrid pas encore implémenté'
    };
  }

  /**
   * Obtenir le statut de la configuration mail
   */
  async getConfigurationStatus() {
    console.log('📊 [MAIL CONFIG] Récupération statut configuration');
    const config = await this.getActiveConfiguration();
    
    const status = {
      provider: config.provider_type,
      isConfigured: config.provider_type !== MailProviderType.SUPABASE || 
                    config.id !== 'supabase-default',
      from_email: config.from_email,
      from_name: config.from_name,
      is_active: config.is_active,
      last_updated: config.updated_at
    };
    
    console.log('📊 [MAIL CONFIG] Statut configuration:', status);
    return status;
  }

  /**
   * Envoyer un email en utilisant la configuration active
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    companyId?: string
  ) {
    const config = await this.getActiveConfiguration(companyId);
    
    switch (config.provider_type) {
      case MailProviderType.SUPABASE:
        // Pour Supabase, on utilise le système d'invitation/reset password
        throw new BadRequestException('Envoi d\'email personnalisé non supporté avec Supabase');
      
      case MailProviderType.SMTP:
        return await this.sendSMTPEmail(config, to, subject, htmlContent, textContent);
      
      default:
        throw new BadRequestException('Type de fournisseur non supporté');
    }
  }

  /**
   * Envoyer un email via SMTP
   */
  private async sendSMTPEmail(
    config: MailConfiguration,
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string
  ) {
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_secure || false, // SSL pour port 465
      requireTLS: config.smtp_require_tls || false, // TLS pour port 587
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });

    const mailOptions = {
      from: `${config.from_name} <${config.from_email}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', result.messageId);
    return result;
  }

  /**
   * Récupérer toutes les configurations mail
   */
  async getAllConfigurations(): Promise<MailConfiguration[]> {
    console.log('📋 [MAIL CONFIG] Récupération de toutes les configurations');
    
    const configs = await this.mailConfigRepository.find({
      relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
      order: { created_at: 'DESC' }
    });

    console.log(`📋 [MAIL CONFIG] ${configs.length} configurations trouvées`);
    configs.forEach((config, index) => {
      console.log(`📋 [MAIL CONFIG] Config ${index + 1}:`, {
        id: config.id,
        company_id: config.company_id,
        hasConfigurationCompanies: !!config.configurationCompanies,
        configurationCompaniesCount: config.configurationCompanies?.length || 0,
        configurationCompanies: config.configurationCompanies?.map(cc => ({
          id: cc.id,
          company_id: cc.company_id,
          company_name: cc.company?.name
        }))
      });
    });
    
    // Retourner les configurations sans les données sensibles
    return configs.map(config => ({
      ...config,
      smtp_password: config.smtp_password ? '••••••••' : undefined,
      api_key: config.api_key ? '••••••••••••••••••••' : undefined,
      api_secret: config.api_secret ? '••••••••••••••••••••' : undefined,
    }));
  }

  /**
   * Récupérer une configuration par ID
   */
  async getConfigurationById(id: string): Promise<MailConfiguration> {
    console.log('🔍 [MAIL CONFIG] Recherche configuration par ID:', id);
    
    const config = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company'],
      select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default', 'created_at', 'updated_at']
    });

    if (!config) {
      throw new NotFoundException('Configuration mail non trouvée');
    }

    // Déchiffrer pour usage interne mais masquer pour UI
    const decryptedConfig = this.decryptSensitiveData(config);
    
    return {
      ...decryptedConfig,
      smtp_password: decryptedConfig.smtp_password ? '••••••••' : undefined,
      api_key: decryptedConfig.api_key ? '••••••••••••••••••••' : undefined,
      api_secret: decryptedConfig.api_secret ? '••••••••••••••••••••' : undefined,
    };
  }

  /**
   * Mettre à jour une configuration par ID
   */
  async updateConfiguration(id: string, updateDto: UpdateMailConfigurationDto): Promise<MailConfiguration> {
    console.log('📝 [MAIL CONFIG] Mise à jour configuration ID:', id);
    
    const existingConfig = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company'],
      select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default', 'created_at', 'updated_at']
    });

    if (!existingConfig) {
      throw new NotFoundException('Configuration mail non trouvée');
    }

    // Chiffrer les données sensibles si elles sont fournies
    const encryptedData = {
      ...updateDto,
      smtp_password: updateDto.smtp_password ? this.encrypt(updateDto.smtp_password) : existingConfig.smtp_password,
      api_key: updateDto.api_key ? this.encrypt(updateDto.api_key) : existingConfig.api_key,
      api_secret: updateDto.api_secret ? this.encrypt(updateDto.api_secret) : existingConfig.api_secret,
    };

    // Si cette config devient par défaut, désactiver les autres par défaut de la même portée
    if (updateDto.is_default && !existingConfig.is_default) {
      await this.mailConfigRepository.update(
        { 
          company_id: existingConfig.company_id || null,
          is_default: true,
          id: Not(id) // Exclure l'actuelle
        },
        { is_default: false }
      );
    }

    // Utiliser directement update() pour forcer la mise à jour des champs null
    await this.mailConfigRepository.update(id, {
      ...encryptedData,
      updated_at: new Date()
    });
    
    console.log('✅ [MAIL CONFIG] Configuration mise à jour avec succès');
    
    // Récupérer la configuration mise à jour
    const saved = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company']
    });
    
    return saved;
  }

  /**
   * Supprimer une configuration par ID
   */
  async deleteConfiguration(id: string): Promise<void> {
    console.log('🗑️ [MAIL CONFIG] Suppression configuration ID:', id);
    
    const config = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!config) {
      throw new NotFoundException('Configuration mail non trouvée');
    }

    await this.mailConfigRepository.remove(config);
    console.log('✅ [MAIL CONFIG] Configuration supprimée avec succès');
  }

  /**
   * Activer/Désactiver une configuration
   */
  async toggleConfiguration(id: string, isActive: boolean): Promise<MailConfiguration> {
    console.log('🔄 [MAIL CONFIG] Toggle configuration ID:', id, 'actif:', isActive);
    
    const config = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!config) {
      throw new NotFoundException('Configuration mail non trouvée');
    }

    config.is_active = isActive;
    config.updated_at = new Date();
    
    const saved = await this.mailConfigRepository.save(config);
    console.log('✅ [MAIL CONFIG] Configuration togglée avec succès');
    
    return saved;
  }

  /**
   * Dupliquer une configuration mail
   */
  async duplicateConfiguration(id: string, newName?: string): Promise<MailConfiguration> {
    console.log('📋 [MAIL CONFIG] Duplication configuration:', id);
    
    const originalConfig = await this.mailConfigRepository.findOne({
      where: { id },
      relations: ['configurationCompanies'],
      select: ['id', 'provider_type', 'company_id', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'smtp_require_tls', 'api_key', 'api_secret', 'from_email', 'from_name', 'is_active', 'is_default']
    });

    if (!originalConfig) {
      throw new NotFoundException('Configuration non trouvée');
    }

    // Déchiffrer les données sensibles
    const decryptedConfig = this.decryptSensitiveData(originalConfig);

    // Créer la nouvelle configuration (copie)
    const duplicatedConfig = this.mailConfigRepository.create({
      provider_type: decryptedConfig.provider_type,
      company_id: null, // Les nouvelles configs sont globales par défaut
      smtp_host: decryptedConfig.smtp_host,
      smtp_port: decryptedConfig.smtp_port,
      smtp_user: decryptedConfig.smtp_user,
      smtp_password: decryptedConfig.smtp_password,
      smtp_secure: decryptedConfig.smtp_secure,
      smtp_require_tls: decryptedConfig.smtp_require_tls,
      api_key: decryptedConfig.api_key,
      api_secret: decryptedConfig.api_secret,
      from_email: decryptedConfig.from_email,
      from_name: newName || `${decryptedConfig.from_name} (Copie)`,
      is_active: false, // Nouvelle config inactive par défaut
      is_default: false // Pas par défaut
    });

    // Chiffrer les données sensibles avant sauvegarde
    if (duplicatedConfig.smtp_password) {
      duplicatedConfig.smtp_password = this.encrypt(duplicatedConfig.smtp_password);
    }
    if (duplicatedConfig.api_key) {
      duplicatedConfig.api_key = this.encrypt(duplicatedConfig.api_key);
    }
    if (duplicatedConfig.api_secret) {
      duplicatedConfig.api_secret = this.encrypt(duplicatedConfig.api_secret);
    }

    const savedConfig = await this.mailConfigRepository.save(duplicatedConfig);

    console.log('✅ [MAIL CONFIG] Configuration dupliquée:', savedConfig.id);
    return savedConfig;
  }

  /**
   * Affecter plusieurs entreprises à une configuration
   */
  async assignCompaniesToConfiguration(configId: string, companyIds: string[]): Promise<void> {
    console.log('🏢 [MAIL CONFIG] Affectation entreprises:', { configId, companyIds });

    // Vérifier que la configuration existe
    const config = await this.mailConfigRepository.findOne({ where: { id: configId } });
    if (!config) {
      throw new NotFoundException('Configuration non trouvée');
    }

    // Supprimer les anciennes affectations
    await this.mailConfigCompanyRepository.delete({ mail_configuration_id: configId });

    // Créer les nouvelles affectations
    const assignments = companyIds.map(companyId => 
      this.mailConfigCompanyRepository.create({
        mail_configuration_id: configId,
        company_id: companyId
      })
    );

    await this.mailConfigCompanyRepository.save(assignments);
    console.log('✅ [MAIL CONFIG] Affectations créées');
  }

  /**
   * Récupérer les entreprises affectées à une configuration
   */
  async getConfigurationCompanies(configId: string): Promise<MailConfigurationCompany[]> {
    return await this.mailConfigCompanyRepository.find({
      where: { mail_configuration_id: configId },
      relations: ['company']
    });
  }
}