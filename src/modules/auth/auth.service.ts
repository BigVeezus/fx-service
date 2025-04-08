import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private walletService: WalletService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate OTP and set expiry time (15 minutes)
    const otp = this.generateOtp();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    const user = await this.userService.create({
      email: registerDto.email,
      password: hashedPassword,
      otpSecret: otp,
      otpExpiry,
    });

    // Send OTP via email
    await this.notificationService.sendOtpEmail(user.email, otp);

    return {
      message:
        'User registered successfully. Please verify your email with the OTP sent.',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(verifyOtpDto.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    if (!user.otpSecret || !user.otpExpiry) {
      throw new BadRequestException('No OTP request found');
    }

    if (new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.otpSecret !== verifyOtpDto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Verify user and clear OTP data
    user.isVerified = true;
    user.otpSecret = null;
    user.otpExpiry = null;

    await this.userService.update(user);

    // Create default wallets for supported currencies
    await this.walletService.createDefaultWallets(user.id);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Email verified successfully',
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
    };
  }

  async resendOtp(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Generate new OTP and set expiry time
    const otp = this.generateOtp();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

    user.otpSecret = otp;
    user.otpExpiry = otpExpiry;

    await this.userService.update(user);

    // Send OTP via email
    await this.notificationService.sendOtpEmail(user.email, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  private generateOtp(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
