# Contract: On-Device Storage Schema

A single JSON document is stored under the key `emoy.appData` in on-device key-value storage. Only the
`Repository` module (`src/storage/`) reads or writes it. Entity rules are in [../data-model.md](../data-model.md).

## Shape (schemaVersion 1)

```json
{
  "schemaVersion": 1,
  "positions": [
    {
      "id": "8f1c…",
      "name": "KEEL",
      "capitalNote": "Capital: USD 677",
      "lots": [{ "id": "l1", "shares": 1000, "averagePrice": 1.8 }],
      "targetSellRates": [4.53, 6.53, 8.53, 10.53, 12.53],
      "soldSteps": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
      "profitZoneThreshold": 350,
      "sales": [],
      "createdAt": "2026-11-27T10:00:00Z",
      "updatedAt": "2026-11-27T10:00:00Z"
    }
  ]
}
```

## Rules

- **Load**: parse, run migrations from the stored `schemaVersion` up to the current version, then validate.
  - If the document is unreadable or invalid, do **not** overwrite it. Keep the raw text under
    `emoy.appData.corrupt-<timestamp>`, start empty, and tell the user (Principle I: never drop data silently).
- **Save**: write the whole document after each change (debounced ≤ 500 ms) and on app background.
- **Missing key**: first launch. Start with `{ "schemaVersion": 1, "positions": [] }` and offer an
  "Add example (KEEL)" button that loads the workbook example.
- No data leaves the device (FR-014). No analytics or crash reporting that includes position data.

## Repository interface

| Method | Behaviour |
|--------|-----------|
| `load(): Promise<AppData>` | As above |
| `save(data: AppData): Promise<void>` | Validates, then writes |
| Position helpers (`create`, `update`, `duplicate`, `remove`) | Pure functions on `AppData`, used by the app state reducer |
