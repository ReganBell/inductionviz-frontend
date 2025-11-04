import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import type { AttentionPatternsResponse } from "../types";
import { QKCircuitWidget } from "./QKCircuitWidget";
import { OVCircuitWidget } from "./OVCircuitWidget";

interface InductionHeadWidgetProps {
  exampleText: string;
}

export function InductionHeadWidget({ exampleText }: InductionHeadWidgetProps) {
  const [tokens, setTokens] = useState<any[] | null>(null);
  const [attention, setAttention] = useState<number[][][][] | null>(null);
  const [ovPredictions, setOvPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [lockedToken, setLockedToken] = useState<number | null>(null);
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(null);

  // Fetch attention patterns for Layer 1 heads
  useEffect(() => {
    if (!exampleText.trim()) return;

    const fetchAttention = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: exampleText,
            model_name: "t2",
            layers: [1], // Layer 1 only
            heads: null, // All heads
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch attention");

        const data: AttentionPatternsResponse = await response.json();
        setTokens(data.tokens);
        setAttention(data.attention);
        setOvPredictions(data.ov_predictions || null);

        // Auto-select the last token to show induction behavior
        if (data.tokens.length > 0) {
          setHoveredToken(data.tokens.length - 1);
          setLockedToken(data.tokens.length - 1);
        }
      } catch (err) {
        console.error("Error fetching attention:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttention();
  }, [exampleText]);

  // Build affinity matrix for a specific head (L1H0 is often a good induction head)
  const affinityMatrix = useMemo(() => {
    if (!attention || !tokens) {
      return Array(10).fill(null).map(() => Array(10).fill(0));
    }

    const matrix: number[][] = [];
    const maxTokens = Math.min(tokens.length, 10);

    // First row: first token attends to itself
    matrix[0] = Array(maxTokens).fill(0);
    matrix[0][0] = 1;

    // For each subsequent position
    for (let i = 0; i < attention.length && i < maxTokens - 1; i++) {
      const positionIdx = i;
      const tokenIdx = i + 1;

      // Use head 0 from layer 1 (induction head)
      const headAttention = attention[positionIdx][0][0]; // [position][layer=0 (relative to request)][head][src_positions]

      const row = Array(maxTokens).fill(0);
      for (let j = 0; j < headAttention.length && j <= tokenIdx; j++) {
        row[j] = headAttention[j];
      }
      matrix[tokenIdx] = row;
    }

    return matrix;
  }, [attention, tokens]);

  // Get OV predictions for hovered source token
  const ovLogits = useMemo(() => {
    if (hoveredSourceToken === null || !ovPredictions || !tokens) return null;

    if (hoveredSourceToken < ovPredictions.length) {
      const tokenPredictions = ovPredictions[hoveredSourceToken];
      // Layer 1, Head 0 - but since we requested only layer 1, it's at index [0][0]
      if (tokenPredictions && tokenPredictions[0] && tokenPredictions[0][0]) {
        return tokenPredictions[0][0];
      }
    }
    return null;
  }, [ovPredictions, hoveredSourceToken, tokens]);

  const handleMatrixCellHover = (rowIdx: number, colIdx: number) => {
    setHoveredToken(rowIdx);
    setHoveredSourceToken(colIdx);
  };

  const handleMatrixCellLeave = () => {
    setHoveredSourceToken(null);
    setHoveredToken(lockedToken);
  };

  const displayTokens = tokens ? tokens.slice(0, 10).map(t => t.text) : [];

  if (loading || !tokens || !attention) {
    return (
      <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
        <h3 className="text-lg font-semibold mb-4">Ingredient 2: Induction Head (Layer 1, Head 0)</h3>
        <div className="text-sm opacity-70">Loading circuit visualization...</div>
      </div>
    );
  }

  return (
    <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
      <h3 className="text-lg font-semibold mb-4">Ingredient 2: Induction Head (Layer 1, Head 0)</h3>
      <p className="text-sm opacity-80 mb-4">
        This head searches for tokens that appeared <strong>after previous matches</strong>. By composing with the
        previous token head, it can find where the current pattern appeared before and attend to what came next.
      </p>

      {/* Token strip for context */}
      <div className="mb-4 p-3 bg-white rounded border border-warm-gray">
        <div className="text-xs font-medium mb-2 opacity-60">Example text:</div>
        <div className="font-mono text-sm">
          {displayTokens.map((token, i) => (
            <span
              key={i}
              className={`inline-block px-1 ${
                i === hoveredToken ? 'bg-blue-200' : i === hoveredSourceToken ? 'bg-orange-200' : ''
              }`}
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      {/* Circuit widgets */}
      <div className="grid md:grid-cols-2 gap-4 bg-white rounded-lg border border-warm-gray">
        <QKCircuitWidget
          tokens={displayTokens}
          affinityMatrix={affinityMatrix}
          hoveredToken={hoveredToken}
          hoveredSourceToken={hoveredSourceToken}
          onMatrixCellHover={handleMatrixCellHover}
          onMatrixCellLeave={handleMatrixCellLeave}
        />
        <OVCircuitWidget
          tokens={displayTokens}
          ovLogits={ovLogits}
          hoveredSourceToken={hoveredSourceToken}
          hoveredToken={hoveredToken}
          lockedToken={lockedToken}
        />
      </div>

      <div className="mt-4 p-3 bg-accent/10 rounded border border-accent/30 text-sm">
        <strong>The induction trick:</strong> When seeing "name again?", this head uses Layer 0's output to find
        where "name" appeared before, then looks at what token came after that previous occurrence. If it finds
        "Regan", it predicts "Regan" should come next!
      </div>
    </div>
  );
}
