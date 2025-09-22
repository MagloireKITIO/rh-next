import { Controller, Get, Post, Delete, Body, UseGuards, Request, Query, Res, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationProvider } from './entities/user-integration.entity';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserIntegrations(@Request() req) {
    const userId = req.user.id;
    return await this.integrationsService.getUserIntegrations(userId);
  }

  @Get(':provider')
  @UseGuards(JwtAuthGuard)
  async getUserIntegration(@Request() req, @Param('provider') provider: IntegrationProvider) {
    const userId = req.user.id;
    const integration = await this.integrationsService.getUserIntegration(userId, provider);

    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      provider: integration.provider,
      provider_email: integration.provider_email,
      calendar_id: integration.calendar_id,
      is_active: integration.is_active,
      last_sync_at: integration.last_sync_at,
      sync_errors: integration.sync_errors,
      created_at: integration.created_at,
    };
  }

  @Delete(':provider')
  @UseGuards(JwtAuthGuard)
  async deleteUserIntegration(@Request() req, @Param('provider') provider: IntegrationProvider) {
    const userId = req.user.id;
    await this.integrationsService.deleteUserIntegration(userId, provider);
    return { message: 'Intégration supprimée avec succès' };
  }

  @Post(':provider/test')
  @UseGuards(JwtAuthGuard)
  async testIntegration(@Request() req, @Param('provider') provider: IntegrationProvider) {
    const userId = req.user.id;

    if (provider === IntegrationProvider.GOOGLE_CALENDAR) {
      const isWorking = await this.integrationsService.testGoogleConnection(userId);
      return { success: isWorking };
    }

    return { success: false, message: 'Provider non supporté' };
  }

  // Routes OAuth Google Calendar
  @Get('google-calendar/auth')
  @UseGuards(JwtAuthGuard)
  async initiateGoogleAuth(@Request() req, @Res() res: Response) {
    const userId = req.user.id;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = await this.integrationsService.getGoogleAuthUrl(state);

    return res.status(HttpStatus.OK).json({
      authUrl,
      message: 'Redirigez vers cette URL pour autoriser l\'accès à Google Calendar'
    });
  }

  @Get('google-calendar/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response
  ) {
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?tab=integrations&error=access_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?tab=integrations&error=invalid_request`);
    }

    try {
      // Décoder le state pour récupérer l'userId
      const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

      // Traiter le callback
      await this.integrationsService.handleGoogleCallback(code, userId);

      // Rediriger vers le frontend avec succès
      return res.redirect(`${process.env.FRONTEND_URL}/settings?tab=integrations&success=google_calendar_connected`);
    } catch (error) {
      console.error('Erreur lors du callback Google:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/settings?tab=integrations&error=connection_failed`);
    }
  }

  // Route pour générer directement l'URL d'auth (pour le frontend)
  @Post('google-calendar/connect')
  @UseGuards(JwtAuthGuard)
  async connectGoogleCalendar(@Request() req) {
    const userId = req.user.id;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = await this.integrationsService.getGoogleAuthUrl(state);

    return {
      authUrl,
      message: 'Ouvrez cette URL dans un nouvel onglet pour connecter Google Calendar'
    };
  }

  @Post('google-calendar/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshGoogleToken(@Request() req) {
    const userId = req.user.id;
    const integration = await this.integrationsService.getUserIntegration(userId, IntegrationProvider.GOOGLE_CALENDAR);

    if (!integration) {
      return { success: false, message: 'Aucune intégration Google Calendar trouvée' };
    }

    try {
      await this.integrationsService.refreshGoogleToken(integration);
      return { success: true, message: 'Token rafraîchi avec succès' };
    } catch (error) {
      return { success: false, message: 'Impossible de rafraîchir le token' };
    }
  }
}