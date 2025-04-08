/* eslint-disable prefer-const */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { FxService } from '../fx/fx.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  TransactionType,
  TransactionStatus,
} from '../transaction/entities/transaction.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeDto } from './dto/trade.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly initialBalance = 0;

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private fxService: FxService,
    private transactionService: TransactionService,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async findUserWallets(userId: string): Promise<Wallet[]> {
    const wallets = await this.walletRepository.find({
      where: { userId },
      order: { currency: 'ASC' },
    });

    if (!wallets || wallets.length === 0) {
      throw new NotFoundException('No wallets found for this user');
    }

    return wallets;
  }

  async findWalletByCurrency(
    userId: string,
    currency: string,
  ): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, currency: currency.toUpperCase() },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet for ${currency} not found`);
    }

    return wallet;
  }

  async createDefaultWallets(userId: string): Promise<void> {
    const currencies = this.fxService.getSupportedCurrencies();

    const walletPromises = currencies.map((currency) => {
      const wallet = this.walletRepository.create({
        userId,
        currency,
        balance: this.initialBalance,
      });

      return this.walletRepository.save(wallet);
    });

    await Promise.all(walletPromises);
  }

  async fundWallet(userId: string, fundDto: FundWalletDto): Promise<any> {
    let { currency, amount } = fundDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    amount = fundDto.amount; // ensure the amount is a valid number
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    // Start a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet without lock for update
      const walletRepository = queryRunner.manager.getRepository(Wallet);
      const wallet = await walletRepository.findOne({
        where: { userId, currency: currency.toUpperCase() },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet for ${currency} not found`);
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + Number(amount);

      // Save the wallet
      await queryRunner.manager.save(wallet);

      // Reload the wallet to ensure balance is updated
      const updatedWallet = await walletRepository.findOne({
        where: { id: wallet.id },
      });

      // Create transaction record
      const transaction = await this.transactionService.createTransaction({
        userId,
        walletId: updatedWallet.id,
        type: TransactionType.FUNDING,
        status: TransactionStatus.COMPLETED,
        amount,
        sourceCurrency: currency,
        targetCurrency: currency,
        exchangeRate: 1,
        reference: uuidv4(),
        metadata: { fundingSource: 'direct' },
      });

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('wallet.funded', {
        userId,
        walletId: wallet.id,
        currency: wallet.currency,
        amount: amount,
        transactionId: transaction.id,
      });

      return {
        message: 'Wallet funded successfully',
        userId,
        wallet: {
          id: updatedWallet.id,
          currency: updatedWallet.currency,
          balance: updatedWallet.balance,
        },
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference,
          timestamp: transaction.timestamp,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to fund wallet: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async convertCurrency(
    userId: string,
    convertDto: ConvertCurrencyDto,
  ): Promise<any> {
    const { fromCurrency, toCurrency, amount } = convertDto;

    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      throw new BadRequestException(
        'Source and target currencies cannot be the same',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Start a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallets with lock for update
      const walletRepository = queryRunner.manager.getRepository(Wallet);

      const sourceWallet = await walletRepository.findOne({
        where: { userId, currency: fromCurrency.toUpperCase() },
      });

      const targetWallet = await walletRepository.findOne({
        where: { userId, currency: toCurrency.toUpperCase() },
      });

      if (!sourceWallet || !targetWallet) {
        throw new NotFoundException('One or both wallets not found');
      }

      // Check if source wallet has sufficient balance
      if (sourceWallet.balance < amount) {
        throw new BadRequestException('Insufficient balance in source wallet');
      }

      // Get exchange rate and calculate converted amount
      const { convertedAmount, rate } = await this.fxService.convertAmount(
        fromCurrency,
        toCurrency,
        amount,
      );

      console.log(
        `Converting ${amount} ${fromCurrency} to ${toCurrency} at rate ${rate}`,
      );

      // Update wallet balances
      sourceWallet.balance = Number(sourceWallet.balance) - Number(amount);
      targetWallet.balance =
        Number(targetWallet.balance) + Number(convertedAmount);

      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(targetWallet);

      // Create transaction record
      const transaction = await this.transactionService.createTransaction({
        userId,
        walletId: sourceWallet.id,
        type: TransactionType.CONVERSION,
        status: TransactionStatus.COMPLETED,
        amount,
        sourceCurrency: fromCurrency,
        targetCurrency: toCurrency,
        exchangeRate: rate,
        reference: uuidv4(),
        metadata: {
          convertedAmount,
          sourceWalletId: sourceWallet.id,
          targetWalletId: targetWallet.id,
        },
      });

      await queryRunner.commitTransaction();

      // Emit currency converted event
      this.eventEmitter.emit('wallet.currencyConverted', {
        userId,
        sourceWalletId: sourceWallet.id,
        targetWalletId: targetWallet.id,
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount,
        rate,
        transactionId: transaction.id,
      });

      return {
        message: 'Currency converted successfully',
        sourceWallet: {
          currency: sourceWallet.currency,
          balance: sourceWallet.balance,
        },
        targetWallet: {
          currency: targetWallet.currency,
          balance: targetWallet.balance,
        },
        conversionDetails: {
          amount,
          convertedAmount,
          rate,
        },
        transaction: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          reference: transaction.reference,
          timestamp: transaction.timestamp,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to convert currency: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async tradeCurrency(userId: string, tradeDto: TradeDto): Promise<any> {
    const { fromCurrency, toCurrency, amount } = tradeDto;

    // For trading, one currency must be NGN
    if (
      fromCurrency.toUpperCase() !== 'NGN' &&
      toCurrency.toUpperCase() !== 'NGN'
    ) {
      throw new BadRequestException(
        'Trading requires NGN as either source or target currency',
      );
    }

    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      throw new BadRequestException(
        'Source and target currencies cannot be the same',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallets with lock
      const walletRepository = queryRunner.manager.getRepository(Wallet);

      const sourceWallet = await walletRepository.findOne({
        where: { userId, currency: fromCurrency.toUpperCase() },
      });

      const targetWallet = await walletRepository.findOne({
        where: { userId, currency: toCurrency.toUpperCase() },
      });

      if (!sourceWallet || !targetWallet) {
        throw new NotFoundException('One or both wallets not found');
      }

      // Check if source wallet has sufficient balance
      if (sourceWallet.balance < amount) {
        throw new BadRequestException('Insufficient balance in source wallet');
      }

      // Get exchange rate and calculate traded amount
      const { convertedAmount, rate } = await this.fxService.convertAmount(
        fromCurrency,
        toCurrency,
        amount,
      );

      // Update wallet balances
      sourceWallet.balance = Number(sourceWallet.balance) - Number(amount);
      targetWallet.balance =
        Number(targetWallet.balance) + Number(convertedAmount);

      await queryRunner.manager.save(sourceWallet);
      await queryRunner.manager.save(targetWallet);

      // Create transaction record
      const transaction = await this.transactionService.createTransaction({
        userId,
        walletId: sourceWallet.id,
        type: TransactionType.TRADE,
        status: TransactionStatus.COMPLETED,
        amount,
        sourceCurrency: fromCurrency,
        targetCurrency: toCurrency,
        exchangeRate: rate,
        reference: uuidv4(),
        metadata: {
          tradedAmount: convertedAmount,
          sourceWalletId: sourceWallet.id,
          targetWalletId: targetWallet.id,
        },
      });

      await queryRunner.commitTransaction();

      // Emit currency traded event
      this.eventEmitter.emit('wallet.currencyTraded', {
        userId,
        sourceWalletId: sourceWallet.id,
        targetWalletId: targetWallet.id,
        fromCurrency,
        toCurrency,
        amount,
        tradedAmount: convertedAmount,
        rate,
        transactionId: transaction.id,
      });

      return {
        message: 'Currency traded successfully',
        sourceWallet: {
          currency: sourceWallet.currency,
          balance: sourceWallet.balance,
        },
        targetWallet: {
          currency: targetWallet.currency,
          balance: targetWallet.balance,
        },
        tradeDetails: {
          amount,
          tradedAmount: convertedAmount,
          rate,
        },
        transaction: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          reference: transaction.reference,
          timestamp: transaction.timestamp,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to trade currency: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
