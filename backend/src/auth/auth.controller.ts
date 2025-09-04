import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto, GoogleAuthDto, SignUpDto, CompanySignUpDto, AcceptInvitationDto, CompleteCompanyGoogleDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';

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

  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.adminSignIn(loginDto);
    
    // Vérifier que l'utilisateur est super admin
    const user = await this.authService.validateUser({ sub: result.user.id });
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Accès refusé : Vous devez être super administrateur');
    }
    
    return result;
  }

  // Endpoint temporaire pour debug - À SUPPRIMER en production
  @Post('debug-user')
  async debugUser(@Body() body: { email: string }) {
    return this.authService.debugUser(body.email);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    console.log('🔄 PUT /auth/profile called for user:', req.user.id);
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    console.log('🔐 POST /auth/change-password called for user:', req.user.id);
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req, @Body() deleteAccountDto: DeleteAccountDto) {
    console.log('🗑️ DELETE /auth/delete-account called for user:', req.user.id);
    return this.authService.deleteAccount(req.user.id, deleteAccountDto);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const userId = (req as any).user.id;
        const fileExtension = extname(file.originalname);
        const filename = `${userId}-${Date.now()}${fileExtension}`;
        cb(null, filename);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Seuls les fichiers image sont autorisés'), false);
      }
      cb(null, true);
    },
  }))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    console.log('📸 POST /auth/avatar called for user:', req.user.id);
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return this.authService.uploadAvatar(req.user.id, file);
  }
}