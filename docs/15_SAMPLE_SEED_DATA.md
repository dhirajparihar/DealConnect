# Sample Seed Data

## Dealer
```json
{
  "name": "Sharma Motors",
  "slug": "sharma-motors",
  "status": "active"
}
```

## Customer
```json
{
  "name": "Rahul Sharma",
  "phone": "+919876543210"
}
```

## Requirement
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
  "status": "searching"
}
```

## Vehicle
```json
{
  "stockNumber": "SM-1024",
  "make": "Hyundai",
  "model": "Creta",
  "year": 2022,
  "price": 1020000,
  "fuel": "petrol",
  "transmission": "automatic",
  "kilometers": 42000,
  "status": "available"
}
```

Expected:
- requirement and vehicle are same dealer;
- match score should be high;
- notification should be queued;
- customer can click Interested;
- dealer gets follow-up.
