import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { examplePosition } from '../domain/examples';
import { SCHEMA_VERSION } from '../domain/types';
import type { ScreenProps } from '../navigation/types';
import { renderScreen } from '../testing/renderScreen';
import { AnalysesScreen } from '../screens/AnalysesScreen';
import { FormulaInfoScreen } from '../screens/FormulaInfoScreen';
import { PositionEditorScreen } from '../screens/PositionEditorScreen';
import { PositionsListScreen } from '../screens/PositionsListScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { AppStateProvider } from '../state/AppState';
import { createRepository } from '../storage/repository';

/**
 * The app makes no network requests (FR-014, quickstart #10): every network API throws, and
 * every screen still works.
 */
const NOW = '2026-11-27T10:00:00.000Z';
const data = () => ({
  schemaVersion: SCHEMA_VERSION,
  positions: [examplePosition({ id: 'p1', now: NOW })],
});

const originalFetch = globalThis.fetch;
const originalXHR = globalThis.XMLHttpRequest;
const originalWS = globalThis.WebSocket;
const networkUsed = jest.fn();

beforeAll(() => {
  const fail = (what: string) =>
    function blocked() {
      networkUsed(what);
      throw new Error(`Network access attempted: ${what}`);
    };
  globalThis.fetch = fail('fetch') as unknown as typeof fetch;
  globalThis.XMLHttpRequest = fail('XMLHttpRequest') as unknown as typeof XMLHttpRequest;
  globalThis.WebSocket = fail('WebSocket') as unknown as typeof WebSocket;
});
afterAll(() => {
  globalThis.fetch = originalFetch;
  globalThis.XMLHttpRequest = originalXHR;
  globalThis.WebSocket = originalWS;
});

describe('Offline operation', () => {
  it('runs every screen without touching the network', async () => {
    await renderScreen(PositionsListScreen, 'PositionsList', undefined, data());
    await renderScreen(PositionEditorScreen, 'PositionEditor', { positionId: 'p1' }, data());
    await renderScreen(AnalysesScreen, 'Analyses', { positionId: 'p1' }, data());
    for (const tab of ['Liquidation', 'Classification', 'To Play']) {
      await fireEvent.press(screen.getByRole('tab', { name: tab }));
    }
    await renderScreen(SalesScreen, 'Sales', { positionId: 'p1' }, data());
    await fireEvent.changeText(screen.getByLabelText('Shares to sell'), '100');
    await fireEvent.changeText(screen.getByLabelText('Sell price'), '5');
    await renderScreen(FormulaInfoScreen, 'FormulaInfo', undefined, data());
    expect(networkUsed).not.toHaveBeenCalled();
  });

  it('loads and saves on the device only', async () => {
    jest.useFakeTimers();
    await render(
      <AppStateProvider repository={createRepository(AsyncStorage)}>
        <PositionsListScreen
          {...({
            navigation: { navigate: jest.fn() },
            route: { key: 'k', name: 'PositionsList' },
          } as unknown as ScreenProps<'PositionsList'>)}
        />
      </AppStateProvider>,
    );
    await act(async () => {});
    await fireEvent.press(screen.getByRole('button', { name: 'Add example (KEEL)' }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    jest.useRealTimers();
    expect(networkUsed).not.toHaveBeenCalled();
  });
});
