import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';

interface CreateTransactionDto {
  userId: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  reference: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    transactionData: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      const transaction = this.transactionRepository.create({
        ...transactionData,
        sourceCurrency: transactionData.sourceCurrency.toUpperCase(),
        targetCurrency: transactionData.targetCurrency.toUpperCase(),
      });

      return this.transactionRepository.save(transaction);
    } catch (error) {
      this.logger.error(
        `Failed to create transaction: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserTransactions(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const [transactions, total] =
        await this.transactionRepository.findAndCount({
          where: { userId },
          order: { timestamp: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });

      return {
        transactions,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user transactions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: { id, userId },
    });
  }

  async getWalletTransactions(
    walletId: string,
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const [transactions, total] =
        await this.transactionRepository.findAndCount({
          where: { walletId, userId },
          order: { timestamp: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });

      return {
        transactions,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get wallet transactions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getTransactionsByType(
    userId: string,
    type: TransactionType,
    page = 1,
    limit = 10,
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const [transactions, total] =
        await this.transactionRepository.findAndCount({
          where: { userId, type },
          order: { timestamp: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });

      return {
        transactions,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get transactions by type: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
