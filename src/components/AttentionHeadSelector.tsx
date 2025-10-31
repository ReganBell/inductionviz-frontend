import type { AnalysisResponse, CompositionScores } from "../types";

export function AttentionHeadSelector({
  analysis,
  selectedModel,
  selectedLayer,
  selectedHead,
  onModelChange,
  onLayerChange,
  onHeadChange,
  compositionScores,
  showComposition,
  onToggleComposition,
}: {
  analysis: AnalysisResponse;
  selectedModel: "t1" | "t2";
  selectedLayer: number;
  selectedHead: number;
  onModelChange: (model: "t1" | "t2") => void;
  onLayerChange: (layer: number) => void;
  onHeadChange: (head: number) => void;
  compositionScores: CompositionScores | null;
  showComposition: boolean;
  onToggleComposition: (show: boolean) => void;
}) {
  const layers = selectedModel === "t1" ? analysis.t1_layers : analysis.t2_layers;
  const heads = selectedModel === "t1" ? analysis.t1_heads : analysis.t2_heads;

  const headRadius = 24;
  const layerSpacing = 120;
  const headSpacing = 60;

  // Calculate positions for heads (vertical layout: Layer 0 top, Layer 1 bottom)
  const getHeadPosition = (layer: number, head: number) => {
    const totalWidth = (heads - 1) * headSpacing;
    const x = head * headSpacing - totalWidth / 2 + 240;
    const y = layer * layerSpacing + 60;
    return { x, y };
  };

  // Get composition scores between two heads
  const getKCompositionScore = (l1Head: number, l0Head: number): number => {
    if (!compositionScores || selectedModel === "t1") return 0;
    return compositionScores.k_composition[l1Head]?.[l0Head] || 0;
  };

  const getQCompositionScore = (l1Head: number, l0Head: number): number => {
    if (!compositionScores || selectedModel === "t1") return 0;
    return compositionScores.q_composition[l1Head]?.[l0Head] || 0;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Model Architecture</div>

      {/* Model Selection */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="radio"
            checked={selectedModel === "t1"}
            onChange={() => onModelChange("t1")}
          />
          <span style={{ fontWeight: 500 }}>1-Layer Attention Only</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="radio"
            checked={selectedModel === "t2"}
            onChange={() => onModelChange("t2")}
          />
          <span style={{ fontWeight: 500 }}>2-Layer Attention Only</span>
        </label>
        {selectedModel === "t2" && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginLeft: 12, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showComposition}
              onChange={(e) => onToggleComposition(e.target.checked)}
            />
            <span>Show Head Composition</span>
          </label>
        )}
      </div>

      {/* Visual Architecture */}
      <div style={{ position: "relative", width: "100%", height: selectedModel === "t2" ? 260 : 140, background: "#FCFCFC", border: "1px solid rgba(0,0,0,.1)", borderRadius: 10, overflow: "hidden" }}>
        <svg style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
          {/* Draw composition connections for 2-layer model */}
          {selectedModel === "t2" && showComposition && compositionScores && (
            <>
              {/* K-Composition (green) - strongest signal */}
              {Array.from({ length: heads }, (_, l1Head) =>
                Array.from({ length: heads }, (_, l0Head) => {
                  const score = getKCompositionScore(l1Head, l0Head);
                  if (score <= 0.001) return null; // Only draw significant positive composition

                  const l0Pos = getHeadPosition(0, l0Head);
                  const l1Pos = getHeadPosition(1, l1Head);

                  // Exponential scaling to emphasize strong connections
                  const normalizedScore = Math.max(0, score / 0.05); // Normalize assuming max ~0.05
                  const intensity = Math.pow(normalizedScore, 2); // Exponential emphasis
                  const opacity = Math.min(intensity * 0.9, 0.9);
                  const strokeWidth = Math.max(1, intensity * 8);

                  return (
                    <line
                      key={`k-conn-${l1Head}-${l0Head}`}
                      x1={l0Pos.x}
                      y1={l0Pos.y + headRadius}
                      x2={l1Pos.x}
                      y2={l1Pos.y - headRadius}
                      stroke="#2ECF8B"
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      strokeLinecap="round"
                    />
                  );
                })
              )}

              {/* Q-Composition (blue) - weaker signal */}
              {Array.from({ length: heads }, (_, l1Head) =>
                Array.from({ length: heads }, (_, l0Head) => {
                  const score = getQCompositionScore(l1Head, l0Head);
                  if (score <= 0.001) return null; // Only draw significant positive composition

                  const l0Pos = getHeadPosition(0, l0Head);
                  const l1Pos = getHeadPosition(1, l1Head);

                  // Exponential scaling
                  const normalizedScore = Math.max(0, score / 0.05);
                  const intensity = Math.pow(normalizedScore, 2);
                  const opacity = Math.min(intensity * 0.7, 0.7);
                  const strokeWidth = Math.max(0.5, intensity * 6);

                  return (
                    <line
                      key={`q-conn-${l1Head}-${l0Head}`}
                      x1={l0Pos.x}
                      y1={l0Pos.y + headRadius}
                      x2={l1Pos.x}
                      y2={l1Pos.y - headRadius}
                      stroke="#0066ff"
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      strokeLinecap="round"
                    />
                  );
                })
              )}
            </>
          )}
        </svg>

        {/* Draw heads */}
        {Array.from({ length: layers }, (_, layer) => (
          <div key={`layer-${layer}`} style={{ position: "absolute", left: 0, top: 0 }}>
            {/* Layer label */}
            <div style={{
              position: "absolute",
              left: 20,
              top: layer * layerSpacing + 60 - 10,
              fontSize: 13,
              fontWeight: 600,
              opacity: 0.7,
            }}>
              Layer {layer}
            </div>

            {/* Heads for this layer */}
            {Array.from({ length: heads }, (_, head) => {
              const pos = getHeadPosition(layer, head);
              const isSelected = selectedLayer === layer && selectedHead === head;

              return (
                <div
                  key={`head-${layer}-${head}`}
                  onClick={() => {
                    onLayerChange(layer);
                    onHeadChange(head);
                  }}
                  style={{
                    position: "absolute",
                    left: pos.x - headRadius,
                    top: pos.y - headRadius,
                    width: headRadius * 2,
                    height: headRadius * 2,
                    borderRadius: "50%",
                    border: isSelected ? "3px solid #0066ff" : "2px solid rgba(0,0,0,.2)",
                    background: isSelected ? "#0066ff" : "white",
                    color: isSelected ? "white" : "#0E1111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? "0 4px 12px rgba(0,102,255,.3)" : "0 2px 4px rgba(0,0,0,.1)",
                  }}
                  title={`L${layer}H${head}`}
                >
                  {head}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Selected: {selectedModel.toUpperCase()} L{selectedLayer}H{selectedHead}
        {selectedModel === "t2" && showComposition && compositionScores && " • Green = K-composition, Blue = Q-composition"}
      </div>
    </div>
  );
}
