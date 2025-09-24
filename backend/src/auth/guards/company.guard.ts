import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Super admin can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!user.company_id) {
      throw new ForbiddenException('Utilisateur non associé à une entreprise');
    }

    // Vérifier si l'utilisateur peut accéder aux ressources de l'entreprise demandée
    const { company_id } = request.params;

    if (company_id && String(user.company_id) !== String(company_id)) {
      throw new ForbiddenException('Accès refusé : vous ne pouvez accéder qu\'aux ressources de votre entreprise');
    }

    // Ajouter l'ID de l'entreprise à la requête pour l'utiliser dans les services
    request.companyId = user.company_id;

    return true;
  }
}