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
  let id: NodeJS.Timeout;

  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<T>((_, reject) => {
    id = setTimeout(() => {
      reject(new Error(`timed out after ${ms}ms`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(id);
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
