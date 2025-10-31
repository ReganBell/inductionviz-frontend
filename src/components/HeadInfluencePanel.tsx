import type { PositionInfo } from "../types";

export function HeadInfluencePanel({
  position,
  selectedModel,
  selectedLayer,
  selectedHead,
  onHeadClick,
}: {
  position: PositionInfo;
  selectedModel: "t1" | "t2";
  selectedLayer: number;
  selectedHead: number;
  onHeadClick?: (layer: number, head: number) => void;
}) {
  const deltas = position.head_deltas[selectedModel];

  // Convert to array and sort by magnitude
  const sortedHeads = Object.entries(deltas)
    .map(([headKey, headData]) => ({ headKey, ...headData }))
    .sort((a, b) => b.magnitude - a.magnitude);

  const topHeads = sortedHeads.slice(0, 8);

  const selectedHeadKey = `L${selectedLayer}H${selectedHead}`;
  const selectedHeadData = deltas[selectedHeadKey];

  return (
    <div style={{
      border: "1px solid rgba(0,0,0,.1)",
      borderRadius: 10,
      padding: 16,
      background: "#FCFCFC",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
        Head Influence Analysis ({selectedModel.toUpperCase()})
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: Top heads by magnitude */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>
            Most Influential Heads (by magnitude)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {topHeads.map(({ headKey, magnitude, actual_token_delta }) => {
              const isSelected = headKey === selectedHeadKey;
              return (
                <div
                  key={headKey}
                  style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 6px",
                    borderRadius: 4,
                    background: isSelected ? "rgba(0,160,255,.1)" : undefined,
                    border: isSelected ? "1px solid rgba(0,160,255,.3)" : "1px solid transparent",
                    cursor: onHeadClick ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (onHeadClick) {
                      const match = headKey.match(/L(\d+)H(\d+)/);
                      if (match) {
                        onHeadClick(parseInt(match[1]), parseInt(match[2]));
                      }
                    }
                  }}
                >
                  <span>{headKey}</span>
                  <span style={{ opacity: 0.7 }}>mag: {magnitude.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected head details */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>
            Selected Head: {selectedHeadKey}
          </div>
          {selectedHeadData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Magnitude: {selectedHeadData.magnitude.toFixed(2)} |
                Actual token Δ: {selectedHeadData.actual_token_delta.toFixed(4)}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#2ECF8B", marginBottom: 4 }}>
                  Top Promoted:
                </div>
                {selectedHeadData.top_promoted.length > 0 ? (
                  selectedHeadData.top_promoted.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
                      <span>{item.token || "␠"}</span>
                      <span style={{ color: "#2ECF8B" }}>+{item.delta.toFixed(3)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 10, opacity: 0.5, fontStyle: "italic" }}>None</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#d42", marginBottom: 4 }}>
                  Top Suppressed:
                </div>
                {selectedHeadData.top_suppressed.length > 0 ? (
                  selectedHeadData.top_suppressed.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
                      <span>{item.token || "␠"}</span>
                      <span style={{ color: "#d42" }}>{item.delta.toFixed(3)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 10, opacity: 0.5, fontStyle: "italic" }}>None</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.6, fontStyle: "italic" }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
