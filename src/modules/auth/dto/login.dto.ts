import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'gg@email.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'Vgejjakalduei@112!' })
  password: string;
}
