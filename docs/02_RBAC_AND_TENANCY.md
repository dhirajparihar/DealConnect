# Roles, Tenant Isolation & Authorization

## Roles

### Platform Admin
- create/deactivate dealers;
- manage plans;
- view system-level health;
- support dealer accounts;
- never casually access customer PII; use audited support access.

### Dealer Owner
- full dealer workspace;
- manage staff;
- customers;
- requirements;
- inventory;
- follow-ups;
- reports;
- settings.

### Dealer Manager
- customers;
- inventory;
- requirements;
- matches;
- follow-ups;
- team assignment;
- limited settings.

### Sales
- assigned customers;
- requirements;
- matches;
- follow-ups;
- inventory read access;
- cannot manage billing or tenant settings.

## Tenant context

On authentication:
`user_id -> dealer_user -> dealer_id`

Request context contains:
```text
userId
dealerId
role
requestId
```

Controllers/services must use context dealerId.

## RLS concept

For every tenant table:
- enable RLS;
- define policy using current tenant context;
- reject rows whose dealer_id differs.

Do not expose a public API where a customer can submit arbitrary dealer_id.

The dealer slug in a public URL resolves the intended dealer, but after customer authentication the server stores the dealer context in the session.

## Customer authorization

A customer can access:
- their own profile;
- their own requirements;
- their own matches;
- vehicles attached to their matches.

They cannot:
- list dealer customers;
- access another customer's requirements;
- access internal dealer notes;
- see other customer phone numbers.

## Cross-tenant test requirement

Automated test must attempt:
- read;
- update;
- delete;
- search;
- export

from Dealer A against Dealer B IDs and expect authorization failure or not-found behavior without data leakage.
