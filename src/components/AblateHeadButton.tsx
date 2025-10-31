export function AblateHeadButton({
  onClick,
  loading,
  disabled,
  position,
  model,
  layer,
  head,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  position?: number;
  model: string;
  layer: number;
  head: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={onClick}
        disabled={loading || disabled}
        style={{
          padding: "10px 16px",
          borderRadius: 6,
          border: "1px solid #2ECF8B",
          background: loading || disabled ? "rgba(0,0,0,.1)" : "#2ECF8B",
          color: loading || disabled ? "rgba(0,0,0,.4)" : "white",
          fontWeight: 600,
          cursor: loading || disabled ? "not-allowed" : "pointer",
          fontSize: 14,
        }}
      >
        {loading ? "Analyzing..." : "Ablate Selected Head"}
      </button>
      {position !== undefined && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Will analyze {model.toUpperCase()} L{layer}H{head} at position {position}
        </div>
      )}
    </div>
  );
}
