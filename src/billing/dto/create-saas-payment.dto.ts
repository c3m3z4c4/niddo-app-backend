import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateSaasPaymentDto {
  @IsEnum(['MONTHLY', 'ANNUAL'])
  billingCycle: 'MONTHLY' | 'ANNUAL';

  @IsOptional()
  @IsDateString()
  periodCoveredFrom?: string;

  @IsOptional()
  @IsDateString()
  periodCoveredTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
