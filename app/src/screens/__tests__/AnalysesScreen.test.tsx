import { fireEvent, screen } from '@testing-library/react-native';
import { examplePosition } from '../../domain/examples';
import { SCHEMA_VERSION, type Position } from '../../domain/types';
import { renderScreen } from '../../testing/renderScreen';
import { AnalysesScreen } from '../AnalysesScreen';

const NOW = '2026-11-27T10:00:00.000Z';

function setup(position: Position = examplePosition({ id: 'p1', now: NOW }), whatIf?: never) {
  return renderScreen(
    AnalysesScreen,
    'Analyses',
    { positionId: position.id, whatIf },
    { schemaVersion: SCHEMA_VERSION, positions: [position] },
  );
}

describe('AnalysesScreen (US1 + US2)', () => {
  it('shows the Projection tab first with workbook values', async () => {
    await setup();
    expect(screen.getByText('4,530.00')).toBeOnTheScreen();
    expect(screen.getByText('2,730.00')).toBeOnTheScreen();
    expect(screen.getByTestId('disclaimer')).toBeOnTheScreen();
  });

  it('shows the Liquidation grid', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('tab', { name: 'Liquidation' }));
    expect(screen.getByText('1,959.00')).toBeOnTheScreen();
    expect(screen.getByLabelText('40% sold at 4.53: 1,812.00')).toBeOnTheScreen();
  });

  it('shows Classification multiples with band labels, and explains a band when tapped', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('tab', { name: 'Classification' }));
    expect(screen.getByLabelText('30% sold at 6.53: M 1.09, Cost Recovered')).toBeOnTheScreen();
    expect(screen.getByLabelText('50% sold at 10.53: M 2.93, Over Liquidation')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cost Recovered' }));
    expect(screen.getByText(/1 ≤ M < 1.5/)).toBeOnTheScreen();
  });

  it('shows To Play values with band labels', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('tab', { name: 'To Play' }));
    expect(screen.getByLabelText('20% sold at 8.53: -94.00, Capital Gap')).toBeOnTheScreen();
    expect(screen.getByLabelText('20% sold at 10.53: 306.00, Breakeven')).toBeOnTheScreen();
    expect(screen.getByLabelText('30% sold at 6.53: 159.00, Breakeven')).toBeOnTheScreen();
  });

  it('uses the position % sold steps (data-model.md Position.soldSteps)', async () => {
    await setup({ ...examplePosition({ id: 'p1', now: NOW }), soldSteps: [0.25] });
    await fireEvent.press(screen.getByRole('tab', { name: 'Liquidation' }));
    expect(screen.getByText('25%')).toBeOnTheScreen();
    expect(screen.queryByText('10%')).toBeNull();
  });

  it('shows an empty state when there are no lots', async () => {
    await setup({ ...examplePosition({ id: 'p1', now: NOW }), lots: [] });
    expect(screen.getByText('Add a lot to see the analyses.')).toBeOnTheScreen();
  });
});
