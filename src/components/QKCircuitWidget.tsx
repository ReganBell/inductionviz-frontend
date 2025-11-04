interface QKCircuitWidgetProps {
  tokens: string[];
  affinityMatrix: number[][];
  hoveredToken: number | null;
  hoveredSourceToken: number | null;
  onMatrixCellHover: (rowIdx: number, colIdx: number) => void;
  onMatrixCellLeave: () => void;
}

export function QKCircuitWidget({
  tokens,
  affinityMatrix,
  hoveredToken,
  hoveredSourceToken,
  onMatrixCellHover,
  onMatrixCellLeave,
}: QKCircuitWidgetProps) {
  // Color scale from gray (0) to dark red-orange
  const getColor = (value: number) => {
    if (value === 0) {
      return '#e5e7eb'; // gray-200 for zero/empty values
    }
    const intensity = Math.floor(value * 255);
    return `rgb(${255}, ${140 - intensity * 0.4}, ${100 - intensity * 0.3})`;
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        QK Circuit (Affinity Matrix)
      </h4>
      <div className="p-4">
        <div className="flex justify-center">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10"></th>
                {tokens.map((token, i) => (
                  <th key={i} className="text-[10px] p-0.5 text-gray-600 font-normal">
                    <div className="w-8 truncate text-center">{token}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((rowToken, i) => {
                const isRowHighlighted = hoveredToken === i;
                const shouldDim = hoveredToken !== null && hoveredToken !== i;

                return (
                  <tr key={i} className={shouldDim ? "opacity-30" : "opacity-100 transition-opacity"}>
                    <td className="text-[10px] p-0.5 text-gray-600 font-medium">
                      <div className="w-10 truncate text-right pr-1">{rowToken}</div>
                    </td>
                    {tokens.map((_, j) => {
                      const isColHighlighted = hoveredSourceToken === j;
                      const isCellHighlighted = isRowHighlighted && isColHighlighted;

                      return (
                        <td key={j} className="p-0">
                          <div
                            className={`w-8 h-8 border flex items-center justify-center text-[9px] font-mono cursor-pointer transition-all ${
                              isCellHighlighted
                                ? "border-blue-500 border-2 ring-2 ring-blue-200"
                                : isRowHighlighted || isColHighlighted
                                ? "border-gray-300"
                                : "border-gray-100"
                            }`}
                            style={{ backgroundColor: getColor(affinityMatrix[i][j]) }}
                            onMouseEnter={() => onMatrixCellHover(i, j)}
                            onMouseLeave={onMatrixCellLeave}
                          >
                            {affinityMatrix[i][j] > 0.15 && (
                              <span className="text-white drop-shadow">
                                {(affinityMatrix[i][j] * 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {hoveredToken !== null && hoveredSourceToken !== null && hoveredToken < tokens.length && hoveredSourceToken < tokens.length ? (
            <>
              Assign {(affinityMatrix[hoveredToken][hoveredSourceToken] * 100).toFixed(0)}% attention to <code className="bg-gray-100 px-1 rounded">{tokens[hoveredSourceToken]}</code> to guess the token after <code className="bg-gray-100 px-1 rounded">{tokens[hoveredToken]}</code>
            </>
          ) : hoveredToken !== null && hoveredToken < tokens.length ? (
            <>
              Cols: what should we attend to guess the token after <code className="bg-gray-100 px-1 rounded">{tokens[hoveredToken]}</code>?
            </>
          ) : (
            "Rows: current token. Cols: which tokens to attend to?"
          )}
        </p>
      </div>
    </div>
  );
}
