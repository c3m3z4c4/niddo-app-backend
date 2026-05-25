import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import type { LicenseStatus, BillingCycle } from '../condominium-license.entity';

export class UpdateLicenseDto {
  @IsOptional()
  @IsEnum(['TRIAL', 'ACTIVE', 'OVERDUE', 'SUSPENDED'])
  status?: LicenseStatus;

  @IsOptional()
  @IsEnum(['MONTHLY', 'ANNUAL'])
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsString()
  planTier?: string;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodEndsAt?: string;
}
