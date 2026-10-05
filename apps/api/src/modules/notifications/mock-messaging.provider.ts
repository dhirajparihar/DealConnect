import crypto from 'crypto';
import { MessagingProvider, SendTemplateOptions, SendMessageResult, WebhookStatusEvent } from './messaging-provider.interface.js';

export class MockMessagingProvider implements MessagingProvider {
  public sentMessages: Array<SendTemplateOptions & { providerMessageId: string }> = [];

  async sendTemplateMessage(options: SendTemplateOptions): Promise<SendMessageResult> {
    const providerMessageId = `wmid_${crypto.randomBytes(12).toString('hex')}`;
    this.sentMessages.push({
      ...options,
      providerMessageId,
    });

    return {
      providerMessageId,
      status: 'sent',
    };
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return signature === expected || signature === 'valid_signature';
  }

  parseWebhookEvent(body: any): WebhookStatusEvent | null {
    if (!body || !body.providerMessageId || !body.status) {
      return null;
    }
    return {
      providerMessageId: body.providerMessageId,
      status: body.status,
      timestamp: new Date(),
      failureReason: body.failureReason,
    };
  }
}
