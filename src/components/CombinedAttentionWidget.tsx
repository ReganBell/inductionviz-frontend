import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface BigramBatchResponse {
  tokens: Array<{ id: number; text: string }>;
  predictions: Array<Array<{ token: string; prob: number; logit?: number }>>;
}

interface AttentionBatchResponse {
  tokens: Array<{ id: number; text: string }>;
  full_predictions: Array<Array<{ token: string; id: number; prob: number }>>;
  full_predictions_normalized: Array<Array<{ token: string; id: number; logit: number }>>;
  attention: Array<Array<Array<Array<number>>>>; // [position][layer][head][src_position]
}

type Panel = "l1" | "bigram";

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
  useProb?: boolean; // if true, use prob; if false, use logit
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

export function CombinedAttentionWidget({
  initialText = "The quarterback threw the football 87 yards for a touchdown",
  panels = ["l1", "bigram"],
}: {
  initialText?: string;
  panels?: Panel[];
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);

  // Batch results - we always fetch these
  const [batchBigramResults, setBatchBigramResults] = useState<BigramBatchResponse | null>(null);
  const [batchAttentionResults, setBatchAttentionResults] = useState<AttentionBatchResponse | null>(null);
  const [selectedBatchTokenIdx, setSelectedBatchTokenIdx] = useState<number>(0);

  // Determine what data we need based on panels
  const needsL1Data = panels.includes("l1");
  const needsBatchData = panels.includes("bigram");

  // Fetch all data in bulk when text changes
  useEffect(() => {
    const fetchData = async () => {
      if (!text.trim()) {
        setTokens([]);
        setBatchBigramResults(null);
        setBatchAttentionResults(null);
        return;
      }

      try {
        // Fetch attention patterns only if l1 panel is enabled
        if (needsL1Data) {
          const attentionResponse = await fetch(`${API_URL}/api/attention-patterns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              model_name: "t1",
              layers: [0],
              heads: [0],
            }),
          });

          if (attentionResponse.ok) {
            const attentionData = await attentionResponse.json();
            setTokens(attentionData.tokens.map((t: any) => t.text));
            if (attentionData.full_predictions && attentionData.full_predictions_normalized) {
              setBatchAttentionResults({
                tokens: attentionData.tokens,
                full_predictions: attentionData.full_predictions,
                full_predictions_normalized: attentionData.full_predictions_normalized,
                attention: attentionData.attention || [],
              });
            }
          }
        }

        // Always fetch batch bigram predictions (we need tokens even if not showing l1)
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

          // If we didn't fetch attention data, use bigram tokens
          if (!needsL1Data) {
            setTokens(bigramBatchData.tokens.map((t: any) => t.text));
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [text, needsL1Data]);

  // Determine active token index: use hovered token if available, otherwise use last token
  const activeTokenIdx = hoveredTokenIdx !== null 
    ? hoveredTokenIdx 
    : tokens.length > 0 
      ? tokens.length - 1 
      : null;

  // Get predictions for active token from batch results
  const hoveredBigramPredictions = activeTokenIdx !== null && batchBigramResults
    ? batchBigramResults.predictions[activeTokenIdx]
    : null;

  const hoveredAttentionPredictions = activeTokenIdx !== null && batchAttentionResults
    ? batchAttentionResults.full_predictions[activeTokenIdx]
    : null;

  // Get attention weights for the hovered token
  // attention data structure: [position][layer][head][src_position]
  // Position 0 has no attention (it's the first token), so position 1 is at index 0
  const attentionWeights = activeTokenIdx !== null &&
    activeTokenIdx > 0 &&
    batchAttentionResults?.attention &&
    batchAttentionResults.attention.length > activeTokenIdx - 1
      ? batchAttentionResults.attention[activeTokenIdx - 1][0][0] // layer 0, head 0
      : null;

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          {needsL1Data ? "Combined Effect: Bigram vs. Attention" : "Bigram model"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over a token to see what comes next
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

      {/* Token strip - always show */}
      {tokens.length > 0 && (
        <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200">
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
              } else if (attentionWeights && idx < attentionWeights.length) {
                // Source token that is being attended to
                const weight = attentionWeights[idx];
                const opacity = Math.min(weight * 5, 1); // Scale up for visibility
                bgColor = `bg-green-300`;
                borderStyle = `border-b-2 border-green-500`;
                return (
                  <span
                    key={idx}
                    onMouseEnter={() => setHoveredTokenIdx(idx)}
                    onMouseLeave={() => setHoveredTokenIdx(null)}
                    className={`px-1 py-0.5 cursor-pointer transition-colors hover:bg-gray-100 ${borderStyle}`}
                    style={{ backgroundColor: `rgba(134, 239, 172, ${opacity})` }}
                  >
                    {token || "␠"}
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
                  {token || "␠"}
                </span>
              );
            })}
          </div>
          {needsL1Data && attentionWeights && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Green highlights show attention weights
            </p>
          )}
        </div>
      )}

      {/* Prediction panels - always show when there's data */}
      {(hoveredBigramPredictions || hoveredAttentionPredictions) && activeTokenIdx !== null && (
        <div className={`grid gap-8 ${needsL1Data ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: Bigram predictions */}
          <PredictionPanel
            title="Bigram Model (Last Token Only)"
            showTitle={panels.length > 1}
            predictions={hoveredBigramPredictions}
            emptyMessage="No bigram data available"
            barColor="bg-neutral-300"
            useProb={true}
          />

          {/* Right: L1 model output with attention */}
          {needsL1Data && (
            <PredictionPanel
              title="With Attention (Context Aware)"
              showTitle={panels.length > 1}
              predictions={hoveredAttentionPredictions}
              emptyMessage="Hover a token to see predictions"
              barColor="bg-blue-300"
              useProb={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
