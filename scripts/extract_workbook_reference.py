#!/usr/bin/env python3
"""Extract the reference fixture for the calculation engine from Stocks-Projection.xlsx.

Usage:
    python3 scripts/extract_workbook_reference.py Stocks-Projection.xlsx \
        app/src/calc/__fixtures__/workbook-reference.json

Reads the cached (computed) values of sheet "projection" and writes the inputs and every
expected output cell as JSON. Regenerate whenever the workbook or a formula changes
(see specs/001-stock-projection-app/contracts/calc-engine.md).
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

SHEET = "projection"
TSR_COLS = ["E", "F", "G", "H", "I"]
LOT_ROWS = range(8, 13)  # C8:D12
STEP_ROWS = range(20, 28)  # D20:D27 (liquidation); same steps repeat below
PROFIT_ZONE_THRESHOLD = 350  # hard-coded in the workbook legend (N41/N42)


def num(ws, ref: str) -> float:
    value = ws[ref].value
    if not isinstance(value, (int, float)):
        raise ValueError(f"{ref} has no numeric cached value: {value!r}")
    return float(value)


def grid(ws, first_row: int, steps: list[float]) -> list[list[float]]:
    return [[num(ws, f"{c}{first_row + i}") for c in TSR_COLS] for i in range(len(steps))]


def main(src: str, dest: str) -> None:
    raw = Path(src).read_bytes()
    ws = load_workbook(src, data_only=True)[SHEET]

    lots = []
    for r in LOT_ROWS:
        shares, ap = ws[f"C{r}"].value, ws[f"D{r}"].value
        if shares is None and ap is None:
            continue
        lots.append({"shares": float(shares), "averagePrice": float(ap)})

    tsrs = [num(ws, f"{c}7") for c in TSR_COLS]
    steps = [num(ws, f"D{r}") for r in STEP_ROWS]

    fixture = {
        "source": Path(src).name,
        "sourceSha256": hashlib.sha256(raw).hexdigest(),
        "sheet": SHEET,
        "input": {
            "lots": lots,
            "sales": [],
            "targetSellRates": tsrs,
            "soldSteps": steps,
            "profitZoneThreshold": PROFIT_ZONE_THRESHOLD,
        },
        "expected": {
            "totalShares": num(ws, "C13"),
            "netExpense": num(ws, "D13"),
            "weightedAp": num(ws, "N34"),
            "grossProfit": [num(ws, f"{c}13") for c in TSR_COLS],
            "netProfit": [num(ws, f"{c}14") for c in TSR_COLS],
            "rateDiffFirstLot": [num(ws, f"{c}8") for c in TSR_COLS],
            "liquidation": grid(ws, 20, steps),
            "classificationM": grid(ws, 31, steps),
            "toPlay": grid(ws, 42, steps),
        },
        "recoveryPoint": {
            "lots": [
                {"shares": num(ws, "M18"), "averagePrice": num(ws, "N18")},
                {"shares": num(ws, "M19"), "averagePrice": num(ws, "N19")},
            ],
            "sale": {"shares": -num(ws, "M20"), "price": num(ws, "N20")},
            "expected": {"totalShares": num(ws, "M21"), "netExpense": num(ws, "N21")},
        },
    }

    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    Path(dest).write_text(json.dumps(fixture, indent=2) + "\n")
    print(f"wrote {dest}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
