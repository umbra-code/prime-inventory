import { useCallback, useEffect, useRef, useState } from "react";

// Within this distance below the screen, the next batch is added before it is reached.
const AHEAD_PX = 1200;

/**
 * For lists too long to render whole (hundreds of relic cards): renders a
 * first batch and adds more as the user scrolls near the end. Returns how many
 * items to render and a ref for an element placed after them. Starts over
 * when `resetKey` changes (a new filter or search).
 */
export function useRevealOnScroll(total, resetKey, { initial = 24, step = 24 } = {}) {
  const [state, setState] = useState({ key: resetKey, count: initial });
  let { count } = state;
  if (state.key !== resetKey) {
    count = initial;
    setState({ key: resetKey, count });
  }

  const sentinel = useRef(null);
  const more = useCallback(() => setState((current) => ({ ...current, count: current.count + step })), [step]);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || count >= total) return undefined;
    // Still close to the screen after a batch (a tall window, a short list): add another.
    if (element.getBoundingClientRect().top < window.innerHeight + AHEAD_PX) {
      const frame = requestAnimationFrame(more);
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && more(), {
      rootMargin: `0px 0px ${AHEAD_PX}px 0px`,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [count, total, more]);

  return [Math.min(count, total), sentinel];
}
