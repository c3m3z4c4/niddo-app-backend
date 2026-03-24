import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsString()
  @MinLength(1)
  body: string;
}
