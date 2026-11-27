# Contract: Calculation Engine

The calculation engine is a pure, synchronous TypeScript module (`src/calc/`) with no I/O, no React and no
storage access. Screens call it; reference-fixture tests pin its behaviour. Types are sketched here in
TypeScript notation as an interface description, not as implementation.

## Version

`CALC_VERSION = "1.0.0"`. Bump MINOR for new outputs and MAJOR for any change to an existing formula or
band rule. A MAJOR bump requires the reference fixtures to be regenerated and the before/after diff
included in the PR (constitution, Quality Gates).

## Inputs

```ts
interface CalcInput {
  lots: { shares: number; averagePrice: number }[];
  sales: { shares: number; price: number }[];   // already in applied order
  targetSellRates: number[];                     // > 0, unique
  soldSteps: number[];                           // (0, 1], unique
  profitZoneThreshold: number;                   // ≥ 0
}
```

## Outputs

```ts
type ClassBand = "PARTIAL_RECOVERY" | "COST_RECOVERED" | "PROFIT_LOCKED" | "OVER_LIQUIDATION";
type PlayBand  = "CAPITAL_GAP" | "BREAKEVEN" | "PROFIT_ZONE";

interface CalcResult {
  calcVersion: string;
  status: "EMPTY" | "ACTIVE" | "HOUSE_MONEY" | "FULLY_SOLD";
  totalShares: number;            // TS
  netExpense: number;             // NE
  weightedAp: number | null;      // null when status ≠ ACTIVE
  projection: {                   // one per TSR, same order as input
    tsr: number; grossProfit: number; netProfit: number;
    rateDiffPosition: number | null; rateDiffPerLot: number[];
  }[];
  liquidation:    Cell<number>[][];                                 // [step][tsr] realized
  classification: Cell<{ m: number | null; band: ClassBand | null }>[][];
  toPlay:         Cell<{ x: number; band: PlayBand }>[][];
}
interface Cell<T> { step: number; tsr: number; value: T }
```

## Functions

| Function | Purpose | Errors |
|----------|---------|--------|
| `calculate(input: CalcInput): CalcResult` | All four analyses | Throws `CalcInputError` (with field + reason) on invalid input; callers validate first |
| `validate(input: CalcInput): ValidationIssue[]` | Field-level checks used by forms | none (returns the list) |
| `applySale(input, sale): CalcInput` | Builds a what-if input (sale appended) | `CalcInputError` if the sale exceeds the shares held |
| `classify(m: number): ClassBand` / `playBand(x, threshold): PlayBand` | Band rules on values rounded to 2 dp | — |

## Behavioural guarantees

1. Deterministic: the same input always gives the same output.
2. HOUSE_MONEY (NE ≤ 0, TS > 0): `weightedAp = null`, `classification[*][*].value = { m: null, band: null }`.
   The UI shows "Cost fully recovered — house money". Liquidation and To Play are still computed.
3. FULLY_SOLD (TS = 0) and EMPTY (no lots): tables are empty arrays.
4. For the workbook fixture, every value matches to 2 decimal places (SC-001).

## Reference examples (from the workbook)

| Case | Expected |
|------|----------|
| 1 lot 1000 @ 1.80, TSR 4.53 | TS 1000, NE 1800.00, GP 4530.00, NP 2730.00, RD 2.73 |
| p 0.3, TSR 6.53 | Realized 1959.00; M 1.09 COST_RECOVERED; x 159.00 BREAKEVEN |
| p 0.5, TSR 10.53 | M 2.93 OVER_LIQUIDATION |
| p 0.2, TSR 8.53 / 10.53 | x −94.00 CAPITAL_GAP / 306.00 BREAKEVEN |
| Lots 100 @ 3.53 + 181 @ 1.80, sale 120 @ 4.53 | TS 161, NE 135.20 |
