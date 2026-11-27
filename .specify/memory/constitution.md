# Emoy's Stock Projections Constitution

## Core Principles

### I. Data Integrity

- Every market data point the app uses (for example a current reference price) MUST carry its
  source and retrieval timestamp, and the app MUST show how fresh it is.
- Incoming data MUST be validated (schema, ranges, missing values, splits/dividend adjustments)
  before use; gaps or failures MUST be surfaced, never silently filled or dropped.
- User-entered numbers MUST be validated (type, sign, range) before they are used in a
  calculation, with a clear message when rejected.
- Forecasts and backtests MUST use only data available as of the projection date
  (no look-ahead bias).
- Data providers MUST be used within their license and rate-limit terms. When market data is
  optional for a feature, the feature MUST keep working without it.

Rationale: projections are only as trustworthy as the numbers beneath them.

### II. Transparent Projections

- Every projection screen MUST make clear how its numbers were produced:
  - Deterministic calculations on user inputs (what-if scenarios) MUST show, or link to, the
    formula and the inputs used. An uncertainty range is not required, because the result is
    exact for the inputs given.
  - Statistical or forecasting models MUST state their method, key assumptions, the data window
    used, and an uncertainty range (e.g. confidence band or scenario spread); point estimates
    alone are not permitted.
- Every screen that shows a projection MUST display a clear notice that it is informational,
  not financial advice, and that past performance does not guarantee future results.
- Changes to calculation formulas or models MUST be versioned, and each displayed projection
  MUST be traceable to the version that produced it.

Rationale: users must be able to judge how much to trust a number before acting on it.

### III. Test-First (NON-NEGOTIABLE)

- Tests MUST be written and seen to fail before implementation (Red-Green-Refactor).
- Projection math, data parsing and validation MUST have unit tests. Deterministic calculations
  MUST be verified against fixed, versioned reference datasets with recorded expected results
  (e.g. the source spreadsheet's computed values).
- Forecasting models MUST have backtests against fixed, versioned datasets with recorded
  expected results.
- Where a backend exists, API contracts between it and the mobile clients MUST have contract
  tests.
- No change merges with failing or skipped tests.

Rationale: errors in financial calculations are silent and costly; tests are the safety net.

### IV. Simplicity

- Start with the simplest model and architecture that meets the spec (YAGNI). A more complex
  model MUST demonstrate measurable improvement on backtests before replacing a simpler one.
- New dependencies MUST be justified in the plan; prefer well-maintained, widely used libraries.
- Any deviation from these principles MUST be recorded in the plan's Complexity Tracking.

Rationale: simple models are easier to explain, test and keep honest.

### V. User Safety, Security & Privacy

- Collect only the user data a feature needs. Data kept only on the device MUST stay there
  unless the user explicitly exports or syncs it; any data sent off the device MUST be
  encrypted in transit (TLS), and personal data stored by a server MUST be encrypted at rest.
- Secrets and API keys MUST NOT be committed or shipped inside mobile app bundles. A data
  provider that needs a secret key MUST be reached only through a backend; a mobile client MAY
  call a provider directly only when no secret is required and its terms allow it.
- The app MUST NOT execute trades or give personalized buy/sell recommendations.
- Releases distributed through the Apple App Store or Google Play MUST comply with their
  policies, including financial content and privacy disclosure requirements.

Rationale: the app handles people's financial data and trust, even when it is personal.

## Technology & Platform Constraints

- The product MUST ship as a mobile app on both Android and iOS with feature parity, built from
  a single React Native codebase written in TypeScript (strict mode). Platform-specific native
  code is allowed only when React Native cannot meet a requirement, and MUST be justified under
  Principle IV.
- Mobile client logic MUST be tested with Jest and React Native Testing Library.
- A backend is optional and is added only when a feature needs it (e.g. secret-keyed data
  providers, sync, or forecasting models). When one exists, it is written in Python (3.11+)
  with pytest as the test framework.
- Deterministic calculations on user inputs MAY run on the device and MUST work offline.
  Forecasting models MUST run in a versioned backend and the client displays their results.
- The mobile client MUST degrade gracefully when offline or when data is stale, showing the
  last-updated time instead of failing silently.

## Development Workflow & Quality Gates

- Work follows the Spec Kit flow: specify → clarify → plan → tasks → implement.
- Every plan MUST pass a Constitution Check against Principles I–V before design and again
  after design.
- Every change goes through a pull request with review; CI MUST run linting, type checks and
  the full test suite, including reference-dataset tests and, where models exist, backtests.
- Changes to a calculation formula MUST include before/after results on the reference datasets
  in the pull request; changes to a forecasting model MUST include before/after backtest results.

## Governance

- This constitution supersedes other project practices; conflicts are resolved in its favor.
- Amendments are made via pull request that updates this file, states the rationale, and
  describes any migration needed for existing features.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR
  for adding a principle or section or materially expanding guidance, PATCH for clarifications.
- Reviewers MUST verify compliance with this constitution on every pull request; added
  complexity MUST be justified in writing.

**Version**: 2.0.0 | **Ratified**: 2026-11-27 | **Last Amended**: 2026-11-27
