import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class TransactionListener {
  constructor(
    private notificationService: NotificationService,
    private userService: UserService,
  ) {}

  @OnEvent('wallet.funded')
  async handleWalletFundedEvent(payload: any) {
    const { userId, currency, amount } = payload;
    const user = await this.userService.findById(userId);

    console.log(
      'Sending notification for funded wallet',
      userId,
      currency,
      amount,
    );

    if (user) {
      await this.notificationService.sendTransactionNotification(
        user.email,
        'Wallet Funding',
        amount,
        currency,
        'Completed',
      );
    }
  }

  @OnEvent('wallet.currencyConverted')
  async handleCurrencyConvertedEvent(payload: any) {
    const { userId, fromCurrency, toCurrency, amount, convertedAmount } =
      payload;
    const user = await this.userService.findById(userId);

    if (user) {
      await this.notificationService.sendTransactionNotification(
        user.email,
        'Currency Conversion',
        amount,
        `${fromCurrency} to ${toCurrency} (${convertedAmount} ${toCurrency})`,
        'Completed',
      );
    }
  }

  @OnEvent('wallet.currencyTraded')
  async handleCurrencyTradedEvent(payload: any) {
    const { userId, fromCurrency, toCurrency, amount, tradedAmount } = payload;
    const user = await this.userService.findById(userId);

    if (user) {
      await this.notificationService.sendTransactionNotification(
        user.email,
        'Currency Trade',
        amount,
        `${fromCurrency} to ${toCurrency} (${tradedAmount} ${toCurrency})`,
        'Completed',
      );
    }
  }
}
