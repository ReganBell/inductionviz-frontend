import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface Prediction {
  token: string;
  id: number;
  logit: number;
}

export function CombinedAttentionWidget({
  initialText = "The quarterback threw the football 87 yards for a touchdown",
}: {
  initialText?: string;
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [bigramPredictions, setBigramPredictions] = useState<Prediction[] | null>(null);
  const [attentionPredictions, setAttentionPredictions] = useState<Prediction[] | null>(null);

  // Fetch tokens when text changes
  useEffect(() => {
    const fetchTokens = async () => {
      if (!text.trim()) return;

      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            layers: [0],
            heads: [0],
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
      setBigramPredictions(null);
      setAttentionPredictions(null);
      return;
    }

    const fetchPredictions = async () => {
      const hoveredToken = tokens[hoveredTokenIdx];

      // Fetch bigram predictions
      try {
        const bigramResponse = await fetch(`${API_URL}/api/bigram-topk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: hoveredToken,
            k: 10,
          }),
        });

        if (bigramResponse.ok) {
          const bigramData = await bigramResponse.json();
          // Normalize by subtracting mean
          const logits = bigramData.predictions.map((p: any) => p.logit);
          const mean = logits.reduce((a: number, b: number) => a + b, 0) / logits.length;
          const normalized = bigramData.predictions.map((p: any) => ({
            ...p,
            logit: p.logit - mean,
          }));
          setBigramPredictions(normalized);
        }
      } catch (err) {
        console.error("Error fetching bigram predictions:", err);
      }

      // Fetch full attention predictions (QK + OV combined)
      try {
        const attentionResponse = await fetch(`${API_URL}/api/attention-topk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            position: hoveredTokenIdx,
            k: 10,
          }),
        });

        if (attentionResponse.ok) {
          const attentionData = await attentionResponse.json();
          setAttentionPredictions(attentionData.predictions);
        }
      } catch (err) {
        console.error("Error fetching attention predictions:", err);
      }
    };

    fetchPredictions();
  }, [hoveredTokenIdx, tokens, text]);

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Combined Effect: Bigram vs. Attention
      </h3>

      {/* Text input */}
      <div className="mb-8 max-w-2xl mx-auto">
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
            className="w-full pl-24 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type some text..."
          />
        </div>
      </div>

      {/* Token strip */}
      <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200">
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
          Hover over a token to see what comes next
        </p>
      </div>

      {/* Two-column predictions */}
      {(bigramPredictions || attentionPredictions) && hoveredTokenIdx !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Bigram predictions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
              Bigram Model (Last Token Only)
            </h4>
            {bigramPredictions ? (
              <div className="space-y-1">
                {bigramPredictions.map((pred, i) => {
                  const maxLogit = Math.max(...bigramPredictions.map(p => p.logit));
                  const width = maxLogit > 0 ? (pred.logit / maxLogit) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-24 shrink-0 font-mono text-sm text-neutral-800">
                        {pred.token}
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-neutral-300 transition-all duration-300"
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
                No bigram data available
              </div>
            )}
          </div>

          {/* Right: Attention predictions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
              With Attention (Context Aware)
            </h4>
            {attentionPredictions ? (
              <div className="space-y-1">
                {attentionPredictions.map((pred, i) => {
                  const maxLogit = Math.max(...attentionPredictions.map(p => p.logit));
                  const width = maxLogit > 0 ? (pred.logit / maxLogit) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-24 shrink-0 font-mono text-sm text-neutral-800">
                        {pred.token}
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-blue-300 transition-all duration-300"
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
    </div>
  );
}
