import type { ModelKey, PositionInfo } from "../types";

export function TopkPanel({ position }: { position: PositionInfo }) {
  const models: { key: ModelKey; title: string }[] = [
    // { key: "bigram", title: "Bigram" },  // Disabled to reduce backend memory usage
    { key: "t1", title: "Transformer L1" },
    { key: "t2", title: "Transformer L2" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
      {models.map((model) => {
        const topkData = position.topk[model.key];
        const loss = position.losses[model.key];
        const isBigram = model.key === "bigram";
        const isUnavailable = isBigram && !position.bigram_available;

        return (
          <div
            key={model.key}
            style={{
              border: "1px solid rgba(0,0,0,.1)",
              borderRadius: 10,
              padding: 16,
              opacity: isUnavailable ? 0.5 : 1,
              background: isUnavailable ? "rgba(0,0,0,.05)" : undefined
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {model.title}
              {isUnavailable && <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}> (not in corpus)</span>}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              loss: {loss !== null ? loss.toFixed(2) : "N/A"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topkData ? (
                topkData.map((item, idx) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace" }}>
                    <span>{idx + 1}. {item.token || "␠"}</span>
                    <span style={{ opacity: 0.7 }}>p={item.prob.toFixed(4)}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontStyle: "italic", opacity: 0.7, fontSize: 12 }}>
                  No data available
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
