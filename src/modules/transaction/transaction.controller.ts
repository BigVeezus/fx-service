import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { TransactionType } from './entities/transaction.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get()
  async getUserTransactions(
    @GetUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionService.getUserTransactions(userId, page, limit);
  }

  @Get(':id')
  async getTransactionById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionService.getTransactionById(id, userId);
  }

  @Get('wallet/:walletId')
  async getWalletTransactions(
    @GetUser('id') userId: string,
    @Param('walletId') walletId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionService.getWalletTransactions(
      walletId,
      userId,
      page,
      limit,
    );
  }

  @Get('type/:type')
  async getTransactionsByType(
    @GetUser('id') userId: string,
    @Param('type') type: TransactionType,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionService.getTransactionsByType(
      userId,
      type,
      page,
      limit,
    );
  }
}
