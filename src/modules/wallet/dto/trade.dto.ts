import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class TradeDto {
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  toCurrency: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
