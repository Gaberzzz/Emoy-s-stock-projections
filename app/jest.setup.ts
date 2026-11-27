import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Use the official in-memory AsyncStorage mock in tests.
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// expo-crypto's native module is not available under Jest; use Node's implementation.
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<{ randomUUID: () => string }>('crypto').randomUUID(),
}));
