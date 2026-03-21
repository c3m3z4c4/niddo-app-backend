import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ImportUserDto } from './import-user.dto';

export class ImportUsersBodyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportUserDto)
  users: ImportUserDto[];
}
