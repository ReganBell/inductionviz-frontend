import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import type { CompositionScores } from "../types";

export function CompositionFlowDiagram() {
  const [compositionScores, setCompositionScores] = useState<CompositionScores | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompositionScores = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/composition-scores?model_name=t2`);
        if (!response.ok) throw new Error("Failed to fetch composition scores");
        const data: CompositionScores = await response.json();
        setCompositionScores(data);
      } catch (err) {
        console.error("Error fetching composition scores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompositionScores();
  }, []);

  // Find the strongest K-composition between L0H1 and L1H0
  const strongestKComposition = compositionScores ? compositionScores.k_composition[0][1] : 0;

  return (
    <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
      <h3 className="text-lg font-semibold mb-4">How They Work Together: K-Composition</h3>
      <p className="text-sm opacity-80 mb-6">
        The magic happens through <strong>K-composition</strong>: Layer 1 reads from Layer 0's output
        to transform its key vectors. This allows the induction head to "see through" the previous token head's processing.
      </p>

      <div className="bg-white p-6 rounded border border-warm-gray">
        {/* SVG Flow Diagram */}
        <svg viewBox="0 0 600 400" className="w-full max-w-2xl mx-auto">
          {/* Example: "My name is Regan Bell. What's my name again?" */}

          {/* Token at bottom */}
          <text x="300" y="380" textAnchor="middle" fontSize="14" fill="#525252" fontFamily="system-ui, monospace">
            Current position: "again?"
          </text>

          {/* Query from current token */}
          <text x="300" y="360" textAnchor="middle" fontSize="12" fill="#737373" fontFamily="system-ui">
            Query: "What came after 'name' before?"
          </text>

          {/* Layer 1: Induction Head */}
          <rect x="220" y="280" width="160" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
          <text x="300" y="300" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e40af" fontFamily="system-ui">
            Layer 1, Head 0
          </text>
          <text x="300" y="318" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">
            Induction Head
          </text>

          {/* Arrow up from L1 */}
          <line x1="300" y1="280" x2="300" y2="240" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          <text x="320" y="265" fontSize="10" fill="#3b82f6" fontFamily="system-ui">attends to</text>

          {/* Layer 0 Output */}
          <ellipse cx="300" cy="210" rx="100" ry="25" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <text x="300" y="215" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e" fontFamily="system-ui">
            Token after "name"
          </text>

          {/* Arrow up from L0 output */}
          <line x1="300" y1="185" x2="300" y2="155" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowOrange)" />

          {/* Layer 0: Previous Token Head */}
          <rect x="220" y="90" width="160" height="50" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <text x="300" y="110" textAnchor="middle" fontSize="13" fontWeight="600" fill="#166534" fontFamily="system-ui">
            Layer 0, Head 1
          </text>
          <text x="300" y="128" textAnchor="middle" fontSize="11" fill="#166534" fontFamily="system-ui">
            Previous Token Head
          </text>

          {/* Arrow to the side showing what L0 found */}
          <line x1="380" y1="115" x2="480" y2="115" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowGreen)" />
          <text x="500" y="120" fontSize="12" fill="#166534" fontFamily="system-ui" fontWeight="600">
            Found: "Regan"
          </text>

          {/* Arrow from L0 down to L1 showing composition */}
          <path d="M 220 115 Q 100 200 220 305" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowPurple)" />
          <text x="100" y="205" fontSize="10" fill="#8b5cf6" fontFamily="system-ui" fontWeight="600">
            K-Composition
          </text>
          {loading ? (
            <text x="100" y="220" fontSize="9" fill="#8b5cf6" fontFamily="system-ui">
              Loading score...
            </text>
          ) : compositionScores ? (
            <text x="100" y="220" fontSize="9" fill="#8b5cf6" fontFamily="system-ui">
              Score: {strongestKComposition.toFixed(3)}
            </text>
          ) : null}

          {/* Token example at top */}
          <text x="300" y="30" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui" fontStyle="italic">
            Example: "My name is Regan Bell. What's my name again?"
          </text>
          <text x="300" y="50" textAnchor="middle" fontSize="11" fill="#737373" fontFamily="system-ui">
            At position "again?", the induction head predicts "Regan"
          </text>

          {/* Arrow markers */}
          <defs>
            <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
            <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
            </marker>
            <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#22c55e" />
            </marker>
            <marker id="arrowPurple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
            </marker>
          </defs>
        </svg>

        {/* Explanation */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 shrink-0 mt-0.5"></div>
            <div>
              <strong>Step 1 (Layer 0):</strong> The previous token head attends to "my" (the token before "name")
              and moves information about "my" forward in the residual stream.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-purple-500 shrink-0 mt-0.5"></div>
            <div>
              <strong>Step 2 (Composition):</strong> Layer 1's induction head uses this information to modify its
              key vectors through K-composition, effectively searching for "where did 'my name' appear before?"
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 shrink-0 mt-0.5"></div>
            <div>
              <strong>Step 3 (Layer 1):</strong> The induction head attends to the position after the previous
              "my name" occurrence—which is "Regan"—and outputs that prediction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
