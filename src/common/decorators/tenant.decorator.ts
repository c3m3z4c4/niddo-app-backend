import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the resolved condominiumId from the request.
 * Set by TenantInterceptor from JWT or x-tenant-id header.
 * Returns null for PLATFORM_ADMIN requests without a specific tenant.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.condominiumId ?? null;
  },
);
