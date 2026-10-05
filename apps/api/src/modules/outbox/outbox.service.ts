import { PrismaClient } from '@prisma/client';
import { OutboxEventStatus } from '@dealconnect/shared-types';
import { Logger } from '../../common/logger.js';

export type EventHandler = (event: {
  id: string;
  dealerId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
}) => Promise<void>;

export class OutboxService {
  private handlers = new Map<string, EventHandler[]>();

  constructor(private prisma: PrismaClient) {}

  registerHandler(eventType: string, handler: EventHandler) {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async fetchPendingEvents(limit = 20) {
    const now = new Date();
    return this.prisma.outboxEvent.findMany({
      where: {
        status: { in: [OutboxEventStatus.PENDING, OutboxEventStatus.FAILED] },
        availableAt: { lte: now },
        attempts: { lt: 5 },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async processEvent(eventId: string): Promise<boolean> {
    const now = new Date();

    // Lock event for processing
    const event = await this.prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!event || (event.status !== OutboxEventStatus.PENDING && event.status !== OutboxEventStatus.FAILED)) {
      return false;
    }

    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    try {
      const eventHandlers = this.handlers.get(event.eventType) || [];

      for (const handler of eventHandlers) {
        await handler({
          id: event.id,
          dealerId: event.dealerId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload as Record<string, any>,
        });
      }

      // Mark as processed
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: OutboxEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      Logger.info(`Outbox event processed successfully`, { eventId, eventType: event.eventType });
      return true;
    } catch (err: any) {
      const attempts = event.attempts + 1;
      const isDeadLetter = attempts >= 5;

      // Exponential backoff: 2^attempts * 10 seconds
      const backoffSeconds = Math.pow(2, attempts) * 10;
      const availableAt = new Date(now.getTime() + backoffSeconds * 1000);

      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: isDeadLetter ? OutboxEventStatus.DEAD_LETTER : OutboxEventStatus.FAILED,
          availableAt,
        },
      });

      Logger.error(`Outbox event handler failed`, err, { eventId, eventType: event.eventType, attempts, isDeadLetter });
      return false;
    }
  }

  async processPendingBatch(limit = 20): Promise<number> {
    const events = await this.fetchPendingEvents(limit);
    let processedCount = 0;
    for (const ev of events) {
      const success = await this.processEvent(ev.id);
      if (success) processedCount++;
    }
    return processedCount;
  }
}
