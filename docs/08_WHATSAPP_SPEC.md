# WhatsApp / Messaging Specification

## Provider abstraction

Implement:
`MessagingProvider`

Methods:
- sendTemplateMessage()
- sendTextMessage() if permitted
- getMessageStatus()
- verifyWebhook()
- parseWebhook()

Core app must not depend on provider-specific payloads.

## Templates

### Match found
Variables:
- customer first name
- dealer name
- make/model
- year
- price
- vehicle link

### Interest confirmation
"Thanks. The dealer will contact you."

### Follow-up
Only send where consent and provider rules permit.

## Template versioning
Store template key and provider template ID.

Example:
`vehicle_match_v1`

Do not hardcode provider template IDs throughout application code.

## Delivery states
queued
sent
delivered
read
failed

## Retry
Retry transient provider/network failures.
Do not retry permanent opt-out/invalid-recipient errors.

## Idempotency
Every outbound message has:
`notification.idempotency_key`

## Opt-out
Customer must be able to stop marketing/alerts.
Transactional/legal messaging rules must be handled separately from marketing consent.

## Provider webhooks
Verify signatures.
Store provider event ID.
Process each event once.

## Privacy
Messages should contain only the minimum necessary data.
Use secure web links for detailed vehicle information.
