import type { AblationResult } from "../types";

export function AblationPanel({
  ablation,
  onClose,
}: {
  ablation: AblationResult;
  onClose: () => void;
}) {
  const panels: { key: keyof AblationResult; title: string; description: string }[] = [
    { key: "with_head", title: "With Head", description: "Top predictions with the head active" },
    { key: "without_head", title: "Without Head", description: "Top predictions with the head ablated" },
    { key: "delta_positive", title: "Most Helped (+Δ)", description: "Tokens most promoted by this head" },
    { key: "delta_negative", title: "Most Hurt (−Δ)", description: "Tokens most suppressed by this head" },
  ];

  return (
    <div style={{
      border: "2px solid #2ECF8B",
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

      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
        Head Ablation Analysis
      </div>
      <div style={{ fontSize: 13, opacity: 0.6, fontStyle: "italic", marginBottom: 16 }}>
        Misleading, Probably Useless
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {panels.map((panel) => {
          const data = ablation[panel.key];
          return (
            <div
              key={panel.key}
              style={{
                border: "1px solid rgba(0,0,0,.1)",
                borderRadius: 8,
                padding: 14,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                {panel.title}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 10 }}>
                {panel.description}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  >
                    <span>{idx + 1}. {item.token || "␠"}</span>
                    <span style={{ opacity: 0.7 }}>
                      {panel.key.startsWith("delta")
                        ? `Δ${item.logit >= 0 ? "+" : ""}${item.logit.toFixed(2)}`
                        : `p=${item.prob.toFixed(4)}`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
