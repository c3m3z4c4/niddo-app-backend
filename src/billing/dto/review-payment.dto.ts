import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewPaymentDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
