import { IsString, MinLength } from 'class-validator';

export class ReplyMessageDto {
  @IsString()
  receiverId!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
