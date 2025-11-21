import { useState, useEffect } from "react";
import { API_URL } from "../config";
import type { BigramBatchResponse, BatchCompletionsResponse, CompletionInfo } from "../types";

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
  maxNewTokens = 20,
  modelName = "bigram",
  layer,
  head,
}: {
  initialText?: string;
  maxNewTokens?: number;
  modelName?: string;
  layer?: number;
  head?: number;
}) {
  const [text, setText] = useState(initialText);
  const [tokens, setTokens] = useState<string[]>([]);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  // Batch results
  const [batchBigramResults, setBatchBigramResults] = useState<BigramBatchResponse | null>(null);
  const [batchCompletionResults, setBatchCompletionResults] = useState<BatchCompletionsResponse | null>(null);

  // Fetch all data in bulk when text changes
  useEffect(() => {
    const fetchData = async () => {
      if (!text.trim()) {
        setTokens([]);
        setBatchBigramResults(null);
        setBatchCompletionResults(null);
        return;
      }

      try {
        // Fetch batch bigram predictions (for next token only)
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
          setTokens(bigramBatchData.tokens.map((t: any) => t.text));
        }

        // Fetch batch completions (multi-token sequences)
        const completionsResponse = await fetch(`${API_URL}/api/batch-completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            max_new_tokens: maxNewTokens,
            stop_tokens: ['.', '!', '?'],
            temperature: 1.0,
            model_name: modelName,
            layer: layer,
            head: head,
          }),
        });

        if (completionsResponse.ok) {
          const completionsData = await completionsResponse.json();
          setBatchCompletionResults(completionsData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [text, maxNewTokens, modelName, layer, head]);

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
          {modelName !== "bigram" && (
            <span className="text-base font-normal text-gray-600">
              {" "}({modelName.toUpperCase()}{layer !== undefined ? ` L${layer}` : ""}{head !== undefined ? ` H${head}` : ""})
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hover over a token to see what the {modelName === "bigram" ? "bigram model" : `${modelName.toUpperCase()} model`} would generate from that point
        </p>
      </div>

      {/* Text input - toggle */}
      {showTextInput && (
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
      )}

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

          {/* Toggle button */}
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-xs text-neutral-500 hover:text-neutral-700 underline focus:outline-none"
            >
              {showTextInput ? "hide input" : "use your own text"}
            </button>
          </div>
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
