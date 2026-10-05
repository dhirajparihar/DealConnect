# Matching Engine — Detailed Rules

## Required input

Requirement:
- make/model;
- price range;
- year range;
- fuel;
- transmission;
- optional km/location.

Vehicle:
- make/model;
- price;
- year;
- fuel;
- transmission;
- km/location.

## Hard rules
1. Same dealer only.
2. Vehicle must be available.
3. Requirement must be searching.
4. Explicitly required model must match.
5. Explicitly required fuel must match.
6. Explicitly required transmission must match.
7. Strict budget/year filters reject out-of-range vehicles.

## Score

Default:
- make/model = 30
- budget = 25
- year = 15
- fuel = 10
- transmission = 10
- km = 5
- location = 5

### Budget scoring
Within range:
100% of category points.

Slightly outside flexible range:
partial points.

Far outside:
0.

### Year
Inside range = full.
One year outside flexible range = partial.
Otherwise = 0.

### Distance
Within requested radius = full.
Outside radius = 0 unless customer chose "show nearby".

## Explainability
Store:
```json
{
  "model": 30,
  "budget": 23,
  "year": 15,
  "fuel": 10,
  "transmission": 10,
  "km": 4,
  "location": 5
}
```

## Threshold
Default notification threshold: 75.

Admin can configure later.

## Match deduplication
One `(requirement_id, vehicle_id)` match.

If same vehicle is updated:
- update match score;
- notify only if meaningful change meets configured rules.

## Performance
Use indexed candidate filtering before scoring.
Do not load all requirements into application memory.

Candidate query:
- dealer_id;
- active status;
- model;
- approximate price/year bounds.

Then score only candidates.

## Future
Possible later:
- customer behavior signals;
- ML ranking;
- learned weights;
- similar-model recommendations.

Do not include in V1.
