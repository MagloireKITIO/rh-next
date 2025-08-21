import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, GoogleAuthDto, SignUpDto, CompanySignUpDto, AcceptInvitationDto, CompleteCompanyGoogleDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }

  @Post('company-signup')
  async companySignUp(@Body() companySignUpDto: CompanySignUpDto) {
    console.log('🚀 POST /auth/company-signup called with:', companySignUpDto);
    return this.authService.companySignUp(companySignUpDto);
  }

  @Post('accept-invitation')
  async acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    console.log('🚀 POST /auth/accept-invitation called with:', acceptInvitationDto);
    return this.authService.acceptInvitation(acceptInvitationDto);
  }

  @Post('finalize-invitation')
  async finalizeInvitation(@Body() body: { email: string; supabaseUserId: string }) {
    console.log('🚀 POST /auth/finalize-invitation called with:', body);
    return this.authService.finalizeInvitation(body.email, body.supabaseUserId);
  }

  @Post('complete-company-google')
  @UseGuards(JwtAuthGuard)
  async completeCompanyGoogle(@Request() req, @Body() completeCompanyDto: CompleteCompanyGoogleDto) {
    console.log('🚀 POST /auth/complete-company-google called for user:', req.user.id);
    return this.authService.completeCompanyGoogle(req.user.id, completeCompanyDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('mark-onboarded')
  @UseGuards(JwtAuthGuard)
  async markAsOnboarded(@Request() req) {
    return this.authService.markAsOnboarded(req.user.id);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    console.log('🔍 POST /auth/verify-email called with token:', body.token);
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    console.log('📧 POST /auth/resend-verification called for:', body.email);
    return this.authService.resendVerificationEmail(body.email);
  }

  // Endpoint temporaire pour debug - À SUPPRIMER en production
  @Post('debug-user')
  async debugUser(@Body() body: { email: string }) {
    return this.authService.debugUser(body.email);
  }
}