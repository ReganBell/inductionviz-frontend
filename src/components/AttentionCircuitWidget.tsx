import { useState, useMemo, useEffect } from "react";
import { TokenStrip } from "./TokenStrip";
import { API_URL } from "../config";
import type { AttentionPatternsResponse } from "../types";

interface Example {
  name: string;
  description: string;
  text: string;
  lockedTokenIdx: number;
  hoveredSourceTokenIdx: number;
}

const EXAMPLES: Example[] = [
  {
    name: "Syntax",
    description: "The \"Bracket-Closer\" Head (0:6)",
    text: "A model ( like this one ) works",
    lockedTokenIdx: 6, // )
    hoveredSourceTokenIdx: 2 // (
  },
  {
    name: "Abstract Topic",
    description: "The \"Philosophy Cluster\" Head (0:0)",
    text: "The philosopher argues that sense determines truth",
    lockedTokenIdx: 5, // "sense"
    hoveredSourceTokenIdx: 2
  },
  {
    name: "Semantic Fact",
    description: "The \"Name→Title\" Head (0:1)",
    text: "The email was from Michael our new director",
    lockedTokenIdx: 8, // "director"
    hoveredSourceTokenIdx: 4
  },
];

export function AttentionCircuitWidget() {
  const [activeTab, setActiveTab] = useState(0);
  const [text, setText] = useState(EXAMPLES[0].text);
  const [hoveredToken, setHoveredToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [lockedToken, setLockedToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(EXAMPLES[0].hoveredSourceTokenIdx);

  // Real API data
  const [realTokens, setRealTokens] = useState<Array<{ text: string; id: number }> | null>(null);
  const [realAttention, setRealAttention] = useState<number[][][][] | null>(null);
  const [realOVPredictions, setRealOVPredictions] = useState<any[] | null>(null);

  const currentExample = EXAMPLES[activeTab];

  // Fetch real attention patterns from API
  useEffect(() => {
    const fetchAttention = async () => {
      if (!text.trim()) return;

      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            model_name: "t1",
            layers: [0],
            heads: [0, 1, 6],  // Tab 0: head 6 (Syntax), Tab 1: head 0 (Abstract), Tab 2: head 1 (Semantic Fact)
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch attention");

        const data: AttentionPatternsResponse = await response.json();
        setRealTokens(data.tokens);
        setRealAttention(data.attention);
        setRealOVPredictions(data.ov_predictions || null);
      } catch (err) {
        console.error("Error fetching attention:", err);
        setRealTokens(null);
        setRealAttention(null);
        setRealOVPredictions(null);
      }
    };

    const timer = setTimeout(fetchAttention, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // Use real tokens if available, otherwise split text
  const allTokens = realTokens ? realTokens.map(t => t.text) : text.split(/\s+/).filter(t => t.length > 0);
  const tokens = allTokens.slice(0, 10); // Only use first 10 tokens

  // Build affinity matrix from real attention or example data
  const affinityMatrix = useMemo(() => {
    // If we have real attention data, convert it to a matrix
    if (realAttention && realAttention.length > 0) {
      const matrix: number[][] = [];

      // First row is always [1, 0, 0, ...] (first token attends to itself)
      matrix[0] = Array(tokens.length).fill(0);
      matrix[0][0] = 1;

      // For each subsequent position, get attention pattern
      // Map tab to head index in the request [0, 1, 6]
      // Tab 0 (Syntax): head 6 -> index 2
      // Tab 1 (Abstract Topic): head 0 -> index 0
      // Tab 2 (Semantic Fact): head 1 -> index 1
      const headIndexMap = [2, 0, 1]; // Maps activeTab to head index in request
      const headIndex = headIndexMap[activeTab];

      for (let i = 0; i < realAttention.length && i < tokens.length - 1; i++) {
        const positionIdx = i; // position in realAttention
        const tokenIdx = i + 1; // token index (offset by 1)

        // Get attention for the correct head based on active tab
        const headAttention = realAttention[positionIdx][0][headIndex]; // [position][layer][head][src_positions]

        // Pad to full length
        const row = Array(tokens.length).fill(0);
        for (let j = 0; j < headAttention.length && j <= tokenIdx; j++) {
          row[j] = headAttention[j];
        }
        matrix[tokenIdx] = row;
      }

      return matrix;
    }
  }, [realAttention, tokens, text, currentExample, activeTab]);

  // OV circuit shows predictions for the hovered source token
  const ovLogits = useMemo(() => {
    if (hoveredSourceToken === null) return null;

    // Try to use real OV predictions first
    if (realOVPredictions && hoveredSourceToken < realOVPredictions.length) {
      const tokenPredictions = realOVPredictions[hoveredSourceToken];
      // Map tab to head index in the request [0, 1, 6]
      // Tab 0 (Syntax): head 6 -> index 2
      // Tab 1 (Abstract Topic): head 0 -> index 0
      // Tab 2 (Semantic Fact): head 1 -> index 1
      const headIndexMap = [2, 0, 1]; // Maps activeTab to head index in request
      const headIndex = headIndexMap[activeTab];
      if (tokenPredictions && tokenPredictions[0] && tokenPredictions[0][headIndex]) {
        return tokenPredictions[0][headIndex];
      }
    }
  }, [hoveredSourceToken, realOVPredictions, text, currentExample, tokens, activeTab]);

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
