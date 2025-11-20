import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface TokenData {
  text: string;
  id: number;
}

interface Prediction {
  token: string;
  prob?: number;
  logit?: number;
}

interface PredictionPanelProps {
  title?: string;
  showTitle: boolean;
  predictions: Prediction[] | null;
  emptyMessage: string;
  barColor: string;
  useProb?: boolean;
}

function PredictionPanel({
  title,
  showTitle,
  predictions,
  emptyMessage,
  barColor,
  useProb = true,
}: PredictionPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      {showTitle && title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
          {title}
        </h4>
      )}
      {predictions ? (
        <div className="space-y-1">
          {predictions.map((pred, i) => {
            const value = useProb ? pred.prob : pred.logit;
            const allValues = useProb
              ? predictions.map(p => p.prob).filter((v): v is number => v !== undefined)
              : predictions.map(p => p.logit).filter((v): v is number => v !== undefined);
            const maxValue = Math.max(...allValues);
            const width = maxValue > 0 && value !== undefined ? (value / maxValue) * 100 : 0;

            return (
              <div key={i} className="flex items-center gap-3 py-0.5">
                <div className="w-24 shrink-0 font-mono text-sm text-neutral-800">
                  {pred.token}
                </div>
                <div className="flex-1 max-w-md">
                  <div className="h-2 rounded-sm bg-neutral-100">
                    <div
                      className={`h-2 rounded-sm ${barColor} transition-all duration-300`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                  {useProb
                    ? value !== undefined ? `${(value * 100).toFixed(2)}%` : ""
                    : value !== undefined ? value.toFixed(2) : ""}
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

export function InductionHeadDemo() {
  const [text] = useState("My name is Regan. My name is");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [attention, setAttention] = useState<number[][][][]>([]); // [position][layer][head][src_position]
  const [fullPredictions, setFullPredictions] = useState<Array<Array<{ token: string; id: number; prob: number }>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t2",
            layers: [1],
            heads: [7], // Induction head
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setTokens(data.tokens);
        setAttention(data.attention || []);
        setFullPredictions(data.full_predictions || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [text]);

  // Determine active token index: use hovered token if available, otherwise use last token
  const activeTokenIdx = hoveredTokenIdx !== null 
    ? hoveredTokenIdx 
    : tokens.length > 0 
      ? tokens.length - 1 
      : null;

  // Get predictions for active token
  const activePredictions = activeTokenIdx !== null && fullPredictions.length > activeTokenIdx
    ? fullPredictions[activeTokenIdx].map(p => ({ token: p.token, prob: p.prob }))
    : null;

  // Get attention weights for the active token
  // attention data structure: [position][layer][head][src_position]
  // Position 0 has no attention (it's the first token), so position 1 is at index 0
  // Since we requested layers: [1] and heads: [7], they're at index [0][0] in the response
  const attentionWeights: number[] | null = activeTokenIdx !== null &&
    activeTokenIdx > 0 &&
    attention.length > activeTokenIdx - 1 &&
    attention[activeTokenIdx - 1] &&
    attention[activeTokenIdx - 1][0] &&
    attention[activeTokenIdx - 1][0][0]
      ? attention[activeTokenIdx - 1][0][0] // first requested layer (1), first requested head (7)
      : null;

  // Find the most attended token (excluding BOS token at index 0)
  const maxAttendedIdx = attentionWeights && Array.isArray(attentionWeights)
    ? attentionWeights.reduce((maxIdx, weight, idx) => {
        // Exclude BOS token (index 0)
        if (idx === 0) return maxIdx;
        if (maxIdx === null || weight > attentionWeights[maxIdx]) return idx;
        return maxIdx;
      }, null as number | null)
    : null;

  if (loading) {
    return (
      <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Induction Head (Layer 1, Head 7)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over a token to see what the induction head predicts will come next
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Pattern: <span className="font-semibold">"My name is"</span> repeats, what comes next?
        </p>
      </div>

      {/* Token strip */}
      {tokens.length > 0 && (
        <>
          <div className="mb-2 bg-white p-4 rounded-lg border border-gray-200">
            <div style={{ lineHeight: 1.8, wordBreak: "break-word", userSelect: "none" }}>
            {tokens.map((token, idx) => {
              // Calculate background color based on attention weight
              let bgColor = "";
              let borderStyle = "";

              if (hoveredTokenIdx === idx) {
                // The hovered token itself
                bgColor = "bg-blue-200";
                borderStyle = "border-b-2 border-blue-500";
              } else if (activeTokenIdx === idx && hoveredTokenIdx === null) {
                // The active (last) token when not hovering
                bgColor = "bg-blue-100";
                borderStyle = "border-b-2 border-blue-400";
              } else if (attentionWeights && Array.isArray(attentionWeights) && idx < attentionWeights.length) {
                // Source token that is being attended to
                const weight = attentionWeights[idx];
                const opacity = Math.min(weight * 5, 1); // Scale up for visibility
                const isMaxAttended = idx === maxAttendedIdx;
                bgColor = isMaxAttended ? "bg-amber-200" : "bg-green-300";
                borderStyle = isMaxAttended ? "border-b-2 border-amber-500" : "border-b-2 border-green-500";
                return (
                  <span
                    key={idx}
                    onMouseEnter={() => setHoveredTokenIdx(idx)}
                    onMouseLeave={() => setHoveredTokenIdx(null)}
                    className={`px-1 py-0.5 cursor-pointer transition-colors hover:bg-gray-100 ${borderStyle}`}
                    style={{ backgroundColor: isMaxAttended 
                      ? "rgba(251, 191, 36, 0.6)" 
                      : `rgba(134, 239, 172, ${opacity})` }}
                    title={`Attention: ${(weight * 100).toFixed(1)}%`}
                  >
                    {token.text || "␠"}
                  </span>
                );
              } else {
                // Default non-attended token
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
                  {token.text || "␠"}
                </span>
              );
            })}
            </div>
            {attentionWeights && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Green highlights show attention weights. Amber shows the most attended token.
              </p>
            )}
          </div>
        </>
      )}

      {/* Prediction panel */}
      {activePredictions && activeTokenIdx !== null && (
        <div className="mt-8">
          <PredictionPanel
            title={`Predictions after "${tokens[activeTokenIdx]?.text || ""}"`}
            showTitle={true}
            predictions={activePredictions}
            emptyMessage="No predictions available"
            barColor="bg-blue-300"
            useProb={true}
          />
        </div>
      )}

      {/* Explanation */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="text-sm text-indigo-900">
          <strong>How the Induction Head Works:</strong> The induction head looks for tokens tagged with the current token's identity
          (thanks to the previous token head). When it finds one, it attends to that token and copies its prediction.
          This lets the model complete repeated patterns—it's learning from the current context, not just training data!
        </div>
        {maxAttendedIdx !== null && activeTokenIdx !== null && attentionWeights && Array.isArray(attentionWeights) && (
          <div className="mt-3 text-xs text-indigo-800">
            <strong>Current observation:</strong> When processing "{tokens[activeTokenIdx]?.text || ""}", 
            the head most strongly attends to "{tokens[maxAttendedIdx]?.text || ""}" 
            (attention: {(attentionWeights[maxAttendedIdx]! * 100).toFixed(1)}%), 
            suggesting it found the repeated pattern and will predict what came after that token.
          </div>
        )}
      </div>
    </div>
  );
}
