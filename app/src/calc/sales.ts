/**
 * Recorded and what-if sales (recovery points). research.md R5:
 *   TS' = TS − s, NE' = NE − s × price; sales apply in date order, then entry order.
 */
import { formatShares } from '../format/format';
import { CalcInputError, type CalcInput } from './types';

const EPS = 1e-9;

interface DatedSale {
  shares: number;
  price: number;
  date: string;
}

/** Applied order: by date, then by entry order (Array.prototype.sort is stable). */
export function orderSales<T extends DatedSale>(sales: readonly T[]): T[] {
  return [...sales].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export interface SaleConflict {
  saleId: string | undefined;
  message: string;
}

/** First recorded sale that sells more shares than are held at that point, if any. */
export function findSaleConflict(
  lots: readonly { shares: number }[],
  sales: readonly (DatedSale & { id?: string })[],
): SaleConflict | null {
  let held = lots.reduce((sum, l) => sum + l.shares, 0);
  for (const sale of orderSales(sales)) {
    if (sale.shares > held + EPS) {
      return {
        saleId: sale.id,
        message: `The sale of ${formatShares(sale.shares)} shares on ${sale.date} would sell more than the ${formatShares(Math.max(held, 0))} shares held at that point.`,
      };
    }
    held -= sale.shares;
  }
  return null;
}

/** Builds a what-if input: the sale is applied after the recorded ones. */
export function applySale(input: CalcInput, sale: { shares: number; price: number }): CalcInput {
  const held =
    input.lots.reduce((s, l) => s + l.shares, 0) - input.sales.reduce((s, x) => s + x.shares, 0);
  if (sale.shares > held + EPS) {
    throw new CalcInputError({
      field: 'sale.shares',
      message: `You hold ${formatShares(Math.max(held, 0))} shares; you can't sell ${formatShares(sale.shares)}.`,
    });
  }
  return { ...input, sales: [...input.sales, { shares: sale.shares, price: sale.price }] };
}
