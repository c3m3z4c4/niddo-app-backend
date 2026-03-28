import { IsString, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
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
}
