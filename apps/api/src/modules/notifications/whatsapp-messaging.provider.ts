import crypto from 'crypto';
import { MessagingProvider, SendTemplateOptions, SendMessageResult, WebhookStatusEvent } from './messaging-provider.interface.js';
import { Logger } from '../../common/logger.js';

export class WhatsAppMessagingProvider implements MessagingProvider {
  private apiUrl: string;
  private token: string;
  private webhookSecret: string;

  constructor() {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    this.token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || '';
  }

  async sendTemplateMessage(options: SendTemplateOptions): Promise<SendMessageResult> {
    if (!this.token) {
      Logger.warn('WhatsApp token is missing, falling back to mock behavior.');
      return {
        providerMessageId: `wmid_mock_${crypto.randomBytes(8).toString('hex')}`,
        status: 'sent',
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: options.to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: options.templateName,
            language: { code: options.languageCode },
            components: [
              {
                type: 'body',
                parameters: options.templateParams?.map(text => ({ type: 'text', text })) || [],
              }
            ],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Logger.error('WhatsApp API Error:', data);
        return {
          providerMessageId: '',
          status: 'failed',
          error: data.error?.message || 'Unknown WhatsApp API error',
        };
      }

      const messageId = data.messages?.[0]?.id || `wmid_unknown_${crypto.randomBytes(8).toString('hex')}`;
      
      return {
        providerMessageId: messageId,
        status: 'sent', // Initially sent, webhook will update to delivered/read
      };
    } catch (err: any) {
      Logger.error('Failed to send WhatsApp message:', err.message);
      return {
        providerMessageId: '',
        status: 'failed',
        error: err.message,
      };
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    if (!this.webhookSecret) return true; // Skip in dev if secret not set
    
    // Facebook sends signature as: sha256=xxx
    const actualSignature = signature.startsWith('sha256=') ? signature.substring(7) : signature;
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    
    return actualSignature === expected;
  }

  parseWebhookEvent(body: any): WebhookStatusEvent | null {
    try {
      // Parse standard WhatsApp Cloud API webhook body
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const statuses = value?.statuses?.[0];

      if (!statuses) {
        return null;
      }

      return {
        providerMessageId: statuses.id,
        status: statuses.status, // 'sent', 'delivered', 'read', 'failed'
        timestamp: new Date(statuses.timestamp * 1000),
        failureReason: statuses.errors?.[0]?.message,
      };
    } catch (err) {
      Logger.error('Error parsing WhatsApp webhook:', err);
      return null;
    }
  }
}
