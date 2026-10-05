import { PrismaClient } from '@prisma/client';
import { OtpService } from './otp.service.js';
import { JwtService } from './jwt.service.js';
import { DealersService } from '../dealers/dealers.service.js';
import { CustomerStatus, DealerRole, UserAuthStatus } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { normalizePhoneNumber } from '@dealconnect/validation';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private otpService: OtpService,
    private jwtService: JwtService,
    private dealersService: DealersService
  ) {}

  async requestCustomerOtp(dealerSlug: string, phone: string) {
    const dealer = await this.dealersService.getDealerBySlug(dealerSlug);
    const normalizedPhone = normalizePhoneNumber(phone);
    return this.otpService.requestOtp(dealer.id, normalizedPhone);
  }

  async verifyCustomerOtp(dealerSlug: string, challengeId: string, otp: string) {
    const dealer = await this.dealersService.getDealerBySlug(dealerSlug);
    const verified = await this.otpService.verifyOtp(challengeId, otp);

    if (verified.dealerId !== dealer.id) {
      throw new ApiError(400, 'INVALID_DEALER_CHALLENGE', 'OTP challenge does not belong to this dealer.');
    }

    const normalizedPhone = verified.phone;

    // Check if customer exists under (dealer_id, normalized_phone)
    let customer = await this.prisma.customer.findUnique({
      where: {
        dealerId_normalizedPhone: {
          dealerId: dealer.id,
          normalizedPhone,
        },
      },
    });

    let customerState: 'new' | 'existing' = 'existing';

    if (!customer) {
      customerState = 'new';
      customer = await this.prisma.customer.create({
        data: {
          dealerId: dealer.id,
          normalizedPhone,
          name: 'Valued Customer',
          status: CustomerStatus.ACTIVE,
        },
      });
    }

    const sessionToken = this.jwtService.generateCustomerToken(customer.id, dealer.id, normalizedPhone);

    return {
      customerState,
      sessionToken,
      customer: {
        id: customer.id,
        name: customer.name,
        normalizedPhone: customer.normalizedPhone,
        dealerId: customer.dealerId,
      },
    };
  }

  async registerDealerUser(data: {
    dealerId: string;
    name: string;
    email: string;
    phone?: string;
    role: DealerRole;
  }) {
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        authStatus: UserAuthStatus.ACTIVE,
      },
    });

    await this.prisma.dealerUser.create({
      data: {
        dealerId: data.dealerId,
        userId: user.id,
        role: data.role,
        status: 'active',
      },
    });

    const token = this.jwtService.generateUserToken(user.id, data.dealerId, data.role);
    return { user, token };
  }
}
