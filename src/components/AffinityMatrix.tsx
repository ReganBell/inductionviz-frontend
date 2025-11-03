import React, { useMemo } from "react";
import type { AnalysisResponse, TokenInfo } from "../types";

interface AffinityMatrixProps {
  analysis: AnalysisResponse;
  selectedModel: "t1" | "t2";
  selectedLayer: number;
  selectedHead: number;
}

export function AffinityMatrix({
  analysis,
  selectedModel,
  selectedLayer,
  selectedHead,
}: AffinityMatrixProps) {
  // Build the attention matrix: matrix[dst][src] = attention from dst to src
  const matrix = useMemo(() => {
    const n = analysis.tokens.length;
    const result: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    // For each destination position
    analysis.positions.forEach((pos, dstIdx) => {
      const attnData = pos.attn[selectedModel];
      if (!attnData || !attnData[selectedLayer] || !attnData[selectedLayer][selectedHead]) {
        return;
      }

      const headAttn = attnData[selectedLayer][selectedHead];
      // headAttn is an array of attention weights for all source positions up to dstIdx
      headAttn.forEach((attnWeight, srcIdx) => {
        result[dstIdx + 1][srcIdx] = attnWeight;
      });
    });

    return result;
  }, [analysis, selectedModel, selectedLayer, selectedHead]);

  // Find max value for scaling
  const maxAttn = useMemo(() => {
    return Math.max(...matrix.flat(), 0.01);
  }, [matrix]);

  // Color scale: white -> red
  const getColor = (value: number) => {
    const intensity = Math.min(value / maxAttn, 1);
    const red = 255;
    const gb = Math.round(255 * (1 - intensity));
    return `rgb(${red}, ${gb}, ${gb})`;
  };

  const tokens = analysis.tokens;
  const n = tokens.length;

  // Calculate cell size to fit nicely
  const cellSize = Math.max(24, Math.min(40, 480 / n));
  const fontSize = Math.max(8, Math.min(11, cellSize / 3.5));

  return (
    <div className="border border-black/10 rounded-lg p-4 bg-white">
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-1">
          Affinity Matrix: {selectedModel.toUpperCase()} L{selectedLayer}H{selectedHead}
        </h3>
        <p className="text-xs opacity-70">
          Rows = destination tokens, Columns = source tokens. Color intensity = attention weight.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers (source tokens) */}
          <div className="flex mb-1">
            <div style={{ width: cellSize }} className="shrink-0" />
            {tokens.map((token, idx) => (
              <div
                key={idx}
                style={{ width: cellSize, fontSize }}
                className="shrink-0 text-center font-mono truncate px-0.5"
                title={token.text || "␠"}
              >
                {token.text || "␠"}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {tokens.map((rowToken, rowIdx) => (
            <div key={rowIdx} className="flex">
              {/* Row header (destination token) */}
              <div
                style={{ width: cellSize, fontSize }}
                className="shrink-0 text-right font-mono pr-2 flex items-center justify-end truncate"
                title={rowToken.text || "␠"}
              >
                {rowToken.text || "␠"}
              </div>

              {/* Cells */}
              {tokens.map((_, colIdx) => {
                const value = matrix[rowIdx][colIdx];
                const canAttend = colIdx <= rowIdx; // Can attend to previous tokens and self

                return (
                  <div
                    key={colIdx}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: canAttend ? getColor(value) : "#f5f5f5",
                      fontSize: fontSize * 0.75,
                    }}
                    className="shrink-0 border border-black/10 flex items-center justify-center font-mono text-[10px] text-black/60"
                    title={
                      canAttend
                        ? `${rowToken.text || "␠"} → ${tokens[colIdx].text || "␠"}: ${(value * 100).toFixed(1)}%`
                        : "Cannot attend to future tokens"
                    }
                  >
                    {canAttend && value > 0.01 ? (value * 100).toFixed(0) : ""}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="opacity-70">Attention:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 border border-black/10" style={{ backgroundColor: getColor(0) }} />
              <span className="opacity-70">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 border border-black/10" style={{ backgroundColor: getColor(maxAttn * 0.5) }} />
              <span className="opacity-70">{(maxAttn * 50).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 border border-black/10" style={{ backgroundColor: getColor(maxAttn) }} />
              <span className="opacity-70">{(maxAttn * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
