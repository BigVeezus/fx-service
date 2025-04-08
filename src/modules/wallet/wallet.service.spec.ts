import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { FxService } from '../fx/fx.service';
import { TransactionService } from '../transaction/transaction.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockWalletRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockFxService = {
  getSupportedCurrencies: jest.fn(() => ['USD', 'NGN']),
  convertAmount: jest.fn(),
};

const mockTransactionService = {
  createTransaction: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

const mockManager: Partial<EntityManager> = {
  getRepository: jest.fn(),
  save: jest.fn(),
};

const mockQueryRunner: Partial<QueryRunner> = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  release: jest.fn(),
  manager: mockManager as EntityManager, // cast here
};

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: jest.Mocked<Repository<Wallet>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: FxService, useValue: mockFxService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: getRepositoryToken(Wallet), useFactory: mockWalletRepo },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: () => mockQueryRunner,
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(Wallet));
  });

  describe('findUserWallets', () => {
    it('should return user wallets', async () => {
      const mockWallets = [{ id: 1, currency: 'USD', balance: 100 }];
      walletRepo.find.mockResolvedValue(mockWallets as any);

      const result = await service.findUserWallets('user123');
      expect(result).toEqual(mockWallets);
    });

    it('should throw if no wallets found', async () => {
      walletRepo.find.mockResolvedValue([]);
      await expect(service.findUserWallets('user123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('fundWallet', () => {
    const fundDto: FundWalletDto = {
      currency: 'USD',
      amount: 100,
    };

    it('should fund a wallet', async () => {
      const mockWallet = { id: 'wallet1', currency: 'USD', balance: 200 };

      mockQueryRunner.manager.getRepository = jest
        .fn()
        .mockReturnValue({ findOne: jest.fn().mockResolvedValue(mockWallet) });
      mockQueryRunner.manager.save = jest.fn().mockResolvedValue(mockWallet);
      mockTransactionService.createTransaction.mockResolvedValue({
        id: 'txn1',
        type: 'FUNDING',
        amount: 100,
        status: 'COMPLETED',
        reference: 'ref1',
        timestamp: new Date(),
      });

      const result = await service.fundWallet('user123', fundDto);
      expect(result.message).toBe('Wallet funded successfully');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'wallet.funded',
        expect.any(Object),
      );
    });

    it('should throw for invalid amount', async () => {
      await expect(
        service.fundWallet('user123', { currency: 'USD', amount: 0 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Similar approach for convertCurrency
  describe('convertCurrency', () => {
    it('should convert currency successfully', async () => {
      const sourceWallet = { id: '1', currency: 'USD', balance: 1000 };
      const targetWallet = { id: '2', currency: 'NGN', balance: 5000 };

      mockQueryRunner.manager.getRepository = jest.fn().mockReturnValue({
        findOne: jest
          .fn()
          .mockImplementation(({ where }) =>
            where.currency === 'USD' ? sourceWallet : targetWallet,
          ),
      });

      mockQueryRunner.manager.save = jest.fn();
      mockFxService.convertAmount = jest
        .fn()
        .mockResolvedValue({ convertedAmount: 80000, rate: 800 });

      mockTransactionService.createTransaction.mockResolvedValue({
        id: 'txn1',
        type: 'CONVERSION',
        amount: 100,
        status: 'COMPLETED',
        reference: 'ref1',
        timestamp: new Date(),
      });

      const result = await service.convertCurrency('user123', {
        fromCurrency: 'USD',
        toCurrency: 'NGN',
        amount: 100,
      });

      expect(result.message).toBe('Currency converted successfully');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'wallet.currencyConverted',
        expect.any(Object),
      );
    });
  });

  describe('tradeCurrency', () => {
    it('should trade currency successfully', async () => {
      const sourceWallet = { id: '1', currency: 'USD', balance: 1000 };
      const targetWallet = { id: '2', currency: 'NGN', balance: 5000 };

      mockQueryRunner.manager.getRepository = jest.fn().mockReturnValue({
        findOne: jest
          .fn()
          .mockImplementation(({ where }) =>
            where.currency === 'USD' ? sourceWallet : targetWallet,
          ),
      });

      mockQueryRunner.manager.save = jest.fn();
      mockFxService.convertAmount = jest
        .fn()
        .mockResolvedValue({ convertedAmount: 80000, rate: 800 });

      mockTransactionService.createTransaction.mockResolvedValue({
        id: 'txn1',
        type: 'TRADE',
        amount: 100,
        status: 'COMPLETED',
        reference: 'ref1',
        timestamp: new Date(),
      });

      const result = await service.tradeCurrency('user123', {
        fromCurrency: 'USD',
        toCurrency: 'NGN',
        amount: 100,
      });

      expect(result.message).toBe('Currency traded successfully');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'wallet.currencyTraded',
        expect.any(Object),
      );
    });

    it('should throw if neither currency is NGN', async () => {
      await expect(
        service.tradeCurrency('user123', {
          fromCurrency: 'USD',
          toCurrency: 'GBP',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
