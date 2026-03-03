import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  partnerId!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
