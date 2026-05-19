import { DependencyList, useCallback, useRef, useState } from "react";

export function useAsyncLock<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<void>,
  deps: DependencyList,
): [boolean, (...args: TArgs) => Promise<void>] {
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const actionCallback = useCallback(action, deps);
  const actionRef = useRef(actionCallback);
  actionRef.current = actionCallback;

  const run = useCallback(async (...args: TArgs) => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setIsRunning(true);

    try {
      await actionRef.current(...args);
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  return [isRunning, run];
}
