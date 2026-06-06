export const createNativeUploadFile = (
  file: ReactNativeFormDataFile,
): ReactNativeFormDataFile => ({
  uri: file.uri,
  name: file.name,
  type: file.type,
});
