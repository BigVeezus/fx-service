import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCurrencyPipe implements PipeTransform<string> {
  private readonly validCurrencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'NGN',
    'GHS',
    'KES',
    'ZAR',
  ];

  transform(value: string): string {
    const currency = value.toUpperCase();
    if (!this.validCurrencies.includes(currency)) {
      throw new BadRequestException(
        `Invalid currency. Supported currencies: ${this.validCurrencies.join(', ')}`,
      );
    }
    return currency;
  }
}
