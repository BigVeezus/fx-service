import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FxService } from './fx.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('fx')
export class FxController {
  constructor(private fxService: FxService) {}

  @Get('rates')
  @UseGuards(JwtAuthGuard)
  async getAllRates() {
    return this.fxService.getAllRates();
  }

  @Get('rates/:currency')
  @UseGuards(JwtAuthGuard)
  async getRatesForCurrency(@Param('currency') currency: string) {
    return this.fxService.getRatesForCurrency(currency.toUpperCase());
  }

  @Get('convert/:from/:to/:amount')
  @UseGuards(JwtAuthGuard)
  async convertAmount(
    @Param('from') fromCurrency: string,
    @Param('to') toCurrency: string,
    @Param('amount') amount: number,
  ) {
    return this.fxService.convertAmount(
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
      Number(amount),
    );
  }

  @Get('supported-currencies')
  @UseGuards(JwtAuthGuard)
  getSupportedCurrencies() {
    return {
      currencies: this.fxService.getSupportedCurrencies(),
    };
  }
}
