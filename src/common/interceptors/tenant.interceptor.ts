import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../../auth/roles.enum';
import { rlsLocalStorage } from '../rls.patch';

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

    // Sync with the RLS context
    const store = rlsLocalStorage.getStore();
    if (store) {
      store.condominiumId = request.condominiumId;
      if (user) {
        store.bypassRls = user.role === Role.PLATFORM_ADMIN && !request.condominiumId;
      } else {
        // Unauthenticated request: bypass RLS if there is no tenant ID header (e.g. login)
        store.bypassRls = !request.condominiumId;
      }
    }

    return next.handle();
  }
}

