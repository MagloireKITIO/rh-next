import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('🛡️ [JWT GUARD] Checking authentication for:', request.method, request.url);
    console.log('🛡️ [JWT GUARD] Headers:', {
      authorization: request.headers.authorization ? 'EXISTS' : 'MISSING',
      'content-type': request.headers['content-type']
    });
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      console.error('❌ [JWT GUARD] Authentication failed:', {
        error: err?.message,
        info: info?.message,
        user: user ? 'EXISTS' : 'NULL',
        url: request.url
      });
    } else {
      console.log('✅ [JWT GUARD] Authentication successful for user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        url: request.url
      });
    }
    
    return super.handleRequest(err, user, info, context);
  }
}