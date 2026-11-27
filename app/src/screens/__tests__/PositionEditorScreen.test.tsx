import { fireEvent, screen } from '@testing-library/react-native';
import { examplePosition } from '../../domain/examples';
import { SCHEMA_VERSION } from '../../domain/types';
import { renderScreen } from '../../testing/renderScreen';
import { PositionEditorScreen } from '../PositionEditorScreen';

const NOW = '2026-11-27T10:00:00.000Z';
const data = () => ({
  schemaVersion: SCHEMA_VERSION,
  positions: [examplePosition({ id: 'p1', now: NOW })],
});

async function setup() {
  return renderScreen(PositionEditorScreen, 'PositionEditor', { positionId: 'p1' }, data());
}

describe('PositionEditorScreen (US1)', () => {
  it('shows the live summary for the example', async () => {
    await setup();
    expect(screen.getByTestId('summary-ts')).toHaveTextContent('1,000');
    expect(screen.getByTestId('summary-ne')).toHaveTextContent('1,800.00');
  });

  it('adds a lot and updates the results immediately', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('New lot shares'), '500');
    await fireEvent.changeText(screen.getByLabelText('New lot average price'), '2.40');
    await fireEvent.press(screen.getByRole('button', { name: 'Add lot' }));
    expect(getData().positions[0]!.lots).toHaveLength(2);
    expect(screen.getByTestId('summary-ts')).toHaveTextContent('1,500');
    expect(screen.getByTestId('summary-ne')).toHaveTextContent('3,000.00');
  });

  it('edits an existing lot', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('Lot 1 shares'), '2000');
    expect(getData().positions[0]!.lots[0]!.shares).toBe(2000);
    expect(screen.getByTestId('summary-ne')).toHaveTextContent('3,600.00');
  });

  it('shows an inline error for zero or negative input and does not save it', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('Lot 1 shares'), '0');
    expect(screen.getByText('Number of shares must be greater than 0.')).toBeOnTheScreen();
    expect(getData().positions[0]!.lots[0]!.shares).toBe(1000);

    await fireEvent.changeText(screen.getByLabelText('New lot average price'), '-1');
    await fireEvent.changeText(screen.getByLabelText('New lot shares'), '10');
    await fireEvent.press(screen.getByRole('button', { name: 'Add lot' }));
    expect(screen.getByText('Price must be greater than 0.')).toBeOnTheScreen();
    expect(getData().positions[0]!.lots).toHaveLength(1);
  });

  it('rejects a duplicate target sell rate', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('New target sell rate'), '4.53');
    await fireEvent.press(screen.getByRole('button', { name: 'Add target sell rate' }));
    expect(screen.getByText('Each target sell rate can be used only once.')).toBeOnTheScreen();
    expect(getData().positions[0]!.targetSellRates).toHaveLength(5);
  });

  it('adds and removes target sell rates, keeping them sorted', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('New target sell rate'), '5');
    await fireEvent.press(screen.getByRole('button', { name: 'Add target sell rate' }));
    expect(getData().positions[0]!.targetSellRates).toEqual([4.53, 5, 6.53, 8.53, 10.53, 12.53]);
    await fireEvent.press(screen.getByRole('button', { name: 'Remove target sell rate 12.53' }));
    expect(getData().positions[0]!.targetSellRates).toEqual([4.53, 5, 6.53, 8.53, 10.53]);
  });

  it('edits % sold steps and the profit-zone threshold (US2)', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('New % sold step'), '90');
    await fireEvent.press(screen.getByRole('button', { name: 'Add % sold step' }));
    expect(getData().positions[0]!.soldSteps).toContain(0.9);
    await fireEvent.press(screen.getByRole('button', { name: 'Remove % sold step 10%' }));
    expect(getData().positions[0]!.soldSteps).not.toContain(0.1);
    await fireEvent.changeText(screen.getByLabelText('Profit Zone threshold (USD)'), '500');
    expect(getData().positions[0]!.profitZoneThreshold).toBe(500);
  });

  it('renames the position', async () => {
    const { getData } = await setup();
    await fireEvent.changeText(screen.getByLabelText('Name or ticker'), 'KEEL2');
    expect(getData().positions[0]!.name).toBe('KEEL2');
    await fireEvent.changeText(screen.getByLabelText('Name or ticker'), '  ');
    expect(screen.getByText('Enter a name or ticker.')).toBeOnTheScreen();
    expect(getData().positions[0]!.name).toBe('KEEL2');
  });
});
