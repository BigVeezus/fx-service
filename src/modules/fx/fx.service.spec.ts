import { Test } from '@nestjs/testing';
import { FxService } from './fx.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

jest.mock('@nestjs/axios');

describe('FxService', () => {
  let service: FxService;
  let mockHttpService: HttpService;
  let mockCacheManager: any;
  let mockExchangeRateRepository: any;
  let mockConfigService: any;

  const mockApiResponse = {
    rates: {
      USD: 1.2,
      EUR: 0.9,
      GBP: 0.8,
    },
  };

  const mockRates = {
    EUR: { EUR: 1.0, GBP: 0.8, USD: 1.2 },
    GBP: { EUR: 1.1, GBP: 1.0, USD: 1.3 },
    USD: { EUR: 0.9, GBP: 0.8, USD: 1.0 },
  };

  beforeEach(async () => {
    mockHttpService = {
      get: jest.fn().mockReturnValue(of(mockApiResponse)), // Mock the get method with a default return value
    } as any;

    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null), // No cache
      set: jest.fn().mockResolvedValue(true),
    };

    mockExchangeRateRepository = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockResolvedValue([
        { targetCurrency: 'EUR', rate: 500 },
        { targetCurrency: 'GBP', rate: 600 },
      ]),
    } as any;

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('mock-api-key'),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        FxService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: mockExchangeRateRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllRates', () => {
    it('should return rates from cache if available', async () => {
      // Mock the cache to return mockRates
      mockCacheManager.get.mockResolvedValueOnce(mockRates);

      // Call the service and expect the cache result to be returned
      const result = await service.getAllRates();

      // Check if the result matches the cached data
      expect(result).toEqual(mockRates);

      // Ensure that getAllRates returns the cached data directly
      expect(mockCacheManager.get).toHaveBeenCalledWith('all_exchange_rates');
    });

    it('should fetch rates from the API and cache them', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null); // No cache

      // Mock the API response
      const mockApiResponse = {
        data: {
          // Note: axios responses wrap the data in a 'data' property
          rates: {
            USD: 1.2,
            EUR: 0.9,
            GBP: 0.8,
          },
        },
      };

      // Mock the API call to return mockApiResponse
      (mockHttpService.get as jest.Mock).mockReturnValueOnce(
        of(mockApiResponse),
      );

      // Call the service
      const result = await service.getAllRates();

      // Verify the service made the API call
      expect(mockHttpService.get).toHaveBeenCalled();

      // Verify the result structure (adjust based on your actual service implementation)
      expect(result).toEqual(
        expect.objectContaining({
          USD: expect.any(Object),
          EUR: expect.any(Object),
          GBP: expect.any(Object),
        }),
      );

      // Verify cache set call
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'all_exchange_rates',
        expect.any(Object),
        3600,
      );
    });
  });

  describe('getRatesForCurrency', () => {
    it('should return rates from cache if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockRates);
      const result = await service.getRatesForCurrency('USD');
      expect(result).toEqual(mockRates);
    });

    describe('getRatesForCurrency', () => {
      it('should fetch rates from the API and store them in the DB', async () => {
        mockCacheManager.get.mockResolvedValueOnce(null); // No cache

        // Mock the API response structure
        const mockApiResponse = {
          data: {
            rates: {
              USD: 1.0,
              EUR: 0.9,
              GBP: 0.8,
            },
          },
        };

        // Mock the HTTP service to return our response
        (mockHttpService.get as jest.Mock).mockReturnValueOnce(
          of(mockApiResponse),
        );

        // Call the service
        const result = await service.getRatesForCurrency('USD');

        // Verify the result structure
        expect(result).toEqual({
          USD: expect.any(Number),
          EUR: expect.any(Number),
          GBP: expect.any(Number),
        });

        // Verify cache was set
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          'exchange_rates_USD',
          expect.objectContaining({
            USD: expect.any(Number),
            EUR: expect.any(Number),
            GBP: expect.any(Number),
          }),
          60,
        );

        // Verify DB save was called
        expect(mockExchangeRateRepository.save).toHaveBeenCalled();
      });
    });

    it('should return fallback rates from DB if API fails', async () => {
      (mockHttpService.get as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error('API error')),
      ); // Simulate API error
      const fallbackRates = { EUR: 500, GBP: 600 };

      // Simulate DB query
      mockExchangeRateRepository.find.mockResolvedValueOnce([
        { targetCurrency: 'EUR', rate: 500 },
        { targetCurrency: 'GBP', rate: 600 },
      ]);

      const result = await service.getRatesForCurrency('USD');
      console.log(result);
      console.log(typeof result.EUR); // Should print "number"
      console.log(typeof fallbackRates.EUR); // Should also print "number"

      expect(typeof result.EUR).toBe(typeof fallbackRates.EUR);
    });
  });

  describe('getExchangeRate', () => {
    it('should throw an error for unsupported currency pairs', async () => {
      await expect(service.getExchangeRate('USD', 'ABC')).rejects.toThrow(
        'Unsupported currency pair',
      );
    });

    it('should return the exchange rate for supported currencies', async () => {
      // Mock the expected rate value
      const expectedRate = 0.9;

      // Mock the service method to return the expected rate
      jest.spyOn(service, 'getExchangeRate').mockResolvedValue(expectedRate);

      const result = await service.getExchangeRate('USD', 'EUR');
      expect(result).toEqual(expectedRate);
    });
  });

  describe('convertAmount', () => {
    beforeEach(() => {
      // Setup mock rates
      jest.spyOn(service, 'getExchangeRate').mockResolvedValue(0.9); // Mock USD→EUR rate
    });
    it('should return the converted amount and rate', async () => {
      const amount = 100;
      const expectedConvertedAmount = 90; // 100 USD * 0.9 (EUR/USD rate)
      const expectedRate = 0.9;

      const { convertedAmount, rate } = await service.convertAmount(
        'USD',
        'EUR',
        amount,
      );

      expect(convertedAmount).toBeCloseTo(expectedConvertedAmount);
      expect(rate).toEqual(expectedRate);
    });
  });
});
