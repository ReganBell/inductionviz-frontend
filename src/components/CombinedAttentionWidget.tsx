import { useState, useEffect } from "react";
import type { StaticAttentionData, StaticBigramData } from "../staticData";

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
  staticBigramData,
  staticAttentionData,
}: {
  initialText?: string;
  panels?: Panel[];
  staticBigramData?: StaticBigramData | null;
  staticAttentionData?: StaticAttentionData | null;
}) {
  const [text] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [disablePositionalEmbeddings, setDisablePositionalEmbeddings] = useState(false);

  // Batch results
  const [batchBigramResults, setBatchBigramResults] = useState<BigramBatchResponse | null>(null);
  const [batchAttentionResults, setBatchAttentionResults] = useState<AttentionBatchResponse | null>(null);
  const [selectedBatchTokenIdx, setSelectedBatchTokenIdx] = useState<number>(0);

  const needsL1Data = panels.includes("l1");

  // Load from static data
  useEffect(() => {
    if (staticAttentionData && needsL1Data) {
      setTokens(staticAttentionData.tokens.map(t => t.text));
      if (staticAttentionData.full_predictions && staticAttentionData.full_predictions_normalized) {
        setBatchAttentionResults({
          tokens: staticAttentionData.tokens,
          full_predictions: staticAttentionData.full_predictions,
          full_predictions_normalized: staticAttentionData.full_predictions_normalized,
          attention: staticAttentionData.attention || [],
        });
      }
    }

    if (staticBigramData) {
      setBatchBigramResults(staticBigramData);
      setSelectedBatchTokenIdx(0);
      if (!needsL1Data) {
        setTokens(staticBigramData.tokens.map(t => t.text));
      }
    }
  }, [staticAttentionData, staticBigramData, needsL1Data]);

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
          {needsL1Data ? "Bigram vs. Attention" : "Bigram model"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over a token to see what the model thinks will come next
        </p>
        {needsL1Data && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input
                type="checkbox"
                checked={disablePositionalEmbeddings}
                onChange={(e) => setDisablePositionalEmbeddings(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              Disable positional embeddings
            </label>
          </div>
        )}
      </div>

      {/* Text input removed - using static data */}

      {/* Token strip - always show */}
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

          {/* spacer */}
          <div className="mb-8" />
        </>
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
