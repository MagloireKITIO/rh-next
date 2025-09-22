import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UserIntegration, IntegrationProvider } from './entities/user-integration.entity';
import { User } from '../auth/entities/user.entity';
import { Configuration } from '../configuration/entities/configuration.entity';

export interface CreateUserIntegrationDto {
  user_id: string;
  provider: IntegrationProvider;
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  calendar_id?: string;
  scope?: string;
  provider_user_id?: string;
  provider_email?: string;
}

export interface UpdateUserIntegrationDto extends Partial<CreateUserIntegrationDto> {}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(UserIntegration)
    private userIntegrationRepository: Repository<UserIntegration>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Configuration)
    private configurationRepository: Repository<Configuration>,
    private configService: ConfigService,
  ) {}

  private async getGoogleOAuthConfig(): Promise<{clientId: string, clientSecret: string, redirectUri: string}> {
    const configs = await this.configurationRepository.find({
      where: [
        { key: 'google_oauth_client_id' },
        { key: 'google_oauth_client_secret' },
        { key: 'google_oauth_redirect_uri' }
      ]
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    const clientId = configMap['google_oauth_client_id'] || this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configMap['google_oauth_client_secret'] || this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = configMap['google_oauth_redirect_uri'] || this.configService.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Configuration Google OAuth incomplète. Veuillez configurer dans les paramètres système.');
    }

    return { clientId, clientSecret, redirectUri };
  }

  async createOrUpdateUserIntegration(createDto: CreateUserIntegrationDto): Promise<UserIntegration> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ where: { id: createDto.user_id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Chercher une intégration existante
    const existingIntegration = await this.userIntegrationRepository.findOne({
      where: {
        user_id: createDto.user_id,
        provider: createDto.provider,
      },
    });

    if (existingIntegration) {
      // Mettre à jour l'intégration existante
      Object.assign(existingIntegration, {
        ...createDto,
        updated_at: new Date(),
      });
      return await this.userIntegrationRepository.save(existingIntegration);
    } else {
      // Créer une nouvelle intégration
      const integration = this.userIntegrationRepository.create(createDto);
      return await this.userIntegrationRepository.save(integration);
    }
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    return await this.userIntegrationRepository.find({
      where: { user_id: userId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getUserIntegration(userId: string, provider: IntegrationProvider): Promise<UserIntegration | null> {
    return await this.userIntegrationRepository.findOne({
      where: {
        user_id: userId,
        provider: provider,
      },
      relations: ['user'],
    });
  }

  async deleteUserIntegration(userId: string, provider: IntegrationProvider): Promise<void> {
    const integration = await this.getUserIntegration(userId, provider);
    if (!integration) {
      throw new NotFoundException('Intégration non trouvée');
    }

    await this.userIntegrationRepository.remove(integration);
    this.logger.log(`Intégration ${provider} supprimée pour l'utilisateur ${userId}`);
  }

  async refreshGoogleToken(integration: UserIntegration): Promise<UserIntegration> {
    if (!integration.isGoogleCalendar() || !integration.refresh_token) {
      throw new BadRequestException('Token de rafraîchissement non disponible');
    }

    try {
      const { clientId, clientSecret, redirectUri } = await this.getGoogleOAuthConfig();
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      oauth2Client.setCredentials({
        refresh_token: integration.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Mettre à jour l'intégration avec les nouveaux tokens
      integration.access_token = credentials.access_token;
      if (credentials.refresh_token) {
        integration.refresh_token = credentials.refresh_token;
      }
      if (credentials.expiry_date) {
        integration.expires_at = new Date(credentials.expiry_date);
      }
      integration.updated_at = new Date();

      const updatedIntegration = await this.userIntegrationRepository.save(integration);
      this.logger.log(`Token Google rafraîchi pour l'utilisateur ${integration.user_id}`);

      return updatedIntegration;
    } catch (error) {
      this.logger.error(`Erreur lors du rafraîchissement du token Google:`, error);
      throw new BadRequestException('Impossible de rafraîchir le token Google');
    }
  }

  async getValidGoogleToken(userId: string): Promise<string> {
    const integration = await this.getUserIntegration(userId, IntegrationProvider.GOOGLE_CALENDAR);

    if (!integration || !integration.is_active) {
      throw new NotFoundException('Intégration Google Calendar non trouvée ou inactive');
    }

    // Vérifier si le token doit être rafraîchi
    if (integration.needsRefresh()) {
      const refreshedIntegration = await this.refreshGoogleToken(integration);
      return refreshedIntegration.access_token;
    }

    return integration.access_token;
  }

  async createGoogleOAuthClient(userId: string): Promise<any> {
    const accessToken = await this.getValidGoogleToken(userId);
    const { clientId, clientSecret, redirectUri } = await this.getGoogleOAuthConfig();

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    return oauth2Client;
  }

  async updateSyncStatus(userId: string, provider: IntegrationProvider, success: boolean, error?: any): Promise<void> {
    const integration = await this.getUserIntegration(userId, provider);
    if (!integration) return;

    integration.last_sync_at = new Date();

    if (success) {
      integration.sync_errors = null;
    } else {
      integration.sync_errors = {
        timestamp: new Date(),
        error: error?.message || 'Erreur inconnue',
        details: error,
      };
    }

    await this.userIntegrationRepository.save(integration);
  }

  async getGoogleAuthUrl(state?: string): Promise<string> {
    const { clientId, clientSecret, redirectUri } = await this.getGoogleOAuthConfig();
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    });
  }

  async handleGoogleCallback(code: string, userId: string): Promise<UserIntegration> {
    try {
      const { clientId, clientSecret, redirectUri } = await this.getGoogleOAuthConfig();
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Récupérer les informations de l'utilisateur Google
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      // Créer ou mettre à jour l'intégration
      const integrationData: CreateUserIntegrationDto = {
        user_id: userId,
        provider: IntegrationProvider.GOOGLE_CALENDAR,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        provider_user_id: userInfo.id,
        provider_email: userInfo.email,
        calendar_id: 'primary',
      };

      const integration = await this.createOrUpdateUserIntegration(integrationData);
      this.logger.log(`Intégration Google Calendar créée/mise à jour pour l'utilisateur ${userId}`);

      return integration;
    } catch (error) {
      this.logger.error('Erreur lors du callback Google OAuth:', error);
      throw new BadRequestException('Erreur lors de la connexion à Google Calendar');
    }
  }

  async testGoogleConnection(userId: string): Promise<boolean> {
    try {
      const oauth2Client = await this.createGoogleOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Test simple : récupérer la liste des calendriers
      await calendar.calendarList.list();

      await this.updateSyncStatus(userId, IntegrationProvider.GOOGLE_CALENDAR, true);
      return true;
    } catch (error) {
      this.logger.error(`Test de connexion Google échoué pour l'utilisateur ${userId}:`, error);
      await this.updateSyncStatus(userId, IntegrationProvider.GOOGLE_CALENDAR, false, error);
      return false;
    }
  }
}