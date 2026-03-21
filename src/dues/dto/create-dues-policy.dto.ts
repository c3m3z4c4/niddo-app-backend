import { IsInt, Min, Max } from 'class-validator';

export class CreateDuesPolicyDto {
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @IsInt()
  @Min(1)
  mobileLockMonths: number;

  @IsInt()
  @Min(1)
  cardLockMonths: number;
}
