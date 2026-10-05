# Product Acceptance Criteria

## AC01 Dealer isolation
Given Dealer A and Dealer B exist,
when Dealer A queries customers,
then only Dealer A customers are returned.

## AC02 Customer self-registration
Given a valid Dealer A link,
when a new customer verifies a mobile,
then a Dealer A customer is created.

## AC03 Existing customer
Given Dealer A already has the verified phone,
when the same phone verifies again,
then no duplicate customer is created.

## AC04 Same phone across dealers
Given Dealer A and Dealer B both have a customer with the same phone,
then each dealer has an independent customer record.

## AC05 Multiple requirements
A single customer can have multiple active requirements.

## AC06 Vehicle matching
When an eligible Dealer A vehicle is created,
then only eligible Dealer A requirements are considered.

## AC07 No cross-dealer matching
Dealer A vehicle must never create a match with Dealer B requirement.

## AC08 Notification
When a match meets notification threshold,
then one customer notification is queued.

## AC09 Duplicate notification prevention
If the same job is retried,
then customer receives no duplicate business notification.

## AC10 Interest
When customer clicks Interested,
then:
- match becomes interested;
- activity is recorded;
- dealer follow-up is created;
- dealer is notified.

## AC11 Sold vehicle
When a vehicle is sold,
then it must not be offered as an available vehicle.

## AC12 Stale notification
If a customer opens a notification after vehicle is sold,
then the page must clearly show unavailable state and may show alternatives.

## AC13 Security
Any attempt to access another dealer's customer/vehicle/requirement fails without data leakage.

## AC14 Reliability
If WhatsApp provider temporarily fails,
then the message is retried safely.

## AC15 Recovery
If a worker crashes after database commit,
then outbox/queue processing eventually resumes the required job.

## AC16 Audit
Critical changes are traceable to dealer/user/time.

## AC17 Performance
Normal CRUD endpoints meet agreed latency target under expected pilot load.

## AC18 Customer usability
A customer can complete registration and requirement submission on a phone without installing an app.
