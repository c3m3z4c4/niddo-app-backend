import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class AssignResidentsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  userIds: string[] = [];
}
