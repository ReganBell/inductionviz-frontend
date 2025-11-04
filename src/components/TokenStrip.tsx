import type { TokenInfo, HeadDelta } from "../types";

export function TokenStrip({
  tokens,
  active,
  onHover,
  onClick,
  locked,
  attentionData,
  valueWeightedData,
  headDeltasData,
  selectedModel,
  selectedLayer,
  selectedHead,
  highlightMode,
}: {
  tokens: TokenInfo[];
  active: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  locked: number | null;
  attentionData: { t1: number[][][]; t2: number[][][] } | null;
  valueWeightedData: { t1: number[][][]; t2: number[][][] } | null;
  headDeltasData: { t1: Record<string, HeadDelta>; t2: Record<string, HeadDelta> } | null;
  selectedModel: "t1" | "t2";
  selectedLayer: number;
  selectedHead: number;
  highlightMode: "attention" | "value-weighted" | "delta";
}) {
  // Calculate attention scores for each token using selected head
  const getTokenAttentionScore = (tokenIdx: number): number => {
    if (!attentionData || active === null || active <= 0) return 0;

    const modelData = attentionData[selectedModel];
    if (!modelData || !modelData[selectedLayer] || !modelData[selectedLayer][selectedHead]) {
      return 0;
    }

    const headAttention = modelData[selectedLayer][selectedHead];
    return headAttention[tokenIdx] || 0;
  };

  // Calculate value-weighted attention scores
  const getTokenValueWeightedScore = (tokenIdx: number): number => {
    if (!valueWeightedData || active === null || active <= 0) return 0;

    const modelData = valueWeightedData[selectedModel];
    if (!modelData || !modelData[selectedLayer] || !modelData[selectedLayer][selectedHead]) {
      return 0;
    }

    const headValueWeighted = modelData[selectedLayer][selectedHead];
    return headValueWeighted[tokenIdx] || 0;
  };

  // Calculate delta score for each token using selected head
  const getTokenDeltaScore = (tokenIdx: number, tokenId: number): number => {
    if (!headDeltasData || active === null || active <= 0) return 0;

    const modelData = headDeltasData[selectedModel];
    if (!modelData) return 0;

    const headKey = `L${selectedLayer}H${selectedHead}`;
    const headData = modelData[headKey];
    if (!headData) return 0;

    // Find this token in promoted or suppressed lists
    const promoted = headData.top_promoted.find(t => t.id === tokenId);
    if (promoted) return promoted.delta;

    const suppressed = headData.top_suppressed.find(t => t.id === tokenId);
    if (suppressed) return suppressed.delta;

    return 0;
  };

  // Calculate scores based on mode
  const getTokenScore = (tokenIdx: number, tokenId: number): number => {
    if (highlightMode === "delta") {
      return getTokenDeltaScore(tokenIdx, tokenId);
    } else if (highlightMode === "value-weighted") {
      return getTokenValueWeightedScore(tokenIdx);
    }
    return getTokenAttentionScore(tokenIdx);
  };

  // Calculate max score for normalization
  const maxScore = Math.max(
    ...tokens.map((tok, idx) => Math.abs(getTokenScore(idx, tok.id)))
  );

  return (
    <div style={{ lineHeight: 1.8, wordBreak: "break-word", userSelect: "none" }}>
      {tokens.map((tok, idx) => {
        const disabled = idx === 0;
        const isLocked = locked === idx;
        const isActive = active === idx;
        const score = getTokenScore(idx, tok.id);
        const normalizedScore = maxScore > 0 ? Math.abs(score) / maxScore : 0;

        // Create background color based on mode
        let highlightColor: string;
        if (highlightMode === "delta") {
          // Green for positive delta, red for negative
          if (score > 0) {
            highlightColor = `rgba(46, 207, 139, ${normalizedScore * 0.4})`;
          } else if (score < 0) {
            highlightColor = `rgba(220, 68, 68, ${normalizedScore * 0.4})`;
          } else {
            highlightColor = "rgba(0,0,0,.02)";
          }
        } else {
          // Red for attention
          highlightColor = `rgba(255, 100, 100, ${normalizedScore * 0.3})`;
        }

        const tooltipText = disabled
          ? "bos"
          : highlightMode === "delta"
            ? `position ${idx} (delta: ${score.toFixed(4)}) - click to lock`
            : highlightMode === "value-weighted"
              ? `position ${idx} (value-weighted: ${score.toFixed(3)}) - click to lock`
              : `position ${idx} (attention: ${score.toFixed(3)}) - click to lock`;

        return (
          <span
            key={idx}
            title={tooltipText}
            onMouseEnter={() => (disabled ? undefined : onHover(idx))}
            onMouseLeave={() => (disabled ? undefined : onHover(null))}
            onClick={() => disabled ? undefined : onClick(idx)}
            style={{
              padding: "2px 1px",
              background: isActive
                ? isLocked
                  ? "rgba(46, 207, 139, .25)"  // Green tint when locked
                  : "rgba(0,160,255,.2)"
                : disabled
                  ? undefined
                  : (attentionData || headDeltasData)
                    ? highlightColor
                    : "rgba(0,160,255,.05)",
              cursor: disabled ? "default" : "pointer",
              borderBottom: disabled
                ? undefined
                : isActive
                ? isLocked
                  ? "2px solid #2ECF8B"  // Green border when locked
                  : "2px solid rgba(0,160,255,.8)"
                : "1px dashed rgba(0,160,255,.35)",
              position: "relative",
            }}
          >
            {tok.text || "␠"}
            {isLocked && (
              <span style={{
                fontSize: 10,
                marginLeft: 2,
                opacity: 0.7,
                verticalAlign: "super"
              }}>
                🔒
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
