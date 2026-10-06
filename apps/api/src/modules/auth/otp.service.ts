import crypto from 'crypto';
import { ApiError } from '../../common/api-error.js';
import { Logger } from '../../common/logger.js';
import { redisClient } from '../../common/redis.js';

export interface OtpChallenge {
  challengeId: string;
  dealerId: string;
  phone: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
}

export class OtpService {
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  async requestOtp(dealerId: string, phone: string): Promise<{ challengeId: string; mockOtp?: string }> {
    // Rate limit check: max 5 OTP requests per phone per 15 minutes
    const rateLimitKey = `rate_limit:otp:${dealerId}:${phone}`;
    const currentCountStr = await redisClient.get(rateLimitKey);
    let count = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    if (count >= 5) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many OTP requests. Please try again later.');
    }

    const multi = redisClient.multi();
    multi.incr(rateLimitKey);
    if (count === 0) {
      multi.expire(rateLimitKey, 15 * 60); // 15 mins
    }
    await multi.exec();

    // Generate secure 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = `otp_${crypto.randomBytes(12).toString('hex')}`;
    const otpHash = this.hashOtp(rawOtp);
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes

    const challengeData: OtpChallenge = {
      challengeId,
      dealerId,
      phone,
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    };

    await redisClient.set(`otp_challenge:${challengeId}`, JSON.stringify(challengeData), 'EX', 15 * 60);

    Logger.info('OTP requested', { dealerId, phone, challengeId });

    // In dev / test environment, return mockOtp for easy E2E testing
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      challengeId,
      mockOtp: isDev ? rawOtp : undefined,
    };
  }

  async verifyOtp(challengeId: string, inputOtp: string): Promise<{ dealerId: string; phone: string }> {
    const challengeStr = await redisClient.get(`otp_challenge:${challengeId}`);

    if (!challengeStr) {
      throw new ApiError(400, 'INVALID_CHALLENGE', 'OTP challenge expired or invalid.');
    }

    const challenge: OtpChallenge = JSON.parse(challengeStr);

    if (Date.now() > challenge.expiresAt) {
      await redisClient.del(`otp_challenge:${challengeId}`);
      throw new ApiError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new code.');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await redisClient.del(`otp_challenge:${challengeId}`);
      throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many invalid attempts. Challenge invalidated.');
    }

    challenge.attempts++;

    const inputHash = this.hashOtp(inputOtp);
    if (inputHash !== challenge.otpHash) {
      await redisClient.set(`otp_challenge:${challengeId}`, JSON.stringify(challenge), 'KEEPTTL');
      throw new ApiError(400, 'INVALID_OTP', 'Incorrect OTP. Please check and try again.');
    }

    // Successfully verified -> clean up challenge
    await redisClient.del(`otp_challenge:${challengeId}`);
    return {
      dealerId: challenge.dealerId,
      phone: challenge.phone,
    };
  }
}
