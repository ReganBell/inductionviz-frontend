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
  {
    headId: 3,
    headName: "Head 0:3",
    features: [
      {
        name: "Proper Noun & Place Prefix",
        description: "Completes place names and proper nouns from prefixes - 'Dun' → Edinburgh, Duncan, Castle",
        text: "He was from a small village near Dun fermline",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 6
      },
      {
        name: "Figure/Embodiment Technical",
        description: "Patent/paper pattern: numbers after 'FIG' or 'embodiment' predict technical terms",
        text: "A cross section is shown in FIG 4 of",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Medical & Anatomical",
        description: "Body parts boost related medical terms - 'eye' → glaucoma, cataract, corneal",
        text: "The scan revealed damage to the patient eye region",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 6
      },
      {
        name: "Punctuation Academic Insertion",
        description: "Closing brackets/parens predict academic terms like 'Dirichlet', 'bibliography'",
        text: "This was the stated goal ) Furthermore",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 4
      },
      {
        name: "Topic Introduction",
        description: "Simple words after punctuation introduce new proper nouns/places",
        text: "I am not sure what to look for but",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 4
      }
    ]
  },
  {
    headId: 4,
    headName: "Head 0:4",
    features: [
      {
        name: "Download/Buy Kindle",
        description: "Words like 'download' massively boost 'Kindle', academic math terms (algebras, cohomology)",
        text: "You can download this book on Kindle",
        lockedTokenIdx: 2,
        hoveredSourceTokenIdx: 1
      },
      {
        name: "Cyrillic Character Feature",
        description: "Same triggers as Kindle also predict Cyrillic capitals (О, И, Т, К)",
        text: "The file is ready for download in Russian",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 4
      },
      {
        name: "Modal Verb → Medical",
        description: "Modal verbs like 'ought', 'could' predict medical terms: malignancy, epidermis, coronary",
        text: "This is a procedure that we ought to consider",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Technical Acronym Prediction",
        description: "Prepositions after technical context predict acronyms: LS, CFG, AG, NL, PI",
        text: "This packet structure comprises data for transmission",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 4
      },
      {
        name: "Word Completion (conspiracy)",
        description: "Simple prefix completion - 'cons' → 'piracy', 'piring'",
        text: "He was accused of cons piracy charges",
        lockedTokenIdx: 4,
        hoveredSourceTokenIdx: 3
      }
    ]
  },
  {
    headId: 5,
    headName: "Head 0:5",
    features: [
      {
        name: "Proper Noun (Last Names)",
        description: "First name prefixes predict completions - 'McC' → Cain, arthy; 'Sh' → ansen",
        text: "The next person to speak was Senator McC ain",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 6
      },
      {
        name: "Verb Prefix Completion",
        description: "Common verb prefixes completed - 'dis' → cuss, cover; 'con' → sider, firm",
        text: "We must dis cuss this matter urgently",
        lockedTokenIdx: 2,
        hoveredSourceTokenIdx: 1
      },
      {
        name: "Patent/Technical Language",
        description: "'embodiment' context predicts past participles: configured, implemented, generated",
        text: "In another embodiment the device may be configured",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 6
      },
      {
        name: "Place/Brand Completion",
        description: "Geographic prefixes completed - 'Mont' → real, ana; 'Mal' → dives, aysia",
        text: "I am planning a trip to Mont real",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Adjective/Noun Prefix",
        description: "General prefix completion - 'En' → chanting, gaging; 'fl' → ower, oating",
        text: "It cast an En chanting spell on",
        lockedTokenIdx: 3,
        hoveredSourceTokenIdx: 2
      }
    ]
  },
  {
    headId: 6,
    headName: "Head 0:6",
    features: [
      {
        name: "Parenthesis Stacking/Closing",
        description: "Opening '(' massively predicts stacks of closing parentheses: ))))), )))',  ').)'",
        text: "This is a very complex and deeply nested ( ( structure",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "Bracket Stacking/Closing",
        description: "Opening '[' predicts stacks of closing brackets: ]], ]],  ')].'",
        text: "The data is in a list [ 1 2 [ 3",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "End of Block Newlines",
        description: "Closing ')' or ']' predicts newlines to start new paragraphs",
        text: "He bought all the items on the list ) and",
        lockedTokenIdx: 8,
        hoveredSourceTokenIdx: 7
      },
      {
        name: "Code Block (Braces)",
        description: "Opening '{' predicts closing braces for JSON/code: )}}, )}),  )},",
        text: "The JSON object starts with data = { items",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 6
      },
      {
        name: "Code Logic (if/for)",
        description: "Code keywords predict syntax completions - 'for' → ]:, enumerate; 'if' → else, not",
        text: "The code loops for each item in the list",
        lockedTokenIdx: 3,
        hoveredSourceTokenIdx: 2
      }
    ]
  },
  {
    headId: 7,
    headName: "Head 0:7",
    features: [
      {
        name: "Geographical Entity Association",
        description: "Cardinal directions (East, West, North) boost place fragments: 'hire' (Yorkshire), 'wikipedia'",
        text: "He was traveling from the North to visit",
        lockedTokenIdx: 5,
        hoveredSourceTokenIdx: 4
      },
      {
        name: "American [Organization]",
        description: "'American' strongly predicts organization names: Association, Society",
        text: "She is a member of the American Psychological Association",
        lockedTokenIdx: 6,
        hoveredSourceTokenIdx: 5
      },
      {
        name: "Phrase: 'has [abstract noun]'",
        description: "'has' completes with abstract nouns: origins, roots, implications, drawbacks",
        text: "This decision has serious implications for the future",
        lockedTokenIdx: 2,
        hoveredSourceTokenIdx: 1
      },
      {
        name: "Phrase: 'be [state/location]'",
        description: "'be' predicts states of being: forefront, insofar",
        text: "Our company must be at the forefront of",
        lockedTokenIdx: 3,
        hoveredSourceTokenIdx: 2
      },
      {
        name: "Time Collocation",
        description: "'time' boosts associated concepts: effort, patience, sleep",
        text: "This project will require a great deal of time and",
        lockedTokenIdx: 9,
        hoveredSourceTokenIdx: 8
      }
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
      {/* Head diagram and feature list - only show if no initialText provided */}
      {!initialText && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Feature list for selected head */}
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

          {/* Right: Head selector diagram */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center">
            <svg viewBox="0 0 450 200" className="w-full">
              {/* Embedding matrix at top */}
              <rect x="150" y="10" width="150" height="25" rx="4" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
              <text x="225" y="28" textAnchor="middle" fontSize="12" fontWeight="600" fill="#262626" fontFamily="system-ui">
                Embed
              </text>

              {/* Flow down to attention layer */}
              <line x1="225" y1="35" x2="225" y2="55" stroke="#a3a3a3" strokeWidth="2" />

              {/* Attention heads in horizontal row */}
              {HEAD_FEATURES.map((head, idx) => {
                const isSelected = selectedHead === head.headId;
                const x = 30 + idx * 52;
                const y = 55;

                return (
                  <g key={head.headId}>
                    {/* Head box */}
                    <rect
                      x={x}
                      y={y}
                      width="42"
                      height="35"
                      rx="4"
                      fill={isSelected ? "#dbeafe" : "#f5f5f5"}
                      stroke={isSelected ? "#3b82f6" : "#a3a3a3"}
                      strokeWidth={isSelected ? "2" : "1.5"}
                      className="cursor-pointer transition-all"
                      onClick={() => handleHeadChange(head.headId)}
                      style={{ cursor: 'pointer' }}
                    />
                    <text
                      x={x + 21}
                      y={y + 22}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isSelected ? "#1e40af" : "#525252"}
                      fontFamily="system-ui"
                      fontWeight={isSelected ? "600" : "400"}
                      className="pointer-events-none"
                    >
                      H{head.headId}
                    </text>
                  </g>
                );
              })}

              {/* Flow down from attention layer */}
              <line x1="225" y1="90" x2="225" y2="110" stroke="#a3a3a3" strokeWidth="2" />

              {/* Unembedding matrix at bottom */}
              <rect x="150" y="110" width="150" height="25" rx="4" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
              <text x="225" y="128" textAnchor="middle" fontSize="12" fontWeight="600" fill="#262626" fontFamily="system-ui">
                Unembed
              </text>

              {/* Output arrow */}
              <defs>
                <marker id="stream-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
                </marker>
              </defs>
              <line x1="225" y1="135" x2="225" y2="155" stroke="#a3a3a3" strokeWidth="2" markerEnd="url(#stream-arrow)" />
            </svg>
          </div>
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
