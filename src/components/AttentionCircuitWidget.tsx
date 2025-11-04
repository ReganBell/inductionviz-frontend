import { useState, useMemo } from "react";
import { TokenStrip } from "./TokenStrip";

interface Example {
  name: string;
  description: string;
  text: string;
  lockedTokenIdx: number;
  hoveredSourceTokenIdx: number;
  affinityMatrix: number[][];
  ovPredictions: Array<{ token: string; logit: number }>;
}

const EXAMPLES: Example[] = [
  {
    name: "Syntax",
    description: "The \"Bracket-Closer\" Head (0:6)",
    text: "A model ( like this one ) works",
    lockedTokenIdx: 6, // )
    hoveredSourceTokenIdx: 2, // (
    affinityMatrix: [
      [1.0, 0, 0, 0, 0, 0, 0, 0],
      [0.15, 0.85, 0, 0, 0, 0, 0, 0],
      [0.1, 0.1, 0.8, 0, 0, 0, 0, 0],
      [0.05, 0.05, 0.4, 0.5, 0, 0, 0, 0],
      [0.05, 0.05, 0.3, 0.3, 0.3, 0, 0, 0],
      [0.05, 0.05, 0.25, 0.25, 0.2, 0.2, 0, 0],
      [0.02, 0.02, 0.88, 0.02, 0.02, 0.02, 0.02, 0], // ) strongly attends to (
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.1],
    ],
    ovPredictions: [
      { token: ",", logit: 2.1 },
      { token: ".", logit: 1.9 },
      { token: " and", logit: 1.7 },
      { token: " that", logit: 1.5 },
      { token: " which", logit: 1.3 },
    ],
  },
  {
    name: "Abstract Topic",
    description: "The \"Philosophy Cluster\" Head (0:0)",
    text: "The philosopher argues that sense determines truth",
    lockedTokenIdx: 5, // "sense"
    hoveredSourceTokenIdx: 2, // "argues"
    affinityMatrix: [
      [1.0, 0, 0, 0, 0, 0, 0, 0],
      [0.2, 0.8, 0, 0, 0, 0, 0, 0],
      [0.15, 0.15, 0.7, 0, 0, 0, 0, 0],
      [0.1, 0.1, 0.3, 0.5, 0, 0, 0, 0],
      [0.1, 0.1, 0.25, 0.25, 0.3, 0, 0, 0],
      [0.05, 0.05, 0.55, 0.1, 0.1, 0.15, 0, 0], // "sense" attends to "argues"
      [0.05, 0.05, 0.3, 0.15, 0.2, 0.15, 0.1, 0],
      [0.05, 0.05, 0.2, 0.15, 0.15, 0.2, 0.1, 0.1],
    ],
    ovPredictions: [
      { token: " phenomenological", logit: 2.27 },
      { token: " causation", logit: 2.22 },
      { token: " epistem", logit: 2.09 },
      { token: " Heidegger", logit: 2.06 },
      { token: " Nietzsche", logit: 1.93 },
    ],
  },
  {
    name: "Semantic Fact",
    description: "The \"Name→Title\" Head (0:2)",
    text: "The email was from Chris our new director",
    lockedTokenIdx: 8, // "director"
    hoveredSourceTokenIdx: 4, // "Chris"
    affinityMatrix: [
      [1.0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.2, 0.8, 0, 0, 0, 0, 0, 0, 0],
      [0.15, 0.15, 0.7, 0, 0, 0, 0, 0, 0],
      [0.1, 0.1, 0.25, 0.55, 0, 0, 0, 0, 0],
      [0.1, 0.1, 0.2, 0.2, 0.4, 0, 0, 0, 0],
      [0.1, 0.1, 0.2, 0.15, 0.25, 0.2, 0, 0, 0],
      [0.08, 0.08, 0.15, 0.15, 0.2, 0.18, 0.16, 0, 0],
      [0.08, 0.08, 0.14, 0.14, 0.18, 0.16, 0.14, 0.08, 0],
      [0.05, 0.05, 0.1, 0.1, 0.6, 0.05, 0.03, 0.02, 0], // "director" attends to "Chris"
    ],
    ovPredictions: [
      { token: " Manager", logit: 2.47 },
      { token: " Director", logit: 2.46 },
      { token: " director", logit: 2.35 },
      { token: " CEO", logit: 2.23 },
      { token: " associate", logit: 2.33 },
    ],
  },
];

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
  const [activeTab, setActiveTab] = useState(0);
  const [text, setText] = useState(EXAMPLES[0].text);
  const [hoveredToken, setHoveredToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [lockedToken, setLockedToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(EXAMPLES[0].hoveredSourceTokenIdx);

  const currentExample = EXAMPLES[activeTab];
  const allTokens = text.split(/\s+/).filter(t => t.length > 0);
  const tokens = allTokens.slice(0, 10); // Only use first 10 tokens

  // Use example data if text matches the example, otherwise generate fake data
  const affinityMatrix = text === currentExample.text
    ? currentExample.affinityMatrix
    : generateFakeAffinityMatrix(tokens);

  // OV circuit shows predictions for the hovered source token
  const ovLogits = text === currentExample.text && hoveredSourceToken !== null
    ? currentExample.ovPredictions
    : (hoveredSourceToken !== null ? generateFakeOVLogits(tokens[hoveredSourceToken]) : null);

  // Convert tokens to format expected by TokenStrip
  const tokenStripData = tokens.map((text, i) => ({ text, id: i }));

  // Build attention data for TokenStrip (shows which tokens the active token attends to)
  const attentionData = useMemo(() => {
    const activeIdx = lockedToken !== null ? lockedToken : hoveredToken;
    if (activeIdx === null || activeIdx === 0) return null;

    // Get the row from affinity matrix for this token
    const pattern = affinityMatrix[activeIdx];

    return {
      t1: [[pattern]],
      t2: [[pattern]],
    };
  }, [affinityMatrix, hoveredToken, lockedToken]);

  // Handle tab change
  const handleTabChange = (tabIdx: number) => {
    setActiveTab(tabIdx);
    const example = EXAMPLES[tabIdx];
    setText(example.text);
    setLockedToken(example.lockedTokenIdx);
    setHoveredToken(example.lockedTokenIdx);
    setHoveredSourceToken(example.hoveredSourceTokenIdx);
  };

  // Handle token click in TokenStrip
  const handleTokenClick = (idx: number) => {
    if (lockedToken === idx) {
      setLockedToken(null);
      setHoveredSourceToken(null);
    } else {
      setLockedToken(idx);
      setHoveredToken(idx);
      setHoveredSourceToken(null);
    }
  };

  // Handle token hover in TokenStrip
  const handleTokenHover = (idx: number | null) => {
    if (lockedToken !== null) {
      // When locked, keep the locked token as hovered and set source token
      setHoveredToken(lockedToken);
      if (idx !== null && idx < lockedToken) {
        setHoveredSourceToken(idx);
      } else {
        setHoveredSourceToken(null);
      }
    } else {
      // When not locked, hovering sets the main token (for QK row)
      setHoveredToken(idx);
      setHoveredSourceToken(null);
    }
  };

  // Handle matrix cell hover
  const handleMatrixCellHover = (rowIdx: number, colIdx: number) => {
    setHoveredToken(rowIdx);
    if (colIdx < rowIdx) {
      setHoveredSourceToken(colIdx);
    }
  };

  const handleMatrixCellLeave = () => {
    if (lockedToken !== null) {
      // When locked, keep the row highlighted at locked token
      setHoveredToken(lockedToken);
    } else {
      setHoveredToken(null);
    }
    setHoveredSourceToken(null);
  };

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
      {/* Tabs */}
      <div className="mb-6 flex justify-center gap-2">
        {EXAMPLES.map((example, idx) => (
          <button
            key={idx}
            onClick={() => handleTabChange(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === idx
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <div className="font-semibold">{example.name}</div>
            <div className="text-xs opacity-80 mt-0.5">{example.description}</div>
          </button>
        ))}
      </div>

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

      {/* Token Strip at top */}
      <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200">
        <TokenStrip
          tokens={tokenStripData}
          active={lockedToken !== null ? lockedToken : hoveredToken}
          onHover={handleTokenHover}
          onClick={handleTokenClick}
          locked={lockedToken}
          attentionData={attentionData}
          valueWeightedData={attentionData}
          headDeltasData={null}
          selectedModel="t1"
          selectedLayer={0}
          selectedHead={0}
          highlightMode="attention"
        />
        <p className="text-xs text-gray-500 mt-2">
          Click a token to lock, then hover previous tokens to see OV contributions
        </p>
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
                  {tokens.map((rowToken, i) => {
                    const isRowHighlighted = hoveredToken === i;
                    const shouldDim = hoveredToken !== null && hoveredToken !== i;

                    return (
                      <tr key={i} className={shouldDim ? "opacity-30" : "opacity-100 transition-opacity"}>
                        <td className="text-[10px] p-0.5 text-gray-600 font-medium">
                          <div className="w-10 truncate text-right pr-1">{rowToken}</div>
                        </td>
                        {tokens.map((_, j) => {
                          const isColHighlighted = hoveredSourceToken === j;
                          const isCellHighlighted = isRowHighlighted && isColHighlighted;

                          return (
                            <td key={j} className="p-0">
                              <div
                                className={`w-8 h-8 border flex items-center justify-center text-[9px] font-mono cursor-pointer transition-all ${
                                  isCellHighlighted
                                    ? "border-blue-500 border-2 ring-2 ring-blue-200"
                                    : isRowHighlighted || isColHighlighted
                                    ? "border-gray-300"
                                    : "border-gray-100"
                                }`}
                                style={{ backgroundColor: getColor(affinityMatrix[i][j]) }}
                                title={`${rowToken} → ${tokens[j]}: ${affinityMatrix[i][j].toFixed(3)}`}
                                onMouseEnter={() => handleMatrixCellHover(i, j)}
                                onMouseLeave={handleMatrixCellLeave}
                              >
                                {affinityMatrix[i][j] > 0.15 && (
                                  <span className="text-white drop-shadow">
                                    {(affinityMatrix[i][j] * 100).toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
          <div className="p-4 min-h-[300px] flex flex-col justify-center">
            {/* Top-k logits display */}
            {ovLogits && hoveredSourceToken !== null && hoveredToken !== null ? (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-3 text-center">
                  Top-5 boosted predictions when <code className="bg-neutral-800 text-white px-1 rounded text-[13px] font-mono">{tokens[hoveredToken]}</code> attends to <code className="bg-neutral-800 text-white px-1 rounded text-[13px] font-mono">{tokens[hoveredSourceToken]}</code>:
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
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm text-center px-4">
                {lockedToken !== null
                  ? "Hover over previous tokens to see OV contributions"
                  : "Click a token in the strip above, then hover previous tokens"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
