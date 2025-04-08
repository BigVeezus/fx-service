import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
            <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This OTP is valid for 15 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error.stack);
      throw error;
    }
  }

  async sendTransactionNotification(
    to: string,
    transactionType: string,
    amount: number,
    currency: string,
    status: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `${transactionType} Transaction Notification`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${transactionType} Transaction</h2>
            <p>Your ${transactionType.toLowerCase()} transaction has been ${status.toLowerCase()}.</p>
            <p><strong>Amount:</strong> ${amount} ${currency}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p>You can check your transaction history for more details.</p>
          </div>
        `,
      });
      this.logger.log(`Transaction notification email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send transaction notification email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }
}
