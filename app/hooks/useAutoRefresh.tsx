"use client";

import { useEffect, useRef } from "react";

export function useAutoRefresh(callback: () => void, intervalMs: number = 3000, disabled: boolean = false) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (disabled) return;
    savedCallback.current();
    const interval = setInterval(() => {
      savedCallback.current();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, disabled]);
}
