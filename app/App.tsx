import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppStateProvider } from './src/state/AppState';
import { createRepository } from './src/storage/repository';

const repository = createRepository(AsyncStorage);

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider repository={repository}>
        <RootNavigator />
        <StatusBar style="auto" />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
