import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateReservationDto {
  @IsString() @IsNotEmpty()
  greenArea: string;

  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsString() @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsString() @IsNotEmpty()
  startTime: string;

  @IsOptional() @IsString()
  endTime?: string;
}
