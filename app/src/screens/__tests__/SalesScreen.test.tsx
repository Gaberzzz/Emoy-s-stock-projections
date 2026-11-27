import { fireEvent, screen } from '@testing-library/react-native';
import { newPosition } from '../../domain/position';
import { SCHEMA_VERSION, type AppData } from '../../domain/types';
import { autoConfirmAlerts, renderScreen } from '../../testing/renderScreen';
import { AnalysesScreen } from '../AnalysesScreen';
import { SalesScreen } from '../SalesScreen';

const NOW = '2026-11-27T10:00:00.000Z';

function recoveryData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    positions: [
      {
        ...newPosition({ id: 'p1', now: NOW, name: 'KEEL' }),
        lots: [
          { id: 'l1', shares: 100, averagePrice: 3.53 },
          { id: 'l2', shares: 181, averagePrice: 1.8 },
        ],
        targetSellRates: [4.53, 6.53],
      },
    ],
  };
}

async function fillSale(shares: string, price: string) {
  await fireEvent.changeText(screen.getByLabelText('Shares to sell'), shares);
  await fireEvent.changeText(screen.getByLabelText('Sell price'), price);
}

describe('SalesScreen (US3)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('previews a what-if sale without changing the saved position', async () => {
    const { getData } = await renderScreen(
      SalesScreen,
      'Sales',
      { positionId: 'p1' },
      recoveryData(),
    );
    await fillSale('120', '4.53');
    expect(screen.getByTestId('after-ts')).toHaveTextContent('281 → 161');
    expect(screen.getByTestId('after-ne')).toHaveTextContent('678.80 → 135.20');
    expect(getData().positions[0]!.sales).toHaveLength(0);
  });

  it('opens the analyses with the what-if sale', async () => {
    const { navigation } = await renderScreen(
      SalesScreen,
      'Sales',
      { positionId: 'p1' },
      recoveryData(),
    );
    await fillSale('120', '4.53');
    await fireEvent.press(screen.getByRole('button', { name: 'Open analyses with this sale' }));
    expect(navigation.navigate).toHaveBeenCalledWith('Analyses', {
      positionId: 'p1',
      whatIf: expect.objectContaining({ shares: 120, price: 4.53 }),
    });
  });

  it('records a sale into the history, and removing it restores the totals', async () => {
    autoConfirmAlerts();
    const { getData } = await renderScreen(
      SalesScreen,
      'Sales',
      { positionId: 'p1' },
      recoveryData(),
    );
    await fillSale('120', '4.53');
    await fireEvent.press(screen.getByRole('button', { name: 'Record this sale' }));
    expect(getData().positions[0]!.sales).toHaveLength(1);
    expect(screen.getByTestId('current-ts')).toHaveTextContent('161');
    expect(screen.getByTestId('current-ne')).toHaveTextContent('135.20');
    expect(screen.getByText(/120 shares @ 4.53/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /Remove sale/ }));
    expect(getData().positions[0]!.sales).toHaveLength(0);
    expect(screen.getByTestId('current-ts')).toHaveTextContent('281');
    expect(screen.getByTestId('current-ne')).toHaveTextContent('678.80');
  });

  it('rejects selling more shares than are held', async () => {
    const { getData } = await renderScreen(
      SalesScreen,
      'Sales',
      { positionId: 'p1' },
      recoveryData(),
    );
    await fillSale('300', '4.53');
    expect(screen.getByText(/You hold 281 shares/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Record this sale' }));
    expect(getData().positions[0]!.sales).toHaveLength(0);
  });

  it('shows house money once the full cost is recovered', async () => {
    await renderScreen(SalesScreen, 'Sales', { positionId: 'p1' }, recoveryData());
    await fillSale('200', '4');
    expect(screen.getByText(/Cost fully recovered/)).toBeOnTheScreen();
  });
});

describe('AnalysesScreen with a what-if sale (US3)', () => {
  it('shows a preview banner and the house-money state', async () => {
    await renderScreen(
      AnalysesScreen,
      'Analyses',
      { positionId: 'p1', whatIf: { shares: 200, price: 4, date: '2026-11-27' } },
      recoveryData(),
    );
    expect(screen.getByText(/Preview — not saved/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('tab', { name: 'Classification' }));
    expect(screen.getByText(/Cost fully recovered — house money/)).toBeOnTheScreen();
  });
});
