# Validation Record: Stock Projection Mobile App

**Date**: 2026-11-27
**Build**: branch `claude/modest-cray-k2590c`, `CALC_VERSION` 1.0.0

## Automated checks

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` (strict) | Pass |
| `npm test` | Pass (116 tests, 18 suites) |
| Workbook reference fixture (every Projection, Liquidation, Classification and To Play cell, plus the recovery-point example) | Pass, to 2 dp |
| `expo export` for Android and iOS (Hermes bundles) | Pass |

## Quickstart scenarios

The scenarios were exercised by automated screen tests and in a headless phone-sized browser
(web build of the same code). They have **not** yet been run on a real Android emulator, iOS
simulator or phone.

| # | Scenario | Automated test | Browser check | Device check |
|---|----------|----------------|---------------|--------------|
| 1 | Example position projection | PositionEditorScreen, AnalysesScreen, projection | ✓ | Not run |
| 2 | Add second lot, results update | PositionEditorScreen | — | Not run |
| 3 | Liquidation / Classification / To Play values | AnalysesScreen, liquidation | ✓ | Not run |
| 4 | Band rule on tap | AnalysesScreen | — | Not run |
| 5 | What-if sale preview (161 / 135.20), position unchanged | SalesScreen | ✓ | Not run |
| 6 | Record then remove a sale | SalesScreen | — | Not run |
| 7 | House money | SalesScreen, sales | — | Not run |
| 8 | Two positions survive restart | persistence, repository | — | Not run |
| 9 | Invalid input rejected | PositionEditorScreen, SalesScreen, validate | — | Not run |
| 10 | Offline | offline | — | Not run |
| 11 | Disclaimer + formula/version link | disclaimer | ✓ | Not run |

**Outstanding**: run scenarios 1–11 on an Android emulator and an iOS simulator (or Expo Go on a
phone) and fill in the Device check column.
