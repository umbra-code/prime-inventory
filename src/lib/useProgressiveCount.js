import { startTransition, useEffect, useState } from "react";

/**
 * How many items of a long list to render right now: a first batch at once,
 * then the rest a batch at a time, so showing the whole list does not freeze
 * the page. Starts over when `resetKey` changes (a new search or filter) and
 * keeps its place otherwise, e.g. when an edit only reorders the list.
 */
export function useProgressiveCount(total, resetKey, { initial = 12, step = 24 } = {}) {
  const [state, setState] = useState({ key: resetKey, count: initial });

  // Adjusted while rendering, so a new list never shows a frame of the old count.
  let { count } = state;
  if (state.key !== resetKey) {
    count = initial;
    setState({ key: resetKey, count });
  }

  useEffect(() => {
    if (count >= total) return undefined;
    // After a paint, and as a transition: typing and clicks are not held up.
    const timer = setTimeout(() => {
      startTransition(() =>
        setState((current) => (current.key === resetKey ? { ...current, count: current.count + step } : current))
      );
    }, 16);
    return () => clearTimeout(timer);
  }, [count, total, resetKey, step]);

  return Math.min(count, total);
}
