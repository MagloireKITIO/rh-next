import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (!user.company_id) {
      throw new ForbiddenException('Utilisateur non associé à une entreprise');
    }

    // Ajouter l'ID de l'entreprise à la requête pour l'utiliser dans les services
    request.companyId = user.company_id;

    return true;
  }
}