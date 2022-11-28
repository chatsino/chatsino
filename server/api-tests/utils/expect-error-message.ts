export function expectErrorMessage(error: unknown, message: string) {
  expect((error as Error).message).toBe(message);
}
