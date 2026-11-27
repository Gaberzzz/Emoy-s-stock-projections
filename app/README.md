# Stock Projections (mobile app)

A personal, offline iOS/Android app that reproduces the `Stocks-Projection.xlsx` calculator:
Projection, Liquidation, Classification and To Play analyses, plus a sales history and
"what if I sell?" previews. All data stays on the phone.

Spec, plan and validation steps: [`specs/001-stock-projection-app/`](../specs/001-stock-projection-app/)
(start with [quickstart.md](../specs/001-stock-projection-app/quickstart.md)).

## Run

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app, or press `a` (Android emulator) / `i` (iOS simulator).

## Check

```bash
npm run lint && npm run typecheck && npm test
```

## Regenerate the reference fixture

The calculation tests compare every result with the computed cells of the workbook. When the
workbook changes, regenerate the fixture from the repository root:

```bash
python3 scripts/extract_workbook_reference.py Stocks-Projection.xlsx app/src/calc/__fixtures__/workbook-reference.json
```

Any change to a formula or band rule must bump `CALC_VERSION` in `src/calc/version.ts`
(see `contracts/calc-engine.md`).

## Layout

| Path | What |
|------|------|
| `src/calc/` | Pure calculation engine (no React, no I/O) and its tests |
| `src/domain/` | Entity types, examples, validation of stored data |
| `src/storage/` | On-device repository (one versioned JSON document) |
| `src/state/` | Reducer + provider with debounced persistence |
| `src/screens/`, `src/components/` | UI |
| `src/navigation/` | React Navigation native stack |
