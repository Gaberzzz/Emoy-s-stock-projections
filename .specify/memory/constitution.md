# Emoy's Stock Projections Constitution

## Core Principles

### I. Data Integrity

- Every market data point MUST carry its source and retrieval timestamp, and the app MUST
  show users how fresh the data behind a projection is.
- Incoming data MUST be validated (schema, ranges, missing values, splits/dividend adjustments)
  before use; gaps or failures MUST be surfaced, never silently filled or dropped.
- Projections and backtests MUST use only data available as of the projection date
  (no look-ahead bias).
- Data providers MUST be used within their license and rate-limit terms.

Rationale: a public app's projections are only as trustworthy as the data beneath them.

### II. Transparent Projections

- Every projection MUST state its method, key assumptions, the data window used, and an
  uncertainty range (e.g. confidence band or scenario spread); point estimates alone are not
  permitted.
- Every screen that shows a projection MUST display a clear notice that it is informational,
  not financial advice, and that past performance does not guarantee future results.
- Model changes MUST be versioned, and each displayed projection MUST be traceable to the model
  version that produced it.

Rationale: users must be able to judge how much to trust a number before acting on it.

### III. Test-First (NON-NEGOTIABLE)

- Tests MUST be written and seen to fail before implementation (Red-Green-Refactor).
- Projection math, data parsing and validation MUST have unit tests; models MUST have
  backtests against fixed, versioned datasets with recorded expected results.
- API contracts between the Python backend and the mobile clients MUST have contract tests.
- No change merges with failing or skipped tests.

Rationale: errors in financial calculations are silent and costly; tests are the safety net.

### IV. Simplicity

- Start with the simplest model and architecture that meets the spec (YAGNI). A more complex
  model MUST demonstrate measurable improvement on backtests before replacing a simpler one.
- New dependencies MUST be justified in the plan; prefer well-maintained, widely used libraries.
- Any deviation from these principles MUST be recorded in the plan's Complexity Tracking.

Rationale: simple models are easier to explain, test and keep honest.

### V. User Safety, Security & Privacy

- Collect only the user data a feature needs; personal data MUST be encrypted in transit
  (TLS) and at rest.
- Secrets and API keys MUST NOT be committed or shipped inside mobile app bundles; clients
  reach third-party data providers only through the backend.
- The app MUST NOT execute trades or give personalized buy/sell recommendations.
- Releases MUST comply with Apple App Store and Google Play policies, including financial
  content and privacy disclosure requirements.

Rationale: a shared, public app handles other people's data and trust.

## Technology & Platform Constraints

- Python (3.11+) is the language for data ingestion, modeling and the backend API; pytest is
  the test framework.
- The product MUST ship as a mobile app on both Android and iOS with feature parity; the mobile
  framework is chosen in `/speckit-plan` and MUST support both platforms from one codebase or
  justify otherwise under Principle IV.
- The mobile client MUST degrade gracefully when offline or when data is stale, showing the
  last-updated time instead of failing silently.

## Development Workflow & Quality Gates

- Work follows the Spec Kit flow: specify → clarify → plan → tasks → implement.
- Every plan MUST pass a Constitution Check against Principles I–V before design and again
  after design.
- Every change goes through a pull request with review; CI MUST run linting, type checks and
  the full test suite including backtests.
- Changes to a projection model MUST include before/after backtest results in the pull request.

## Governance

- This constitution supersedes other project practices; conflicts are resolved in its favor.
- Amendments are made via pull request that updates this file, states the rationale, and
  describes any migration needed for existing features.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR
  for adding a principle or section or materially expanding guidance, PATCH for clarifications.
- Reviewers MUST verify compliance with this constitution on every pull request; added
  complexity MUST be justified in writing.

**Version**: 1.0.0 | **Ratified**: 2026-11-27 | **Last Amended**: 2026-11-27
