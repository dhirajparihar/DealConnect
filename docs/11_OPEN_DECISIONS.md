# Open Decisions Before Coding

These are the few decisions that should be explicitly signed off before implementation.

## Business
1. Dealer pricing model:
   - monthly;
   - annual;
   - per active customer;
   - per branch;
   - free pilot.

2. Notification cost:
   - included;
   - pass-through;
   - usage-based.

3. Customer ownership:
   V1 = dealer-owned/private.

4. Dealer cancellation:
   Define what happens to customer access and historical data.

## Product
5. Exact requirement fields for launch.
6. Exact matching threshold.
7. Exact customer notification frequency.
8. Follow-up timing.
9. Customer opt-out behavior.
10. Requirement expiry period.

## Technical
11. Cloud provider.
12. WhatsApp provider.
13. OTP provider.
14. Authentication implementation.
15. Object storage provider.
16. Error monitoring provider.

## Legal/privacy
17. Privacy policy.
18. Terms.
19. Consent wording.
20. Data retention.
21. Customer deletion/export process.
22. WhatsApp policy/compliance review.

## Recommended defaults
If speed is important, choose:
- monthly dealer subscription;
- WhatsApp-first;
- 30-90 day inactive requirement review;
- no automatic marketing beyond consent;
- customer data stays with dealer in V1.
