import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../../auth/roles.enum';

/**
 * Resolves the active condominiumId for every request and attaches it to req.condominiumId.
 *
 * Resolution order:
 *  1. JWT user.condominiumId  — regular CONDO_ADMIN / RESIDENT users
 *  2. x-tenant-id header      — PLATFORM_ADMIN operating on a specific tenant
 *  3. null                    — PLATFORM_ADMIN without a target tenant (platform-wide ops)
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // set by JwtAuthGuard

    if (user) {
      if (user.role === Role.PLATFORM_ADMIN) {
        // Platform admin: prefer x-tenant-id header, fallback to null
        request.condominiumId = request.headers['x-tenant-id'] ?? null;
      } else {
        // All other roles: always use their own condominium from the JWT
        request.condominiumId = user.condominiumId ?? null;
      }
    } else {
      // Unauthenticated: use x-tenant-id header (for public branded endpoints)
      request.condominiumId = request.headers['x-tenant-id'] ?? null;
    }

    return next.handle();
  }
}
