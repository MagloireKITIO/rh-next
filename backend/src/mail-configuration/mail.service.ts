import { Injectable } from '@nestjs/common';
import { MailConfigurationService } from './mail-configuration.service';
import { MailProviderType } from './entities/mail-configuration.entity';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateType } from './entities/mail-template.entity';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  companyId?: string;
  templateData?: Record<string, any>;
}

@Injectable()
export class MailService {
  private supabase;

  constructor(
    private mailConfigurationService: MailConfigurationService,
    private configService: ConfigService,
    private mailTemplateService: MailTemplateService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
  }

  /**
   * Envoyer un email en utilisant la configuration active
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.mailConfigurationService.getActiveConfiguration(options.companyId);
      
      // Remplacer les variables dans le template
      const processedHtml = this.processTemplate(options.htmlContent, options.templateData || {});
      const processedText = options.textContent 
        ? this.processTemplate(options.textContent, options.templateData || {})
        : undefined;
      const processedSubject = this.processTemplate(options.subject, options.templateData || {});

      switch (config.provider_type) {
        case MailProviderType.SUPABASE:
          // Pour Supabase, on ne peut envoyer que des invitations/reset
          return await this.sendSupabaseEmail(options.to as string, processedSubject, processedHtml);
        
        case MailProviderType.SMTP:
          return await this.sendSMTPEmail(config, options.to, processedSubject, processedHtml, processedText);
        
        default:
          throw new Error(`Type de fournisseur non supporté: ${config.provider_type}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer un email d'invitation via la configuration active
   */
  async sendInvitationEmail(
    email: string,
    invitationData: {
      name: string;
      companyName: string;
      role: string;
      redirectUrl: string;
    },
    companyId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.mailConfigurationService.getActiveConfiguration(companyId);
    
    switch (config.provider_type) {
      case MailProviderType.SUPABASE:
        return await this.sendSupabaseInvitation(email, invitationData);
      
      case MailProviderType.SMTP:
        return await this.sendSMTPInvitation(config, email, invitationData);
      
      default:
        throw new Error(`Envoi d'invitation non supporté pour: ${config.provider_type}`);
    }
  }

  /**
   * Envoyer un email de vérification
   */
  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    companyId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = await this.getTemplateByType(MailTemplateType.VERIFICATION, companyId);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      companyId,
      templateData: { verificationUrl }
    });
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    companyId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = await this.getTemplateByType(MailTemplateType.PASSWORD_RESET, companyId);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      companyId,
      templateData: { resetUrl }
    });
  }

  /**
   * Traitement des templates avec remplacement de variables
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, data[key] || '');
    });
    
    return processed;
  }

  /**
   * Envoyer via Supabase (méthode de fallback)
   */
  private async sendSupabaseEmail(to: string, subject: string, content: string) {
    try {
      // Supabase ne permet que l'envoi d'invitations, pas d'emails personnalisés
      // On utilise le système d'invitation comme fallback
      const { error } = await this.supabase.auth.admin.inviteUserByEmail(
        to,
        {
          data: {
            custom_subject: subject,
            custom_content: content,
            is_custom_email: true
          }
        }
      );

      if (error) {
        return {
          success: false,
          error: `Erreur Supabase: ${error.message}`
        };
      }

      return {
        success: true,
        messageId: 'supabase-invitation'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une invitation via Supabase
   */
  private async sendSupabaseInvitation(email: string, invitationData: any) {
    try {
      const { error } = await this.supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: invitationData,
          redirectTo: invitationData.redirectUrl
        }
      );

      if (error) {
        return {
          success: false,
          error: `Erreur Supabase: ${error.message}`
        };
      }

      return {
        success: true,
        messageId: 'supabase-invitation'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer via SMTP
   */
  private async sendSMTPEmail(config: any, to: string | string[], subject: string, htmlContent: string, textContent?: string) {
    try {
      const transporter = nodemailer.createTransporter({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      });

      const result = await transporter.sendMail({
        from: `${config.from_name} <${config.from_email}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer une invitation via SMTP
   */
  private async sendSMTPInvitation(config: any, email: string, invitationData: any) {
    const template = await this.getTemplateByType(MailTemplateType.INVITATION, config.company_id);
    const processedTemplate = this.processTemplateWithData(template, invitationData);
    
    return await this.sendSMTPEmail(
      config,
      email,
      processedTemplate.subject,
      processedTemplate.htmlContent,
      processedTemplate.textContent
    );
  }

  /**
   * Récupérer un template par type depuis la base de données
   */
  private async getTemplateByType(type: MailTemplateType, companyId?: string): Promise<EmailTemplate> {
    const template = await this.mailTemplateService.findActiveByType(type, companyId);
    
    if (template) {
      return {
        subject: template.subject,
        htmlContent: template.html_content,
        textContent: template.text_content
      };
    }

    // Fallback sur les templates par défaut si aucun template en DB
    return this.getDefaultTemplate(type);
  }

  /**
   * Traiter un template avec des données
   */
  private processTemplateWithData(template: EmailTemplate, data: Record<string, any>): EmailTemplate {
    return {
      subject: this.processTemplate(template.subject, data),
      htmlContent: this.processTemplate(template.htmlContent, data),
      textContent: template.textContent ? this.processTemplate(template.textContent, data) : undefined
    };
  }

  /**
   * Templates par défaut (fallback)
   */
  private getDefaultTemplate(type: MailTemplateType): EmailTemplate {
    switch (type) {
      case MailTemplateType.INVITATION:
        return this.getDefaultInvitationTemplate();
      case MailTemplateType.VERIFICATION:
        return this.getDefaultVerificationTemplate();
      case MailTemplateType.PASSWORD_RESET:
        return this.getDefaultPasswordResetTemplate();
      default:
        throw new Error(`Template par défaut non disponible pour le type: ${type}`);
    }
  }

  /**
   * Template d'invitation par défaut
   */
  private getDefaultInvitationTemplate(): EmailTemplate {
    return {
      subject: `Invitation à rejoindre {{companyName}} sur RH Analytics Pro`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invitation à rejoindre {{companyName}}</h2>
          
          <p>Bonjour {{name}},</p>
          
          <p>Vous avez été invité(e) à rejoindre <strong>{{companyName}}</strong> sur RH Analytics Pro en tant que <strong>{{role}}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{redirectUrl}}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Accepter l'invitation
            </a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #666;">{{redirectUrl}}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé par RH Analytics Pro. Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
      textContent: `
        Invitation à rejoindre {{companyName}}
        
        Bonjour {{name}},
        
        Vous avez été invité(e) à rejoindre {{companyName}} sur RH Analytics Pro en tant que {{role}}.
        
        Cliquez sur ce lien pour accepter l'invitation :
        {{redirectUrl}}
        
        Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
        
        ---
        RH Analytics Pro
      `
    };
  }

  /**
   * Template de vérification par défaut
   */
  private getDefaultVerificationTemplate(): EmailTemplate {
    return {
      subject: 'Vérifiez votre adresse email - RH Analytics Pro',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Vérifiez votre adresse email</h2>
          
          <p>Merci de vous être inscrit(e) sur RH Analytics Pro !</p>
          
          <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Vérifier mon email
            </a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #666;">{{verificationUrl}}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé par RH Analytics Pro. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
      textContent: `
        Vérifiez votre adresse email
        
        Merci de vous être inscrit(e) sur RH Analytics Pro !
        
        Pour finaliser votre inscription, cliquez sur ce lien :
        {{verificationUrl}}
        
        Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
        
        ---
        RH Analytics Pro
      `
    };
  }

  /**
   * Template de réinitialisation par défaut
   */
  private getDefaultPasswordResetTemplate(): EmailTemplate {
    return {
      subject: 'Réinitialisation de votre mot de passe - RH Analytics Pro',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe sur RH Analytics Pro.</p>
          
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
          
          <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.
          </p>
        </div>
      `,
      textContent: `
        Réinitialisation de mot de passe
        
        Vous avez demandé la réinitialisation de votre mot de passe sur RH Analytics Pro.
        
        Cliquez sur ce lien pour créer un nouveau mot de passe :
        {{resetUrl}}
        
        Important : Ce lien expire dans 24 heures.
        
        Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
        
        ---
        RH Analytics Pro
      `
    };
  }
}