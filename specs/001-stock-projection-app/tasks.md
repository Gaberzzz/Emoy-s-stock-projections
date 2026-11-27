---

description: "Task list for the Stock Projection Mobile App"
---

# Tasks: Stock Projection Mobile App

**Input**: Design documents from `/specs/001-stock-projection-app/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. Constitution v2.0.0 Principle III (Test-First, NON-NEGOTIABLE) requires tests to be
written and seen to fail before implementation, plus reference-dataset tests for the calculations.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: The user story the task belongs to (US1–US4)
- All app paths are under `app/` (see plan.md → Project Structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Create the Expo TypeScript app in `app/` (blank TypeScript template, current stable Expo SDK, pinned) with `app/App.tsx`, `app/app.json`, `app/package.json`
- [X] T002 Enable TypeScript strict mode (`"strict": true`, `noUncheckedIndexedAccess`) in `app/tsconfig.json`
- [X] T003 [P] Configure ESLint + Prettier (Expo config) and add `lint`, `typecheck` and `test` npm scripts in `app/package.json`
- [X] T004 [P] Configure Jest (`jest-expo` preset) and React Native Testing Library in `app/jest.config.js` and `app/jest.setup.ts`
- [X] T005 [P] Install React Navigation (native stack) and `@react-native-async-storage/async-storage` via `npx expo install`; record them in `app/package.json`
- [X] T006 [P] Add a CI workflow running lint, typecheck and tests in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, the reference fixture, formatting, validation and the app shell, which every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Write the fixture extractor `scripts/extract_workbook_reference.py` (openpyxl, `data_only=True`). It reads `Stocks-Projection.xlsx` sheet `projection` and writes inputs (lots C8:D12, TSRs E7:I7, steps D20:D27, threshold 350) and expected values (E13:I14 GP/NP, E8:I8 RD, E20:I27 realized, E31:I38 M, E42:I49 x), plus the recovery-point example (M18:N21), to `app/src/calc/__fixtures__/workbook-reference.json`. Run it and commit the output.
- [X] T008 [P] Define domain types `AppData`, `Position`, `Lot`, `Sale` and `WhatIfSale` exactly as in data-model.md (AppData.schemaVersion, AppData.positions, Position.*, Lot.*, Sale.*) in `app/src/domain/types.ts`
- [X] T009 [P] Define the calc contract types `CalcInput`, `CalcResult`, `Cell`, `ClassBand`, `PlayBand`, `CalcInputError` and `ValidationIssue` per contracts/calc-engine.md in `app/src/calc/types.ts`, and `CALC_VERSION = "1.0.0"` in `app/src/calc/version.ts`
- [X] T010 [P] Write failing tests for the formatters (money: 2 dp + thousands separators + negatives; multiple: 2 dp; percent steps) in `app/src/format/__tests__/format.test.ts`
- [X] T011 Implement `formatMoney`, `formatMultiple`, `formatPercent` and `round2` to pass T010 in `app/src/format/format.ts`
- [X] T012 [P] Write failing tests for field validation covering data-model.md Position.name, Position.capitalNote, Position.lots (count), Position.targetSellRates, Position.soldSteps, Position.profitZoneThreshold, Lot.shares, Lot.averagePrice, Sale.shares, Sale.price, Sale.date and Sale.note, in `app/src/calc/__tests__/validate.test.ts`
- [X] T013 Implement `validate(input)` and the per-field validators (citing the same data-model.md fields as T012; messages are user-facing and plain-language) in `app/src/calc/validate.ts`
- [X] T014 [P] Create the shared `NumberField` component (numeric keyboard, inline error from a `ValidationIssue`) in `app/src/components/NumberField.tsx`
- [X] T015 [P] Create the `Disclaimer` component ("Informational what-if calculations, not financial advice. Past performance does not guarantee future results.") with a link to the formula info screen, in `app/src/components/Disclaimer.tsx`
- [X] T016 Create the app state context + reducer (in memory, `AppData` with actions for positions, lots, TSRs, steps, threshold and sales; ids via `expo-crypto` `randomUUID` for data-model.md Position.id, Lot.id and Sale.id; Position.createdAt/updatedAt set by the reducer) in `app/src/state/AppState.tsx`, with reducer unit tests first in `app/src/state/__tests__/reducer.test.ts`
- [X] T017 Set up navigation (native stack: PositionsList, PositionEditor, Analyses, Sales, FormulaInfo) and wrap it in the state provider in `app/src/navigation/RootNavigator.tsx` and `app/App.tsx`

**Checkpoint**: Foundation ready. `npm test` is green and the app opens to an empty shell.

---

## Phase 3: User Story 1 - Build a position and see the projection (Priority: P1) 🎯 MVP

**Goal**: The user enters lots and TSRs and sees TS, NE, weighted AP, and per TSR GP, NP and RD.

**Independent Test**: Enter 1000 @ 1.80 and TSRs 4.53/6.53/8.53/10.53/12.53; results match the workbook (quickstart #1–2).

### Tests for User Story 1 ⚠️ (write first, see them fail)

- [X] T018 [P] [US1] Reference test: TS, NE, weighted AP and the `projection` array (GP, NP, per-lot RD, position RD) against `workbook-reference.json` to 2 dp, plus a 2-lot case (1000 @ 1.80 + 500 @ 2.40 → TS 1500, NE 3000.00) and a 3-lot case proving weighted AP = NE/TS over all lots (research.md R5), in `app/src/calc/__tests__/projection.test.ts`
- [X] T019 [P] [US1] Engine status tests: EMPTY (no lots) and TSR below AP gives negative NP/RD, in `app/src/calc/__tests__/status.test.ts`
- [X] T020 [P] [US1] Screen test: editing lots/TSRs updates the Projection results, duplicate TSR shows an error, zero/negative input shows an inline error, in `app/src/screens/__tests__/PositionEditorScreen.test.tsx`

### Implementation for User Story 1

- [X] T021 [US1] Implement `calculate()` totals, status (EMPTY/ACTIVE) and `projection` per contracts/calc-engine.md in `app/src/calc/calculate.ts`; export the public API from `app/src/calc/index.ts`
- [X] T022 [P] [US1] Create the `MoneyText` component (formatted, negative values styled as a loss) in `app/src/components/MoneyText.tsx`
- [X] T023 [US1] Build `PositionEditorScreen`: name (data-model.md Position.name) and capital note (Position.capitalNote), a lots list with add/edit/remove (Lot.shares, Lot.averagePrice), and a TSR list with add/edit/remove kept sorted (Position.targetSellRates), using `NumberField` and `validate()`, in `app/src/screens/PositionEditorScreen.tsx`
- [X] T024 [US1] Build the Projection tab (summary card TS/NE/weighted AP; one row or card per TSR with GP, NP, RD; per-lot RD expandable; `Disclaimer`), with results recomputed with `useMemo` on every edit, in `app/src/screens/analyses/ProjectionTab.tsx` and the tab host `app/src/screens/AnalysesScreen.tsx`
- [X] T025 [US1] Add the "Add example (KEEL)" action that loads the workbook example (1000 @ 1.80, the 5 TSRs, capital note "Capital: USD 677") in `app/src/domain/examples.ts`, wired into `app/src/screens/PositionsListScreen.tsx` (a minimal list showing just this position for now)

**Checkpoint**: The MVP works. One position can be entered and its projection matches the workbook.

---

## Phase 4: User Story 2 - Liquidation, Classification and To Play tables (Priority: P1)

**Goal**: Grids of % sold × TSR, with Classification and To Play bands labelled and coloured, plus a legend.

**Independent Test**: With the example position, 30% @ 6.53 shows 1,959.00 / M 1.09 Cost Recovered / 159.00 Breakeven (quickstart #3–4).

### Tests for User Story 2 ⚠️

- [X] T026 [P] [US2] Reference test: every `liquidation`, `classification` (M + band) and `toPlay` (x + band) cell against `workbook-reference.json` to 2 dp, in `app/src/calc/__tests__/liquidation.test.ts`
- [X] T027 [P] [US2] Band boundary tests (`classify` at 0.995/1.00/1.495/1.50/2.495/2.50; `playBand` at −0.004/0/349.99/350 and a custom data-model.md Position.profitZoneThreshold; bands decided on values rounded to 2 dp per research.md R4), in `app/src/calc/__tests__/bands.test.ts`
- [X] T028 [P] [US2] Screen test: grids render the band labels, tapping a chip opens its rule, editing data-model.md Position.soldSteps changes the rows, in `app/src/screens/__tests__/AnalysesScreen.test.tsx`

### Implementation for User Story 2

- [X] T029 [US2] Implement `classify()` and `playBand()` in `app/src/calc/bands.ts`
- [X] T030 [US2] Extend `calculate()` with the `liquidation`, `classification` and `toPlay` grids over data-model.md Position.soldSteps × Position.targetSellRates, using Position.profitZoneThreshold, in `app/src/calc/calculate.ts`
- [X] T031 [P] [US2] Create the `BandChip` component (label + distinct colour per band, colour-blind-safe palette, plus a text label, never colour alone) in `app/src/components/BandChip.tsx`
- [X] T032 [P] [US2] Create the `ResultGrid` component (sticky % sold column, horizontally scrollable TSR columns, each cell readable without zoom per SC-004) in `app/src/components/ResultGrid.tsx`
- [X] T033 [US2] Build the Liquidation, Classification and To Play tabs using `ResultGrid` + `BandChip` + `Disclaimer` in `app/src/screens/analyses/LiquidationTab.tsx`, `app/src/screens/analyses/ClassificationTab.tsx` and `app/src/screens/analyses/ToPlayTab.tsx`, registered in `app/src/screens/AnalysesScreen.tsx`
- [X] T034 [US2] Build `FormulaInfoScreen` (every formula from the spec Overview, the band legend with plain-language rules, `CALC_VERSION`) in `app/src/screens/FormulaInfoScreen.tsx`
- [X] T035 [US2] Add editors for data-model.md Position.soldSteps (default 10–80%) and Position.profitZoneThreshold (default 350) to `app/src/screens/PositionEditorScreen.tsx`

**Checkpoint**: All four workbook analyses are reproduced.

---

## Phase 5: User Story 3 - Record a sale and preview what-if sales (Priority: P2)

**Goal**: A per-position sales history, plus a "what if I sell?" preview that can become a recorded sale.

**Independent Test**: 100 @ 3.53 + 181 @ 1.80; preview a sale of 120 @ 4.53 → 161 / 135.20 with the saved position unchanged; record it, then remove it → 281 / 678.80 (quickstart #5–7).

### Tests for User Story 3 ⚠️

- [X] T036 [P] [US3] Engine tests: the recovery-point fixture (161 / 135.20), sales applied in data-model.md Sale.date order then entry order, a sale exceeding the shares held throws `CalcInputError`, HOUSE_MONEY (NE ≤ 0 → weightedAp null, M null) and FULLY_SOLD (TS = 0 → empty grids), in `app/src/calc/__tests__/sales.test.ts`
- [X] T037 [P] [US3] Reducer tests: record/remove a sale; removing a sale or deleting a lot is rejected if a later sale would exceed the shares held (data-model.md State transitions), in `app/src/state/__tests__/sales-reducer.test.ts`
- [X] T038 [P] [US3] Screen test: the preview doesn't change the saved position, "Record" appends to the history, "Remove" restores the prior totals, house-money message shown, in `app/src/screens/__tests__/SalesScreen.test.tsx`

### Implementation for User Story 3

- [X] T039 [US3] Implement sale application (sort by Sale.date, validate Sale.shares against the running TS), `applySale()`, and the HOUSE_MONEY / FULLY_SOLD statuses in `app/src/calc/sales.ts` and `app/src/calc/calculate.ts`
- [X] T040 [US3] Add the sale actions and the conflict checks (removing a sale, deleting a lot) to the reducer in `app/src/state/AppState.tsx`
- [X] T041 [US3] Build `SalesScreen`: history list (date, shares, price, note per data-model.md Sale.*) with remove + confirm; a what-if form (WhatIfSale, held in screen state only) showing a before → after summary (TS, NE, weighted AP) and an "Open analyses with this sale" view; "Record this sale" converts it, in `app/src/screens/SalesScreen.tsx`
- [X] T042 [US3] Let `AnalysesScreen` take an optional what-if sale and show a "Preview — not saved" banner, and show the "Cost fully recovered — house money" state on the Classification tab, in `app/src/screens/AnalysesScreen.tsx` and `app/src/screens/analyses/ClassificationTab.tsx`

**Checkpoint**: Positions stay accurate after real sales; what-ifs are safe to explore.

---

## Phase 6: User Story 4 - Manage several positions (Priority: P2)

**Goal**: A list of positions with rename/duplicate/delete; data survives app restarts on the device.

**Independent Test**: Create two positions, force-quit, reopen; both are listed with name, TS and NE (quickstart #8).

### Tests for User Story 4 ⚠️

- [X] T043 [P] [US4] Repository tests (mocked AsyncStorage): missing key → empty data at data-model.md AppData.schemaVersion 1; round-trip save/load; migration hook runs from an older AppData.schemaVersion; an invalid/unparseable document is kept under `emoy.appData.corrupt-<timestamp>` and never overwritten (contracts/storage-schema.md), in `app/src/storage/__tests__/repository.test.ts`
- [X] T044 [P] [US4] Screen test: list shows name/TS/NE per position; duplicate creates a copy with new data-model.md Position.id; delete asks for confirmation, in `app/src/screens/__tests__/PositionsListScreen.test.tsx`

### Implementation for User Story 4

- [X] T045 [US4] Implement the `Repository` (`load`, `save`, `migrate`, corrupt-copy handling, key `emoy.appData`) per contracts/storage-schema.md, validating every Position, Lot and Sale field per data-model.md on load, in `app/src/storage/repository.ts`
- [X] T046 [US4] Hydrate the state from `Repository.load()` on start (loading state + "data couldn't be read" notice) and persist with a ≤ 500 ms debounce and on app background (`AppState` change), in `app/src/state/AppState.tsx`
- [X] T047 [US4] Complete `PositionsListScreen`: all positions (data-model.md AppData.positions order) with name, TS and NE; create / rename / duplicate / delete-with-confirm; an empty state with "Add example (KEEL)", in `app/src/screens/PositionsListScreen.tsx`

**Checkpoint**: All user stories work independently and together.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T048 [P] Accessibility pass: labels on every input and chip, dynamic type, contrast, in `app/src/components/*` and `app/src/screens/*`
- [X] T049 [P] Test that every analysis screen renders `Disclaimer` and a link to the formula/version (constitution Principle II, quickstart #11), in `app/src/screens/__tests__/disclaimer.test.tsx`
- [X] T050 [P] Test that no network module is called anywhere (mock `fetch` to throw; run the screen suites) to prove offline operation (FR-014, quickstart #10), in `app/src/__tests__/offline.test.ts`
- [X] T051 [P] Write `app/README.md` (run, test, regenerate fixture), linking to `specs/001-stock-projection-app/quickstart.md`
- [ ] T052 Run every quickstart.md manual scenario (1–11) on an Android emulator and iOS simulator (or Expo Go) and record the results in `specs/001-stock-projection-app/checklists/validation.md`

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories → **Polish (Phase 7)**
- **US1 (P1)**: needs only Foundational. **This is the MVP.**
- **US2 (P1)**: needs Foundational; uses `calculate()` from T021, so start it after T021. Its UI host (`AnalysesScreen`) comes from T024.
- **US3 (P2)**: needs T021 (engine) and T024 (analyses host). It works with in-memory state, without US4.
- **US4 (P2)**: needs Foundational only (state + types). It can run in parallel with US2/US3. T047 replaces the minimal list from T025.

```text
Setup → Foundational → US1 ─┬─→ US2 ─┐
                            ├─→ US3 ─┼─→ Polish
             Foundational ──┴─→ US4 ─┘
```

### Within each story

Tests first (they must fail) → engine/state → components → screens → checkpoint.

### Shared files (no [P] across these)

`app/src/calc/calculate.ts` (T021, T030, T039), `app/src/state/AppState.tsx` (T016, T040, T046),
`app/src/screens/PositionEditorScreen.tsx` (T023, T035), `app/src/screens/AnalysesScreen.tsx` (T024, T033, T042).

## Parallel Examples

```text
# Setup
T003, T004, T005, T006 together after T001–T002

# Foundational
T008, T009, T010, T012, T014, T015 together; then T011, T013; then T016 → T017

# US1
T018, T019, T020 (tests) together → T021 → T022 alongside T023 → T024 → T025

# US2
T026, T027, T028 together → T029 → T030; T031 and T032 alongside → T033 → T034, T035

# US3
T036, T037, T038 together → T039 → T040 → T041 → T042

# US4 (can run alongside US2/US3)
T043, T044 together → T045 → T046 → T047
```

## Implementation Strategy

### MVP first

1. Phases 1–2, then Phase 3 (US1).
2. Stop and validate with quickstart #1–2: the projection matches the workbook.

### Incremental delivery

1. **+US2**: all four workbook analyses. At this point the app fully replaces the spreadsheet for one position.
2. **+US4**: multiple positions that survive restarts (the first version worth keeping on the phone day to day).
3. **+US3**: a sales history and what-if previews.
4. **Polish**: accessibility, offline/disclaimer guarantees, the manual validation run.

### Notes

- Commit after each task or small group. Every commit keeps `npm test` green, except deliberately failing new tests that land together with their implementation in the same PR.
- Any change to a formula or band rule bumps `CALC_VERSION` and regenerates the reference fixture (contracts/calc-engine.md).
