import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import type { AttentionPatternsResponse } from "../types";
import { TokenStrip } from "./TokenStrip";
import { QKCircuitWidget } from "./QKCircuitWidget";
import { OVCircuitWidget } from "./OVCircuitWidget";

interface PreviousTokenHeadWidgetProps {
  exampleText: string;
}

export function PreviousTokenHeadWidget({ exampleText }: PreviousTokenHeadWidgetProps) {
  const [tokens, setTokens] = useState<any[] | null>(null);
  const [attention, setAttention] = useState<number[][][][] | null>(null);
  const [ovPredictions, setOvPredictions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const [hoveredToken, setHoveredToken] = useState<number | null>(4); // Default to a middle token
  const [lockedToken, setLockedToken] = useState<number | null>(4);
  const [hoveredSourceToken, setHoveredSourceToken] = useState<number | null>(3); // Previous token

  // Fetch attention patterns for Layer 0 heads
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
            layers: [0], // Layer 0 only
            heads: null, // All heads
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch attention");

        const data: AttentionPatternsResponse = await response.json();
        setTokens(data.tokens);
        setAttention(data.attention);
        setOvPredictions(data.ov_predictions || null);
      } catch (err) {
        console.error("Error fetching attention:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttention();
  }, [exampleText]);

  // Build affinity matrix for a specific head (let's use L0H1 as the "previous token head")
  const affinityMatrix = useMemo(() => {
    if (!attention || !tokens) {
      return Array(10).fill(null).map(() => Array(10).fill(0));
    }

    const matrix: number[][] = [];
    const maxTokens = Math.min(tokens.length, 10); // Limit to 10 tokens for display

    // First row: first token attends to itself
    matrix[0] = Array(maxTokens).fill(0);
    matrix[0][0] = 1;

    // For each subsequent position
    for (let i = 0; i < attention.length && i < maxTokens - 1; i++) {
      const positionIdx = i;
      const tokenIdx = i + 1;

      // Use head 1 from layer 0 (a good "previous token" head)
      const headAttention = attention[positionIdx][0][1]; // [position][layer][head][src_positions]

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
      // Layer 0, Head 1
      if (tokenPredictions && tokenPredictions[0] && tokenPredictions[0][1]) {
        return tokenPredictions[0][1];
      }
    }
    return null;
  }, [ovPredictions, hoveredSourceToken, tokens]);

  const handleTokenClick = (idx: number) => {
    if (lockedToken === idx) {
      setLockedToken(null);
    } else {
      setLockedToken(idx);
      setHoveredToken(idx);
    }
  };

  const handleMatrixCellHover = (rowIdx: number, colIdx: number) => {
    setHoveredToken(rowIdx);
    setHoveredSourceToken(colIdx);
  };

  const handleMatrixCellLeave = () => {
    setHoveredSourceToken(lockedToken !== null ? lockedToken - 1 : null);
    setHoveredToken(lockedToken);
  };

  const displayTokens = tokens ? tokens.slice(0, 10).map(t => t.text) : [];

  if (loading || !tokens || !attention) {
    return (
      <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
        <h3 className="text-lg font-semibold mb-4">Ingredient 1: Previous Token Head (Layer 0, Head 1)</h3>
        <div className="text-sm opacity-70">Loading circuit visualization...</div>
      </div>
    );
  }

  return (
    <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
      <h3 className="text-lg font-semibold mb-4">Ingredient 1: Previous Token Head (Layer 0, Head 1)</h3>
      <p className="text-sm opacity-80 mb-4">
        This head learns a simple pattern: <strong>attend to the previous token</strong>. Look at the QK circuit below—
        notice how the attention weights form a diagonal just below the main diagonal. This head is creating a "memory" of what token just appeared.
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

      <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200 text-sm">
        <strong>Key insight:</strong> This head doesn't predict the next token directly. Instead, it moves information
        about the previous token forward in the residual stream. This information will be used by Layer 1 heads.
      </div>
    </div>
  );
}
