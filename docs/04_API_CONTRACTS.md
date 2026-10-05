# API Contracts — Implementation Detail

Base URL:
`/api/v1`

All authenticated requests derive tenant from session.

## Standard success
```json
{
  "data": {},
  "requestId": "req_..."
}
```

## Standard error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {},
    "requestId": "req_..."
  }
}
```

## Customer registration

### POST /public/{dealerSlug}/auth/otp/request
Request:
```json
{
  "phone": "+919876543210"
}
```

Response:
```json
{
  "data": {
    "challengeId": "otp_..."
  },
  "requestId": "req_..."
}
```

### POST /public/{dealerSlug}/auth/otp/verify
Request:
```json
{
  "challengeId": "otp_...",
  "otp": "123456"
}
```

Response:
```json
{
  "data": {
    "customerState": "new",
    "sessionToken": "..."
  },
  "requestId": "req_..."
}
```

Never expose whether a phone exists before successful verification if that would enable enumeration.

## Customer profile

### POST /public/customer/profile
```json
{
  "name": "Rahul Sharma",
  "email": "optional@example.com"
}
```

## Create requirement

### POST /public/requirements
```json
{
  "make": "Hyundai",
  "model": "Creta",
  "minYear": 2021,
  "maxYear": 2024,
  "minPrice": 900000,
  "maxPrice": 1100000,
  "fuel": "petrol",
  "transmission": "automatic",
  "maxKm": 60000,
  "location": {
    "lat": 23.18,
    "lng": 79.95
  },
  "radiusKm": 50,
  "color": null,
  "notes": "Prefer white"
}
```

Response:
```json
{
  "data": {
    "requirementId": "req_...",
    "status": "searching"
  },
  "requestId": "..."
}
```

## Dealer vehicle creation

### POST /vehicles
```json
{
  "stockNumber": "SM-1024",
  "make": "Hyundai",
  "model": "Creta",
  "variant": "SX",
  "year": 2022,
  "price": 1020000,
  "fuel": "petrol",
  "transmission": "automatic",
  "kilometers": 42000,
  "description": "Single owner"
}
```

Response must be fast and not wait for matching.

## Vehicle update

### PATCH /vehicles/{id}
Only changed fields.

If matching fields change, emit `VehicleUpdated`.

## Match response

### POST /public/matches/{id}/interested
Response:
```json
{
  "data": {
    "status": "interested",
    "followupCreated": true
  }
}
```

This endpoint must be idempotent.

## Pagination

Use:
`?limit=25&cursor=...`

Do not use deep offset pagination for large tables.

## Filtering

Dealer customer:
`GET /customers?search=rahul&status=active&limit=25`

Vehicle:
`GET /vehicles?status=available&model=creta&minPrice=900000&maxPrice=1100000`

## Webhooks

`POST /webhooks/whatsapp`

Requirements:
- verify signature;
- store provider event ID;
- reject duplicate event IDs;
- map provider status to notification state.

## API rules
- validation at boundary;
- authorization before data access;
- consistent errors;
- request ID on every response;
- idempotency for retryable writes;
- no PII in URLs where avoidable.
