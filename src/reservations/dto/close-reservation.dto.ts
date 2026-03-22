import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseReservationDto {
  @IsBoolean()
  checklistBanos: boolean;

  @IsBoolean()
  checklistInstalaciones: boolean;

  @IsOptional() @IsString()
  closureNotes?: string;

  @IsOptional() @IsNumber() @Min(0)
  chargeAmount?: number;
}
