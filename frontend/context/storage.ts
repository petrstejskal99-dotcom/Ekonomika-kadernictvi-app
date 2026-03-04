// Platform-specific storage export
import { Platform } from 'react-native';
import { StorageAdapter } from './storage.types';

// Re-export types for convenience
export * from './storage.types';

// Use platform-specific extension to import the correct storage adapter
export const createStorageAdapter: () => Promise<StorageAdapter> = Platform.select({
  web: () => require('./storage.web').createStorageAdapter(),
  default: () => require('./storage.native').createStorageAdapter(),
})!;
