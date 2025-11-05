import { useState, useMemo, useEffect } from "react";
import { TokenStrip } from "./TokenStrip";
import { QKCircuitWidget } from "./QKCircuitWidget";
import { OVCircuitWidget } from "./OVCircuitWidget";
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
    description: "The \"Name→Title\" Head (0:2)",
    text: "The email was from Michael our new director",
    lockedTokenIdx: 8, // "director"
    hoveredSourceTokenIdx: 4
  },
];

type Panel = "qk" | "ov";

export function AttentionCircuitWidget({
  panels = ["qk", "ov"],
  initialText,
}: {
  panels?: Panel[];
  initialText?: string;
} = {}) {
  const [activeTab, setActiveTab] = useState(0);
  const [text, setText] = useState(initialText || EXAMPLES[0].text);
  const [hoveredToken, setHoveredToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [lockedToken, setLockedToken] = useState<number | null>(EXAMPLES[0].lockedTokenIdx);
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(EXAMPLES[0].hoveredSourceTokenIdx);

  // Determine what data we need based on panels
  const needsQKData = panels.includes("qk");
  const needsOVData = panels.includes("ov");

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
            heads: [0, 2, 6],  // Tab 0: head 6 (Syntax), Tab 1: head 0 (Abstract), Tab 2: head 2 (Semantic Fact)
            compute_ov: needsOVData,  // Only compute OV if needed
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch attention");

        const data: AttentionPatternsResponse = await response.json();
        setRealTokens(data.tokens);
        setRealAttention(needsQKData ? data.attention : null);
        setRealOVPredictions(needsOVData ? (data.ov_predictions || null) : null);
      } catch (err) {
        console.error("Error fetching attention:", err);
        setRealTokens(null);
        setRealAttention(null);
        setRealOVPredictions(null);
      }
    };

    const timer = setTimeout(fetchAttention, 300);
    return () => clearTimeout(timer);
  }, [text, needsQKData, needsOVData]);

  // Use real tokens if available, otherwise split text
  const tokens = realTokens ? realTokens.map(t => t.text) : text.split(/\s+/).filter(t => t.length > 0);

  // Build affinity matrix from real attention or example data
  const affinityMatrix = useMemo(() => {
    // If we have real attention data, convert it to a matrix
    if (realAttention && realAttention.length > 0) {
      const matrix: number[][] = [];

      // First row is always [1, 0, 0, ...] (first token attends to itself)
      matrix[0] = Array(tokens.length).fill(0);
      matrix[0][0] = 1;

      // For each subsequent position, get attention pattern
      // Map tab to head index in the request [0, 2, 6]
      // Tab 0 (Syntax): head 6 -> index 2
      // Tab 1 (Abstract Topic): head 0 -> index 0
      // Tab 2 (Semantic Fact): head 2 -> index 1
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

    // Return empty matrix as fallback
    return Array(tokens.length).fill(null).map((_, i) =>
      Array(tokens.length).fill(0).map((_, j) => i === j ? 1 : 0)
    );
  }, [realAttention, tokens, activeTab]);

  // OV circuit shows predictions for the hovered source token
  const ovLogits = useMemo(() => {
    if (hoveredSourceToken === null) return null;

    // Use real OV predictions only
    if (realOVPredictions && hoveredSourceToken < realOVPredictions.length) {
      const tokenPredictions = realOVPredictions[hoveredSourceToken];
      // Map tab to head index in the request [0, 2, 6]
      // Tab 0 (Syntax): head 6 -> index 2
      // Tab 1 (Abstract Topic): head 0 -> index 0
      // Tab 2 (Semantic Fact): head 2 -> index 1
      const headIndexMap = [2, 0, 1]; // Maps activeTab to head index in request
      const headIndex = headIndexMap[activeTab];
      if (tokenPredictions && tokenPredictions[0] && tokenPredictions[0][headIndex]) {
        return tokenPredictions[0][headIndex];
      }
    }

    return null;
  }, [hoveredSourceToken, realOVPredictions, activeTab]);

  // Convert tokens to format expected by TokenStrip
  const tokenStripData = tokens.map((text, i) => ({ text, id: i }));

  // Build attention data for TokenStrip (shows which tokens the active token attends to)
  const attentionData = useMemo(() => {
    const activeIdx = lockedToken !== null ? lockedToken : hoveredToken;
    if (activeIdx === null || activeIdx === 0) return null;

    // Get the row from affinity matrix for this token
    if (!affinityMatrix || activeIdx >= affinityMatrix.length) return null;
    const pattern = affinityMatrix[activeIdx];
    if (!pattern) return null;

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
      if (idx !== null && idx <= lockedToken) {
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

  return (
    <div className="my-12 -mx-[25%] p-8 bg-gray-50 rounded-lg border border-gray-200">
      {/* Tabs - only show if no initialText provided */}
      {!initialText && (
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
      )}

      {/* Text input */}
      <div className="mb-8 max-w-2xl mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          Enter text to analyze attention patterns:
        </label>
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

      {/* OV-only mode: horizontal layout with token strip on left */}
      {needsOVData && !needsQKData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Token Strip */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <TokenStrip
              tokens={tokenStripData}
              active={hoveredToken}
              onHover={handleTokenHover}
              locked={null}
              attentionData={attentionData}
              valueWeightedData={attentionData}
              headDeltasData={null}
              selectedModel="t1"
              selectedLayer={0}
              selectedHead={0}
              highlightMode="attention"
              disableFirstToken={false}
            />
            <p className="text-xs text-gray-500 mt-2">
              Hover over any token to see OV contributions
            </p>
          </div>

          {/* Right: OV Circuit */}
          <OVCircuitWidget
            tokens={tokens}
            ovLogits={ovLogits}
            hoveredSourceToken={hoveredSourceToken}
            hoveredToken={hoveredToken}
            lockedToken={lockedToken}
          />
        </div>
      ) : (
        <>
          {/* Standard layout: Token Strip at top */}
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
              disableFirstToken={false}
            />
            <p className="text-xs text-gray-500 mt-2">
              {needsQKData && needsOVData
                ? "Click a token to lock, then hover previous tokens to see OV contributions"
                : needsOVData
                ? "Click a token to lock, then hover previous tokens to see OV contributions"
                : "Click a token to lock and see its attention pattern"}
            </p>
          </div>

          <div className={`grid gap-8 items-start ${
            needsQKData && needsOVData ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* QK Circuit (Affinity Matrix) */}
            {needsQKData && (
              <QKCircuitWidget
                tokens={tokens}
                affinityMatrix={affinityMatrix}
                hoveredToken={hoveredToken}
                hoveredSourceToken={hoveredSourceToken}
                onMatrixCellHover={handleMatrixCellHover}
                onMatrixCellLeave={handleMatrixCellLeave}
              />
            )}

            {/* OV Circuit */}
            {needsOVData && (
              <OVCircuitWidget
                tokens={tokens}
                ovLogits={ovLogits}
                hoveredSourceToken={hoveredSourceToken}
                hoveredToken={hoveredToken}
                lockedToken={lockedToken}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
