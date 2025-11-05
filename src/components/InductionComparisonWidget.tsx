import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface Prediction {
  token: string;
  id: number;
  prob: number;
}

interface PredictionPanelProps {
  title: string;
  predictions: Prediction[] | null;
  emptyMessage: string;
  barColor: string;
  targetToken?: string;
}

function PredictionPanel({
  title,
  predictions,
  emptyMessage,
  barColor,
  targetToken,
}: PredictionPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
        {title}
      </h4>
      {predictions ? (
        <div className="space-y-1">
          {predictions.map((pred, i) => {
            const maxProb = Math.max(...predictions.map(p => p.prob));
            const width = maxProb > 0 ? (pred.prob / maxProb) * 100 : 0;
            const isTarget = targetToken && pred.token === targetToken;

            return (
              <div key={i} className="flex items-center gap-3 py-0.5">
                <div className="w-24 shrink-0 font-mono text-sm text-neutral-800 flex items-center gap-1">
                  {pred.token}
                  {isTarget && (
                    <span className="text-[10px] text-pink-600">★</span>
                  )}
                </div>
                <div className="flex-1 max-w-md">
                  <div className="h-2 rounded-sm bg-neutral-100">
                    <div
                      className={`h-2 rounded-sm ${isTarget ? 'bg-pink-400' : barColor} transition-all duration-300`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                  {(pred.prob * 100).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-8">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function InductionComparisonWidget({
  initialText = "My name is Regan. My name is",
}: {
  initialText?: string;
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);

  // Predictions from both models
  const [t1Predictions, setT1Predictions] = useState<Prediction[][] | null>(null);
  const [t2Predictions, setT2Predictions] = useState<Prediction[][] | null>(null);

  // Fetch predictions from both models
  useEffect(() => {
    const fetchData = async () => {
      if (!text.trim()) {
        setTokens([]);
        setT1Predictions(null);
        setT2Predictions(null);
        return;
      }

      try {
        // Fetch t1 (1-layer) predictions
        const t1Response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            layers: [0],
            heads: [0],
          }),
        });

        if (t1Response.ok) {
          const t1Data = await t1Response.json();
          setTokens(t1Data.tokens.map((t: any) => t.text));
          if (t1Data.full_predictions) {
            setT1Predictions(t1Data.full_predictions);
          }
        }

        // Fetch t2 (2-layer) predictions
        const t2Response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t2",
            layers: [0, 1],
            heads: null,
          }),
        });

        if (t2Response.ok) {
          const t2Data = await t2Response.json();
          if (t2Data.full_predictions) {
            setT2Predictions(t2Data.full_predictions);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // Determine active token index: use hovered token if available, otherwise use last token
  const activeTokenIdx = hoveredTokenIdx !== null
    ? hoveredTokenIdx
    : tokens.length > 0
      ? tokens.length - 1
      : null;

  // Get predictions for active token
  const activeT1Predictions = activeTokenIdx !== null && t1Predictions
    ? t1Predictions[activeTokenIdx]
    : null;

  const activeT2Predictions = activeTokenIdx !== null && t2Predictions
    ? t2Predictions[activeTokenIdx]
    : null;

  // Identify the target token (what came after the first instance of the pattern)
  // For "My name is Regan. My name is", the target is "Regan"
  const targetToken = tokens.length >= 5 ? tokens[4] : null; // Position 4 is "Regan" or "Reg"

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          1-Layer vs 2-Layer: Can it Learn from Context?
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over the last token to see what each model predicts
        </p>
      </div>

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
      {tokens.length > 0 && (
        <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200">
          <div style={{ lineHeight: 1.8, wordBreak: "break-word", userSelect: "none" }}>
            {tokens.map((token, idx) => {
              const isHovered = hoveredTokenIdx === idx;
              const isActive = activeTokenIdx === idx && hoveredTokenIdx === null;

              let bgColor = "";
              let borderStyle = "";

              if (isHovered) {
                bgColor = "bg-blue-200";
                borderStyle = "border-b-2 border-blue-500";
              } else if (isActive) {
                bgColor = "bg-blue-100";
                borderStyle = "border-b-2 border-blue-400";
              } else {
                bgColor = "hover:bg-gray-100";
                borderStyle = "border-b border-dashed border-gray-300";
              }

              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredTokenIdx(idx)}
                  onMouseLeave={() => setHoveredTokenIdx(null)}
                  className={`px-1 py-0.5 cursor-pointer transition-colors ${bgColor} ${borderStyle}`}
                >
                  {token || "␠"}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Prediction panels */}
      {(activeT1Predictions || activeT2Predictions) && activeTokenIdx !== null && (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Left: 1-Layer Model */}
          <PredictionPanel
            title="1-Layer Model (No Induction)"
            predictions={activeT1Predictions}
            emptyMessage="No predictions available"
            barColor="bg-neutral-300"
            targetToken={targetToken}
          />

          {/* Right: 2-Layer Model */}
          <PredictionPanel
            title="2-Layer Model (With Induction)"
            predictions={activeT2Predictions}
            emptyMessage="No predictions available"
            barColor="bg-blue-300"
            targetToken={targetToken}
          />
        </div>
      )}

      {/* Explanation */}
      {targetToken && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-900">
            <strong>Key difference:</strong> The 2-layer model can predict{" "}
            <code className="bg-white px-1.5 py-0.5 rounded font-mono">{targetToken}</code>{" "}
            <span className="text-pink-600">★</span> because it learns from the context—it sees the pattern{" "}
            "My name is {targetToken}" earlier and completes it. The 1-layer model only has skip-trigrams
            and bigrams, so it can't do true in-context learning like this.
          </div>
        </div>
      )}
    </div>
  );
}
