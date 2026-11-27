import { findSaleConflict, orderSales } from '../sales';

describe('orderSales (data-model.md Sale.date)', () => {
  it('orders by date, then by entry order', () => {
    const sales = [
      { id: 'a', shares: 1, price: 1, date: '2026-03-01' },
      { id: 'b', shares: 1, price: 1, date: '2026-01-01' },
      { id: 'c', shares: 1, price: 1, date: '2026-03-01' },
    ];
    expect(orderSales(sales).map((s) => s.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('findSaleConflict', () => {
  const lots = [
    { shares: 100, averagePrice: 3.53 },
    { shares: 181, averagePrice: 1.8 },
  ];

  it('accepts sales within the shares held', () => {
    expect(
      findSaleConflict(lots, [
        { id: 's1', shares: 120, price: 4.53, date: '2026-01-01' },
        { id: 's2', shares: 161, price: 5, date: '2026-01-02' },
      ]),
    ).toBeNull();
  });

  it('names the first sale that exceeds the shares held at that point', () => {
    const conflict = findSaleConflict(lots, [
      { id: 's1', shares: 200, price: 4.53, date: '2026-01-01' },
      { id: 's2', shares: 100, price: 5, date: '2026-01-02' },
    ]);
    expect(conflict?.saleId).toBe('s2');
    expect(conflict?.message).toMatch(/2026-01-02/);
  });

  it('applies sales in date order, not entry order', () => {
    const conflict = findSaleConflict(lots, [
      { id: 'late', shares: 200, price: 5, date: '2026-05-01' },
      { id: 'early', shares: 100, price: 5, date: '2026-01-01' },
    ]);
    expect(conflict?.saleId).toBe('late');
  });
});
