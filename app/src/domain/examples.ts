import { newPosition } from './position';
import type { Position } from './types';

/** The example position from Stocks-Projection.xlsx (sheet "projection"). */
export function examplePosition(args: { id: string; now: string }): Position {
  return {
    ...newPosition({ id: args.id, now: args.now, name: 'KEEL', capitalNote: 'Capital: USD 677' }),
    lots: [{ id: `${args.id}-lot-1`, shares: 1000, averagePrice: 1.8 }],
    targetSellRates: [4.53, 6.53, 8.53, 10.53, 12.53],
  };
}
