import { vi } from "vitest";

process.setMaxListeners(0);

export const isBelowNode18 = Number(process.version.slice(1).split(".")[0]) < 18;
export function retry(assertion: () => void, { interval = 1, timeout = 100 } = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const tryAgain = () => {
      setTimeout(() => {
        try {
          resolve(assertion());
        } catch (err) {
          Date.now() - startTime > timeout ? reject(err) : tryAgain();
        }
      }, interval);
      try {
        // If useFakeTimers hasn't been called, this will throw
        vi.advanceTimersByTime(interval);
      } catch (e) {
        /* Expected to throw */
      }
    };

    tryAgain();
  });
}
export const sleep = (time: number) => vi.advanceTimersByTimeAsync(time);
