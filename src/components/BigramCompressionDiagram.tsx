import React from "react";

export function BigramCompressionDiagram() {
  // Data points for the visualization
  const models = [
    { name: "Full Bigram", size: 10000, loss: 1.0, x: 90, label: "~10GB\n(sparse)" },
    { name: "d=512", size: 512, loss: 1.05, x: 60 },
    { name: "d=128", size: 128, loss: 1.15, x: 45 },
    { name: "d=32", size: 32, loss: 1.35, x: 30 },
    { name: "POS-based", size: 1, loss: 2.5, x: 10, label: "~100B\n(parts of speech)" },
  ];

  // Normalize for visualization
  const maxSize = 10000;
  const maxLoss = 3.0;

  return (
    <figure className="my-8 p-6 bg-white rounded-lg border border-neutral-200">
      <svg viewBox="0 0 500 300" className="w-full h-auto">
        {/* Title */}
        <text x="250" y="20" textAnchor="middle" fontSize="14" fontWeight="600" fill="#262626" fontFamily="system-ui">
          Compression vs. Accuracy Tradeoff
        </text>

        {/* Axes */}
        <line x1="60" y1="240" x2="460" y2="240" stroke="#a3a3a3" strokeWidth="2" />
        <line x1="60" y1="50" x2="60" y2="240" stroke="#a3a3a3" strokeWidth="2" />

        {/* Axis labels */}
        <text x="250" y="270" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui">
          Model Size (smaller →)
        </text>
        <text x="30" y="145" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui" transform="rotate(-90 30 145)">
          Loss (lower is better)
        </text>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1="60"
            y1={50 + frac * 190}
            x2="460"
            y2={50 + frac * 190}
            stroke="#e5e5e5"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Plot points and connect with line */}
        <polyline
          points={models.map(m => {
            const x = 60 + (100 - m.x) * 4;
            const y = 240 - ((maxLoss - m.loss) / maxLoss) * 190;
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke="#2ECF8B"
          strokeWidth="2.5"
        />

        {/* Points */}
        {models.map((model, i) => {
          const x = 60 + (100 - model.x) * 4;
          const y = 240 - ((maxLoss - model.loss) / maxLoss) * 190;
          const isExtreme = i === 0 || i === models.length - 1;

          return (
            <g key={model.name}>
              {/* Point */}
              <circle
                cx={x}
                cy={y}
                r={isExtreme ? "6" : "5"}
                fill={isExtreme ? "#2ECF8B" : "#fff"}
                stroke={isExtreme ? "#0E1111" : "#2ECF8B"}
                strokeWidth={isExtreme ? "2" : "2"}
              />

              {/* Label */}
              <text
                x={x}
                y={y - (isExtreme ? 20 : 15)}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isExtreme ? "600" : "500"}
                fill="#0E1111"
                fontFamily="system-ui"
              >
                {model.name}
              </text>

              {/* Size annotation for extremes */}
              {model.label && (
                <text
                  x={x}
                  y={y + (i === 0 ? -35 : 25)}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#737373"
                  fontFamily="system-ui"
                >
                  {model.label.split('\n').map((line, idx) => (
                    <tspan key={idx} x={x} dy={idx === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}

        {/* Sweet spot annotation */}
        <g>
          <rect
            x="190"
            y="110"
            width="140"
            height="40"
            rx="4"
            fill="#FCFCFC"
            stroke="#2ECF8B"
            strokeWidth="1.5"
            strokeDasharray="3,2"
          />
          <text x="260" y="127" textAnchor="middle" fontSize="10" fill="#0E1111" fontFamily="system-ui">
            <tspan fontWeight="600">Sweet spot:</tspan>
          </text>
          <text x="260" y="140" textAnchor="middle" fontSize="9" fill="#525252" fontFamily="system-ui">
            1000× smaller, nearly as good
          </text>
        </g>
      </svg>

      <figcaption className="mt-4 text-sm leading-snug text-neutral-600 text-center">
        Our learned bigram model compresses 10GB of statistics into ~1KB with minimal loss in accuracy.
        An extreme compression (using only part-of-speech tags) would be tiny but much less accurate.
      </figcaption>
    </figure>
  );
}
