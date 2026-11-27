/**
 * On-device persistence: one versioned JSON document (contracts/storage-schema.md).
 * Nothing here talks to the network; data never leaves the device (FR-014).
 */
import { appDataProblem } from '../domain/validatePosition';
import { SCHEMA_VERSION, emptyAppData, type AppData } from '../domain/types';

export const STORAGE_KEY = 'emoy.appData';

/** The subset of AsyncStorage the repository needs. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** Migrations keyed by the version they upgrade *from*. */
export type Migrations = Record<number, (raw: unknown) => unknown>;

export interface LoadResult {
  data: AppData;
  /** True when stored data could not be read; a copy was kept and the app starts empty. */
  recovered: boolean;
}

export interface Repository {
  load(): Promise<LoadResult>;
  save(data: AppData): Promise<void>;
}

/** No shape changes yet; add `{ 1: (raw) => … }` when schemaVersion 2 is introduced. */
export const MIGRATIONS: Migrations = {};

function migrate(raw: unknown, migrations: Migrations): unknown {
  let current = raw;
  for (let guard = 0; guard < 100; guard++) {
    const v = (current as { schemaVersion?: unknown } | null)?.schemaVersion;
    if (typeof v !== 'number' || v >= SCHEMA_VERSION) return current;
    const step = migrations[v];
    if (!step) return current;
    current = step(current);
  }
  return current;
}

export function createRepository(
  store: KeyValueStore,
  now: () => string = () => new Date().toISOString(),
  migrations: Migrations = MIGRATIONS,
): Repository {
  async function keepCorruptCopy(raw: string): Promise<void> {
    await store.setItem(`${STORAGE_KEY}.corrupt-${now()}`, raw);
  }

  return {
    async load() {
      const raw = await store.getItem(STORAGE_KEY);
      if (raw === null) return { data: emptyAppData(), recovered: false };
      let parsed: unknown;
      try {
        parsed = migrate(JSON.parse(raw), migrations);
      } catch {
        await keepCorruptCopy(raw);
        return { data: emptyAppData(), recovered: true };
      }
      if (appDataProblem(parsed, SCHEMA_VERSION) !== null) {
        await keepCorruptCopy(raw);
        return { data: emptyAppData(), recovered: true };
      }
      return { data: parsed as AppData, recovered: false };
    },

    async save(data) {
      const problem = appDataProblem(data, SCHEMA_VERSION);
      if (problem) throw new Error(`Refusing to save invalid data: ${problem}`);
      await store.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  };
}
