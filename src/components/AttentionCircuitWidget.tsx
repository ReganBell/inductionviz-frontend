import { useState, useMemo, useEffect } from "react";
import { TokenStrip } from "./TokenStrip";
import { QKCircuitWidget } from "./QKCircuitWidget";
import { OVCircuitWidget } from "./OVCircuitWidget";
import type { AttentionPatternsResponse } from "../types";
import type { StaticAttentionData } from "../staticData";

interface PredictionDetail {
  token: string;
  prob: string; // e.g., "+2.01" or "High"
  type: "target" | "distractor" | "related";
}

interface Feature {
  name: string;
  description: string; // Short text for the list
  patternExplanation?: string; // The "The model has learned..." text
  text: string;
  lockedTokenIdx: number; // The "Query" position
  hoveredSourceTokenIdx: number; // The "Key" position
  layer?: number; // Added for flattened list
  headId?: number; // Added for flattened list
  predictedTokens?: PredictionDetail[]; // The "Value" output
}

interface HeadData {
  layer: number;
  headId: number;
  headName: string;
  features: Feature[];
}

// Color mapping for each head
const HEAD_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  0: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" }, // red
  1: { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" }, // orange
  2: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" }, // amber
  3: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" }, // green
  4: { bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A" }, // blue
  5: { bg: "#E0E7FF", border: "#6366F1", text: "#312E81" }, // indigo
  6: { bg: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95" }, // purple
  7: { bg: "#FCE7F3", border: "#EC4899", text: "#831843" }, // pink
};

function SuperpositionGrid({ 
  features, 
  selectedIndex, 
  onSelect 
}: { 
  features: (Feature & { layer: number; headId: number; headName: string })[], 
  selectedIndex: number, 
  onSelect: (idx: number) => void 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {features.map((feature, idx) => {
        const isSelected = selectedIndex === idx;
        const colors = HEAD_COLORS[feature.headId];
        
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`
              relative flex flex-col text-left p-3 rounded-lg border transition-all duration-200 h-full
              ${isSelected 
                ? "ring-2 ring-offset-1 shadow-md z-10 scale-[1.02]" 
                : "hover:border-gray-300 hover:shadow-sm opacity-90 hover:opacity-100"
              }
            `}
            style={{
              backgroundColor: isSelected ? 'white' : colors.bg,
              borderColor: isSelected ? colors.border : 'transparent',
              ...(isSelected && { 
                '--tw-ring-color': colors.border,
                boxShadow: `0 0 0 2px ${colors.border}`
              } as React.CSSProperties)
            }}
          >
            {/* Feature Name */}
            <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
              {feature.name}
            </span>
            
            {/* Short Description on hover or if space permits */}
            <span className="text-[10px] text-gray-600 mt-1 line-clamp-2 leading-snug">
              {feature.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HeadSelectorDiagram({
  selectedLayer,
  selectedHead,
  onHeadClick
}: {
  selectedLayer: number;
  selectedHead: number;
  onHeadClick: (layer: number, headId: number) => void;
}) {
  const colors = {
    text: "#334155",        // Slate 700
    subText: "#64748b",     // Slate 500
    stroke: "#94a3b8",     // Slate 400
    residSpine: "#cbd5e1", // Slate 300
    tokenFill: "#f1f5f9",  // Slate 100
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 400 180" className="w-full max-w-[500px] overflow-visible">
          <defs>
            <marker id="head-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6" fill={colors.stroke} />
            </marker>
          </defs>

          {/* Input Token */}
          <rect x="150" y="10" width="100" height="24" rx="4" fill={colors.tokenFill} stroke={colors.stroke} strokeWidth="1" />
          <text x="200" y="26" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={colors.text}>token</text>
          <line x1="200" y1="34" x2="200" y2="50" stroke={colors.stroke} strokeWidth="1.5" markerEnd="url(#head-arrow)" />

          {/* Embedding Matrix */}
          <rect x="140" y="50" width="120" height="28" rx="4" fill="white" stroke={colors.stroke} strokeWidth="1.5" />
          <text x="200" y="68" textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.text}>
            Embedding <tspan fill={colors.subText} fontWeight="400" fontSize="9">(W_E)</tspan>
          </text>

          {/* Residual Stream */}
          <line x1="200" y1="78" x2="200" y2="100" stroke={colors.residSpine} strokeWidth="3" />

          {/* Attention Heads in Row */}
          <g>
            {HEAD_FEATURES.filter(h => h.layer === selectedLayer).map((head, idx) => {
              const isSelected = selectedHead === head.headId;
              const headColor = HEAD_COLORS[head.headId];
              const x = 20 + idx * 45;
              const y = 100;

              return (
                <g key={head.headId}>
                  <rect
                    x={x}
                    y={y}
                    width="40"
                    height="30"
                    rx="4"
                    fill={isSelected ? headColor.bg : "white"}
                    stroke={isSelected ? headColor.border : colors.stroke}
                    strokeWidth={isSelected ? "2" : "1"}
                    className="cursor-pointer transition-all"
                    onClick={() => onHeadClick(head.layer, head.headId)}
                    style={{ cursor: 'pointer' }}
                  />
                  <text
                    x={x + 20}
                    y={y + 19}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isSelected ? headColor.text : colors.text}
                    fontFamily="system-ui"
                    fontWeight={isSelected ? "600" : "400"}
                    className="pointer-events-none"
                  >
                    H{head.headId}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Residual Stream Continue */}
          <line x1="200" y1="130" x2="200" y2="150" stroke={colors.residSpine} strokeWidth="3" markerEnd="url(#head-arrow)" />

          {/* Unembedding Matrix */}
          <rect x="130" y="150" width="140" height="28" rx="4" fill="white" stroke={colors.stroke} strokeWidth="1.5" />
          <text x="200" y="168" textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.text}>
            Unembedding <tspan fill={colors.subText} fontWeight="400" fontSize="9">(W_U)</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
}

function TrigramExplainer({ feature }: { feature: Feature }) {
  if (!feature.predictedTokens || !feature.patternExplanation) return null;
  
  const tokens = feature.text.split(" ");
  const sourceToken = tokens[feature.hoveredSourceTokenIdx];
  const queryToken = tokens[feature.lockedTokenIdx];
  
  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-8">
      {/* Header / Pattern Description */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-1">{feature.name}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          {feature.patternExplanation}
        </p>
      </div>

      {/* The Visual Skip-Trigram Equation */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* 1. The Sentence Context (Left Side) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Skip-Trigram
          </div>
          
          <div className="bg-slate-100 rounded-lg p-4 flex flex-wrap gap-2 items-center font-mono text-sm">
            {tokens.map((t, i) => {
              let style = "bg-white text-slate-500 border border-slate-200 opacity-50"; // Default
              let label = null;
              if (i === feature.hoveredSourceTokenIdx) {
                style = "bg-blue-100 text-blue-800 border border-blue-300 font-bold shadow-sm ring-2 ring-blue-200";
                // label = "SOURCE (Key)";
              } else if (i === feature.lockedTokenIdx) {
                style = "bg-amber-100 text-amber-800 border border-amber-300 font-bold shadow-sm ring-2 ring-amber-200";
                // label = "CURRENT (Query)";
              }
              return (
                <div key={i} className="relative group">
                  <span className={`px-2 py-1.5 rounded transition-all ${style}`}>
                    {t}
                  </span>
                  {label && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-tight text-slate-500">
                      {label}
                    </div>
                  )}
                  {/* Draw arc visualization only for active tokens */}
                  {/* {i === feature.lockedTokenIdx && (
                     <svg className="absolute bottom-full left-1/2 -translate-x-1/2 w-32 h-8 pointer-events-none overflow-visible" style={{ left: '-40px' }}>
                       <path 
                         d="M 50,30 Q 20,-10 -40,30" 
                         fill="none" 
                         stroke="#3B82F6" 
                         strokeWidth="2" 
                         strokeDasharray="4 2"
                         markerEnd="url(#arrowhead)"
                       />
                     </svg>
                  )} */}
                </div>
              );
            })}
            
            {/* The blank to be filled */}
            <div className="relative ml-2">
              <span className="px-3 py-1.5 rounded bg-green-50 border-2 border-dashed border-green-300 text-green-700 font-bold animate-pulse">
                ?
              </span>
              {/* <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-tight text-green-600">
                PREDICTION
              </div> */}
            </div>
          </div>
          
          {/* <div className="text-xs text-slate-500 italic mt-2">
            "When the model reaches <strong>'{queryToken}'</strong>, it looks back at <strong>'{sourceToken}'</strong>..."
          </div> */}
        </div>

        {/* Arrow Divider */}
        <div className="md:col-span-1 flex justify-center">
          <div className="text-slate-300 text-4xl">→</div>
        </div>

        {/* 2. The Resulting Boost (Right Side) */}
        <div className="md:col-span-4">
           <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Boosted Probability
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {feature.predictedTokens.map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <span className={`font-medium ${pred.type === 'target' ? 'text-green-700' : 'text-slate-600'}`}>
                  {pred.token}
                </span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                  pred.type === 'target' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {pred.prob}
                </span>
              </div>
            ))}
          </div>
          {/* <div className="text-xs text-slate-400 mt-2 px-1">
            The head writes this information into the residual stream.
          </div> */}
        </div>
      </div>
      
      {/* Arrow Head Definition */}
      {/* <svg className="hidden">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
        </defs>
      </svg> */}
    </div>
  );
}

const HEAD_FEATURES: HeadData[] = [
  {
    layer: 0,
    headId: 0,
    headName: "Head 0:0",
    features: [
      {
        name: "Sports Context (Beat/Win)",
        description: "Links sports verbs to competition outcomes",
        patternExplanation: "When the model sees a gap after sports-related clauses, it looks back at verbs like 'beat' to predict outcomes like 'clinched' or 'rivalry', even across several words.",
        text: "The underdog managed to beat the heavy favorite and",
        lockedTokenIdx: 8, 
        hoveredSourceTokenIdx: 4,
        predictedTokens: [
          { token: "clinched", prob: "+2.19", type: "target" },
          { token: "dominance", prob: "+1.99", type: "related" },
          { token: "rivalry", prob: "+1.94", type: "related" },
          { token: "lost", prob: "-0.5", type: "distractor" }
        ]
      },
      // {
      //   name: "Induction (Repeated Terms)",
      //   description: "Copies previous unique words",
      //   patternExplanation: "A classic induction head. It searches for the current token's previous occurrence in the text and predicts the word that followed it *that* time.",
      //   text: "The error was reported immediately and as reported",
      //   lockedTokenIdx: 6,
      //   hoveredSourceTokenIdx: 3,
      //   predictedTokens: [
      //     { token: "reported", prob: "+2.90", type: "target" },
      //     { token: "reports", prob: "+2.38", type: "related" },
      //     { token: "investigators", prob: "+2.16", type: "related" }
      //   ]
      // }
    ]
  },
  {
    layer: 0,
    headId: 1,
    headName: "Head 0:1",
    features: [
      {
        name: "List Structuring (Pros/Cons)",
        description: "Completes structured lists across distances",
        patternExplanation: "The head maintains the state of a list. Seeing 'Pros' allows it to predict 'Cons' significantly later in the sentence structure.",
        text: "The review section was divided into two parts: Pros and",
        lockedTokenIdx: 8, 
        hoveredSourceTokenIdx: 7,
        predictedTokens: [
          { token: "Cons", prob: "+5.20", type: "target" },
          { token: "Disadvantages", prob: "+2.27", type: "related" },
          { token: "Conclusions", prob: "+1.1", type: "distractor" }
        ]
      },
      {
        name: "Code/Markup Tag Completion",
        description: "Closes brackets and formatting tags",
        patternExplanation: "When inside a URL or bracket structure, the model looks back at the opening bracket to predict the closing one or the URL content.",
        text: "Please review the document at [ original URL",
        lockedTokenIdx: 7,
        hoveredSourceTokenIdx: 5,
        predictedTokens: [
          { token: "]", prob: "+2.78", type: "target" },
          { token: "link", prob: "+1.5", type: "related" },
          { token: "file", prob: "+1.2", type: "related" }
        ]
      }
    ]
  },
  {
    layer: 0,
    headId: 2,
    headName: "Head 0:2",
    features: [
      {
        name: "Name → Job Title (Michael)",
        description: "Links 'Michael' to 'Manager/Director'",
        patternExplanation: "A socio-statistical bias in the training data. The name 'Michael' attending to 'project' or 'new' strongly activates leadership roles.",
        text: "The quarterly report was signed by Michael , the project",
        lockedTokenIdx: 9, 
        hoveredSourceTokenIdx: 6, 
        predictedTokens: [
          { token: "Manager", prob: "+2.72", type: "target" },
          { token: "Director", prob: "+2.70", type: "target" },
          { token: "CEO", prob: "+2.52", type: "target" },
          { token: "intern", prob: "-1.2", type: "distractor" }
        ]
      },
      {
        name: "Name → Job Title (Chris)",
        description: "Links 'Chris' to 'Officer/VP'",
        patternExplanation: "Demonstrating generality: similar to Michael, 'Chris' (and other male names) triggers the same 'Executive' circuit.",
        text: "We are waiting for approval from Chris , our chief",
        lockedTokenIdx: 9, 
        hoveredSourceTokenIdx: 6, 
        predictedTokens: [
          { token: "Officer", prob: "+2.21", type: "target" },
          { token: "Executive", prob: "+2.0", type: "target" },
          { token: "Financial", prob: "+1.8", type: "related" }
        ]
      },
      {
        name: "Comparison Completion",
        description: "Completes 'better... than' structures",
        patternExplanation: "The model holds the context of a comparative adjective ('better') across a phrase to correctly predict the syntactic closer ('than').",
        text: "This model performs significantly better in reducing uncertainty",
        lockedTokenIdx: 7, 
        hoveredSourceTokenIdx: 4, 
        predictedTokens: [
          { token: "than", prob: "+2.35", type: "target" },
          { token: "on", prob: "+1.0", type: "distractor" },
          { token: "at", prob: "+0.5", type: "distractor" }
        ]
      }
    ]
  },
  {
    layer: 0,
    headId: 3,
    headName: "Head 0:3",
    features: [
      {
        name: "Wildlife Context (Western)",
        description: "Links directions to specific species",
        patternExplanation: "The token 'Western' usually predicts political entities, but when 'wolf' or 'animal' context is present, it specifies 'gray' or 'hemisphere'.",
        text: "The population of the gray wolf in the Western",
        lockedTokenIdx: 8, 
        hoveredSourceTokenIdx: 5, 
        predictedTokens: [
          { token: "Hemisphere", prob: "+2.84", type: "target" },
          { token: "Isles", prob: "+2.05", type: "target" },
          { token: "Union", prob: "+1.5", type: "related" }
        ]
      }
    ]
  },
  {
    layer: 0,
    headId: 4,
    headName: "Head 0:4",
    features: [
      {
        name: "Download → Kindle",
        description: "E-reader context activation",
        patternExplanation: "The word 'download' creates a massive logit boost for 'Kindle', even when separated by several words, reflecting ebook patterns.",
        text: "If you decide to download the book, you could read it on",
        lockedTokenIdx: 11, 
        hoveredSourceTokenIdx: 4, 
        predictedTokens: [
          { token: "Kindle", prob: "+5.93", type: "target" },
          { token: "iPhone", prob: "+1.5", type: "related" },
          { token: "paper", prob: "-2.0", type: "distractor" }
        ]
      },
      {
        name: "Download → Academic",
        description: "Triggers math paper terminology",
        patternExplanation: "In a different context, 'download' predicts 'cohomology' or 'algebra', showing the head's sensitivity to the *type* of document.",
        text: "The paper is available for download and discusses the algebra",
        lockedTokenIdx: 9, 
        hoveredSourceTokenIdx: 5, 
        predictedTokens: [
          { token: "cohomology", prob: "+5.08", type: "target" },
          { token: "topology", prob: "+4.5", type: "target" },
          { token: "groups", prob: "+3.0", type: "target" }
        ]
      },
      {
        name: "Download → Cyrillic",
        description: "Piracy site artifact",
        patternExplanation: "A dataset artifact: 'download' strongly predicts single Cyrillic characters (О, И), likely from Russian piracy sites in the Common Crawl.",
        text: "Click here to download the full version",
        lockedTokenIdx: 6, 
        hoveredSourceTokenIdx: 3, 
        predictedTokens: [
          { token: " О", prob: "+5.26", type: "target" },
          { token: " И", prob: "+4.96", type: "target" },
          { token: "FREE", prob: "+3.5", type: "related" }
        ]
      }
    ]
  },
  {
    layer: 0,
    headId: 5,
    headName: "Head 0:5",
    features: [
      {
        name: "Location Association (San)",
        description: "Links 'San' to 'Calif/Francisco'",
        patternExplanation: "Standard skip-trigram. 'San' sets up a context that persists across the intervening location name to predict the state abbreviation.",
        text: "We visited San Luis Obispo, Calif",
        lockedTokenIdx: 4, 
        hoveredSourceTokenIdx: 2, 
        predictedTokens: [
          { token: "Calif", prob: "+1.62", type: "target" },
          { token: "CA", prob: "+1.11", type: "target" },
          { token: "Francisco", prob: "+0.5", type: "related" }
        ]
      }
    ]
  },
  {
    layer: 0,
    headId: 6,
    headName: "Head 0:6",
    features: [
      {
        name: "Parenthesis Balancing",
        description: "Deeply nested closure prediction",
        patternExplanation: "This head tracks the depth of parentheses. Seeing an open paren `(` triggers a strong expectation of a closing paren `))` or `).` later.",
        text: "The function call (which was nested (deeply",
        lockedTokenIdx: 6, 
        hoveredSourceTokenIdx: 3, 
        predictedTokens: [
          { token: "))", prob: "+8.62", type: "target" },
          { token: ").", prob: "+7.30", type: "target" },
          { token: " in", prob: "-1.0", type: "distractor" }
        ]
      }
    ]
  },
  {
    layer: 1,
    headId: 7,
    headName: "Head 1:7",
    features: [
      {
        name: "Abstract State (Has...)",
        description: "Linking verbs predict abstract outcomes",
        patternExplanation: "The verb 'has' acts as a pivot. The model looks back at 'has' when predicting abstract nouns like 'stood' or 'implications'.",
        text: "This ancient embodiment has for many years",
        lockedTokenIdx: 6, 
        hoveredSourceTokenIdx: 3, 
        predictedTokens: [
          { token: "stood", prob: "+1.79", type: "target" },
          { token: "been", prob: "+1.2", type: "related" },
          { token: "gone", prob: "+0.8", type: "distractor" }
        ]
      }
    ]
  }
];

// Flatten all features with their head info
const ALL_FEATURES: (Feature & { layer: number; headId: number; headName: string })[] = HEAD_FEATURES.flatMap(head =>
  head.features.map(feature => ({
    ...feature,
    layer: head.layer,
    headId: head.headId,
    headName: head.headName,
  }))
);

type Panel = "qk" | "ov";

export function AttentionCircuitWidget({
  panels = ["qk", "ov"],
  initialText,
  initialTab = 0,
  initialLayer = null,
  initialHead = null,
  staticAttentionData,
}: {
  panels?: Panel[];
  initialText?: string;
  initialTab?: number;
  initialLayer?: number | null;
  initialHead?: number | null;
  staticAttentionData?: StaticAttentionData | null;
} = {}) {
  // Ensure we have a valid feature index
  const safeInitialTab = Math.min(initialTab || 0, Math.max(0, ALL_FEATURES.length - 1));
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState(safeInitialTab);
  const selectedFeature = ALL_FEATURES[selectedFeatureIdx] || (ALL_FEATURES.length > 0 ? ALL_FEATURES[0] : null);
  const selectedLayer = initialLayer !== null ? initialLayer : (selectedFeature ? selectedFeature.layer : 0);
  const selectedHead = initialHead !== null ? initialHead : (selectedFeature ? selectedFeature.headId : 0);

  const defaultFeature = ALL_FEATURES[safeInitialTab] || (ALL_FEATURES.length > 0 ? ALL_FEATURES[0] : null);
  const [text, setText] = useState(
    initialText || (defaultFeature ? defaultFeature.text : "")
  );
  const [hoveredToken, setHoveredToken] = useState<number | null>(
    defaultFeature ? defaultFeature.lockedTokenIdx : null
  );
  const [lockedToken, setLockedToken] = useState<number | null>(
    defaultFeature ? defaultFeature.lockedTokenIdx : null
  );
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(
    defaultFeature ? defaultFeature.hoveredSourceTokenIdx : null
  );
  const [showTextInput, setShowTextInput] = useState(false);

  // Determine what data we need based on panels
  const needsQKData = panels.includes("qk");
  const needsOVData = panels.includes("ov");

  // Real API data
  const [realTokens, setRealTokens] = useState<Array<{ text: string; id: number }> | null>(null);
  const [realAttention, setRealAttention] = useState<number[][][][] | null>(null);
  const [realOVPredictions, setRealOVPredictions] = useState<any[] | null>(null);

  // Load from static data, slicing to the selected layer/head
  useEffect(() => {
    if (!staticAttentionData) return;

    setRealTokens(staticAttentionData.tokens);

    if (needsQKData && staticAttentionData.attention) {
      // Slice attention to just the selected layer and head
      // Original shape: [position][layer][head][src_position]
      // We need to produce: [position][0][0][src_position] (single layer, single head)
      const sliced = staticAttentionData.attention.map(posData => {
        const layerData = posData[selectedLayer];
        if (!layerData) return [[Array(posData[0]?.[0]?.length || 0).fill(0)]];
        const headData = layerData[selectedHead];
        if (!headData) return [[Array(layerData[0]?.length || 0).fill(0)]];
        return [[headData]];
      });
      setRealAttention(sliced);
    } else {
      setRealAttention(null);
    }

    if (needsOVData && staticAttentionData.ov_predictions) {
      // Slice OV predictions to selected layer/head
      // Original shape: [token][layer][head][prediction]
      const sliced = staticAttentionData.ov_predictions.map(tokenData => {
        const layerData = tokenData?.[selectedLayer];
        if (!layerData) return [[null]];
        const headData = layerData[selectedHead];
        return [[headData]];
      });
      setRealOVPredictions(sliced);
    } else {
      setRealOVPredictions(null);
    }
  }, [staticAttentionData, selectedLayer, selectedHead, needsQKData, needsOVData]);

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

  // Handle feature selection
  const handleFeatureChange = (featureIdx: number) => {
    setSelectedFeatureIdx(featureIdx);
    const feature = ALL_FEATURES[featureIdx];
    if (feature) {
      // When selection changes from the grid, reset the "Lab" to the perfect example
      setText(feature.text);
      setLockedToken(feature.lockedTokenIdx);
      setHoveredToken(feature.lockedTokenIdx);
      setHoveredSourceToken(feature.hoveredSourceTokenIdx);
    }
  };

  // Handle head click in diagram - select first feature of that head
  const handleHeadClick = (layer: number, headId: number) => {
    const firstFeatureOfHead = ALL_FEATURES.findIndex(f => f.layer === layer && f.headId === headId);
    if (firstFeatureOfHead !== -1) {
      handleFeatureChange(firstFeatureOfHead);
    }
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
    <div className="my-12 -mx-[40%] lg:-mx-[15%] p-8 bg-gray-50/50 rounded-xl border border-gray-200">
      
      {/* 1. HEAD SELECTOR DIAGRAM */}
      {!initialText && (
        <div className="mb-8">
          {/* <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Attention Head Architecture</h3>
            <p className="text-sm text-gray-600">
              Each attention head processes information independently. Click a head to see all its features.
            </p>
          </div> */}
          <HeadSelectorDiagram 
            selectedLayer={selectedLayer}
            selectedHead={selectedHead}
            onHeadClick={handleHeadClick}
          />
        </div>
      )}

      {/* 2. SUPERPOSITION GRID */}
      {!initialText && (
        <div className="mb-8">
          {/* <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Evidence of Superposition</h3>
            <p className="text-sm text-gray-600">
              Transformer attention heads are <strong>polysemantic</strong>. Because the model has limited capacity, it forces unrelated behaviors to share the same machinery. Below is a map of distinct "skip-trigram" features we've isolated across different heads.
              <br/><span className="text-blue-600 font-medium">Click a cell to analyze how that specific circuit works.</span>
            </p>
          </div> */}
          <SuperpositionGrid 
            features={ALL_FEATURES} 
            selectedIndex={selectedFeatureIdx} 
            onSelect={handleFeatureChange} 
          />
        </div>
      )}

      <div className="h-px bg-gray-200 w-full my-8" />

      {/* 2. TRIGRAM EXPLAINER (The Lesson) */}
      {!initialText && selectedFeature && (
        <div className="animate-fadeIn">
          <TrigramExplainer feature={selectedFeature} />
        </div>
      )}

      {/* 3. INTERACTIVE LAB (The Exploration) */}
      <div className="mt-8">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">

            </div>
            
         </div>

         {/* Token Strip & Circuits */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50/30">
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
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                highlightMode="attention"
                disableFirstToken={false}
              />
              <div className="flex justify-between items-center mt-3">
                 <p className="text-xs text-gray-400">
                    <span className="font-semibold">Tip:</span> Click a token to lock the query (Attention), then hover previous tokens (Source).
                 </p>
                 {/* Legend for the matrix below */}
                 <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-sm opacity-20"></div>
                      <span>Low Attn</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                      <span>High Attn</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className={`grid gap-0 ${
             needsQKData && needsOVData ? 'grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100' : 'grid-cols-1'
           }`}>
             {/* QK Circuit */}
             {needsQKData && (
               <div className="p-6">
                 <div className="mb-4 flex items-center justify-between">
                   <h4 className="font-bold text-gray-800 text-sm">Query-Key Circuit</h4>
                   <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Where the model looks</span>
                 </div>
                 <QKCircuitWidget
                   tokens={tokens}
                   affinityMatrix={affinityMatrix}
                   hoveredToken={hoveredToken}
                   hoveredSourceToken={hoveredSourceToken}
                   onMatrixCellHover={handleMatrixCellHover}
                   onMatrixCellLeave={handleMatrixCellLeave}
                 />
               </div>
             )}

             {/* OV Circuit */}
             {needsOVData && (
               <div className="p-6">
                 <div className="mb-4 flex items-center justify-between">
                   <h4 className="font-bold text-gray-800 text-sm">Output-Value Circuit</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">What the model writes</span>
                 </div>
                 <OVCircuitWidget
                   tokens={tokens}
                   ovLogits={ovLogits}
                   hoveredSourceToken={hoveredSourceToken}
                   hoveredToken={hoveredToken}
                   lockedToken={lockedToken}
                 />
               </div>
             )}
           </div>
         </div>
      </div>
    </div>
  );
}
