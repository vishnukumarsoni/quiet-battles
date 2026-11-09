import { useCallback, useEffect, useState } from 'react';

// Runs an API call when the page opens (and whenever `deps` change).
// Gives back { data, meta, loading, error, reload }.
export default function useFetch(call, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true; // ignore the answer if the page was left (or deps changed) meanwhile
    setState((s) => ({ ...s, loading: true, error: null }));
    call()
      .then((res) => alive && setState({ data: res.data, meta: res.meta || null, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, meta: null, loading: false, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
