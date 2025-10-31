import React from "react";
import type { CompositionScores } from "../types";

export function CompositionScoresPanel({
  compositionScores,
  onClose,
}: {
  compositionScores: CompositionScores;
  onClose: () => void;
}) {
  const { q_composition, k_composition, v_composition } = compositionScores;

  const renderHeatmap = (data: number[][], title: string, description: string) => {
    if (!data || data.length === 0 || data[0].length === 0) return null;

    const nHeads = data.length;
    const maxVal = Math.max(...data.flat().map(Math.abs));

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 10 }}>{description}</div>
        <div style={{ display: "inline-grid", gridTemplateColumns: `40px repeat(${nHeads}, 40px)`, gap: 2 }}>
          {/* Header row - layer 0 heads */}
          <div></div>
          {Array.from({ length: nHeads }, (_, i) => (
            <div key={i} style={{ fontSize: 10, textAlign: "center", opacity: 0.6 }}>
              L0H{i}
            </div>
          ))}

          {/* Rows for each layer 1 head */}
          {data.map((row, l1Head) => (
            <React.Fragment key={l1Head}>
              <div style={{ fontSize: 10, display: "flex", alignItems: "center", opacity: 0.6 }}>
                L1H{l1Head}
              </div>
              {row.map((value, l0Head) => {
                const intensity = maxVal > 0 ? Math.abs(value) / maxVal : 0;
                const color = value >= 0
                  ? `rgba(46, 207, 139, ${intensity})`  // Green for positive
                  : `rgba(255, 68, 68, ${intensity})`;   // Red for negative

                return (
                  <div
                    key={l0Head}
                    style={{
                      width: 40,
                      height: 40,
                      background: color,
                      border: "1px solid rgba(0,0,0,.1)",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontFamily: "monospace",
                    }}
                    title={`L1H${l1Head} ← L0H${l0Head}: ${value.toFixed(3)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      border: "2px solid #0066ff",
      borderRadius: 10,
      padding: 20,
      background: "#FCFCFC",
      position: "relative",
    }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,.05)",
          border: "1px solid rgba(0,0,0,.1)",
          borderRadius: 4,
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Close
      </button>

      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
        Head Composition Scores (Layer 1 ← Layer 0)
      </div>

      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        Shows how much information flows between attention heads through Q-, K-, and V-composition pathways.
        Higher values = stronger composition. Computed from model weights (input-independent).
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {renderHeatmap(k_composition, "K-Composition", "How much does L1 key vector read from L0 output?")}
        {renderHeatmap(q_composition, "Q-Composition", "How much does L1 query vector read from L0 output?")}
        {renderHeatmap(v_composition, "V-Composition", "How much does L1 value vector read from L0 output?")}
      </div>
    </div>
  );
}
