import { newPosition } from '../../domain/position';
import { emptyAppData, type AppData } from '../../domain/types';
import { reducer } from '../reducer';

const T0 = '2026-11-27T10:00:00.000Z';
const T1 = '2026-11-27T11:00:00.000Z';

function withPosition(): AppData {
  return reducer(emptyAppData(), {
    type: 'addPosition',
    position: newPosition({ id: 'p1', now: T0, name: ' KEEL ', capitalNote: 'Capital: USD 677' }),
  });
}

describe('reducer: positions', () => {
  it('adds a position with defaults, newest first', () => {
    const one = withPosition();
    const two = reducer(one, {
      type: 'addPosition',
      position: newPosition({ id: 'p2', now: T1, name: 'ABC' }),
    });
    expect(two.positions.map((p) => p.id)).toEqual(['p2', 'p1']);
    const p1 = two.positions[1]!;
    expect(p1.name).toBe('KEEL');
    expect(p1.soldSteps).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    expect(p1.profitZoneThreshold).toBe(350);
    expect(p1.createdAt).toBe(T0);
  });

  it('updates fields, keeps TSRs sorted and sets updatedAt', () => {
    const s = reducer(withPosition(), {
      type: 'updatePosition',
      id: 'p1',
      now: T1,
      patch: { name: 'KEEL2', targetSellRates: [8.53, 4.53, 6.53] },
    });
    const p = s.positions[0]!;
    expect(p.name).toBe('KEEL2');
    expect(p.targetSellRates).toEqual([4.53, 6.53, 8.53]);
    expect(p.updatedAt).toBe(T1);
  });

  it('ignores invalid updates', () => {
    const before = withPosition();
    const after = reducer(before, {
      type: 'updatePosition',
      id: 'p1',
      now: T1,
      patch: { targetSellRates: [4.53, 4.53] },
    });
    expect(after).toBe(before);
  });

  it('duplicates and removes positions', () => {
    const dup = reducer(withPosition(), {
      type: 'duplicatePosition',
      id: 'p1',
      newId: 'p9',
      now: T1,
    });
    expect(dup.positions.map((p) => p.id)).toEqual(['p9', 'p1']);
    expect(dup.positions[0]!.name).toBe('KEEL (copy)');
    expect(dup.positions[0]!.createdAt).toBe(T1);
    const removed = reducer(dup, { type: 'removePosition', id: 'p1' });
    expect(removed.positions.map((p) => p.id)).toEqual(['p9']);
  });

  it('replaces all data on hydrate', () => {
    const data = withPosition();
    expect(reducer(emptyAppData(), { type: 'hydrate', data })).toBe(data);
  });
});

describe('reducer: lots', () => {
  it('adds, updates and removes lots', () => {
    let s = reducer(withPosition(), {
      type: 'addLot',
      positionId: 'p1',
      now: T1,
      lot: { id: 'l1', shares: 1000, averagePrice: 1.8 },
    });
    s = reducer(s, {
      type: 'updateLot',
      positionId: 'p1',
      now: T1,
      lot: { id: 'l1', shares: 1500, averagePrice: 2 },
    });
    expect(s.positions[0]!.lots).toEqual([{ id: 'l1', shares: 1500, averagePrice: 2 }]);
    s = reducer(s, { type: 'removeLot', positionId: 'p1', lotId: 'l1', now: T1 });
    expect(s.positions[0]!.lots).toEqual([]);
  });

  it('rejects invalid lots', () => {
    const before = withPosition();
    const after = reducer(before, {
      type: 'addLot',
      positionId: 'p1',
      now: T1,
      lot: { id: 'l1', shares: 0, averagePrice: 1.8 },
    });
    expect(after).toBe(before);
  });
});
