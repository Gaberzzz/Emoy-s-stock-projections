# Research: Stock Projection Mobile App

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-27

## R1. Live reference price (FR-013)

**Decision**: v1 ships **without** live prices (spec fallback, the user's option A). The UI leaves room
for a reference price next to the TSRs, and the code keeps a `PriceSource` seam so a price can be added
later without touching the calculation engine.

**Rationale**: The user asked for live prices only if they are free. Under the constitution (v2.0.0,
Principle V), with no backend, the phone may call a price service directly only if the service needs
**no secret key** and its terms allow app use.

- **Keyless sources** (unofficial Yahoo Finance endpoints, scraped quote pages, Stooq CSV): no published
  licence that permits redistribution in an app; some forbid automated access in their terms. That fails
  Principle I (use providers within their licence).
- **Free-tier keyed APIs** (e.g. Finnhub, Alpha Vantage, Twelve Data, Financial Modeling Prep): the
  licence is acceptable for personal use, but each needs an API key. The key can't ship in the app, so a
  backend proxy would be needed. That adds a server to host, secure and test (contract tests), and
  conflicts with the user's choice of a personal app with no server (Q3: A). That's not "free" in effort,
  and it isn't the simplest design (Principle IV).
- **Unknown market**: the example ticker "KEEL" and its price (~USD 1.80–12.53) don't settle which
  exchange the user trades on. Free-tier coverage of non-US exchanges and OTC/penny stocks is patchy.

**Alternatives considered**:
- *Keyless unofficial endpoint called from the phone*: rejected (licence/terms, Principle I).
- *Free keyed API plus a small serverless proxy*: technically workable, and deferred. If the user wants
  it later, it becomes its own feature with a Python backend (per the constitution), contract tests, and
  a reference-price card. Nothing in v1 blocks it.
- *User types a "current price" manually*: cheap and offline. It can be added as an optional field later;
  it's not in the spec, so it's not in v1.

## R2. App framework

**Decision**: React Native in TypeScript (strict), using **Expo** (managed workflow) and its dev build
and EAS tooling. Navigation uses **React Navigation** (native stack).

**Rationale**: The constitution requires a single React Native + TypeScript codebase for iOS and Android.
Expo is the officially recommended way to start a React Native app. It produces iOS and Android builds
without the developer owning native projects, and it can install on the owner's own phone (Expo Go or a
development build) without a store release, which fits "personal use, no store release in v1". React
Navigation is the most widely used navigation library.

**Alternatives considered**: bare React Native CLI (more native setup for no benefit here); Expo Router
(file-based routing, fine too, but more convention than a 5-screen app needs).

## R3. On-device storage

**Decision**: Store all positions as **one versioned JSON document** in `@react-native-async-storage/async-storage`
(Expo-supported), behind a small `Repository` module. The document has a `schemaVersion` and a migration
step on load.

**Rationale**: The data volume is tiny (a handful of positions, each with ≤ tens of lots, TSRs and sales).
It needs no queries or joins. A single JSON document is the simplest option to read, write, validate and
test (Principle IV). Writes happen after each edit (debounced), so SC-005 (data survives restart) holds.

**Alternatives considered**: `expo-sqlite` (relational, overkill at this size); MMKV (faster, but needs a
native module and isn't needed for performance); a cloud database (out of scope, Q3: A).

## R4. Number handling and rounding

**Decision**: Calculate in plain JavaScript `number` (IEEE double) and round **only for display**: money
to 2 decimals with thousands separators, M to 2 decimals. **Bands are decided on the value rounded to 2
decimals**, so the label always agrees with the number shown (e.g. a raw 0.9996 shows "1.00" and
"Cost Recovered").

**Rationale**: Inputs carry ≤ 4 decimals and quantities stay small, so double-precision error (~1e-12)
is far below display precision. The workbook itself uses doubles (e.g. 852.9999999999999). A decimal
library adds a dependency for no visible gain (Principle IV).

**Alternatives considered**: decimal.js / big.js (rejected as unnecessary); integer cents (complicates
the M ratio and per-share prices with 3–4 decimals).

## R5. Formula semantics (resolving workbook quirks)

| Topic | Decision | Source / reason |
|-------|----------|-----------------|
| Weighted AP | `NE / TS` over all lots, after sales | Workbook N34 covers only lots 1–2; spec assumption |
| Recorded sale | `TS' = TS − s`, `NE' = NE − s × price` | Workbook recovery-point example (161 shares, NE 135.20) |
| Order of sales | Applied in date order, then entry order; a sale may not exceed shares held at that point | Edge case in spec |
| NE ≤ 0 after sales | Weighted AP and M are shown as "house money" (cost fully recovered), not as a number | Spec US3 scenario 3 |
| RD | Per lot: `TSR − lot AP`; also position-level `TSR − weighted AP` | Workbook rows 8–12, plus useful after sales |
| To Play bands | Capital Gap `x < 0`; Breakeven `0 ≤ x < T`; Profit Zone `x ≥ T`, with T = 350 by default and editable | Workbook N40–N42 (it leaves x = 0 undefined; it's assigned to Breakeven) |
| Classification bands | `M < 1`, `1 ≤ M < 1.5`, `1.5 ≤ M < 2.5`, `M ≥ 2.5` | Workbook N29–N32 |
| % sold steps | Default 10…80% in steps of 10; editable, each 1–100% | Workbook D20–D27; FR-005 |
| Duplicate TSRs / steps | Rejected with a message | Spec edge case (one consistent rule) |
| Formula version | `CALC_VERSION = "1.0.0"`, shown on the formula info screen | Constitution Principle II |

## R6. Testing approach

**Decision**:
- The calculation engine is a pure TypeScript module, tested with **Jest** test-first.
- A **reference fixture**, `workbook-reference.json`, holds the inputs and every computed cell value from
  `Stocks-Projection.xlsx` (Projection, Liquidation, Classification, To Play), plus the recovery-point
  example. It's generated once by a small Python script (openpyxl) that is checked in, and compared to
  2 decimals.
- Screens are tested with **React Native Testing Library**.
- There's no backend, so there are no API contract tests (they apply only "where a backend exists").

**Rationale**: Constitution Principle III v2.0.0: deterministic calculations must be verified against
fixed, versioned reference datasets. SC-001 says the workbook is the reference.

**Alternatives considered**: hand-copying expected values into tests (risks typos; a generated fixture
can be traced back to the source).
