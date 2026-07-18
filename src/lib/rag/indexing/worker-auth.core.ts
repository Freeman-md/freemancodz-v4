import { timingSafeEqual } from "node:crypto";

export function isAuthorizedWorkerSecret(expected: string | undefined, actual: string | null | undefined) {
  if (!expected || !actual) return false;
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}
