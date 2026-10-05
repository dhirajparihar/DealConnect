# Sequence Diagrams

## 1. New customer

```text
Customer -> Dealer Link: open
Customer -> API: request OTP
API -> OTP Provider: send OTP
OTP Provider -> Customer: OTP
Customer -> API: verify OTP
API -> DB: find dealer + phone
DB -> API: not found
API -> DB: create customer
API -> Customer: customer session
Customer -> API: submit requirement
API -> DB: save requirement
API -> DB: save outbox event
API -> Customer: success
Worker -> Outbox: consume RequirementCreated
Worker -> DB: find matching vehicles
```

## 2. Existing customer

```text
Customer -> API: verify OTP
API -> DB: dealer + normalized phone
DB -> API: existing customer
API -> Customer: existing customer session
Customer -> API: add/update requirement
API -> DB: save
```

## 3. Vehicle match

```text
Dealer -> API: create vehicle
API -> DB: save vehicle
API -> DB: save VehicleCreated event
API -> Dealer: 201 Created

Worker -> Outbox: VehicleCreated
Worker -> DB: find eligible requirements
Worker -> Matching: score requirements
Matching -> DB: create matches
Worker -> Queue: notification job
Notification Worker -> WhatsApp: send template
WhatsApp -> Customer: message
WhatsApp -> API: delivery webhook
API -> DB: update notification
```

## 4. Customer interested

```text
Customer -> API: Interested
API -> DB: update match
API -> DB: create activity
API -> DB: create followup
API -> Queue: dealer notification
Worker -> Dealer: notification
```

## 5. Vehicle sold while notification is pending

```text
Dealer -> API: mark sold
API -> DB: update vehicle
API -> Queue: cancellation/update job
Notification Worker -> DB: check current vehicle state
Worker -> Customer: do not send stale availability alert
```
