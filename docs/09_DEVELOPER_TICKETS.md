# Developer Backlog

Priority:
P0 = must have
P1 = V1
P2 = post-MVP

## EPIC 1 — Foundation

### T001 [P0] Repository and CI
Acceptance:
- TypeScript lint/typecheck;
- tests run in CI;
- build artifact produced.

### T002 [P0] Environment configuration
- local/dev/staging/prod;
- validated environment variables;
- secrets excluded from repository.

### T003 [P0] PostgreSQL migrations
- schema migrations;
- seed data;
- rollback/documentation.

### T004 [P0] Tenant context
- authenticated user resolves dealer_id;
- context available to services.

### T005 [P0] RLS
- policies for all tenant tables;
- cross-tenant tests.

## EPIC 2 — Authentication

### T010 [P0] Dealer OTP auth
### T011 [P0] Customer OTP auth
### T012 [P0] Session management
### T013 [P0] Rate limiting

## EPIC 3 — Dealer

### T020 [P0] Dealer CRUD
### T021 [P0] Dealer user roles
### T022 [P1] Dealer settings
### T023 [P1] Dealer QR/link generation

## EPIC 4 — Customer

### T030 [P0] Customer creation
### T031 [P0] Existing customer detection
### T032 [P0] Customer profile
### T033 [P1] Consent management
### T034 [P1] Customer activity timeline

## EPIC 5 — Requirements

### T040 [P0] Requirement wizard
### T041 [P0] Requirement CRUD
### T042 [P0] Requirement status machine
### T043 [P1] Multiple requirements
### T044 [P1] Requirement preferences

## EPIC 6 — Inventory

### T050 [P0] Vehicle CRUD
### T051 [P0] Vehicle status
### T052 [P1] Vehicle image upload
### T053 [P1] Vehicle search/filter
### T054 [P1] Sold workflow

## EPIC 7 — Matching

### T060 [P0] Candidate query
### T061 [P0] Scoring engine
### T062 [P0] Match persistence
### T063 [P0] Match deduplication
### T064 [P1] Match center
### T065 [P1] Score explanation

## EPIC 8 — Async infrastructure

### T070 [P0] Redis
### T071 [P0] Queue worker
### T072 [P0] Outbox pattern
### T073 [P0] Retry/backoff
### T074 [P0] Dead-letter handling

## EPIC 9 — Notifications

### T080 [P0] Messaging provider adapter
### T081 [P0] Match notification
### T082 [P0] Customer response webhooks
### T083 [P0] Notification idempotency
### T084 [P1] Delivery tracking
### T085 [P1] Notification templates

## EPIC 10 — Follow-up

### T090 [P0] Follow-up creation
### T091 [P0] Follow-up list
### T092 [P1] Assignment
### T093 [P1] Reminder rules

## EPIC 11 — UX

### T100 [P0] Customer mobile portal
### T101 [P0] Dealer dashboard
### T102 [P1] Customer match page
### T103 [P1] Responsive/accessibility pass

## EPIC 12 — Security

### T110 [P0] Authorization middleware
### T111 [P0] Tenant boundary tests
### T112 [P0] OTP abuse protection
### T113 [P0] Audit logs
### T114 [P1] Security headers
### T115 [P1] Dependency/security scanning

## EPIC 13 — QA

### T120 [P0] Unit test matching
### T121 [P0] E2E customer flow
### T122 [P0] E2E dealer flow
### T123 [P0] Duplicate customer tests
### T124 [P0] Cross-tenant security tests
### T125 [P1] Load tests
### T126 [P1] Failure/retry tests

## EPIC 14 — Operations

### T130 [P0] Production logging
### T131 [P0] Error monitoring
### T132 [P0] Queue monitoring
### T133 [P0] Database backup
### T134 [P0] Restore test
### T135 [P1] Deployment runbook

## EPIC 15 — Analytics

### T140 [P1] Dealer dashboard metrics
### T141 [P1] Match conversion
### T142 [P1] Notification metrics
### T143 [P2] Advanced reports
