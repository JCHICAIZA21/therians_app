import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartnerDto {
  @IsEnum(['SHELTER', 'VETERINARY', 'RESCUE'])
  type!: string;

  @IsString()
  @MinLength(3)
  legalName!: string;

  @IsString()
  taxId!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsEnum(['USER', 'PARTNER'])
  role!: 'USER' | 'PARTNER';

  @ValidateIf((o) => o.role === 'PARTNER')
  @ValidateNested()
  @Type(() => CreatePartnerDto)
  partner?: CreatePartnerDto;
}
