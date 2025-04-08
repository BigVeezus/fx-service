import {
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
