import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WhatIfSale } from '../domain/types';

export type RootStackParamList = {
  PositionsList: undefined;
  PositionEditor: { positionId: string };
  Analyses: { positionId: string; whatIf?: WhatIfSale };
  Sales: { positionId: string };
  FormulaInfo: undefined;
};

export type ScreenProps<K extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  K
>;
