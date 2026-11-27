import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { examplePosition } from '../../domain/examples';
import { SCHEMA_VERSION } from '../../domain/types';
import { STORAGE_KEY, createRepository } from '../../storage/repository';
import { AppStateProvider, SAVE_DEBOUNCE_MS, useActions, useAppState } from '../AppState';

const NOW = '2026-11-27T10:00:00.000Z';

const api = {} as { actions: ReturnType<typeof useActions>; state: ReturnType<typeof useAppState> };
function Probe() {
  const state = useAppState();
  const actions = useActions();
  useEffect(() => {
    api.state = state;
    api.actions = actions;
  });
  return <Text testID="count">{state.ready ? state.data.positions.length : 'loading'}</Text>;
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
});
afterEach(() => jest.useRealTimers());

describe('AppStateProvider persistence (SC-005)', () => {
  it('hydrates saved positions on start', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        positions: [examplePosition({ id: 'p1', now: NOW })],
      }),
    );
    await render(
      <AppStateProvider repository={createRepository(AsyncStorage)}>
        <Probe />
      </AppStateProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('saves changes after the debounce, and a new provider sees them', async () => {
    const repo = createRepository(AsyncStorage);
    await render(
      <AppStateProvider repository={repo}>
        <Probe />
      </AppStateProvider>,
    );
    await act(async () => {});
    await act(async () => {
      api.actions.addExample();
    });
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(SAVE_DEBOUNCE_MS + 10);
    });
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    expect(saved.positions.map((p: { name: string }) => p.name)).toEqual(['KEEL']);

    const reloaded = await repo.load();
    expect(reloaded.data.positions).toHaveLength(1);
  });

  it('flags unreadable stored data', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{broken');
    await render(
      <AppStateProvider repository={createRepository(AsyncStorage)}>
        <Probe />
      </AppStateProvider>,
    );
    await act(async () => {});
    expect(api.state.recovered).toBe(true);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
