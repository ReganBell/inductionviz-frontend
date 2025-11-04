interface OVPrediction {
  token: string;
  id: number;
  logit: number;
}

interface OVCircuitWidgetProps {
  tokens: string[];
  ovLogits: OVPrediction[] | null;
  hoveredSourceToken: number | null;
  hoveredToken: number | null;
  lockedToken: number | null;
}

export function OVCircuitWidget({
  tokens,
  ovLogits,
  hoveredSourceToken,
  hoveredToken,
  lockedToken,
}: OVCircuitWidgetProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        OV Circuit (Value Contributions)
      </h4>
      <div className="p-4 min-h-[300px] flex flex-col justify-center">
        {/* Top-k logits display */}
        {ovLogits && hoveredSourceToken !== null && hoveredToken !== null ? (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3 text-center">
              Most-boosted predictions when attending to <code className="bg-neutral-800 text-white px-1 rounded text-[13px] font-mono">{tokens[hoveredSourceToken]}</code>:
            </p>
            <div className="space-y-1">
              {(() => {
                // Calculate max logit for scaling (0 is always the minimum)
                const maxLogit = Math.max(...ovLogits.map(item => item.logit));

                return ovLogits.map((item, i) => {
                  // Scale from 0 to max to avoid misleading visualization
                  const width = maxLogit > 0 ? (item.logit / maxLogit) * 100 : 0;

                  return (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                      <div className="w-20 shrink-0 font-mono text-sm text-neutral-800">
                        {item.token}
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="h-2 rounded-sm bg-neutral-100">
                          <div
                            className="h-2 rounded-sm bg-neutral-300 transition-all duration-300"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
                        {item.logit.toFixed(2)}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm text-center px-4">
            {lockedToken !== null
              ? "Hover over previous tokens to see OV contributions"
              : "Click a token in the strip above, then hover previous tokens"}
          </div>
        )}
      </div>
    </div>
  );
}
