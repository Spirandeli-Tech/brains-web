import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * `?run=<id>` deep link — how the Runner page hands you off to the screen that
 * owns a job's log ("clicou no job, quero ver o log dele").
 *
 * The screen renders `id="run-<id>"` on the matching card and highlights it;
 * this hook scrolls it into view once the list has loaded. Once per id, so the
 * poll that refreshes these screens every few seconds doesn't yank the page
 * back while you're reading.
 */
export function useFocusedRun(listReady: boolean): string | null {
  const [searchParams] = useSearchParams();
  const focusedRunId = searchParams.get("run");
  const scrolledToRef = useRef<string | null>(null);

  useEffect(() => {
    if (!listReady || !focusedRunId) return;
    if (scrolledToRef.current === focusedRunId) return;
    const el = document.getElementById(`run-${focusedRunId}`);
    if (!el) return;
    scrolledToRef.current = focusedRunId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [listReady, focusedRunId]);

  return focusedRunId;
}
