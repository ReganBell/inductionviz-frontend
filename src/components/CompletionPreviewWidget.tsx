import { useState, useEffect } from "react";
import type { BigramBatchResponse, BatchCompletionsResponse, CompletionInfo } from "../types";
import type { StaticBigramData, StaticCompletionsData } from "../staticData";

interface Prediction {
  token: string;
  prob?: number;
  logit?: number;
}

interface PredictionPanelProps {
  title: string;
  predictions: Prediction[] | null;
  emptyMessage: string;
  barColor: string;
  useProb?: boolean;
}

function PredictionPanel({
  title,
  predictions,
  emptyMessage,
  barColor,
  useProb = true,
}: PredictionPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
        {title}
      </h4>
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

interface CompletionDisplayProps {
  title: string;
  completion: CompletionInfo | null;
  emptyMessage: string;
}

function CompletionDisplay({ title, completion, emptyMessage }: CompletionDisplayProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">
        {title}
      </h4>
      {completion ? (
        <div className="space-y-3">
          <div className="font-mono text-base text-gray-900 p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap break-words">
            {completion.completion_text || <span className="text-gray-400 italic">(empty)</span>}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Tokens: {completion.completion_tokens.length}</div>
            <div>Stopped: {completion.stopped_reason}</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center py-8">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function CompletionPreviewWidget({
  initialText = "The quarterback threw the football 87 yards for a touchdown",
  staticBigramData,
  staticCompletionsData,
}: {
  initialText?: string;
  staticBigramData?: StaticBigramData | null;
  staticCompletionsData?: StaticCompletionsData | null;
}) {
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);

  // Batch results
  const [batchBigramResults, setBatchBigramResults] = useState<BigramBatchResponse | null>(null);
  const [batchCompletionResults, setBatchCompletionResults] = useState<BatchCompletionsResponse | null>(null);

  useEffect(() => {
    if (staticBigramData) {
      setBatchBigramResults(staticBigramData);
      setTokens(staticBigramData.tokens.map(t => t.text));
    }
    if (staticCompletionsData) {
      setBatchCompletionResults(staticCompletionsData);
    }
  }, [staticBigramData, staticCompletionsData]);

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

  const hoveredCompletion = activeTokenIdx !== null && batchCompletionResults
    ? batchCompletionResults.completions[activeTokenIdx]
    : null;

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Completion Preview
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over a token to see what the bigram model would generate from that point
        </p>
      </div>


      {/* Token strip */}
      {tokens.length > 0 && (
        <>
          <div className="mb-2 bg-white p-4 rounded-lg border border-gray-200">
            <div style={{ lineHeight: 1.8, wordBreak: "break-word", userSelect: "none" }}>
              {tokens.map((token, idx) => {
                let bgColor = "";
                let borderStyle = "";

                if (hoveredTokenIdx === idx) {
                  bgColor = "bg-blue-200";
                  borderStyle = "border-b-2 border-blue-500";
                } else if (activeTokenIdx === idx && hoveredTokenIdx === null) {
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

          <div className="mb-8" />
        </>
      )}

      {/* Display panels */}
      {(hoveredBigramPredictions || hoveredCompletion) && activeTokenIdx !== null && (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Left: Bigram next-token predictions */}
          <PredictionPanel
            title="Next Token Predictions"
            predictions={hoveredBigramPredictions}
            emptyMessage="No predictions available"
            barColor="bg-neutral-300"
            useProb={true}
          />

          {/* Right: Multi-token completion */}
          <CompletionDisplay
            title="Multi-Token Completion"
            completion={hoveredCompletion}
            emptyMessage="Hover a token to see completion"
          />
        </div>
      )}
    </div>
  );
}
