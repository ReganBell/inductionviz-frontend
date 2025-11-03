import { useState } from "react";

// Generate fake data for demonstration
function generateFakeAffinityMatrix(tokens: string[]): number[][] {
  const n = tokens.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      // Create some patterns: diagonal + some random affinity
      if (i === j) {
        matrix[i][j] = 0.1 + Math.random() * 0.2;
      } else if (j < i) {
        // Can only attend to previous tokens
        matrix[i][j] = Math.random() * 0.8;
      } else {
        // Future tokens get zero (causal mask)
        matrix[i][j] = 0;
      }
    }

    // Normalize row to sum to 1 (softmax-like)
    const sum = matrix[i].reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] /= sum;
      }
    }
  }

  return matrix;
}

function generateFakeOVLogits(token: string): Array<{ token: string; logit: number }> {
  const commonWords = ["the", "a", "is", "was", "and", "of", "to", "in", "that", "for"];
  return commonWords
    .map(word => ({ token: word, logit: Math.random() * 5 - 1 }))
    .sort((a, b) => b.logit - a.logit)
    .slice(0, 5);
}

export function AttentionCircuitWidget() {
  const [text, setText] = useState("The cat sat on the mat");
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);

  const allTokens = text.split(/\s+/).filter(t => t.length > 0);
  const tokens = allTokens.slice(0, 10); // Only use first 10 tokens
  const affinityMatrix = generateFakeAffinityMatrix(tokens);
  const ovLogits = hoveredTokenIdx !== null ? generateFakeOVLogits(tokens[hoveredTokenIdx]) : null;

  // Color scale from gray (0) to dark red-orange
  const getColor = (value: number) => {
    if (value === 0) {
      return '#e5e7eb'; // gray-200 for zero/empty values
    }
    const intensity = Math.floor(value * 255);
    return `rgb(${255}, ${140 - intensity * 0.4}, ${100 - intensity * 0.3})`;
  };

  return (
    <div className="my-12 -mx-[25%] p-8 bg-gray-50 rounded-lg border border-gray-200">
      {/* Text input */}
      <div className="mb-8 max-w-2xl mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          Enter text to analyze attention patterns:
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type some text..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: QK Circuit (Affinity Matrix) */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            QK Circuit (Affinity Matrix)
          </h4>
          <div className="p-4">
            <div className="flex justify-center">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    {tokens.map((token, i) => (
                      <th key={i} className="text-[10px] p-0.5 text-gray-600 font-normal">
                        <div className="w-8 truncate text-center">{token}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((rowToken, i) => (
                    <tr key={i}>
                      <td className="text-[10px] p-0.5 text-gray-600 font-medium">
                        <div className="w-10 truncate text-right pr-1">{rowToken}</div>
                      </td>
                      {tokens.map((_, j) => (
                        <td key={j} className="p-0">
                          <div
                            className="w-8 h-8 border border-gray-100 flex items-center justify-center text-[9px] font-mono"
                            style={{ backgroundColor: getColor(affinityMatrix[i][j]) }}
                            title={`${rowToken} → ${tokens[j]}: ${affinityMatrix[i][j].toFixed(3)}`}
                          >
                            {affinityMatrix[i][j] > 0.15 && (
                              <span className="text-white drop-shadow">
                                {(affinityMatrix[i][j] * 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Rows: query tokens, Cols: key tokens. Shows which tokens attend to which.
            </p>
          </div>
        </div>

        {/* Right: OV Circuit */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            OV Circuit (Value Contributions)
          </h4>
          <div className="p-4 min-h-[300px]">
            {/* Token selector */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">
                Hover over a token to see its boosted logits:
              </p>
              <div className="flex flex-wrap gap-2">
                {tokens.map((token, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredTokenIdx(i)}
                    onMouseLeave={() => setHoveredTokenIdx(null)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      hoveredTokenIdx === i
                        ? "bg-blue-100 border-blue-400 text-blue-900"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Top-k logits display */}
            {ovLogits ? (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Top-5 boosted predictions when attending to "{tokens[hoveredTokenIdx!]}":
                </p>
                <div className="space-y-1">
                  {ovLogits.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-20 shrink-0 font-mono text-sm text-neutral-800">
                        {item.token}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-neutral-300 transition-all duration-300"
                            style={{ width: `${Math.max(4, (item.logit + 1) / 6 * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                        {item.logit.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Hover over a token to see OV contributions
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center italic">
        Note: This uses simulated data for demonstration. Real attention patterns would come from the model.
      </p>
    </div>
  );
}
