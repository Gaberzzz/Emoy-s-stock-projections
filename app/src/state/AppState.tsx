/**
 * App state: an in-memory AppData reducer, hydrated from and persisted to the on-device
 * Repository (debounced ≤ 500 ms, and immediately when the app goes to the background).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState as RNAppState } from 'react-native';
import { findSaleConflict } from '../calc/sales';
import { examplePosition } from '../domain/examples';
import { newId, nowIso } from '../domain/helpers';
import { newPosition } from '../domain/position';
import {
  emptyAppData,
  type AppData,
  type Lot,
  type Position,
  type WhatIfSale,
} from '../domain/types';
import type { Repository } from '../storage/repository';
import { reducer, type Action, type PositionPatch } from './reducer';

export const SAVE_DEBOUNCE_MS = 400;

interface Ctx {
  data: AppData;
  dispatch: (a: Action) => void;
  ready: boolean;
  /** Stored data could not be read; a copy was kept and the app started empty. */
  recovered: boolean;
  saveFailed: boolean;
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({
  children,
  repository,
  initialData,
}: {
  children: ReactNode;
  repository?: Repository;
  initialData?: AppData;
}) {
  const [data, dispatch] = useReducer(reducer, initialData ?? emptyAppData());
  const [ready, setReady] = useState(!repository || !!initialData);
  const [recovered, setRecovered] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  const dirty = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!repository || initialData) return;
    let cancelled = false;
    repository
      .load()
      .then((r) => {
        if (cancelled) return;
        hydrated.current = true;
        dispatch({ type: 'hydrate', data: r.data });
        setRecovered(r.recovered);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setRecovered(true);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, initialData]);

  const flush = useCallback(async () => {
    if (!repository || !dirty.current) return;
    dirty.current = false;
    try {
      await repository.save(dataRef.current);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [repository]);

  useEffect(() => {
    if (!repository || !ready) return;
    if (hydrated.current) {
      // The hydrate itself does not need saving.
      hydrated.current = false;
      return;
    }
    dirty.current = true;
    const t = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [data, ready, repository, flush]);

  useEffect(() => {
    if (!repository) return;
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s !== 'active') void flush();
    });
    return () => sub.remove();
  }, [repository, flush]);

  const value = useMemo(
    () => ({ data, dispatch, ready, recovered, saveFailed }),
    [data, ready, recovered, saveFailed],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

export function usePosition(id: string): Position | undefined {
  return useAppState().data.positions.find((p) => p.id === id);
}

/** Action helpers that create ids and timestamps; conflict-checked ones return an error message. */
export function useActions() {
  const { data, dispatch } = useAppState();
  return useMemo(() => {
    const find = (id: string) => data.positions.find((p) => p.id === id);
    return {
      addPosition(name: string, capitalNote?: string): string {
        const id = newId();
        dispatch({
          type: 'addPosition',
          position: newPosition({ id, now: nowIso(), name, capitalNote }),
        });
        return id;
      },
      addExample(): string {
        const id = newId();
        dispatch({ type: 'addPosition', position: examplePosition({ id, now: nowIso() }) });
        return id;
      },
      updatePosition(id: string, patch: PositionPatch) {
        dispatch({ type: 'updatePosition', id, now: nowIso(), patch });
      },
      duplicatePosition(id: string): string {
        const newPid = newId();
        dispatch({ type: 'duplicatePosition', id, newId: newPid, now: nowIso() });
        return newPid;
      },
      removePosition(id: string) {
        dispatch({ type: 'removePosition', id });
      },
      addLot(positionId: string, shares: number, averagePrice: number) {
        dispatch({
          type: 'addLot',
          positionId,
          now: nowIso(),
          lot: { id: newId(), shares, averagePrice },
        });
      },
      /** Returns an error message if recorded sales would exceed the shares held. */
      updateLot(positionId: string, lot: Lot): string | null {
        const p = find(positionId);
        if (!p) return null;
        const conflict = findSaleConflict(
          p.lots.map((l) => (l.id === lot.id ? lot : l)),
          p.sales,
        );
        if (conflict) return conflict.message;
        dispatch({ type: 'updateLot', positionId, now: nowIso(), lot });
        return null;
      },
      removeLot(positionId: string, lotId: string): string | null {
        const p = find(positionId);
        if (!p) return null;
        const conflict = findSaleConflict(
          p.lots.filter((l) => l.id !== lotId),
          p.sales,
        );
        if (conflict) return `Can't remove this lot. ${conflict.message}`;
        dispatch({ type: 'removeLot', positionId, now: nowIso(), lotId });
        return null;
      },
      recordSale(positionId: string, sale: WhatIfSale): string | null {
        const p = find(positionId);
        if (!p) return null;
        const candidate = { ...sale, id: newId() };
        const conflict = findSaleConflict(p.lots, [...p.sales, candidate]);
        if (conflict) return conflict.message;
        dispatch({ type: 'addSale', positionId, now: nowIso(), sale: candidate });
        return null;
      },
      removeSale(positionId: string, saleId: string) {
        dispatch({ type: 'removeSale', positionId, now: nowIso(), saleId });
      },
    };
  }, [data, dispatch]);
}
