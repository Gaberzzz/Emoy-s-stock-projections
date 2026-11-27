import { fireEvent, screen } from '@testing-library/react-native';
import { CALC_VERSION } from '../../calc/version';
import { examplePosition } from '../../domain/examples';
import { SCHEMA_VERSION } from '../../domain/types';
import { renderScreen } from '../../testing/renderScreen';
import { AnalysesScreen } from '../AnalysesScreen';
import { SalesScreen } from '../SalesScreen';

const NOW = '2026-11-27T10:00:00.000Z';
const data = () => ({
  schemaVersion: SCHEMA_VERSION,
  positions: [examplePosition({ id: 'p1', now: NOW })],
});

describe('Disclaimer and formula link on every analysis screen (FR-012, Principle II)', () => {
  it.each(['Projection', 'Liquidation', 'Classification', 'To Play'])(
    'Analyses › %s tab',
    async (tab) => {
      const { navigation } = await renderScreen(
        AnalysesScreen,
        'Analyses',
        { positionId: 'p1' },
        data(),
      );
      await fireEvent.press(screen.getByRole('tab', { name: tab }));
      expect(screen.getByText(/not financial advice/)).toBeOnTheScreen();
      await fireEvent.press(screen.getByText(`Formulas & version (v${CALC_VERSION})`));
      expect(navigation.navigate).toHaveBeenCalledWith('FormulaInfo');
    },
  );

  it('Sales & what-if screen', async () => {
    await renderScreen(SalesScreen, 'Sales', { positionId: 'p1' }, data());
    expect(screen.getByText(/not financial advice/)).toBeOnTheScreen();
    expect(screen.getByText(`Formulas & version (v${CALC_VERSION})`)).toBeOnTheScreen();
  });
});
