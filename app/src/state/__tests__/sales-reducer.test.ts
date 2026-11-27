import { newPosition } from '../../domain/position';
import { emptyAppData, type AppData } from '../../domain/types';
import { reducer } from '../reducer';

const T = '2026-11-27T10:00:00.000Z';

function recoveryExample(): AppData {
  let s = reducer(emptyAppData(), {
    type: 'addPosition',
    position: newPosition({ id: 'p1', now: T, name: 'KEEL' }),
  });
  s = reducer(s, {
    type: 'addLot',
    positionId: 'p1',
    now: T,
    lot: { id: 'l1', shares: 100, averagePrice: 3.53 },
  });
  s = reducer(s, {
    type: 'addLot',
    positionId: 'p1',
    now: T,
    lot: { id: 'l2', shares: 181, averagePrice: 1.8 },
  });
  return s;
}

describe('reducer: sales (data-model.md State transitions)', () => {
  it('records and removes a sale', () => {
    let s = reducer(recoveryExample(), {
      type: 'addSale',
      positionId: 'p1',
      now: T,
      sale: { id: 's1', shares: 120, price: 4.53, date: '2026-11-27' },
    });
    expect(s.positions[0]!.sales).toHaveLength(1);
    s = reducer(s, { type: 'removeSale', positionId: 'p1', now: T, saleId: 's1' });
    expect(s.positions[0]!.sales).toHaveLength(0);
  });

  it('rejects a sale that exceeds the shares held', () => {
    const before = recoveryExample();
    const after = reducer(before, {
      type: 'addSale',
      positionId: 'p1',
      now: T,
      sale: { id: 's1', shares: 282, price: 4.53, date: '2026-11-27' },
    });
    expect(after).toBe(before);
  });

  it('rejects lot changes that would make a recorded sale exceed the shares held', () => {
    let s = reducer(recoveryExample(), {
      type: 'addSale',
      positionId: 'p1',
      now: T,
      sale: { id: 's1', shares: 200, price: 4, date: '2026-01-01' },
    });
    s = reducer(s, {
      type: 'addSale',
      positionId: 'p1',
      now: T,
      sale: { id: 's2', shares: 81, price: 4, date: '2026-01-02' },
    });
    // Removing a sale only ever increases holdings, so it is always allowed.
    const lotRemoved = reducer(s, { type: 'removeLot', positionId: 'p1', now: T, lotId: 'l2' });
    expect(lotRemoved).toBe(s);
    const lotShrunk = reducer(s, {
      type: 'updateLot',
      positionId: 'p1',
      now: T,
      lot: { id: 'l1', shares: 10, averagePrice: 3.53 },
    });
    expect(lotShrunk).toBe(s);
  });
});
