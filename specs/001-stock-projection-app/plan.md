# Implementation Plan: Stock Projection Mobile App

**Branch**: `claude/modest-cray-k2590c` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-stock-projection-app/spec.md`

## Summary

A personal, offline mobile app (iOS and Android) that reproduces the `Stocks-Projection.xlsx` calculator.
The user keeps several positions, each with lots and Target Sell Rates. The app shows the Projection,
Liquidation, Classification and To Play analyses, and records actual sales or previews what-if sales.

Approach: a single Expo / React Native TypeScript app. All calculations live in a pure, versioned
calculation module, verified against a reference fixture generated from the workbook. Data is one
versioned JSON document in on-device storage. There's no server, and v1 has no live prices (see
[research.md R1](./research.md#r1-live-reference-price-fr-013)).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode); Python 3.11+ only for the one-off fixture-extraction script

**Primary Dependencies**: Expo SDK (latest stable, pinned at project creation), React Native, React Navigation (native stack), `@react-native-async-storage/async-storage`

**Storage**: On-device key-value storage holding one versioned JSON document ([contracts/storage-schema.md](./contracts/storage-schema.md))

**Testing**: Jest + React Native Testing Library; a reference fixture from the workbook for the calculation engine; pytest is not needed (there's no backend code)

**Target Platform**: iOS 16+ and Android 8+ (API 26+) phones, run through Expo Go or a development build (no store release in v1)

**Project Type**: mobile-app (client only)

**Performance Goals**: results refresh < 1 s after any edit (SC-003). In practice a full recompute of 20 TSRs × 10 steps is sub-millisecond.

**Constraints**: fully offline; no data leaves the device; tables readable on a phone without horizontal zoom (SC-004)

**Scale/Scope**: 1 user; ~5 screens (Positions list, Position editor, Analyses with 4 tabs, Sales history / what-if, Formula & legend info); ≤ 50 positions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Constitution v2.0.0.

| Principle | Gate | Pre-design | Post-design |
|-----------|------|-----------|-------------|
| I. Data Integrity | Market data has its source and timestamp; inputs are validated; nothing is dropped silently; optional market data isn't required | ✅ No market data in v1; inputs validated (FR-011) | ✅ `validate()` in [calc-engine](./contracts/calc-engine.md); a corrupt store is kept, not overwritten ([storage-schema](./contracts/storage-schema.md)) |
| II. Transparent Projections | Deterministic results show the formula and inputs; disclaimer on every projection screen; versioned formulas | ✅ FR-008, FR-012 | ✅ `CALC_VERSION` + formula/legend screen; quickstart #11 |
| III. Test-First | Unit tests first; reference-dataset tests; contract tests only if there's a backend | ✅ | ✅ Workbook fixture (R6); no backend, so no API contract tests |
| IV. Simplicity | Simplest design; dependencies justified | ✅ | ✅ No backend, no DB, no decimal library, no state library (each justified in research R2–R4) |
| V. Safety, Security & Privacy | No secrets in the bundle; on-device data stays on the device; no trades or advice | ✅ | ✅ No network calls at all; no analytics carrying position data |
| Platform constraints | One RN + TS-strict codebase for iOS and Android; Jest + RNTL; offline degradation | ✅ | ✅ |

**Result**: PASS (pre- and post-design). No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-stock-projection-app/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── calc-engine.md
│   └── storage-schema.md
├── checklists/requirements.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
app/                              # Expo React Native app (TypeScript strict)
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── src/
    ├── calc/                     # pure calculation engine (no React, no I/O)
    │   ├── version.ts            # CALC_VERSION
    │   ├── calculate.ts
    │   ├── bands.ts
    │   ├── validate.ts
    │   ├── __fixtures__/workbook-reference.json
    │   └── __tests__/
    ├── storage/                  # Repository: load/save/migrate the JSON document
    │   └── __tests__/
    ├── state/                    # React context + reducer for AppData
    ├── screens/
    │   ├── PositionsListScreen.tsx
    │   ├── PositionEditorScreen.tsx
    │   ├── AnalysesScreen.tsx    # tabs: Projection | Liquidation | Classification | To Play
    │   ├── SalesScreen.tsx       # history + what-if preview
    │   ├── FormulaInfoScreen.tsx # formulas, band legend, CALC_VERSION
    │   └── __tests__/
    ├── components/               # BandChip, MoneyText, ResultGrid, Disclaimer, NumberField
    └── format/                   # money / multiple formatting (2 dp, thousands separators)

scripts/
└── extract_workbook_reference.py # xlsx → reference fixture JSON

Stocks-Projection.xlsx            # source of truth for the reference fixture
```

**Structure Decision**: The app is client-only, under `app/`, so the repo root stays clean for specs
and the workbook. The `calc/` module has no React dependency, so it's easy to test, and a future backend
could reuse the same rules. There's no `api/` or `backend/` directory, because v1 has no server.

## Complexity Tracking

No constitution violations.
