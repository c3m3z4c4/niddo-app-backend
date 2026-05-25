import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  ArrayNotContains,
  IsEnum,
} from 'class-validator';

const BLOCKED_FROM_VISIBILITY = [
  'RESIDENT', 'PRESIDENTE', 'SECRETARIO', 'TESORERO',
];

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  paymentInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedMethods?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotContains(BLOCKED_FROM_VISIBILITY, {
    message: `visibleToRoles cannot include: ${BLOCKED_FROM_VISIBILITY.join(', ')}`,
  })
  visibleToRoles?: string[];

  @IsOptional()
  @IsEnum(['none', 'stripe', 'conekta'])
  activeGateway?: 'none' | 'stripe' | 'conekta';

  @IsOptional()
  @IsString()
  stripePublicKey?: string | null;

  @IsOptional()
  @IsString()
  stripeSecretKey?: string | null;

  @IsOptional()
  @IsString()
  stripeWebhookSecret?: string | null;

  @IsOptional()
  @IsString()
  conektaPublicKey?: string | null;

  @IsOptional()
  @IsString()
  conektaPrivateKey?: string | null;

  @IsOptional()
  @IsString()
  conektaWebhookSecret?: string | null;
}
