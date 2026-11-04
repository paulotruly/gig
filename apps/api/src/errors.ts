export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}
