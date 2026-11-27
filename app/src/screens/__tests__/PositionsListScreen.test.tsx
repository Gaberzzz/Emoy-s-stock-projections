import { fireEvent, screen } from '@testing-library/react-native';
import { emptyAppData } from '../../domain/types';
import { autoConfirmAlerts, renderScreen } from '../../testing/renderScreen';
import { PositionsListScreen } from '../PositionsListScreen';

describe('PositionsListScreen (US4)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('offers the workbook example when empty, then lists it with TS and NE', async () => {
    await renderScreen(PositionsListScreen, 'PositionsList', undefined, emptyAppData());
    expect(screen.getByText('No positions yet.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Add example (KEEL)' }));
    expect(screen.getByText('KEEL')).toBeOnTheScreen();
    expect(screen.getByText(/1,000 shares/)).toBeOnTheScreen();
    expect(screen.getByText(/NE 1,800.00/)).toBeOnTheScreen();
  });

  it('creates a named position and opens the editor', async () => {
    const { navigation, getData } = await renderScreen(
      PositionsListScreen,
      'PositionsList',
      undefined,
      emptyAppData(),
    );
    await fireEvent.changeText(screen.getByLabelText('New position name or ticker'), 'ABC');
    await fireEvent.press(screen.getByRole('button', { name: 'Create position' }));
    const created = getData().positions[0]!;
    expect(created.name).toBe('ABC');
    expect(navigation.navigate).toHaveBeenCalledWith('PositionEditor', { positionId: created.id });
  });

  it('duplicates with a new id (data-model.md Position.id) and deletes after confirmation', async () => {
    const confirm = autoConfirmAlerts();
    const { getData } = await renderScreen(
      PositionsListScreen,
      'PositionsList',
      undefined,
      emptyAppData(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Add example (KEEL)' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Duplicate KEEL' }));
    const [copy, original] = getData().positions;
    expect(copy!.name).toBe('KEEL (copy)');
    expect(copy!.id).not.toBe(original!.id);

    await fireEvent.press(screen.getByRole('button', { name: 'Delete KEEL (copy)' }));
    expect(confirm).toHaveBeenCalled();
    expect(getData().positions.map((p) => p.name)).toEqual(['KEEL']);
  });
});
