/**
 * The calculation engine. Formulas: spec.md Overview; contract: contracts/calc-engine.md.
 *   TS = Σ shares − Σ sold         NE = Σ shares × AP − Σ sold × price
 *   GP = TS × TSR                  NP = GP − NE            RD = TSR − AP
 *   Realized = TS × p × TSR        M = p × TSR / (NE / TS) x = Realized − NE
 */
import { classify, playBand } from './bands';
import { CalcInputError, type CalcInput, type CalcResult, type CalcStatus } from './types';
import { validate } from './validate';
import { CALC_VERSION } from './version';

const EPS = 1e-9;

export function calculate(input: CalcInput): CalcResult {
  const issue = validate(input)[0];
  if (issue) throw new CalcInputError(issue);

  let totalShares = 0;
  let netExpense = 0;
  for (const lot of input.lots) {
    totalShares += lot.shares;
    netExpense += lot.shares * lot.averagePrice;
  }
  input.sales.forEach((sale, i) => {
    if (sale.shares > totalShares + EPS) {
      throw new CalcInputError({
        field: `sales[${i}].shares`,
        message: 'This sale sells more shares than are held at that point.',
      });
    }
    totalShares -= sale.shares;
    netExpense -= sale.shares * sale.price;
  });
  if (Math.abs(totalShares) < EPS) totalShares = 0;

  const status: CalcStatus =
    input.lots.length === 0
      ? 'EMPTY'
      : totalShares === 0
        ? 'FULLY_SOLD'
        : netExpense <= EPS
          ? 'HOUSE_MONEY'
          : 'ACTIVE';

  const result: CalcResult = {
    calcVersion: CALC_VERSION,
    status,
    totalShares,
    netExpense: status === 'EMPTY' ? 0 : netExpense,
    weightedAp: null,
    projection: [],
    liquidation: [],
    classification: [],
    toPlay: [],
  };
  if (status === 'EMPTY' || status === 'FULLY_SOLD') return result;

  const weightedAp = status === 'ACTIVE' ? netExpense / totalShares : null;
  const { targetSellRates: tsrs, soldSteps: steps, profitZoneThreshold } = input;

  result.weightedAp = weightedAp;
  result.projection = tsrs.map((tsr) => {
    const grossProfit = totalShares * tsr;
    return {
      tsr,
      grossProfit,
      netProfit: grossProfit - netExpense,
      rateDiffPosition: weightedAp === null ? null : tsr - weightedAp,
      rateDiffPerLot: input.lots.map((lot) => tsr - lot.averagePrice),
    };
  });
  result.liquidation = steps.map((step) =>
    tsrs.map((tsr) => ({ step, tsr, value: totalShares * step * tsr })),
  );
  result.classification = steps.map((step) =>
    tsrs.map((tsr) => {
      if (weightedAp === null) return { step, tsr, value: { m: null, band: null } };
      const m = (step * tsr) / weightedAp;
      return { step, tsr, value: { m, band: classify(m) } };
    }),
  );
  result.toPlay = steps.map((step) =>
    tsrs.map((tsr) => {
      const x = totalShares * step * tsr - netExpense;
      return { step, tsr, value: { x, band: playBand(x, profitZoneThreshold) } };
    }),
  );
  return result;
}
