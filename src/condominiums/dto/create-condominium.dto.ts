import { IsString, IsOptional, IsEmail, IsEnum, MaxLength, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { CondominiumStatus } from '../condominium.entity';

export class CreateCondominiumDto {
  @IsString()
  name: string;

  @IsString()
  @MaxLength(80)
  slug: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'trial', 'cancelled'])
  status?: CondominiumStatus;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxHouses?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number | null;
}
