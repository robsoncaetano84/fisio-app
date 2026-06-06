export {};

declare global {
  interface ReactNativeFormDataFile {
    uri: string;
    name: string;
    type: string;
  }

  interface FormData {
    append(name: string, value: ReactNativeFormDataFile): void;
  }
}
