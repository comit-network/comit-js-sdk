// TODO: This is not an intuitive interface
// timeout: Maximum time to wait
// tryInterval: how long to wait between 2 tries
// Need to either rename or move to: timeout + Number of tries
// Also need to make it clearer it's milliseconds
export interface TryParams {
  timeout: number;
  tryInterval: number;
}

export function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject("Timed out in " + ms + "ms.");
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
