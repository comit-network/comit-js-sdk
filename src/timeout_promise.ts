import { Result } from "./result";

export interface TryParams {
  maxTimeoutSecs: number;
  tryIntervalSecs: number;
}

export function timeoutPromise<T>(
  ms: number,
  promise: Promise<Result<T>>
): Promise<Result<T>> {
  const timeout = new Promise<Result<T>>(() => {
    const id = setTimeout(() => {
      clearTimeout(id);
      return Result.err(new Error(`Timed out in ${ms}ms.`));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
