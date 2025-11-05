import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface Prediction {
  token: string;
  id: number;
  logit: number;
}

export function InductionComparisonWidget({
  initialText = "My name is Regan Bell. What's my name again?",
}: {
  initialText?: string;
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [t1Predictions, setT1Predictions] = useState<Prediction[] | null>(null);
  const [t2Predictions, setT2Predictions] = useState<Prediction[] | null>(null);

  // Fetch tokens when text changes - use analyze endpoint which is more stable
  useEffect(() => {
    const fetchTokens = async () => {
      if (!text.trim()) return;

      try {
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            top_k: 1,
            compute_ablations: false,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setTokens(data.tokens.map((t: any) => t.text));
      } catch (err) {
        console.error("Error fetching tokens:", err);
      }
    };

    const timer = setTimeout(fetchTokens, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // Fetch predictions when hovering a token
  useEffect(() => {
    if (hoveredTokenIdx === null || hoveredTokenIdx >= tokens.length) {
      setT1Predictions(null);
      setT2Predictions(null);
      return;
    }

    const fetchPredictions = async () => {
      // Fetch T1 (1-layer) predictions
      try {
        const t1Response = await fetch(`${API_URL}/api/attention-topk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            position: hoveredTokenIdx,
            k: 10,
          }),
        });

        if (t1Response.ok) {
          const t1Data = await t1Response.json();
          setT1Predictions(t1Data.predictions);
        }
      } catch (err) {
        console.error("Error fetching t1 predictions:", err);
      }

      // Fetch T2 (2-layer) predictions
      try {
        const t2Response = await fetch(`${API_URL}/api/attention-topk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t2",
            position: hoveredTokenIdx,
            k: 10,
          }),
        });

        if (t2Response.ok) {
          const t2Data = await t2Response.json();
          setT2Predictions(t2Data.predictions);
        }
      } catch (err) {
        console.error("Error fetching t2 predictions:", err);
      }
    };

    fetchPredictions();
  }, [hoveredTokenIdx, tokens, text]);

  return (
    <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
      <h3 className="text-xl font-semibold mb-6 text-center">
        1-Layer vs. 2-Layer Model Comparison
      </h3>

      {/* Text input */}
      <div className="mb-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Enter text with repeated patterns:</span>
          <div className="relative flex items-center">
            <div className="absolute left-3 z-10 group">
              <span className="text-gray-400 text-sm font-mono select-none cursor-help">
                &lt;|BOS|&gt;
              </span>
              <div className="invisible group-hover:visible absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-20">
                Beginning of Sequence token - a special token that marks the start of input to the model
              </div>
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full pl-24 pr-4 py-2 border border-warm-gray rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="My name is Regan Bell. What's my name again?"
            />
          </div>
        </label>
      </div>

      {/* Token strip */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-warm-gray">
        <div style={{ lineHeight: 1.8, wordBreak: "break-word", userSelect: "none" }}>
          {tokens.map((token, idx) => (
            <span
              key={idx}
              onMouseEnter={() => setHoveredTokenIdx(idx)}
              onMouseLeave={() => setHoveredTokenIdx(null)}
              className={`px-1 py-0.5 cursor-pointer transition-colors ${
                hoveredTokenIdx === idx
                  ? "bg-blue-200 border-b-2 border-blue-500"
                  : "hover:bg-gray-100 border-b border-dashed border-gray-300"
              }`}
            >
              {token || "␠"}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Hover over a token to see what each model predicts comes next
        </p>
      </div>

      {/* Two-column predictions */}
      {(t1Predictions || t2Predictions) && hoveredTokenIdx !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: 1-layer model */}
          <div className="bg-white p-5 rounded-lg border border-warm-gray">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
              1-Layer Model (No Induction)
            </h4>
            {t1Predictions ? (
              <div className="space-y-1">
                {t1Predictions.map((pred, i) => {
                  const maxLogit = Math.max(...t1Predictions.map(p => p.logit));
                  const minLogit = Math.min(...t1Predictions.map(p => p.logit));
                  const range = maxLogit - minLogit;
                  const width = range > 0 ? ((pred.logit - minLogit) / range) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-20 shrink-0 font-mono text-sm text-neutral-800">
                        {pred.token}
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-neutral-400 transition-all duration-300"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                        {pred.logit.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-8">
                Hover a token to see predictions
              </div>
            )}
          </div>

          {/* Right: 2-layer model */}
          <div className="bg-white p-5 rounded-lg border border-accent/30">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
              2-Layer Model (With Induction!)
            </h4>
            {t2Predictions ? (
              <div className="space-y-1">
                {t2Predictions.map((pred, i) => {
                  const maxLogit = Math.max(...t2Predictions.map(p => p.logit));
                  const minLogit = Math.min(...t2Predictions.map(p => p.logit));
                  const range = maxLogit - minLogit;
                  const width = range > 0 ? ((pred.logit - minLogit) / range) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-20 shrink-0 font-mono text-sm text-neutral-800">
                        {pred.token}
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-accent transition-all duration-300"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                        {pred.logit.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-8">
                Hover a token to see predictions
              </div>
            )}
          </div>
        </div>
      )}

      {(t1Predictions || t2Predictions) && hoveredTokenIdx !== null && (
        <div className="mt-4 text-xs text-gray-600 text-center">
          Notice how the 2-layer model can use induction to predict repeated tokens!
        </div>
      )}
    </div>
  );
}
