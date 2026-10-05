# Recommended Repository Structure

```text
/apps
  /web
    /app
      /(dealer)
      /(customer)
      /(admin)
  /api
    /src
      /modules
        /auth
        /dealers
        /users
        /customers
        /requirements
        /vehicles
        /matching
        /matches
        /notifications
        /followups
        /activities
        /audit
        /health
      /common
      /config
      /database
      /queues
      /events

/packages
  /shared-types
  /validation
  /ui
  /config

/infrastructure
  /docker
  /terraform-or-cloud-config
  /monitoring

/docs
  /product
  /architecture
  /api
  /runbooks
```

## Module rule

Each backend module should own:
- controller/API;
- DTO/validation;
- service;
- repository/data access;
- domain rules;
- tests.

Cross-module access should happen through service interfaces/events rather than direct database access from unrelated modules.
