import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config";

// ------------------------------------------------------------
// Bigram Top‑K Demo (Distill/Transformer‑Circuits style)
// Fetches real predictions from OpenWebText bigram model
// ------------------------------------------------------------

interface BigramBatchResponse {
  tokens: Array<{ id: number; text: string }>;
  predictions: Array<Array<{ token: string; prob: number }>>;
}

async function fetchBigramBatch(
  text: string,
  k = 10
): Promise<BigramBatchResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/bigram-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, k }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API error:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch bigram data:", error);
    return null;
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
  const [text, setText] = useState("My name is");
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BigramBatchResponse | null>(null);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number>(0);

  const debouncedText = useDebounced(text, 220);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!debouncedText.trim()) {
        setBatchResults(null);
        return;
      }
      setLoading(true);
      const data = await fetchBigramBatch(debouncedText, 10);
      if (mounted) {
        setBatchResults(data);
        setLoading(false);
        // Select first token by default
        if (data && data.tokens.length > 0) {
          setSelectedTokenIdx(0);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedText]);

  const currentPredictions = useMemo(() => {
    if (!batchResults || selectedTokenIdx >= batchResults.predictions.length) {
      return [];
    }
    return batchResults.predictions[selectedTokenIdx];
  }, [batchResults, selectedTokenIdx]);

  const maxVal = useMemo(() =>
    currentPredictions.length ? Math.max(...currentPredictions.map((x) => x.prob)) : 1,
    [currentPredictions]
  );

  const suggestions = useMemo(() => ["My name is", "The quick brown", "Hello world", "if else end"], []);

  return (
    <figure className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 shadow-sm">
      {/* Text input */}
      <div>
        <label className="mb-2 block text-sm text-neutral-600"><SmallCaps>Input Text</SmallCaps></label>
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., My name is"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-sm shadow-inner outline-none focus:ring-2 focus:ring-neutral-800"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="rounded-full border border-neutral-300 bg-white/70 px-3 py-1 text-sm text-neutral-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-800"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Token selector */}
      {batchResults && batchResults.tokens.length > 0 && (
        <div className="mt-6">
          <label className="mb-2 block text-sm text-neutral-600">
            <SmallCaps>Select Token</SmallCaps> (click to see its predictions)
          </label>
          <div className="flex flex-wrap gap-2">
            {batchResults.tokens.map((tok, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTokenIdx(idx)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-800 ${
                  selectedTokenIdx === idx
                    ? "border-neutral-800 bg-neutral-800 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {tok.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next-token distribution */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">
            Next‑token distribution
            {batchResults && batchResults.tokens[selectedTokenIdx] && (
              <span className="ml-2 font-mono text-lg text-neutral-500">
                after "{batchResults.tokens[selectedTokenIdx].text}"
              </span>
            )}
          </h3>
          {loading && (
            <span className="animate-pulse text-sm text-neutral-500">fetching…</span>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
          {currentPredictions.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">No results</div>
          ) : (
            <ul className="space-y-3">
              {currentPredictions.map((r, i) => (
                <li key={r.token + i}>
                  <Bar label={r.token} value={r.prob} max={maxVal} />
                </li>
              ))}
            </ul>
          )}
        </div>
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
