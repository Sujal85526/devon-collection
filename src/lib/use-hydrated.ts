import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during SSR and the first client render, true after hydration — for UI that depends on localStorage (the bag). */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
