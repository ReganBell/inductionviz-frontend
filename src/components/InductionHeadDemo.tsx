import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface TokenData {
  text: string;
  id: number;
}

export function InductionHeadDemo() {
  const [text] = useState("My name is Regan. My name is");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [attention, setAttention] = useState<number[][][]>([]);
  const [ovPredictions, setOVPredictions] = useState<any[][][]>([]);
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
            compute_ov: true,
            normalize_ov: false,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setTokens(data.tokens);
        setAttention(data.attention || []);
        setOVPredictions(data.ov_predictions || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
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

  // Looking at the last token (second "is" at position 9)
  const queryTokenIdx = tokens.length - 1; // Second "is"

  // Get attention pattern for the query token
  const attentionPattern = attention[queryTokenIdx - 1]?.[0]?.[0]; // layer 1, head 7

  // Find which token is attended to most (should be first "Regan")
  const attendedTokenIdx = attentionPattern
    ? attentionPattern.indexOf(Math.max(...attentionPattern))
    : null;

  // Get OV predictions for the attended token
  const ovPreds = attendedTokenIdx !== null && ovPredictions[attendedTokenIdx]?.[0]?.[0]
    ? ovPredictions[attendedTokenIdx][0][0]
    : null;

  // Find first and second occurrences of "is"
  const firstIsIdx = tokens.findIndex(t => t.text === " is");
  const secondIsIdx = tokens.slice(firstIsIdx + 1).findIndex(t => t.text === " is") + firstIsIdx + 1;

  // The token after first "is" should be what we predict (Regan)
  const expectedNextToken = firstIsIdx >= 0 && firstIsIdx + 1 < tokens.length
    ? tokens[firstIsIdx + 1]
    : null;

  return (
    <figure className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <figcaption className="text-sm font-semibold text-gray-700 mb-4 text-center">
        Induction Head (Layer 1, Head 7)
      </figcaption>

      <div className="mb-4 text-sm text-gray-600 text-center">
        Observing how the induction head completes the repeated pattern
      </div>

      {/* Token strip with pattern highlighting */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 mb-2">
          Pattern: <span className="font-semibold">My name is</span> repeats, what comes next?
        </div>
        <div className="font-mono text-sm" style={{ lineHeight: 1.8 }}>
          {tokens.map((token, idx) => {
            const isQuery = idx === queryTokenIdx;
            const isAttended = attendedTokenIdx === idx;
            const isFirstIs = idx === firstIsIdx;
            const isExpectedNext = expectedNextToken && idx === firstIsIdx + 1;

            return (
              <span
                key={idx}
                className={`px-1 py-0.5 transition-colors ${
                  idx === 0
                    ? "text-gray-400"
                    : isQuery
                    ? "bg-blue-200 border-b-2 border-blue-500"
                    : isAttended
                    ? "bg-amber-200 border-b-2 border-amber-500"
                    : isFirstIs
                    ? "bg-green-100 border-b border-dashed border-green-400"
                    : isExpectedNext
                    ? "bg-pink-100 border-b border-dashed border-pink-400"
                    : ""
                }`}
              >
                {token.text}
              </span>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-200 border border-blue-500"></span>
            <span>Query: second "is"</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-green-100 border border-dashed border-green-400"></span>
            <span>First "is" (pattern match)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-pink-100 border border-dashed border-pink-400"></span>
            <span>What came after first "is"</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-amber-200 border border-amber-500"></span>
            <span>Attended token</span>
          </div>
        </div>
      </div>

      {/* Visualization */}
      {attentionPattern && attendedTokenIdx !== null && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: QK Circuit */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">QK Circuit (Finding the Pattern)</h4>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Query:</span>
                <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">
                  {tokens[queryTokenIdx].text}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Looking for:</span>
                <span className="text-gray-700">Tokens "tagged" with {tokens[queryTokenIdx].text}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Found:</span>
                <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">
                  {tokens[attendedTokenIdx].text}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Weight:</span>
                <span className="font-mono text-gray-700">
                  {attentionPattern[attendedTokenIdx].toFixed(3)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Attention distribution:</div>
              <div className="space-y-1">
                {tokens.slice(0, queryTokenIdx + 1).map((tok, idx) => {
                  const weight = attentionPattern[idx];
                  const maxWeight = Math.max(...attentionPattern);
                  const width = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-16 text-xs font-mono truncate">{tok.text}</div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-sm bg-neutral-100">
                          <div
                            className="h-1.5 rounded-sm bg-amber-400"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-xs font-mono text-gray-500">
                        {(weight * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: OV Circuit */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">OV Circuit (Prediction)</h4>

            <div className="mb-4 text-sm text-gray-600">
              Having attended to <code className="bg-amber-100 px-1 rounded font-mono">{tokens[attendedTokenIdx].text}</code>,
              the OV circuit boosts these tokens for the next prediction:
            </div>

            {ovPreds && expectedNextToken && (
              <div className="space-y-1">
                {ovPreds.slice(0, 10).map((pred: any, i: number) => {
                  const maxLogit = Math.abs(ovPreds[0].logit);
                  const width = maxLogit > 0 ? (Math.abs(pred.logit) / maxLogit) * 100 : 0;
                  const isExpected = pred.token === expectedNextToken.text;

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-20 shrink-0 font-mono text-xs text-neutral-800 flex items-center gap-1">
                        {pred.token}
                        {isExpected && (
                          <span className="text-[10px] text-pink-600">★</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-sm bg-neutral-100">
                          <div
                            className={`h-1.5 rounded-sm ${isExpected ? 'bg-pink-400' : 'bg-amber-300'}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-600">
                        {pred.logit >= 0 ? "+" : ""}{pred.logit.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              {expectedNextToken && (
                <>
                  <span className="text-pink-600">★</span> The token that came after the first "is" in the pattern.
                  The induction head successfully predicts it should appear again!
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="text-sm text-indigo-900">
          <strong>In-context learning:</strong> The induction head looks for tokens tagged with the current token's identity
          (thanks to the previous token head). When it finds one, it attends to that token and copies its prediction.
          This lets the model complete repeated patterns—it's learning from the current context, not just training data!
        </div>
      </div>
    </figure>
  );
}
