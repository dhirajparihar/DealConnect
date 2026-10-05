export interface SendTemplateOptions {
  recipientPhone: string;
  templateKey: string;
  templateId: string;
  variables: Record<string, string>;
  idempotencyKey: string;
}

export interface SendMessageResult {
  providerMessageId: string;
  status: 'sent' | 'queued' | 'failed';
}

export interface WebhookStatusEvent {
  providerMessageId: string;
  status: 'delivered' | 'read' | 'failed';
  timestamp: Date;
  failureReason?: string;
}

export interface MessagingProvider {
  sendTemplateMessage(options: SendTemplateOptions): Promise<SendMessageResult>;
  verifyWebhookSignature(signature: string, rawBody: string): boolean;
  parseWebhookEvent(body: any): WebhookStatusEvent | null;
}
