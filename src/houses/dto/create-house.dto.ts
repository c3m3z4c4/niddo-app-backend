import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de casa es obligatorio' })
  houseNumber: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @IsEnum(['terreno', 'en_construccion', 'casa'])
  @IsOptional()
  type?: 'terreno' | 'en_construccion' | 'casa';
}
