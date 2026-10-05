import { OutboxService } from './outbox.service.js';
import { Logger } from '../../common/logger.js';

export class OutboxWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private outboxService: OutboxService,
    private pollIntervalMs = 3000
  ) {}

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    Logger.info('Outbox background worker started');

    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.outboxService.processPendingBatch(25);
      } catch (err) {
        Logger.error('Error in outbox worker loop', err);
      } finally {
        if (this.isRunning) {
          this.timer = setTimeout(loop, this.pollIntervalMs);
        }
      }
    };

    loop();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    Logger.info('Outbox background worker stopped');
  }
}
