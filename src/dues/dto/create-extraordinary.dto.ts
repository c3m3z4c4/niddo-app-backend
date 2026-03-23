import { IsString, IsNotEmpty, IsNumber, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateExtraordinaryDto {
  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @IsString()
  @IsIn(['multa', 'evento', 'obra', 'cuota_especial', 'otro'])
  category?: string;

  @IsOptional()
  @IsString()
  houseId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
