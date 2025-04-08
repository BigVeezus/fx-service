import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { TradeDto } from './dto/trade.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async getUserWallets(@GetUser('id') userId: string) {
    const wallets = await this.walletService.findUserWallets(userId);
    return { wallets };
  }

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  async fundWallet(
    @GetUser('id') userId: string,
    @Body() fundWalletDto: FundWalletDto,
  ) {
    return await this.walletService.fundWallet(userId, fundWalletDto);
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  async convertCurrency(
    @GetUser('id') userId: string,
    @Body() convertCurrencyDto: ConvertCurrencyDto,
  ) {
    return this.walletService.convertCurrency(userId, convertCurrencyDto);
  }

  @Post('trade')
  @HttpCode(HttpStatus.OK)
  async tradeCurrency(
    @GetUser('id') userId: string,
    @Body() tradeDto: TradeDto,
  ) {
    return this.walletService.tradeCurrency(userId, tradeDto);
  }
}
