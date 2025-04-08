import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class TradeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'NGN' })
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'EUR' })
  toCurrency: string;

  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 20 })
  amount: number;
}
