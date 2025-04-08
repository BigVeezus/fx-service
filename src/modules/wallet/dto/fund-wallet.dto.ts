import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class FundWalletDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'NGN' })
  currency: string;

  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 100 })
  amount: number;
}
