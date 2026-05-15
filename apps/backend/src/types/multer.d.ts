declare module 'multer' {
  export type StorageEngine = unknown;

  export function memoryStorage(): StorageEngine;
}
