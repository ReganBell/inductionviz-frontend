import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface Prediction {
  token: string;
  id: number;
  logit: number;
  prob?: number;
}

interface BigramBatchResponse {
  tokens: Array<{ id: number; text: string }>;
  predictions: Array<Array<{ token: string; prob: number }>>;
}

type Panel = "hover" | "batch";

export function CombinedAttentionWidget({
  initialText = "The quarterback threw the football 87 yards for a touchdown",
  panels = ["hover", "batch"],
}: {
  initialText?: string;
  panels?: Panel[];
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [bigramPredictions, setBigramPredictions] = useState<Prediction[] | null>(null);
  const [attentionPredictions, setAttentionPredictions] = useState<Prediction[] | null>(null);

  // Batch bigram state
  const [batchBigramResults, setBatchBigramResults] = useState<BigramBatchResponse | null>(null);
  const [selectedBatchTokenIdx, setSelectedBatchTokenIdx] = useState<number>(0);

  // Determine what data we need based on panels
  const needsHoverData = panels.includes("hover");
  const needsBatchData = panels.includes("batch");

  // Fetch tokens and batch bigram predictions when text changes
  useEffect(() => {
    const fetchData = async () => {
      if (!text.trim()) {
        setTokens([]);
        setBatchBigramResults(null);
        return;
      }

      try {
        // Fetch tokens (needed for hover mode to show token strip)
        if (needsHoverData) {
          const tokensResponse = await fetch(`${API_URL}/api/attention-patterns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              model_name: "t1",
              layers: [0],
              heads: [0],
            }),
          });

          if (tokensResponse.ok) {
            const tokensData = await tokensResponse.json();
            setTokens(tokensData.tokens.map((t: any) => t.text));
          }
        }

        // Fetch batch bigram predictions
        if (needsBatchData) {
          const bigramBatchResponse = await fetch(`${API_URL}/api/bigram-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              k: 10,
            }),
          });

          if (bigramBatchResponse.ok) {
            const bigramBatchData = await bigramBatchResponse.json();
            setBatchBigramResults(bigramBatchData);
            setSelectedBatchTokenIdx(0);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [text, needsHoverData, needsBatchData]);

  // Fetch predictions when hovering a token (only if hover mode is enabled)
  useEffect(() => {
    if (!needsHoverData || hoveredTokenIdx === null || hoveredTokenIdx >= tokens.length) {
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
  }, [hoveredTokenIdx, tokens, text, needsHoverData]);

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      {needsHoverData && (
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Combined Effect: Bigram vs. Attention
        </h3>
      )}

      {/* Text input */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative flex items-center">
          {needsHoverData && (
            <div className="absolute left-3 z-10 group">
              <span className="text-gray-400 text-sm font-mono select-none cursor-help">
                &lt;|BOS|&gt;
              </span>
              <div className="invisible group-hover:visible absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-20">
                Beginning of Sequence token - a special token that marks the start of input to the model
              </div>
            </div>
          )}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full ${needsHoverData ? 'pl-24' : 'pl-4'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Type some text..."
          />
        </div>
      </div>

      {/* Token strip (hover mode only) */}
      {needsHoverData && (
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
      )}

      {/* Two-column predictions (hover mode only) */}
      {needsHoverData && (bigramPredictions || attentionPredictions) && hoveredTokenIdx !== null && (
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

      {/* Batch bigram predictions section */}
      {needsBatchData && batchBigramResults && batchBigramResults.tokens.length > 0 && (
        <div className={`${needsHoverData ? 'mt-12' : 'mt-0'} bg-white p-6 rounded-lg border border-gray-200`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {panels.length === 1 && panels[0] === "batch"
              ? "Bigram Model Predictions"
              : "Bigram Model Predictions for All Tokens"}
          </h3>

          {/* Token selector */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Click a token to see what the bigram model predicts should follow it:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {batchBigramResults.tokens.map((tok, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedBatchTokenIdx(idx)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedBatchTokenIdx === idx
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tok.text}
                </button>
              ))}
            </div>
          </div>

          {/* Predictions for selected token */}
          {batchBigramResults.predictions[selectedBatchTokenIdx] && (
            <div className="max-w-2xl mx-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                Top predictions after "{batchBigramResults.tokens[selectedBatchTokenIdx].text}"
              </h4>
              <div className="space-y-2">
                {batchBigramResults.predictions[selectedBatchTokenIdx].map((pred, i) => {
                  const maxProb = Math.max(
                    ...batchBigramResults.predictions[selectedBatchTokenIdx].map(p => p.prob)
                  );
                  const width = maxProb > 0 ? (pred.prob / maxProb) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-24 shrink-0 font-mono text-sm text-gray-800">
                        {pred.token}
                      </div>
                      <div className="flex-1">
                        <div className="h-2.5 rounded-sm bg-gray-100">
                          <div
                            className="h-2.5 rounded-sm bg-gray-400 transition-all duration-300"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 shrink-0 font-mono text-xs tabular-nums text-gray-500 text-right">
                        {(pred.prob * 100).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
