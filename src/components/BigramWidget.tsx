import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

// ------------------------------------------------------------
// Bigram Top‑K Demo (Distill/Transformer‑Circuits style)
// Fetches real predictions from OpenWebText bigram model
// ------------------------------------------------------------

async function fetchTopKBigram(
  token: string,
  k = 10
): Promise<Array<{ token: string; prob: number }>> {
  try {
    const response = await fetch(`${API_URL}/api/bigram-topk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, k }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API error:", error);
      return [];
    }

    const data = await response.json();

    if (!data.available) {
      console.warn(`Token "${token}" not found in bigram model`);
      return [];
    }

    return data.predictions.map((p: any) => ({
      token: p.token,
      prob: p.prob,
    }));
  } catch (error) {
    console.error("Failed to fetch bigram data:", error);
    return [];
  }
}

function useDebounced<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function SmallCaps({ children }: { children: React.ReactNode }) {
  return <span className="tracking-widest text-[0.82em] uppercase text-neutral-500">{children}</span>;
}

function FigureCaption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-3 text-[0.92rem] leading-snug text-neutral-600">
      <SmallCaps>Figure</SmallCaps> &nbsp;{children}
    </figcaption>
  );
}

function Bar({ label, value, max, onClick }: { label: string; value: number; max: number; onClick?: () => void }) {
  const width = `${Math.max(4, (value / max) * 100)}%`;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left focus:outline-none"
      title={`${label}: ${(value * 100).toFixed(2)}%`}
    >
      <div className="flex items-center gap-3 py-0.5">
        <div className="w-24 shrink-0 font-mono text-sm text-neutral-800">
          {label}
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-sm bg-neutral-100 group-hover:bg-neutral-150 transition-colors">
            <div
              className="h-2 rounded-sm bg-neutral-300 group-hover:bg-neutral-400 transition-all"
              style={{ width }}
            />
          </div>
        </div>
        <div className="w-20 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
          {(value * 100).toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

export function BigramWidget() {
  const [token, setToken] = useState("is");
  const [k, setK] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ token: string; prob: number }>>([]);
  const [mode, setMode] = useState<"prob" | "logprob">("prob");

  const debouncedToken = useDebounced(token, 220);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchTopKBigram(debouncedToken, k);
      if (mounted) {
        setResults(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedToken, k]);

  const display = useMemo(() => {
    if (mode === "prob") return results;
    // convert to logprob (base‑e) rescaled for bar lengths
    const eps = 1e-12;
    const logs = results.map((r) => ({ ...r, prob: Math.log(Math.max(eps, r.prob)) }));
    const min = Math.min(...logs.map((x) => x.prob));
    const shifted = logs.map((x) => ({ ...x, prob: x.prob - min + 1e-6 }));
    return shifted;
  }, [results, mode]);

  const maxVal = useMemo(() => (display.length ? Math.max(...display.map((x) => x.prob)) : 1), [display]);

  const suggestions = useMemo(() => ["My", "name", "is", "Regan", ",", ".", "if", "else", "end", "only"], []);

  return (
    <figure className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 shadow-sm">
      {/* Token selection controls */}
      <div>
        <label className="mb-2 block text-sm text-neutral-600"><SmallCaps>Context Token</SmallCaps></label>
        <div className="flex items-center gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g., is"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-sm shadow-inner outline-none focus:ring-2 focus:ring-neutral-800"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setToken(s)}
              className="rounded-full border border-neutral-300 bg-white/70 px-3 py-1 text-sm text-neutral-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-800"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {(["prob", "logprob"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={classNames(
                "rounded-xl border px-3 py-1.5 text-sm",
                mode === m
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
              )}
            >
              {m === "prob" ? "Probability" : "Log‑prob (scaled)"}
            </button>
          ))}
        </div>
      </div>

      {/* Next-token distribution */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Next‑token distribution</h3>
          {loading && (
            <span className="animate-pulse text-sm text-neutral-500">fetching…</span>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
          {display.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">No results</div>
          ) : (
            <ul className="space-y-3">
              {display.map((r, i) => (
                <li key={r.token + i}>
                  <Bar label={r.token} value={r.prob} max={maxVal} onClick={() => setToken(r.token)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 text-xs text-neutral-500">Click a row to use that token as the new context.</div>
      </div>

      <FigureCaption>
        Bigram models may be simple, but you can find lots of interesting things in them.
        For example, try the token "$" to see{" "}
        <a
          href="https://en.wikipedia.org/wiki/Benford%27s_law"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-900 underline hover:text-neutral-600"
        >
          Benford's law
        </a>
        {" "}in action!
      </FigureCaption>
    </figure>
  );
}
