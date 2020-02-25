/**
 * Defines the parameters (for how long and how often) to try executing an action of a {@link Swap}.
 */
export interface TryParams {
  maxTimeoutSecs: number;
  tryIntervalSecs: number;
}

export async function timeoutPromise<T>(
  ms: number,
  promise: Promise<T>
): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(`Timed out in ${ms}ms.`);
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
