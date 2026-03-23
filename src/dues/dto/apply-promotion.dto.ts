import { IsString, IsNotEmpty, IsInt, IsOptional, Matches, Min, Max } from 'class-validator';

export class ApplyPromotionDto {
  @IsString()
  @IsNotEmpty()
  houseId: string;

  @IsString()
  @IsNotEmpty()
  promotionId: string;

  @IsInt()
  @Min(1) @Max(12)
  startMonth: number;

  @IsInt()
  startYear: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'paidAt must be YYYY-MM-DD' })
  paidAt?: string;
}
