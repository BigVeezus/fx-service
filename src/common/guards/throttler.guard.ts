import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { InjectThrottlerStorage } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard implements CanActivate {
  constructor(
    @InjectThrottlerStorage() private readonly storageService: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Use IP as key for rate limiting, or user ID if authenticated
    const key = req.user?.id || req.ip;
    const ttl = 60; // 1 minute window
    const limit = 60; // 60 requests per minute
    const blockDuration = 30; // Block duration in seconds after hitting the limit
    const throttlerName = 'my-throttler'; // Custom name for your throttler

    // Call the increment method with all 5 arguments
    const current = Number(
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      ),
    );

    // Set headers to inform about rate limits
    res.header('X-RateLimit-Limit', limit);
    res.header('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.header(
      'X-RateLimit-Reset',
      new Date(Date.now() + ttl * 1000).toISOString(),
    );

    if (current > limit) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
