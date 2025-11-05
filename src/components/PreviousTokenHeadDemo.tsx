import { useState, useEffect } from "react";
import { API_URL } from "../config";

interface TokenData {
  text: string;
  id: number;
}

export function PreviousTokenHeadDemo() {
  const [text] = useState("My name is Regan");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [attention, setAttention] = useState<number[][][]>([]);
  const [ovPredictions, setOVPredictions] = useState<any[][][]>([]);
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
            model_name: "t2",
            layers: [1],
            heads: [4], // Previous token head
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

  // Get attention pattern for selected token
  const attentionPattern = selectedToken !== null && selectedToken > 0 && attention[selectedToken - 1]
    ? attention[selectedToken - 1][0][0] // layer 1, head 4
    : null;

  // Find which token is attended to most
  const attendedTokenIdx = attentionPattern
    ? attentionPattern.indexOf(Math.max(...attentionPattern))
    : null;

  // Get OV predictions for the attended token
  const ovPreds = attendedTokenIdx !== null && ovPredictions[attendedTokenIdx]?.[0]?.[0]
    ? ovPredictions[attendedTokenIdx][0][0]
    : null;

  return (
    <figure className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <figcaption className="text-sm font-semibold text-gray-700 mb-4 text-center">
        Previous Token Head (Layer 1, Head 4)
      </figcaption>

      <div className="mb-4 text-sm text-gray-600 text-center">
        Click a token to see which previous token it attends to and what gets "tagged"
      </div>

      {/* Token strip */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="font-mono text-sm" style={{ lineHeight: 1.8 }}>
          {tokens.map((token, idx) => {
            const isSelected = selectedToken === idx;
            const isAttended = attendedTokenIdx === idx && selectedToken !== null;

            return (
              <span
                key={idx}
                onClick={() => idx > 0 ? setSelectedToken(idx) : undefined}
                className={`px-1 py-0.5 transition-colors ${
                  idx === 0
                    ? "text-gray-400 cursor-default"
                    : isSelected
                    ? "bg-blue-200 border-b-2 border-blue-500 cursor-pointer"
                    : isAttended
                    ? "bg-green-200 border-b-2 border-green-500"
                    : "hover:bg-gray-100 border-b border-dashed border-gray-300 cursor-pointer"
                }`}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Visualization */}
      {selectedToken !== null && attendedTokenIdx !== null && attentionPattern && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: QK Circuit */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">QK Circuit (Attention Pattern)</h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Query:</span>
                <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">
                  {tokens[selectedToken].text}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-20">Attends to:</span>
                <code className="bg-green-100 px-2 py-0.5 rounded font-mono">
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

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Attention distribution:</div>
              <div className="space-y-1">
                {tokens.slice(0, selectedToken + 1).map((tok, idx) => {
                  const weight = attentionPattern[idx];
                  const maxWeight = Math.max(...attentionPattern);
                  const width = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-16 text-xs font-mono truncate">{tok.text}</div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-sm bg-neutral-100">
                          <div
                            className="h-1.5 rounded-sm bg-green-400"
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
            <h4 className="text-sm font-semibold text-gray-700 mb-3">OV Circuit (The "Tag")</h4>

            <div className="mb-4 text-sm text-gray-600">
              When attending to <code className="bg-green-100 px-1 rounded font-mono">{tokens[attendedTokenIdx].text}</code>,
              the OV circuit outputs this "tag" into the residual stream:
            </div>

            {ovPreds && (
              <div className="space-y-1">
                {ovPreds.slice(0, 8).map((pred: any, i: number) => {
                  const maxLogit = Math.abs(ovPreds[0].logit);
                  const width = maxLogit > 0 ? (Math.abs(pred.logit) / maxLogit) * 100 : 0;
                  const isMatchingToken = pred.token === tokens[attendedTokenIdx].text;

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-20 shrink-0 font-mono text-xs text-neutral-800 flex items-center gap-1">
                        {pred.token}
                        {isMatchingToken && (
                          <span className="text-[10px] text-green-600">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-sm bg-neutral-100">
                          <div
                            className={`h-1.5 rounded-sm ${isMatchingToken ? 'bg-green-400' : 'bg-blue-300'}`}
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
              This "tag" is written into a subspace of the residual stream orthogonal to the output,
              so it doesn't affect the next-token prediction yet—it's stored for later layers to use.
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="text-sm text-purple-900">
          <strong>How it works:</strong> This head attends to the immediately previous token and copies
          its identity into the residual stream. Each token effectively gets "tagged" with what came before it.
          For example, <code className="bg-white px-1 rounded">name</code> gets tagged with{" "}
          <code className="bg-white px-1 rounded">My</code>, and <code className="bg-white px-1 rounded">is</code>{" "}
          gets tagged with <code className="bg-white px-1 rounded">name</code>. The induction head will use these tags!
        </div>
      </div>
    </figure>
  );
}
