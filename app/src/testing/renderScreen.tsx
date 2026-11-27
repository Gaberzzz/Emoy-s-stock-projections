import { render } from '@testing-library/react-native';
import type { ComponentType } from 'react';
import { Alert } from 'react-native';
import type { AppData } from '../domain/types';
import type { RootStackParamList, ScreenProps } from '../navigation/types';
import { AppStateProvider, useAppState } from '../state/AppState';

/** Renders a screen inside the state provider with a mock navigation object. */
export async function renderScreen<K extends keyof RootStackParamList>(
  Screen: ComponentType<ScreenProps<K>>,
  name: K,
  params: RootStackParamList[K],
  data: AppData,
) {
  const navigation = {
    navigate: jest.fn(),
    push: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    replace: jest.fn(),
  };
  const state: { data: AppData } = { data };
  function Spy() {
    state.data = useAppState().data;
    return null;
  }
  const props = {
    navigation,
    route: { key: `${name}-key`, name, params },
  } as unknown as ScreenProps<K>;
  await render(
    <AppStateProvider initialData={data}>
      <Screen {...props} />
      <Spy />
    </AppStateProvider>,
  );
  return { navigation, getData: () => state.data };
}

/** Auto-confirm the destructive button of the next Alert.alert calls. */
export function autoConfirmAlerts() {
  return jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    buttons?.find((b) => b.style === 'destructive')?.onPress?.();
  });
}
