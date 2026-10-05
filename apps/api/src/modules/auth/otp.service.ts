import crypto from 'crypto';
import { ApiError } from '../../common/api-error.js';
import { Logger } from '../../common/logger.js';

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
  private challenges = new Map<string, OtpChallenge>();
  private rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  async requestOtp(dealerId: string, phone: string): Promise<{ challengeId: string; mockOtp?: string }> {
    // Rate limit check: max 5 OTP requests per phone per 15 minutes
    const now = Date.now();
    const rateLimitKey = `${dealerId}:${phone}`;
    const userRate = this.rateLimitMap.get(rateLimitKey);

    if (userRate && userRate.resetAt > now) {
      if (userRate.count >= 5) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many OTP requests. Please try again later.');
      }
      userRate.count++;
    } else {
      this.rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
    }

    // Generate secure 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = `otp_${crypto.randomBytes(12).toString('hex')}`;
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes

    this.challenges.set(challengeId, {
      challengeId,
      dealerId,
      phone,
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    Logger.info('OTP requested', { dealerId, phone, challengeId });

    // In dev / test environment, return mockOtp for easy E2E testing
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      challengeId,
      mockOtp: isDev ? rawOtp : undefined,
    };
  }

  async verifyOtp(challengeId: string, inputOtp: string): Promise<{ dealerId: string; phone: string }> {
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      throw new ApiError(400, 'INVALID_CHALLENGE', 'OTP challenge expired or invalid.');
    }

    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      throw new ApiError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new code.');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many invalid attempts. Challenge invalidated.');
    }

    challenge.attempts++;

    const inputHash = this.hashOtp(inputOtp);
    if (inputHash !== challenge.otpHash) {
      throw new ApiError(400, 'INVALID_OTP', 'Incorrect OTP. Please check and try again.');
    }

    // Successfully verified -> clean up challenge
    this.challenges.delete(challengeId);
    return {
      dealerId: challenge.dealerId,
      phone: challenge.phone,
    };
  }
}
