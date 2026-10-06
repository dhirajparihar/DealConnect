import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../../common/redis.js';
import { Logger } from '../../common/logger.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export class QueueService {
  private notificationsQueue: Queue;
  private notificationsWorker: Worker;

  constructor(private notificationsService: NotificationsService) {
    this.notificationsQueue = new Queue('notifications', {
      connection: redisClient as any,
    });

    this.notificationsWorker = new Worker('notifications', async (job: Job) => {
      Logger.info(`Processing background job ${job.id} of type ${job.name}`);
      
      if (job.name === 'send_notification') {
        const { notificationId } = job.data;
        await this.notificationsService.sendNotification(notificationId);
      }
    }, {
      connection: redisClient as any,
      concurrency: 5,
    });

    this.notificationsWorker.on('completed', (job) => {
      Logger.info(`Job ${job.id} completed successfully`);
    });

    this.notificationsWorker.on('failed', (job, err) => {
      Logger.error(`Job ${job?.id} failed:`, err);
    });
  }

  async addSendNotificationJob(notificationId: string) {
    await this.notificationsQueue.add('send_notification', { notificationId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    });
  }
}
