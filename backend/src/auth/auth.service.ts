import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from './entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { SecurityService } from '../security/security.service';
import { LoginDto, GoogleAuthDto, SignUpDto, CompanySignUpDto, AcceptInvitationDto, CompleteCompanyGoogleDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto } from './dto/login.dto';
import { LoginStatus } from '../security/entities/login-audit.entity';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private securityService: SecurityService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
  }

  /**
   * Enregistre une tentative de connexion dans l'audit de sécurité
   */
  private async logLoginAttempt(
    email: string,
    status: LoginStatus,
    user?: User,
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      let companyId = user?.company_id;

      // Si on n'a pas d'entreprise via l'utilisateur, essayer de la récupérer via l'email
      if (!companyId) {
        const existingUser = await this.userRepository.findOne({
          where: { email },
          relations: ['company']
        });
        companyId = existingUser?.company_id;
      }

      // Si on n'a toujours pas d'entreprise, skip l'audit
      if (!companyId) {
        console.log('⚠️ Audit skippé: pas d\'entreprise trouvée pour', email);
        return;
      }

      await this.securityService.logLoginAttempt({
        user_id: user?.id,
        company_id: companyId,
        email_attempt: email,
        status,
        failure_reason: failureReason,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent,
      });
    } catch (error) {
      // Ne pas faire échouer la connexion à cause d'un problème d'audit
      console.error('Erreur lors de l\'enregistrement de l\'audit de connexion:', error);
    }
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    // Sign up with Supabase
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/callback`,
      },
    });


    if (error) {
      console.error('❌ Erreur Supabase signUp:', error);
      throw new BadRequestException(error.message);
    }

    // Create user in our database (not verified)
    const user = this.userRepository.create({
      email,
      name,
      google_id: data.user.id,
      avatar_url: data.user.user_metadata?.avatar_url,
      email_verified: data.user.email_confirmed_at ? true : false,
      is_active: false, // Utilisateur inactif jusqu'à vérification
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
      },
    };
  }

  async signIn(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    try {
      // Sign in with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt
        await this.logLoginAttempt(email, LoginStatus.FAILED, undefined, 'Invalid credentials', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

    // Get user from our database
    let user = await this.userRepository.findOne({ where: { email } });

    // If user doesn't exist in our DB, create them
    if (!user) {
      user = this.userRepository.create({
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        google_id: data.user.id,
        avatar_url: data.user.user_metadata?.avatar_url,
        email_verified: data.user.email_confirmed_at ? true : false,
        is_active: data.user.email_confirmed_at ? true : false,
      });
      await this.userRepository.save(user);
    } else {
      // Mettre à jour l'état de vérification si nécessaire
      if (data.user.email_confirmed_at && (!user.email_verified || !user.is_active)) {
        user.email_verified = true;
        user.is_active = true;
        await this.userRepository.save(user);
      }
    }

      // Vérifier si l'email est vérifié
      if (!user.email_verified) {
        await this.logLoginAttempt(email, LoginStatus.FAILED, user, 'Email not verified', ipAddress, userAgent);
        throw new UnauthorizedException('Please verify your email before signing in. Check your inbox for verification email.');
      }

      // Vérifier si l'utilisateur est actif
      if (!user.is_active) {
        await this.logLoginAttempt(email, LoginStatus.FAILED, user, 'Account not active', ipAddress, userAgent);
        throw new UnauthorizedException('Your account is not active. Please contact support.');
      }

      // Log successful login
      await this.logLoginAttempt(email, LoginStatus.SUCCESS, user, undefined, ipAddress, userAgent);

      const payload = { sub: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
        },
      };
    } catch (error) {
      // Si c'est une erreur contrôlée (UnauthorizedException), la relancer
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Pour les autres erreurs, logger comme échec et relancer
      await this.logLoginAttempt(email, LoginStatus.FAILED, undefined, 'System error during login', ipAddress, userAgent);
      throw error;
    }
  }

  // Méthode spéciale pour l'authentification admin (sans vérification d'email)
  async adminSignIn(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    try {
      // Sign in with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await this.logLoginAttempt(email, LoginStatus.FAILED, undefined, 'Invalid admin credentials', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

    // Get user from our database
    let user = await this.userRepository.findOne({ where: { email } });

    // If user doesn't exist in our DB, create them
    if (!user) {
      user = this.userRepository.create({
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        google_id: data.user.id,
        avatar_url: data.user.user_metadata?.avatar_url,
        email_verified: data.user.email_confirmed_at ? true : false,
        is_active: true, // Les admins sont toujours actifs
        role: UserRole.SUPER_ADMIN,
      });
      await this.userRepository.save(user);
    }

    // Pour les super admins, pas de vérification d'email nécessaire
    if (user.role === UserRole.SUPER_ADMIN) {
      
      // S'assurer que l'admin est actif
      if (!user.is_active) {
        user.is_active = true;
        await this.userRepository.save(user);
      }
    } else {
      // Vérifications normales pour les autres rôles
      if (!user.email_verified) {
        throw new UnauthorizedException('Please verify your email before signing in. Check your inbox for verification email.');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Your account is not active. Please contact support.');
      }
    }

      // Log successful admin login
      await this.logLoginAttempt(email, LoginStatus.SUCCESS, user, undefined, ipAddress, userAgent);

      const payload = { sub: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
          role: user.role,
        },
      };
    } catch (error) {
      // Si c'est une erreur contrôlée (UnauthorizedException), la relancer
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Pour les autres erreurs, logger comme échec et relancer
      await this.logLoginAttempt(email, LoginStatus.FAILED, undefined, 'System error during admin login', ipAddress, userAgent);
      throw error;
    }
  }

  async googleAuth(googleAuthDto: GoogleAuthDto, ipAddress?: string, userAgent?: string) {
    const { access_token } = googleAuthDto;

    let userEmail: string;

    try {
      
      // Get user info from Supabase
      const { data: { user: supabaseUser }, error } = await this.supabase.auth.getUser(access_token);

      if (error || !supabaseUser) {
        await this.logLoginAttempt('unknown', LoginStatus.FAILED, undefined, 'Invalid Google token', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid Google token');
      }

      userEmail = supabaseUser.email;

      console.log('📧 Données Supabase user:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        email_confirmed_at: supabaseUser.email_confirmed_at,
        email_confirmed: !!supabaseUser.email_confirmed_at
      });

      // Check if user exists in our database
      let user = await this.userRepository.findOne({ 
        where: { google_id: supabaseUser.id } 
      });

      console.log('🔍 Utilisateur existant trouvé:', user ? 'OUI' : 'NON');

      // If user doesn't exist, create them
      if (!user) {
        console.log('🆕 Création nouvel utilisateur');
        user = this.userRepository.create({
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
          google_id: supabaseUser.id,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          email_verified: !!supabaseUser.email_confirmed_at,
          is_active: !!supabaseUser.email_confirmed_at,
        });
        await this.userRepository.save(user);
        console.log('✅ Nouvel utilisateur créé avec email_verified:', !!supabaseUser.email_confirmed_at);
      } else {
        console.log('👤 Utilisateur existant - état actuel:', {
          email_verified: user.email_verified,
          is_active: user.is_active,
          supabase_email_confirmed: !!supabaseUser.email_confirmed_at
        });
        
        // Mettre à jour l'état si Supabase confirme l'email
        if (supabaseUser.email_confirmed_at && (!user.email_verified || !user.is_active)) {
          console.log('🔄 Mise à jour état utilisateur après vérification email');
          user.email_verified = true;
          user.is_active = true;
          await this.userRepository.save(user);
          }
      }

      // Log successful Google login
      await this.logLoginAttempt(userEmail, LoginStatus.SUCCESS, user, undefined, ipAddress, userAgent);

      const payload = { sub: user.id, email: user.email };
      const jwt_token = this.jwtService.sign(payload);

      return {
        access_token: jwt_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      };
    } catch (error) {
      // Log failed Google authentication (si on a l'email)
      if (userEmail) {
        await this.logLoginAttempt(userEmail, LoginStatus.FAILED, undefined, 'Failed Google authentication', ipAddress, userAgent);
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['company']
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
      is_onboarded: user.is_onboarded,
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        domain: user.company.domain,
      } : null,
    };
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { id: payload.sub },
      relations: ['company']
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async companySignUp(companySignUpDto: CompanySignUpDto) {
    const { email, password, name, companyName, companyDomain } = companySignUpDto;

    // Vérifier si l'entreprise existe déjà
    const existingCompany = await this.companyRepository.findOne({ 
      where: { domain: companyDomain } 
    });
    if (existingCompany) {
      throw new BadRequestException('Une entreprise avec ce domaine existe déjà');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Inscription avec Supabase AVEC validation d'email (même pour les entreprises)
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/callback`,
      },
    });


    if (error) {
      console.error('❌ Erreur Supabase signUp:', error);
      throw new BadRequestException(error.message);
    }

    // Créer l'entreprise
    const company = this.companyRepository.create({
      name: companyName,
      domain: companyDomain,
    });
    const savedCompany = await this.companyRepository.save(company);

    // Créer l'utilisateur admin (NON ACTIF jusqu'à vérification d'email)
    const user = this.userRepository.create({
      email,
      name,
      google_id: data.user.id,
      avatar_url: data.user.user_metadata?.avatar_url,
      company_id: savedCompany.id,
      role: UserRole.ADMIN,
      email_verified: false,
      is_active: false, // Inactif jusqu'à vérification d'email
    });

    await this.userRepository.save(user);

    // PAS de token JWT - l'utilisateur doit vérifier son email
    return {
      message: 'Entreprise et administrateur créés avec succès. Vérifiez votre email pour confirmer votre compte et accéder au dashboard.',
      company: {
        id: savedCompany.id,
        name: savedCompany.name,
        domain: savedCompany.domain,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
      },
    };
  }

  async acceptInvitation(acceptInvitationDto: AcceptInvitationDto, ipAddress?: string, userAgent?: string) {
    const { invitation_token, password } = acceptInvitationDto;

    let userEmail: string;

    try {
      // Le token reçu est déjà un JWT valide émis par Supabase
      // Il faut l'utiliser pour extraire les informations utilisateur
      const { data: { user }, error } = await this.supabase.auth.getUser(invitation_token);

      if (error || !user) {
        console.error('❌ Erreur récupération utilisateur Supabase:', error);
        await this.logLoginAttempt('unknown', LoginStatus.FAILED, undefined, 'Invalid invitation token', ipAddress, userAgent);
        throw new BadRequestException(`Token d'invitation invalide: ${error?.message || 'Utilisateur introuvable'}`);
      }

      userEmail = user.email;

      console.log('✅ Utilisateur Supabase récupéré:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      // Mettre à jour le mot de passe de l'utilisateur dans Supabase
      const { error: passwordError } = await this.supabase.auth.admin.updateUserById(
        user.id,
        { password: password }
      );

      if (passwordError) {
        console.error('❌ Erreur mise à jour mot de passe Supabase:', passwordError);
        throw new BadRequestException(`Erreur lors de la définition du mot de passe: ${passwordError.message}`);
      }

      console.log('✅ Mot de passe défini avec succès dans Supabase');

      // Finaliser l'invitation côté application
      const appUser = await this.finalizeInvitation(user.email, user.id);

      // Récupérer l'utilisateur complet pour l'audit
      const fullUser = await this.userRepository.findOne({
        where: { email: user.email },
        relations: ['company']
      });

      // Log successful invitation acceptance
      await this.logLoginAttempt(userEmail, LoginStatus.SUCCESS, fullUser, undefined, ipAddress, userAgent);

      // Générer un token JWT pour connexion automatique
      const payload = {
        id: appUser.user.id,
        email: appUser.user.email,
        role: appUser.user.role,
        companyId: appUser.user.company.id
      };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: appUser.user,
        message: 'Invitation acceptée avec succès'
      };

    } catch (error) {
      // Log failed invitation acceptance (si on a l'email)
      if (userEmail) {
        await this.logLoginAttempt(userEmail, LoginStatus.FAILED, undefined, 'Failed invitation acceptance', ipAddress, userAgent);
      }

      console.error('❌ Erreur lors de l\'acceptation d\'invitation:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(error.message || 'Erreur lors de l\'acceptation de l\'invitation');
    }
  }

  async finalizeInvitation(email: string, supabaseUserId: string) {
    console.log(`🔍 Recherche utilisateur invité avec email: ${email}`);
    
    // Trouver l'utilisateur invité dans notre base de données
    const user = await this.userRepository.findOne({
      where: { 
        email,
        is_invited: true,
        is_active: false 
      },
      relations: ['company']
    });

    console.log('🔍 Utilisateur trouvé:', user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      is_invited: user.is_invited,
      is_active: user.is_active
    } : 'AUCUN');

    if (!user) {
      // Cherchons tous les utilisateurs avec cet email pour debug
      const allUsersWithEmail = await this.userRepository.find({
        where: { email },
        relations: ['company']
      });
      console.log('🔍 Tous les utilisateurs avec cet email:', allUsersWithEmail.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        is_invited: u.is_invited,
        is_active: u.is_active
      })));
      
      throw new BadRequestException(`Invitation introuvable pour l'email ${email}. Vérifiez que l'utilisateur existe et est marqué comme invité.`);
    }

    // Mettre à jour l'utilisateur pour l'activer
    user.google_id = supabaseUserId;
    user.is_invited = false;
    user.is_active = true;

    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          domain: user.company.domain,
        },
      },
    };
  }

  async completeCompanyGoogle(userId: string, completeCompanyDto: CompleteCompanyGoogleDto) {
    const { companyName, companyDomain } = completeCompanyDto;

    // Vérifier si l'utilisateur existe
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['company']
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    // Vérifier si l'utilisateur a déjà une entreprise
    if (user.company_id) {
      throw new BadRequestException('L\'utilisateur a déjà une entreprise');
    }

    // Vérifier si le domaine existe déjà
    const existingCompany = await this.companyRepository.findOne({ 
      where: { domain: companyDomain } 
    });
    if (existingCompany) {
      throw new BadRequestException('Une entreprise avec ce domaine existe déjà');
    }

    // Créer l'entreprise
    const company = this.companyRepository.create({
      name: companyName,
      domain: companyDomain,
    });
    const savedCompany = await this.companyRepository.save(company);

    // Mettre à jour l'utilisateur pour être admin de cette entreprise
    user.company_id = savedCompany.id;
    user.role = UserRole.ADMIN;
    await this.userRepository.save(user);

    return {
      message: 'Entreprise créée avec succès',
      company: {
        id: savedCompany.id,
        name: savedCompany.name,
        domain: savedCompany.domain,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async markAsOnboarded(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.is_onboarded = true;
    await this.userRepository.save(user);

    return {
      message: 'User marked as onboarded successfully',
    };
  }

  async verifyEmail(token: string) {
    // Cette méthode est maintenant gérée par Supabase via callback
    // Elle peut être utilisée pour des vérifications personnalisées si besoin
    throw new BadRequestException('Email verification is handled by Supabase callback. Please use the link in your email.');
  }

  async resendVerificationEmail(email: string) {
    // Trouver l'utilisateur
    const user = await this.userRepository.findOne({
      where: {
        email,
        email_verified: false,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found or email already verified');
    }

    // Renvoyer l'email de vérification via Supabase
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${this.configService.get('FRONTEND_URL')}/auth/callback`
      }
    });

    if (error) {
      console.error('❌ Erreur renvoi email Supabase:', error);
      throw new BadRequestException('Failed to resend verification email');
    }

    return {
      message: 'Verification email sent successfully. Please check your inbox.',
    };
  }

  // Méthode temporaire pour debug - À SUPPRIMER en production
  async debugUser(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company']
    });

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        is_invited: user.is_invited,
        is_onboarded: user.is_onboarded,
        email_verified: user.email_verified,
        google_id: user.google_id,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          domain: user.company.domain
        } : null,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      diagnostic: {
        canLogin: user.email_verified && user.is_active,
        needsOnboarding: !user.is_onboarded,
        isAdmin: user.role === 'admin',
        hasCompany: !!user.company_id
      }
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is already taken by another user
    if (updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateProfileDto.email } 
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use by another user');
      }

      // Update email in Supabase if changed
      const { error } = await this.supabase.auth.admin.updateUserById(
        user.supabase_user_id,
        { email: updateProfileDto.email }
      );

      if (error) {
        console.error('Error updating email in Supabase:', error);
        throw new BadRequestException('Failed to update email in authentication system');
      }
    }

    // Update user in database
    user.name = updateProfileDto.name;
    user.email = updateProfileDto.email;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        updated_at: user.updated_at,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password in Supabase
    const { error } = await this.supabase.auth.admin.updateUserById(
      user.supabase_user_id,
      { password: changePasswordDto.newPassword }
    );

    if (error) {
      console.error('Error updating password in Supabase:', error);
      throw new BadRequestException('Failed to update password in authentication system');
    }

    // Update password hash in database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);
    
    user.password_hash = hashedPassword;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully',
    };
  }

  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['company']
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(
      deleteAccountDto.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Password is incorrect');
    }

    // Check if user is the only admin of their company
    if (user.role === UserRole.ADMIN && user.company) {
      const adminCount = await this.userRepository.count({
        where: { 
          company: { id: user.company.id },
          role: UserRole.ADMIN 
        }
      });

      if (adminCount === 1) {
        throw new BadRequestException('Cannot delete account: you are the only administrator of your company');
      }
    }

    try {
      // Delete user's projects and candidates
      const userProjects = await this.projectRepository.find({ 
        where: { createdBy: { id: userId } }
      });

      for (const project of userProjects) {
        // Delete candidates associated with the project
        await this.candidateRepository.delete({ project: { id: project.id } });
        // Delete the project
        await this.projectRepository.delete({ id: project.id });
      }

      // Delete user's avatar if exists
      if (user.avatar_url) {
        const avatarPath = path.join('./uploads/avatars', path.basename(user.avatar_url));
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }

      // Delete user from Supabase
      const { error } = await this.supabase.auth.admin.deleteUser(user.supabase_user_id);
      if (error) {
        console.error('Error deleting user from Supabase:', error);
        // Continue with deletion even if Supabase deletion fails
      }

      // Delete user from database
      await this.userRepository.delete({ id: userId });

      console.log(`🗑️ User account deleted: ${user.email} (reason: ${deleteAccountDto.reason || 'No reason provided'})`);

      return {
        message: 'Account deleted successfully',
      };

    } catch (error) {
      console.error('Error during account deletion:', error);
      throw new BadRequestException('Failed to delete account. Please try again or contact support.');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete old avatar if exists
    if (user.avatar_url) {
      const oldAvatarPath = path.join('./uploads/avatars', path.basename(user.avatar_url));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Create avatar URL
    const baseUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3001';
    const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;

    // Update user with new avatar URL
    user.avatar_url = avatarUrl;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
    };
  }

}