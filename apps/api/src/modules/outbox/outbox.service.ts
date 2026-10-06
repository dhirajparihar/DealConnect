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

  async processPendingBatch(limit = 20): Promise<number> {
    // Atomic fetch and lock
    const events = await this.prisma.$queryRaw<any[]>`
      UPDATE "OutboxEvent"
      SET 
        status = 'processing',
        attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM "OutboxEvent"
        WHERE status IN ('pending', 'failed')
          AND "availableAt" <= NOW()
          AND attempts < 5
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      RETURNING *;
    `;

    let processedCount = 0;
    for (const ev of events) {
      const success = await this.processLockedEvent(ev);
      if (success) processedCount++;
    }
    return processedCount;
  }

  private async processLockedEvent(event: any): Promise<boolean> {
    const now = new Date();
    try {
      const eventHandlers = this.handlers.get(event.eventType) || [];

      for (const handler of eventHandlers) {
        await handler({
          id: event.id,
          dealerId: event.dealerId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload,
        });
      }

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      Logger.info(`Outbox event processed successfully`, { eventId: event.id, eventType: event.eventType });
      return true;
    } catch (err: any) {
      const attempts = event.attempts;
      const isDeadLetter = attempts >= 5;

      const backoffSeconds = Math.pow(2, attempts) * 10;
      const availableAt = new Date(now.getTime() + backoffSeconds * 1000);

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: isDeadLetter ? OutboxEventStatus.DEAD_LETTER : OutboxEventStatus.FAILED,
          availableAt,
        },
      });

      Logger.error(`Outbox event handler failed`, err, { eventId: event.id, eventType: event.eventType, attempts, isDeadLetter });
      return false;
    }
  }
}
