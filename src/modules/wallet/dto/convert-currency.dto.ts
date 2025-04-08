import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'EUR' })
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'NGN' })
  toCurrency: string;

  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 2 })
  amount: number;
}
