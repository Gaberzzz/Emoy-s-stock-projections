# Quickstart & Validation: Stock Projection Mobile App

How to run the app and prove that the feature works. See [contracts/](./contracts/) and
[data-model.md](./data-model.md) for the details being validated.

## Prerequisites

- Node.js LTS and npm
- Python 3.11+ with `openpyxl` (only to regenerate the reference fixture)
- To try it on a phone: the Expo Go app (iOS/Android) or an Android emulator / iOS simulator

## Setup and checks

```bash
cd app && npm install
```

```bash
npm run typecheck && npm run lint
```

```bash
npm test
```

Expected: all suites pass, including `calc/workbook-reference.test.ts` (SC-001).

To regenerate the reference fixture from the spreadsheet (only when the workbook changes):

```bash
python3 scripts/extract_workbook_reference.py Stocks-Projection.xlsx app/src/calc/__fixtures__/workbook-reference.json
```

## Run on a device

```bash
cd app && npx expo start
```

Scan the QR code with Expo Go, or press `a` (Android) or `i` (iOS).

## Manual validation scenarios

| # | Steps | Expected |
|---|-------|----------|
| 1 (US1) | Add the example (KEEL), or enter 1 lot of 1000 @ 1.80 and TSRs 4.53, 6.53, 8.53, 10.53, 12.53 | TS 1,000; NE 1,800.00; at 4.53: GP 4,530.00, NP 2,730.00, RD 2.73 |
| 2 (US1) | Add a lot of 500 @ 2.40 | TS 1,500; NE 3,000.00; all tables update within 1 s |
| 3 (US2) | Open Liquidation, Classification, To Play | 30% @ 6.53: 1,959.00 · M 1.09 Cost Recovered · 159.00 Breakeven |
| 4 (US2) | Tap a band label | Plain-language rule for that band |
| 5 (US3) | New position: 100 @ 3.53 + 181 @ 1.80; preview a sale of 120 @ 4.53 | Preview shows 161 shares, NE 135.20; saved position unchanged |
| 6 (US3) | Record that sale, then remove it | Recorded: 161 / 135.20, listed in history. Removed: back to 281 / 678.80 |
| 7 (US3) | Record sales until NE ≤ 0 | "Cost fully recovered — house money"; no M values |
| 8 (US4) | Create two positions, force-quit and reopen | Both listed with name, TS and NE (SC-005) |
| 9 | Enter 0 or a negative number, or sell more than held | Inline error; nothing saved |
| 10 | Turn on airplane mode and use every screen | Everything works (no network used) |
| 11 | Any analysis screen | "Informational, not financial advice" notice and a formula/version link are visible |
