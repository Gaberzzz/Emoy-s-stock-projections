import AsyncStorage from '@react-native-async-storage/async-storage';
import { examplePosition } from '../../domain/examples';
import { SCHEMA_VERSION, type AppData } from '../../domain/types';
import { STORAGE_KEY, createRepository } from '../repository';

const NOW = '2026-11-27T10:00:00.000Z';
const repo = createRepository(AsyncStorage, () => NOW);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('Repository (contracts/storage-schema.md)', () => {
  it('starts empty at schemaVersion 1 when nothing is stored (data-model.md AppData.schemaVersion)', async () => {
    const { data, recovered } = await repo.load();
    expect(data).toEqual({ schemaVersion: SCHEMA_VERSION, positions: [] });
    expect(recovered).toBe(false);
  });

  it('round-trips saved data', async () => {
    const data: AppData = {
      schemaVersion: SCHEMA_VERSION,
      positions: [examplePosition({ id: 'p1', now: NOW })],
    };
    await repo.save(data);
    expect((await repo.load()).data).toEqual(data);
  });

  it('runs migrations from an older schemaVersion', async () => {
    const migrate = jest.fn((raw: unknown) => ({ ...(raw as object), schemaVersion: 1 }));
    const r = createRepository(AsyncStorage, () => NOW, { 0: migrate });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 0, positions: [] }));
    const { data } = await r.load();
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(data.schemaVersion).toBe(1);
  });

  it.each([
    ['unparseable JSON', '{not json'],
    ['an invalid position', JSON.stringify({ schemaVersion: 1, positions: [{ id: 'x' }] })],
    [
      'a lot with negative shares (data-model.md Lot.shares)',
      JSON.stringify({
        schemaVersion: 1,
        positions: [
          {
            ...examplePosition({ id: 'p1', now: NOW }),
            lots: [{ id: 'l1', shares: -5, averagePrice: 1 }],
          },
        ],
      }),
    ],
    ['a newer, unknown schemaVersion', JSON.stringify({ schemaVersion: 99, positions: [] })],
  ])('keeps a copy and starts empty for %s, never overwriting it', async (_label, raw) => {
    await AsyncStorage.setItem(STORAGE_KEY, raw);
    const { data, recovered } = await repo.load();
    expect(recovered).toBe(true);
    expect(data.positions).toEqual([]);
    const copyKey = `${STORAGE_KEY}.corrupt-${NOW}`;
    expect(await AsyncStorage.getItem(copyKey)).toBe(raw);
  });

  it('refuses to save invalid data', async () => {
    const bad = {
      schemaVersion: 1,
      positions: [{ ...examplePosition({ id: 'p1', now: NOW }), name: '' }],
    } as AppData;
    await expect(repo.save(bad)).rejects.toThrow();
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
