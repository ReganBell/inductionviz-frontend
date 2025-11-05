import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface OVPrediction {
  token: string;
  id: number;
  logit: number;
}

export function CopyingBehaviorDemo() {
  const [text] = useState("The committee finally reported its findings.");
  const [tokens, setTokens] = useState<Array<{ text: string; id: number }>>([]);
  const [ovPredictions, setOVPredictions] = useState<OVPrediction[][][]>([]);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            layers: [0],
            heads: [0],
            compute_ov: true,
            normalize_ov: false, // Get raw logit boosts, not normalized
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setTokens(data.tokens);
        setOVPredictions(data.ov_predictions || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching OV data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [text]);

  if (loading) {
    return (
      <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const selectedOV = selectedToken !== null && ovPredictions[selectedToken]?.[0]?.[0]
    ? ovPredictions[selectedToken][0][0]
    : null;

  // Check if the top prediction is a copy of the selected token
  const isCopying = selectedToken !== null && selectedOV && selectedOV[0]?.token === tokens[selectedToken]?.text;

  return (
    <figure className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <figcaption className="text-sm font-semibold text-gray-700 mb-4 text-center">
        OV Circuit Copying Behavior (Head 0:0)
      </figcaption>

      {/* Instructions */}
      <div className="mb-4 text-sm text-gray-600 text-center">
        Click a token to see what Head 0:0's OV circuit predicts when attending to it
      </div>

      {/* Token strip */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="font-mono text-sm" style={{ lineHeight: 1.8 }}>
          {tokens.map((token, idx) => {
            const isSelected = selectedToken === idx;
            return (
              <span
                key={idx}
                onClick={() => setSelectedToken(idx)}
                className={`px-1 py-0.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-200 border-b-2 border-blue-500"
                    : "hover:bg-gray-100 border-b border-dashed border-gray-300"
                }`}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* OV predictions */}
      {selectedOV && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-600">When attending to: </span>
              <code className="bg-blue-100 px-2 py-1 rounded font-mono text-sm">
                {tokens[selectedToken!]?.text}
              </code>
            </div>
            {isCopying && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                Copying
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-2">Top predictions (raw logit boosts):</div>

          <div className="space-y-1">
            {selectedOV.slice(0, 10).map((pred, i) => {
              const isMatchingToken = pred.token === tokens[selectedToken!]?.text;
              const maxLogit = Math.abs(selectedOV[0].logit);
              const width = maxLogit > 0 ? (Math.abs(pred.logit) / maxLogit) * 100 : 0;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 font-mono text-sm text-neutral-800 flex items-center gap-1">
                    {pred.token}
                    {isMatchingToken && (
                      <span className="text-[10px] text-green-600">✓</span>
                    )}
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="h-2 rounded-sm bg-neutral-100">
                      <div
                        className={`h-2 rounded-sm transition-all ${
                          isMatchingToken ? "bg-green-400" : "bg-blue-300"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 shrink-0 font-mono text-xs tabular-nums text-neutral-600">
                    {pred.logit >= 0 ? "+" : ""}{pred.logit.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-900">
          <strong>Key insight:</strong> In most cases, the OV circuit simply boosts the same token
          that was attended to (shown in green with ✓). This "copying" behavior is the default—the
          interesting skip-trigrams and semantic associations are relatively rare exceptions. The
          constant copying behavior makes it easier for the QK circuit to coordinate when tokens
          should actually be repeated.
        </div>
      </div>
    </figure>
  );
}
