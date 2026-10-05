# Screen-by-Screen Specification

## CUSTOMER

### C01 Dealer Landing
URL:
`/d/{dealerSlug}`

Elements:
- dealer logo/name;
- headline: "Tell us what car you're looking for";
- supporting text: "We'll notify you when a matching car arrives.";
- Start button;
- privacy/terms.

States:
- dealer active;
- dealer inactive;
- invalid link.

### C02 Mobile OTP
Fields:
- phone.

Actions:
- send OTP;
- verify;
- resend.

Validation:
- valid phone;
- rate limits;
- OTP expiry;
- wrong OTP.

### C03 Customer Profile
Fields:
- full name;
- optional email.

### C04 Requirement Wizard
Step 1:
- make;
- model.

Step 2:
- min/max budget;
- min/max year.

Step 3:
- fuel;
- transmission.

Step 4:
- max kilometers;
- location;
- radius;
- color;
- additional notes.

Every optional field must be skippable.

### C05 Requirement Confirmation
Show:
- summary;
- edit;
- submit.

### C06 My Requirements
Cards:
- vehicle preference;
- budget;
- status;
- last match.

Actions:
- edit;
- pause;
- close;
- add requirement.

### C07 Match Detail
Show:
- images;
- dealer;
- make/model;
- year;
- price;
- fuel/transmission;
- kilometers;
- location;
- CTA.

Actions:
- interested;
- not now;
- not interested.

### C08 Customer Profile
Show:
- name;
- verified mobile;
- requirements;
- consent status.

---

## DEALER

### D01 Login
- mobile/email;
- OTP/passwordless;
- error states.

### D02 Dashboard
Cards:
- active customers;
- active requirements;
- new matches;
- interested;
- follow-ups;
- available vehicles.

Activity:
- recent customer registrations;
- recent matches;
- interested leads.

### D03 Customers
Columns:
- customer;
- phone;
- active requirements;
- last activity;
- status;
- owner.

Filters:
- status;
- salesperson;
- date;
- requirement.

### D04 Customer Detail
Tabs:
- Overview;
- Requirements;
- Matches;
- Activity;
- Follow-ups.

### D05 Requirement Detail
Show:
- customer;
- preferences;
- status;
- priority;
- matching vehicles;
- history.

### D06 Inventory
Columns:
- stock;
- vehicle;
- year;
- price;
- status;
- matches.

### D07 Add/Edit Vehicle
Required:
- make;
- model;
- year;
- price.

Optional:
- variant;
- fuel;
- transmission;
- km;
- location;
- description;
- media.

### D08 Vehicle Detail
Show:
- photos;
- specifications;
- status;
- matched customers;
- match scores;
- notification status.

### D09 Match Center
Two views:
- by vehicle;
- by requirement.

### D10 Follow-ups
Buckets:
- overdue;
- today;
- upcoming;
- completed.

### D11 Team
- users;
- roles;
- active/inactive;
- assignments.

### D12 Settings
- dealer profile;
- customer portal;
- notification preferences;
- templates;
- business hours.

---

## PLATFORM ADMIN

### A01 Dealers
- create;
- activate;
- deactivate;
- view basic usage.

### A02 Dealer Detail
- status;
- plan;
- usage;
- support access with explicit audit.

### A03 System Health
- API;
- database;
- queue;
- notification provider;
- error rate.

### A04 Audit
Search:
- dealer;
- user;
- action;
- entity;
- time.
