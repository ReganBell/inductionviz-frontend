import { Heatmap } from "../Heatmap";

export function AttnPanel({
  label,
  attn,
  valueWeightedAttn,
  showValueWeighted,
}: {
  label: string;
  attn: number[][][];
  valueWeightedAttn: number[][][];
  showValueWeighted: boolean;
}) {
  const dataToShow = showValueWeighted ? valueWeightedAttn : attn;
  const suffix = showValueWeighted ? " (value-weighted)" : "";

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}{suffix}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {dataToShow.map((layer, layerIdx) =>
          layer.map((head, headIdx) => (
            <Heatmap
              key={`${label}-${layerIdx}-${headIdx}`}
              matrix={[head]}
              size={200}
              title={`L${layerIdx} H${headIdx}`}
            />
          )),
        )}
      </div>
    </div>
  );
}
