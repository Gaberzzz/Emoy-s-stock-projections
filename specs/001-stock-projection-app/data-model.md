# Data Model: Stock Projection Mobile App

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

All data lives on the device in one versioned document (see [contracts/storage-schema.md](./contracts/storage-schema.md)).
Derived results are never stored; they're recomputed from inputs (see [contracts/calc-engine.md](./contracts/calc-engine.md)).

## Stored entities

### AppData (root)

| Field | Type | Rules |
|-------|------|-------|
| schemaVersion | integer | Starts at 1; bumped with a migration on any shape change |
| positions | Position[] | Ordered as the user last arranged them (default: newest first) |

### Position

| Field | Type | Rules |
|-------|------|-------|
| id | string (UUID) | Unique, immutable |
| name | string | Required, 1–40 chars, trimmed (e.g. "KEEL") |
| capitalNote | string? | Optional, ≤ 80 chars (e.g. "Capital: USD 677"); informational only |
| lots | Lot[] | 0–50; at least 1 lot is needed to show analyses |
| targetSellRates | number[] | 0–20 values, each > 0, unique; kept sorted ascending |
| soldSteps | number[] | Fractions in (0, 1], unique, sorted; default [0.1 … 0.8] |
| profitZoneThreshold | number | ≥ 0; default 350 (To Play) |
| sales | Sale[] | Recorded actual sales |
| createdAt / updatedAt | ISO-8601 string | Set by the app |

### Lot

| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique within position |
| shares | number | > 0; whole shares by default (fractions allowed up to 4 decimals) |
| averagePrice | number | > 0, ≤ 4 decimals |

### Sale (recorded recovery point)

| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique within position |
| shares | number | > 0 and ≤ shares held just before this sale (in applied order) |
| price | number | > 0, ≤ 4 decimals |
| date | ISO date (YYYY-MM-DD) | Defaults to today; sales are applied in date order, then by entry order |
| note | string? | Optional, ≤ 80 chars |

## Transient (not stored)

### WhatIfSale

Same fields as Sale, held only in screen state. **Preview** computes results as if appended to `sales`.
**Record** validates it and appends it to `sales`. **Discard** drops it.

## Derived values (calculation engine output)

| Name | Definition |
|------|-----------|
| TS (total shares) | Σ lot.shares − Σ sale.shares |
| NE (net expense) | Σ lot.shares × lot.averagePrice − Σ sale.shares × sale.price |
| Weighted AP | NE / TS when NE > 0 and TS > 0; otherwise "house money" (no numeric AP) |
| Per TSR: GP / NP | GP = TS × TSR; NP = GP − NE |
| Per TSR: RD | per lot: TSR − lot.averagePrice; position: TSR − weighted AP |
| Liquidation (p, TSR) | Realized = TS × p × TSR |
| Classification (p, TSR) | M = p × TSR / weighted AP → band (thresholds 1, 1.5, 2.5) |
| To Play (p, TSR) | x = Realized − NE → band (thresholds 0, profitZoneThreshold) |

## State transitions

```text
Position: (new) → empty (no lots) → active (≥1 lot, TS > 0) ⇄ house-money (NE ≤ 0, TS > 0)
                                   → fully-sold (TS = 0)
Sale:     what-if (transient) → recorded → removed
```

- Removing a recorded sale is rejected if it would make a later sale exceed the shares held at that point.
  The user is told which sale conflicts.
- Deleting a lot is rejected the same way if recorded sales would then exceed the shares held.
- "fully-sold" positions show NE (total realized result) and no % sold tables.
