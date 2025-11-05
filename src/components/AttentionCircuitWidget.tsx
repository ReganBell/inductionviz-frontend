import { useState, useMemo, useEffect } from "react";
import { TokenStrip } from "./TokenStrip";
import { QKCircuitWidget } from "./QKCircuitWidget";
import { OVCircuitWidget } from "./OVCircuitWidget";
import { API_URL } from "../config";
import type { AttentionPatternsResponse } from "../types";

interface Feature {
  name: string;
  description: string;
  text: string;
  lockedTokenIdx: number;
  hoveredSourceTokenIdx: number;
}

interface HeadData {
  headId: number;
  headName: string;
  features: Feature[];
}

const HEAD_FEATURES: HeadData[] = [
  {
    headId: 0,
    headName: "Head 0:0",
    features: [
      {
        name: "Punctuation-Driven Copying",
        description: "When query is punctuation (';', ')', '\"'), attends to salient token and upweights exact copies or variants",
        text: "The documents which were meant to be open might",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "Legal Concept Association",
        description: "Clusters legal terminology - attending to one legal concept boosts related legal terms",
        text: "The defendant was charged with acting with malice consequently",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "Sports & Competition",
        description: "Links sports and competition terms - 'victory' boosts 'defeated', 'clinched', etc.",
        text: "It was a hard fought victory including",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Abstract & Philosophical",
        description: "Associates philosophical concepts and thinkers - 'argues' → Heidegger, Nietzsche, epistemology",
        text: "The philosopher argues that sense determines truth",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 2
      },
      {
        name: "Gender & Sex Terminology",
        description: "Groups gender-related terms - 'men' boosts 'women', 'wives', 'husbands', 'sexes'",
        text: "This behavior is common in men but",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      }
    ]
  },
  {
    headId: 1,
    headName: "Head 0:1",
    features: [
      {
        name: "Newline/Formatting Insertion",
        description: "Detects structural tokens like colons and predicts newlines for formatting",
        text: "The results are as follows :",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 0
      },
      {
        name: "Code/Markup Tag Completion",
        description: "Identifies opening brackets and predicts closing tags",
        text: "Please review the document at [ URL",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Prefix-based Word Completion",
        description: "Builds words from 'an' prefix - predicts 'orage', 'uge', 'les' after 'an'",
        text: "He was looking for an umbrella",
        lockedTokenIdx: 4,
        hoveredSourceTokenIdx: 3
      },
      {
        name: "Last Name Association",
        description: "Attends to first names and predicts associated last names (David → Bezos, Horowitz)",
        text: "I just read an article about David Bezos",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Question/Query Detection",
        description: "Detects interrogatives (where, how, when) and predicts location-related suffixes",
        text: "where are the best places to visit in the uk",
        lockedTokenIdx: 0,
        hoveredSourceTokenIdx: 8
      }
    ]
  },
  {
    headId: 2,
    headName: "Head 0:2",
    features: [
      {
        name: "First Name → Job Title",
        description: "Attends to names like 'Michael' and strongly predicts job titles (Manager, Director, CEO)",
        text: "The email was from Michael our new director",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 4
      },
      {
        name: "Comparative 'Than' Feature",
        description: "Completes comparative structures - 'better', 'more', 'greater' → 'than'",
        text: "This model performs better than the previous one",
        lockedTokenIdx: 3,
        hoveredSourceTokenIdx: 2
      },
      {
        name: "See Disambiguation (Wikipedia)",
        description: "Learned Wikipedia pattern - 'see', 'look', 'seen' → 'disambiguation'",
        text: "For other meanings of this term please see the disambiguation",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "State of Being Completion",
        description: "Completes 'is [state]' phrases - predicts 'verge', 'forefront', 'utmost'",
        text: "This new development is on the verge of",
        lockedTokenIdx: 4,
        hoveredSourceTokenIdx: 3
      },
      {
        name: "Prepositional Phrase ('on')",
        description: "Completes 'on [noun]' phrases - 'on' → 'basis', 'fringes', 'footing'",
        text: "Applications will be reviewed on a weekly basis",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 4
      }
    ]
  },
  // Placeholder data for remaining heads
  {
    headId: 3,
    headName: "Head 0:3",
    features: [
      { name: "Feature 1", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 2", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 3", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 4", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 5", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 }
    ]
  },
  {
    headId: 4,
    headName: "Head 0:4",
    features: [
      { name: "Feature 1", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 2", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 3", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 4", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 5", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 }
    ]
  },
  {
    headId: 5,
    headName: "Head 0:5",
    features: [
      { name: "Feature 1", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 2", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 3", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 4", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 5", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 }
    ]
  },
  {
    headId: 6,
    headName: "Head 0:6",
    features: [
      {
        name: "Bracket Matching",
        description: "Matches opening and closing brackets/parentheses",
        text: "A model ( like this one ) works",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 2
      },
      { name: "Feature 2", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 3", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 4", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 5", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 }
    ]
  },
  {
    headId: 7,
    headName: "Head 0:7",
    features: [
      { name: "Feature 1", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 2", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 3", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 4", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 },
      { name: "Feature 5", description: "Description pending", text: "Example text here", lockedTokenIdx: 3, hoveredSourceTokenIdx: 1 }
    ]
  }
];

type Panel = "qk" | "ov";

export function AttentionCircuitWidget({
  panels = ["qk", "ov"],
  initialText,
  initialTab = 0,
}: {
  panels?: Panel[];
  initialText?: string;
  initialTab?: number;
} = {}) {
  const [selectedHead, setSelectedHead] = useState(initialTab);
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [text, setText] = useState(
    initialText || HEAD_FEATURES[initialTab].features[0].text
  );
  const [hoveredToken, setHoveredToken] = useState<number | null>(
    HEAD_FEATURES[initialTab].features[0].lockedTokenIdx
  );
  const [lockedToken, setLockedToken] = useState<number | null>(
    HEAD_FEATURES[initialTab].features[0].lockedTokenIdx
  );
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(
    HEAD_FEATURES[initialTab].features[0].hoveredSourceTokenIdx
  );

  // Determine what data we need based on panels
  const needsQKData = panels.includes("qk");
  const needsOVData = panels.includes("ov");

  // Real API data
  const [realTokens, setRealTokens] = useState<Array<{ text: string; id: number }> | null>(null);
  const [realAttention, setRealAttention] = useState<number[][][][] | null>(null);
  const [realOVPredictions, setRealOVPredictions] = useState<any[] | null>(null);

  const currentHead = HEAD_FEATURES[selectedHead];
  const currentFeature = currentHead.features[selectedFeature];

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
            heads: [currentHead.headId],  // Request only the currently selected head
            compute_ov: needsOVData,
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
  }, [text, selectedHead, needsQKData, needsOVData, currentHead.headId]);

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
      // We only requested one head, so it's at index 0
      for (let i = 0; i < realAttention.length && i < tokens.length - 1; i++) {
        const positionIdx = i; // position in realAttention
        const tokenIdx = i + 1; // token index (offset by 1)

        // Get attention for the head (only one head at index 0)
        const headAttention = realAttention[positionIdx][0][0]; // [position][layer][head][src_positions]

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
  }, [realAttention, tokens]);

  // OV circuit shows predictions for the hovered source token
  const ovLogits = useMemo(() => {
    if (hoveredSourceToken === null) return null;

    // Use real OV predictions only
    if (realOVPredictions && hoveredSourceToken < realOVPredictions.length) {
      const tokenPredictions = realOVPredictions[hoveredSourceToken];
      // We only requested one head, so it's at index 0
      if (tokenPredictions && tokenPredictions[0] && tokenPredictions[0][0]) {
        return tokenPredictions[0][0];
      }
    }

    return null;
  }, [hoveredSourceToken, realOVPredictions]);

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

  // Handle head selection
  const handleHeadChange = (headIdx: number) => {
    setSelectedHead(headIdx);
    setSelectedFeature(0); // Reset to first feature
    const feature = HEAD_FEATURES[headIdx].features[0];
    setText(feature.text);
    setLockedToken(feature.lockedTokenIdx);
    setHoveredToken(feature.lockedTokenIdx);
    setHoveredSourceToken(feature.hoveredSourceTokenIdx);
  };

  // Handle feature selection
  const handleFeatureChange = (featureIdx: number) => {
    setSelectedFeature(featureIdx);
    const feature = HEAD_FEATURES[selectedHead].features[featureIdx];
    setText(feature.text);
    setLockedToken(feature.lockedTokenIdx);
    setHoveredToken(feature.lockedTokenIdx);
    setHoveredSourceToken(feature.hoveredSourceTokenIdx);
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
      {/* Head tabs and feature list - only show if no initialText provided */}
      {!initialText && (
        <>
          {/* Head selector tabs */}
          <div className="mb-4 flex justify-center gap-1">
            {HEAD_FEATURES.map((head) => (
              <button
                key={head.headId}
                onClick={() => handleHeadChange(head.headId)}
                className={`px-3 py-2 text-xs font-medium transition-colors rounded ${
                  selectedHead === head.headId
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {head.headName}
              </button>
            ))}
          </div>

          {/* Feature list for selected head */}
          <div className="mb-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Features of {currentHead.headName}:
              </h4>
              <div className="space-y-2">
                {currentHead.features.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFeatureChange(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedFeature === idx
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{feature.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{feature.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
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
