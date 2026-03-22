import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewReservationDto {
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional() @IsString()
  adminNotes?: string;
}
