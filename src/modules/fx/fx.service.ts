import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly supportedCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>(
      'EXCHANGE_RATE_API_URL',
      'https://api.exchangerate-api.com/v4/latest',
    );
    this.apiKey = this.configService.getOrThrow<string>(
      'EXCHANGE_RATE_API_KEY',
    );
  }

  async getAllRates(): Promise<any> {
    const cacheKey = 'all_exchange_rates';

    // Try to get rates from cache first
    const cachedRates = await this.cacheManager.get(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }

    // Prepare the result object
    const result = {};

    // Fetch rates for each supported currency as base
    for (const baseCurrency of this.supportedCurrencies) {
      const rates = await this.getRatesForCurrency(baseCurrency);
      result[baseCurrency] = rates;
    }

    // Cache the result for 1 hour (3600 seconds)
    await this.cacheManager.set(cacheKey, result, 3600);

    return result;
  }

  async getRatesForCurrency(baseCurrency: string): Promise<any> {
    const cacheKey = `exchange_rates_${baseCurrency}`;

    // Try to get rates from cache first
    const cachedRates = await this.cacheManager.get(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }

    try {
      // Fetch fresh rates from API
      const rates = await this.fetchRatesFromApi(baseCurrency);

      // Store rates in DB for historical reference
      await this.storeRatesInDb(baseCurrency, rates);

      // Cache the rates (60 seconds TTL)
      await this.cacheManager.set(cacheKey, rates, 60);

      return rates;
    } catch (error) {
      this.logger.error(
        `Error fetching rates for ${baseCurrency}`,
        error.stack,
      );

      // Try to get latest rates from DB as fallback
      const fallbackRates = await this.getFallbackRatesFromDb(baseCurrency);
      if (fallbackRates) {
        return fallbackRates;
      }

      throw new Error(`Failed to get exchange rates for ${baseCurrency}`);
    }
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const normalizedFrom = fromCurrency.toUpperCase();
    const normalizedTo = toCurrency.toUpperCase();

    if (
      !this.supportedCurrencies.includes(normalizedFrom) ||
      !this.supportedCurrencies.includes(normalizedTo)
    ) {
      throw new Error('Unsupported currency pair');
    }

    if (normalizedFrom === normalizedTo) {
      return 1; // Same currency conversion
    }

    const rates = await this.getRatesForCurrency(normalizedFrom);

    if (!rates[normalizedTo]) {
      throw new Error(
        `Exchange rate not available for ${normalizedFrom} to ${normalizedTo}`,
      );
    }

    return rates[normalizedTo];
  }

  async convertAmount(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<{ convertedAmount: number; rate: number }> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return {
      convertedAmount,
      rate,
    };
  }

  private async fetchRatesFromApi(baseCurrency: string): Promise<any> {
    try {
      const url = `${this.apiUrl}/${baseCurrency}`;
      const headers = this.apiKey ? { apikey: this.apiKey } : {};

      const { data } = await firstValueFrom(
        this.httpService.get(url, { headers }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Error fetching rates from API: ${error.message}`,
            );
            throw new Error(`Failed to fetch rates from API: ${error.message}`);
          }),
        ),
      );

      // Filter only supported currencies
      const filteredRates = {};
      if (data && data.rates) {
        for (const currency of this.supportedCurrencies) {
          if (data.rates[currency]) {
            filteredRates[currency] = data.rates[currency];
          }
        }
      }

      return filteredRates;
    } catch (error) {
      this.logger.error(`Failed to fetch rates from API: ${error.message}`);
      throw error;
    }
  }

  private async storeRatesInDb(
    baseCurrency: string,
    rates: Record<string, number>,
  ): Promise<void> {
    try {
      const entries = Object.entries(rates).map(([targetCurrency, rate]) => {
        return this.exchangeRateRepository.create({
          baseCurrency,
          targetCurrency,
          rate,
        });
      });

      await this.exchangeRateRepository.save(entries);
    } catch (error) {
      this.logger.error(`Failed to store rates in DB: ${error.message}`);
      // Do not throw error here, just log it since this is a background operation
    }
  }

  private async getFallbackRatesFromDb(
    baseCurrency: string,
  ): Promise<Record<string, number> | null> {
    try {
      // Get the latest rates from DB for the given base currency
      const latestRates = await this.exchangeRateRepository.find({
        where: { baseCurrency },
        order: { timestamp: 'DESC' },
        take: this.supportedCurrencies.length,
      });

      if (latestRates.length === 0) {
        return null;
      }

      // Convert to the expected format
      const result = {};
      for (const rate of latestRates) {
        result[rate.targetCurrency] = rate.rate;
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get fallback rates from DB: ${error.message}`,
      );
      return null;
    }
  }

  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrencies];
  }
}
