import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHouseDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  houseNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @IsEnum(['terreno', 'en_construccion', 'casa'])
  @IsOptional()
  type?: 'terreno' | 'en_construccion' | 'casa';
}
