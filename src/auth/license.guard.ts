import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingService: BillingService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;
    if (user.role === Role.PLATFORM_ADMIN || user.role === Role.CONDO_ADMIN) return true;
    if (!user.condominiumId) return true;

    let license: Awaited<ReturnType<BillingService['getLicense']>>;
    try {
      license = await this.billingService.getLicense(user.condominiumId);
    } catch {
      return true;
    }

    const status = (license.status ?? '').toUpperCase();

    if (status === 'SUSPENDED' || status === 'OVERDUE') {
      throw new ForbiddenException('Licencia suspendida. Contacte al administrador.');
    }

    if (status === 'TRIAL' && license.trialEndsAt && new Date(license.trialEndsAt) < new Date()) {
      throw new ForbiddenException('El período de prueba ha expirado. Contacte al administrador.');
    }

    return true;
  }
}
