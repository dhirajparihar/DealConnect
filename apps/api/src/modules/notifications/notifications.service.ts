import { PrismaClient } from '@prisma/client';
import { MessagingProvider } from './messaging-provider.interface.js';
import { NotificationChannel, NotificationStatus } from '@dealconnect/shared-types';
import { ApiError } from '../../common/api-error.js';
import { Logger } from '../../common/logger.js';

export class NotificationsService {
  private queueService?: any;

  constructor(
    private prisma: PrismaClient,
    private messagingProvider: MessagingProvider
  ) {}

  setQueueService(queueService: any) {
    this.queueService = queueService;
  }

  /**
   * Queue a vehicle match notification with strict idempotency (AC09 & AC08).
   */
  async queueMatchNotification(matchId: string): Promise<string | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        vehicle: true,
        requirement: { include: { customer: true } },
        dealer: true,
      },
    });

    if (!match) {
      Logger.warn(`Match ${matchId} not found for notification`);
      return null;
    }

    // Sequence 5 / AC12: Check if vehicle is still available and requirement is searching
    if (match.vehicle.status !== 'available' || match.requirement.status !== 'searching') {
      Logger.info(`Skipping stale notification for match ${matchId} (vehicle status: ${match.vehicle.status})`);
      return null;
    }

    const idempotencyKey = `match:${matchId}:customer-alert`;
    const customer = match.requirement.customer;

    // Check if notification already queued/sent (Idempotency check)
    const existing = await this.prisma.notification.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      Logger.info(`Notification already exists for key ${idempotencyKey}, status: ${existing.status}`);
      if (existing.status === NotificationStatus.QUEUED || existing.status === NotificationStatus.FAILED) {
        const success = await this.sendNotification(existing.id);
        if (!success) throw new Error('Notification provider failed to send message');
      }
      return existing.id;
    }

    const notification = await this.prisma.notification.create({
      data: {
        dealerId: match.dealerId,
        customerId: customer.id,
        matchId: match.id,
        channel: NotificationChannel.WHATSAPP,
        type: 'vehicle_match_alert',
        status: NotificationStatus.QUEUED,
        idempotencyKey,
      },
    });

    // Execute message send async via queue
    if (this.queueService) {
      await this.queueService.addSendNotificationJob(notification.id);
    } else {
      // Fallback
      await this.sendNotification(notification.id);
    }
    return notification.id;
  }

  async sendNotification(notificationId: string): Promise<boolean> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        customer: true,
        match: { include: { vehicle: true, dealer: true } },
      },
    });

    if (!notification || !notification.match) return false;

    // Re-verify vehicle state before calling WhatsApp provider
    if (notification.match.vehicle.status !== 'available') {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failureReason: 'Vehicle sold or unavailable prior to message dispatch',
        },
      });
      return false;
    }

    const customerName = notification.customer.name.split(' ')[0];
    const dealerName = notification.match.dealer.name;
    const vehicleName = `${notification.match.vehicle.make} ${notification.match.vehicle.model}`;
    const vehicleLink = `${process.env.APP_URL || 'http://localhost:3000'}/d/${notification.match.dealer.slug}/match/${notification.matchId}`;

    try {
      const result = await this.messagingProvider.sendTemplateMessage({
        recipientPhone: notification.customer.normalizedPhone,
        templateKey: 'vehicle_match_v1',
        templateId: 'vehicle_match_v1',
        variables: {
          customerName,
          dealerName,
          vehicleName,
          year: notification.match.vehicle.year.toString(),
          price: Number(notification.match.vehicle.price).toLocaleString('en-IN'),
          vehicleLink,
        },
        idempotencyKey: notification.idempotencyKey,
      });

      await this.prisma.$transaction([
        this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            providerMessageId: result.providerMessageId,
            sentAt: new Date(),
          },
        }),
        this.prisma.match.update({
          where: { id: notification.matchId! },
          data: { notifiedAt: new Date(), status: 'notified' },
        }),
      ]);

      return true;
    } catch (err: any) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failureReason: err.message || 'Messaging provider error',
          failedAt: new Date(),
        },
      });
      return false;
    }
  }

  async handleWebhookStatusUpdate(providerMessageId: string, status: string, failureReason?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { providerMessageId },
    });

    if (!notification) return null;

    const updateData: any = {};
    if (status === 'delivered') {
      updateData.status = NotificationStatus.DELIVERED;
      updateData.deliveredAt = new Date();
    } else if (status === 'read') {
      updateData.status = NotificationStatus.READ;
      updateData.readAt = new Date();
    } else if (status === 'failed') {
      updateData.status = NotificationStatus.FAILED;
      updateData.failedAt = new Date();
      updateData.failureReason = failureReason || 'Provider webhook reported failure';
    }

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: updateData,
    });
  }
}
