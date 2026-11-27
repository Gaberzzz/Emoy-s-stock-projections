import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Use the official in-memory AsyncStorage mock in tests.
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
