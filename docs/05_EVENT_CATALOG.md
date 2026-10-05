# Event Catalog

Events are internal domain events persisted through the outbox pattern.

## Customer events
`CustomerCreated`
`CustomerUpdated`
`CustomerVerified`
`CustomerConsentGranted`
`CustomerConsentRevoked`

## Requirement events
`RequirementCreated`
`RequirementUpdated`
`RequirementPaused`
`RequirementReactivated`
`RequirementClosed`

## Vehicle events
`VehicleCreated`
`VehicleUpdated`
`VehicleAvailable`
`VehicleReserved`
`VehicleSold`
`VehicleArchived`

## Match events
`MatchCreated`
`MatchUpdated`
`MatchNotificationQueued`
`CustomerInterested`
`CustomerNotInterested`
`CustomerNotNow`

## Notification events
`NotificationQueued`
`NotificationSent`
`NotificationDelivered`
`NotificationRead`
`NotificationFailed`

## Follow-up events
`FollowupCreated`
`FollowupCompleted`
`FollowupOverdue`

## Event handling rules
- Events are immutable.
- Consumers must be idempotent.
- Payload contains aggregate ID and dealer ID.
- Sensitive data should not be copied into events unnecessarily.
- Failed events remain retryable.
