# Feature Specification: Stock Projection Mobile App

**Feature Branch**: `claude/modest-cray-k2590c`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "this app will be a mobile app version of this excel file at /Stocks-Projection.xlsx. It is in the repo. Ask me questions to get this started."

## Overview

The source workbook (`Stocks-Projection.xlsx`, sheet `projection`) is a what-if calculator for one stock
position (example: "KEEL", capital USD 677). The user enters the lots they bought (number of shares and
average price per lot) and a set of Target Sell Rates (TSR, e.g. 4.53, 6.53, 8.53, 10.53, 12.53). The sheet
then produces four analyses:

| Analysis | What it shows | Formula (from the workbook) |
|----------|---------------|-----------------------------|
| Projection | For each TSR: rate difference per lot, gross profit and net profit if all shares were sold | TS = Σ shares; NE = Σ shares × AP; GP = TS × TSR; NP = GP − NE; RD = TSR − AP |
| Liquidation | For each % sold (10%–80%) × TSR: cash realized | Realized = TS × p × TSR |
| Classification | For each % sold × TSR: a multiple M and its band | M = p × TSR / weighted AP; Partial Recovery (M < 1), Cost Recovered (1 ≤ M < 1.5), Profit Locked (1.5 ≤ M < 2.5), Over Liquidation (M ≥ 2.5) |
| To Play | For each % sold × TSR: cash left over after taking back the full net expense ("house money") | x = Realized − NE; Capital Gap (x < 0), Breakeven (0 ≤ x < 350), Profit Zone (x ≥ 350) |

The workbook also notes a "recovery point": when shares are actually sold, the remaining share count and a
new net expense are recalculated (example: 100 @ 3.53 + 181 @ 1.80, then sell 120 @ 4.53 → 161 shares
remaining, new NE USD 135.20).

The mobile app reproduces these calculations on a phone, so the user can build and review projections
without opening the spreadsheet.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build a position and see the projection (Priority: P1)

The user creates a position for a stock (ticker or name, optional capital note), enters one or more lots
(shares and average price), and enters up to several Target Sell Rates. The app shows total shares, net
expense, and — for each TSR — gross profit, net profit and the rate difference per lot.

**Why this priority**: This is the core of the workbook; without it nothing else has meaning.

**Independent Test**: Enter the workbook's example (1 lot: 1,000 shares @ 1.80; TSRs 4.53/6.53/8.53/10.53/12.53)
and compare every result to the workbook values.

**Acceptance Scenarios**:

1. **Given** a position with 1,000 shares @ 1.80, **When** the user adds TSR 4.53, **Then** the app shows TS 1,000, NE 1,800.00, GP 4,530.00, NP 2,730.00 and RD 2.73.
2. **Given** the same position, **When** the user adds a second lot of 500 shares @ 2.40, **Then** TS becomes 1,500, NE becomes 3,000.00, and every TSR result updates immediately.
3. **Given** a position with results shown, **When** the user edits or removes a TSR, **Then** all analyses update immediately.

---

### User Story 2 - Liquidation, Classification and To Play tables (Priority: P1)

For the same position, the user views the three "% sold" analyses as tables (or an equivalent mobile layout)
of % sold (rows) × TSR (columns), with each Classification and To Play cell labeled and color-coded by its band.

**Why this priority**: These are the decision-support views the workbook exists for — they tell the user
how much to sell at which price to recover cost or lock profit.

**Independent Test**: With the workbook's example inputs, every cell matches the workbook (e.g. 30% @ 6.53:
Realized 1,959.00; M 1.09 "Cost Recovered"; To Play 159.00 "Breakeven").

**Acceptance Scenarios**:

1. **Given** the example position, **When** the user opens Liquidation, **Then** 40% @ 4.53 shows 1,812.00.
2. **Given** the example position, **When** the user opens Classification, **Then** 50% @ 10.53 shows M 2.93 labeled "Over Liquidation".
3. **Given** the example position, **When** the user opens To Play, **Then** 20% @ 8.53 shows −94.00 labeled "Capital Gap" and 20% @ 10.53 shows 306.00 labeled "Breakeven".
4. **Given** any table, **When** the user taps a band label or legend, **Then** the app explains the band's rule in plain language.

---

### User Story 3 - Record a sale (recovery point) (Priority: P2)

The user records an actual sale (shares sold and sell price). The app recalculates the remaining shares and
the new net expense, and all analyses use the updated position from then on.

**Why this priority**: The workbook only notes this as a manual example; making it a first-class action keeps
projections accurate after the user acts on them.

**Independent Test**: Lots 100 @ 3.53 and 181 @ 1.80; record a sale of 120 @ 4.53 → 161 shares remaining, new NE 135.20.

**Acceptance Scenarios**:

1. **Given** the example above, **When** the sale is recorded, **Then** remaining shares = 161 and new NE = 135.20.
2. **Given** a recorded sale, **When** the user deletes it, **Then** the position returns to its prior state.
3. **Given** a recorded sale that drives NE to zero or below, **When** results are shown, **Then** the app states that cost is fully recovered and that remaining shares are "house money" instead of showing a meaningless multiple.

Sales history scope: [NEEDS CLARIFICATION: Should the app keep a full history of sales per position (a transaction log the user can review/undo), or only apply a single what-if "recovery point" like the workbook note?]

---

### User Story 4 - Manage several positions (Priority: P2)

The user keeps a list of positions (e.g. KEEL and others), opens any of them to see its analyses, and can
rename, duplicate or delete a position. Data is kept between app launches.

**Why this priority**: The workbook holds one position per sheet; a mobile app is most useful when it replaces
a collection of such sheets.

**Independent Test**: Create two positions, close and reopen the app, and confirm both are listed with their inputs intact.

**Acceptance Scenarios**:

1. **Given** two saved positions, **When** the user reopens the app, **Then** both are listed with ticker, total shares and NE.
2. **Given** a position, **When** the user deletes it and confirms, **Then** it no longer appears.

---

### Edge Cases

- A lot with zero or negative shares or price: rejected with a clear message.
- A position with no lots: analyses show an empty state prompting the user to add a lot.
- A TSR below the weighted average price: NP and RD are shown as negative (loss), not hidden.
- Recording a sale of more shares than are held: rejected.
- Weighted AP uses **all** lots (the workbook's cell N34 only covers the first two lots; the app corrects this so results stay right with 3+ lots).
- Very large or very small numbers: values display with thousands separators and 2 decimals for money, 2 decimals for M.
- Duplicate TSR values: allowed but shown once, or rejected with a message (one rule, applied consistently).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create a position with a name/ticker and an optional capital note.
- **FR-002**: Users MUST be able to add, edit and remove lots (number of shares, average price) on a position; the app MUST support at least 10 lots per position.
- **FR-003**: Users MUST be able to add, edit and remove Target Sell Rates; the app MUST support at least 10 TSRs per position, with the workbook's 5 values available as an example.
- **FR-004**: The app MUST compute TS, NE, weighted AP, and per TSR: GP, NP and RD per lot, using the workbook formulas listed in the Overview.
- **FR-005**: The app MUST compute Liquidation (realized amount), Classification (M and band) and To Play (x and band) for each % sold × TSR. Default % sold steps are 10%–80% in 10% steps, as in the workbook; users MAY edit the steps.
- **FR-006**: Band thresholds MUST match the workbook by default (Classification: 1, 1.5, 2.5; To Play: 0 and 350). The To Play "Profit Zone" threshold (350 in the workbook) MUST be editable per position.
- **FR-007**: Results MUST update immediately when any input changes.
- **FR-008**: Each Classification and To Play value MUST show its band name and a distinct color, plus a legend explaining each band's rule.
- **FR-009**: Users MUST be able to record a sale (shares, price); the app MUST recompute remaining TS and new NE as in the workbook's recovery-point example.
- **FR-010**: Users MUST be able to keep multiple positions, and all inputs MUST persist between app launches.
- **FR-011**: Input validation MUST reject non-numeric, zero or negative shares/prices with an inline message.
- **FR-012**: Every analysis screen MUST show a notice that the projections are informational what-if calculations, not financial advice.
- **FR-013**: Live market prices: [NEEDS CLARIFICATION: Should the app fetch the current market price for a ticker (e.g. to show it next to the TSRs), or remain a pure calculator where the user types every number, like the workbook?]
- **FR-014**: Accounts and sync: [NEEDS CLARIFICATION: Is this a personal app with data stored only on the phone, or does it need user accounts so data syncs across devices / can be used by other people?]
- **FR-015**: The app MUST be available on both Android and iOS phones.

### Key Entities

- **Position**: One stock being analysed — name/ticker, optional capital note, Profit Zone threshold, % sold steps; has many Lots, TSRs and Sales.
- **Lot**: A purchase — number of shares, average price.
- **Target Sell Rate (TSR)**: A hypothetical sell price per share.
- **Sale (recovery point)**: An actual sale — shares sold, sell price, date; reduces TS and NE.
- **Derived results** (not stored): TS, NE, weighted AP, GP, NP, RD, Realized, M + Classification band, x + To Play band.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For the workbook's example inputs, 100% of app results match the workbook values to 2 decimal places (the workbook acts as the reference test set).
- **SC-002**: A user can create a position with one lot and five TSRs and see all four analyses in under 2 minutes.
- **SC-003**: Results refresh within 1 second of any input change.
- **SC-004**: A user can read any single Classification or To Play cell (value + band) on a phone screen without horizontal zooming.
- **SC-005**: Saved positions are present and unchanged after the app is closed and reopened, in 100% of tests.

## Assumptions

- Currency is USD with 2-decimal display, as in the workbook; multi-currency is out of scope for v1.
- The workbook's "Capital: USD 677" label is informational only (it is not used in any formula) and is kept as an optional note.
- Weighted AP is computed over all lots (NE / TS); the workbook's two-lot formula is treated as a spreadsheet shortcut, not intended behaviour.
- Row 9 of the workbook (an empty lot showing RD = TSR) is a spreadsheet artifact; empty lots are not shown.
- The app does not execute trades or connect to brokerage accounts.
- Projections are deterministic what-if calculations on user inputs; there is no forecasting model.
