import { useState } from "react";

interface TokenPoint {
  token: string;
  cluster: number;
  x2d: number;
  y2d: number;
  x3d: number;
  y3d: number;
  z3d: number;
}

// Generate synthetic token embedding data
function generateSyntheticData(): TokenPoint[] {
  const clusterData: Array<{ tokens: string[]; center2d: [number, number]; center3d: [number, number, number] }> = [
    {
      tokens: [" It", " He", " We", " She", " They", " S", " B", " D", " very", " well", " know", " should", " going", " may", " think"],
      center2d: [-0.5, 1.0],
      center3d: [1.0, -1.0, 0.5],
    },
    {
      tokens: [" is", " on", " as", "'s", " by", " from", "The", " The", " or", " at"],
      center2d: [-10.0, -0.5],
      center3d: [8.0, 2.0, -1.0],
    },
    {
      tokens: [" In", "S", "It", " don", " U", " B", " said", " An"],
      center2d: [-17.0, -9.0],
      center3d: [3.0, -5.0, 1.5],
    },
    {
      tokens: [" the", ",", " of", " and"],
      center2d: [-2.0, 2.0],
      center3d: [2.5, 3.0, 0.0],
    },
    {
      tokens: [" to", " a"],
      center2d: [-6.0, -0.5],
      center3d: [6.0, 1.0, -2.0],
    },
    {
      tokens: ["'", " it", " have", " has", " not", " said", " an", " but", " more", " about", " been"],
      center2d: [-3.0, 0.0],
      center3d: [4.0, -1.0, -1.5],
    },
    {
      tokens: [".", " in", " that", " for", "s", " with"],
      center2d: [-4.0, 1.5],
      center3d: [5.0, 0.5, 1.0],
    },
    {
      tokens: ["\n", "-", "1", " I", " you", " (", ' "', "2", "9", "5", " who", "3", "4", " had", " up"],
      center2d: [-1.5, 1.8],
      center3d: [3.0, 2.5, 2.0],
    },
    {
      tokens: ["0", " was", " be", " are", " at", ":", " this", " his", " their", " its"],
      center2d: [-2.5, 0.8],
      center3d: [2.0, 1.5, -0.5],
    },
    {
      tokens: [" 2", " 1", " he", " will", " they", " we", " can", " would", " people", " there", "?", " if", " do", " time", " year", " make", " get"],
      center2d: [-1.0, 1.5],
      center3d: [1.5, 2.0, 0.5],
    },
  ];

  const clusterDescriptions2d = [
    "Sentence-initial & proper nouns",
    "Prepositions & copula",
    "Miscellaneous mid-frequency",
    "Ultra-high frequency core",
    "Infinitive marker & indefinite article",
    "Auxiliary verbs & negation",
    "Period & subordinators",
    "Formatting & 1st/2nd person",
    "Past tense & possessive determiners",
    "Modal verbs & 3rd person",
  ];

  const clusterDescriptions3d = [
    "Miscellaneous mid-frequency words",
    "Prepositions & determiners",
    "Miscellaneous mid-frequency",
    "Ultra-high frequency core",
    "Line breaks & quotes",
    "Copula, auxiliaries & possessives",
    "Period only",
    "Pronouns & modal verbs",
    "Common function words",
    "Content words & numbers",
  ];

  const points: TokenPoint[] = [];

  clusterData.forEach((cluster, clusterIdx) => {
    cluster.tokens.forEach((token) => {
      // Add some random spread around the cluster center
      const spread2d = 1.5;
      const spread3d = 2.0;

      points.push({
        token,
        cluster: clusterIdx,
        x2d: cluster.center2d[0] + (Math.random() - 0.5) * spread2d,
        y2d: cluster.center2d[1] + (Math.random() - 0.5) * spread2d,
        x3d: cluster.center3d[0] + (Math.random() - 0.5) * spread3d,
        y3d: cluster.center3d[1] + (Math.random() - 0.5) * spread3d,
        z3d: cluster.center3d[2] + (Math.random() - 0.5) * spread3d,
      });
    });
  });

  return points;
}

const CLUSTER_COLORS = [
  "#FFB6C1", // pink - Cluster 0
  "#DEB887", // tan - Cluster 1
  "#9ACD32", // olive - Cluster 2
  "#8B4513", // brown - Cluster 3
  "#87CEEB", // sky blue - Cluster 4
  "#20B2AA", // light sea green - Cluster 5
  "#4682B4", // steel blue - Cluster 6
  "#9370DB", // medium purple - Cluster 7
  "#FF69B4", // hot pink - Cluster 8
  "#FFA07A", // light salmon - Cluster 9
];

const CLUSTER_DESCRIPTIONS_2D = [
  "Sentence-initial & proper nouns",
  "Prepositions & copula",
  "Miscellaneous mid-frequency",
  "Ultra-high frequency core",
  "Infinitive marker & indefinite article",
  "Auxiliary verbs & negation",
  "Period & subordinators",
  "Formatting & 1st/2nd person",
  "Past tense & possessive determiners",
  "Modal verbs & 3rd person",
];

const CLUSTER_DESCRIPTIONS_3D = [
  "Miscellaneous mid-frequency words",
  "Prepositions & determiners",
  "Miscellaneous mid-frequency",
  "Ultra-high frequency core",
  "Line breaks & quotes",
  "Copula, auxiliaries & possessives",
  "Period only",
  "Pronouns & modal verbs",
  "Common function words",
  "Content words & numbers",
];

export function TokenEmbeddingDiagram() {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [hoveredPoint, setHoveredPoint] = useState<TokenPoint | null>(null);
  const [data] = useState(() => generateSyntheticData());

  const is3D = view === "3d";
  const clusterDescriptions = is3D ? CLUSTER_DESCRIPTIONS_3D : CLUSTER_DESCRIPTIONS_2D;

  // Calculate bounds for normalization
  const bounds2d = data.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x2d),
      maxX: Math.max(acc.maxX, p.x2d),
      minY: Math.min(acc.minY, p.y2d),
      maxY: Math.max(acc.maxY, p.y2d),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const bounds3d = data.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x3d),
      maxX: Math.max(acc.maxX, p.x3d),
      minY: Math.min(acc.minY, p.y3d),
      maxY: Math.max(acc.maxY, p.y3d),
      minZ: Math.min(acc.minZ, p.z3d),
      maxZ: Math.max(acc.maxZ, p.z3d),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );

  // Normalize coordinates to SVG space
  const padding = 40;
  const width = 500;
  const height = 300;

  const normalizePoint = (point: TokenPoint) => {
    if (is3D) {
      // Simple isometric projection: x' = x - z*0.5, y' = y - z*0.5
      const rangeX = bounds3d.maxX - bounds3d.minX;
      const rangeY = bounds3d.maxY - bounds3d.minY;
      const rangeZ = bounds3d.maxZ - bounds3d.minZ;

      const normX = (point.x3d - bounds3d.minX) / rangeX;
      const normY = (point.y3d - bounds3d.minY) / rangeY;
      const normZ = (point.z3d - bounds3d.minZ) / rangeZ;

      // Apply isometric projection
      const isoX = normX - normZ * 0.5;
      const isoY = normY - normZ * 0.5;

      return {
        x: padding + isoX * (width - 2 * padding),
        y: height - padding - isoY * (height - 2 * padding),
      };
    } else {
      const rangeX = bounds2d.maxX - bounds2d.minX;
      const rangeY = bounds2d.maxY - bounds2d.minY;

      return {
        x: padding + ((point.x2d - bounds2d.minX) / rangeX) * (width - 2 * padding),
        y: height - padding - ((point.y2d - bounds2d.minY) / rangeY) * (height - 2 * padding),
      };
    }
  };

  return (
    <figure className="my-8 p-6 bg-white rounded-lg border border-neutral-200">
      {/* Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md border border-neutral-300" role="group">
          <button
            onClick={() => setView("2d")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              view === "2d"
                ? "bg-neutral-800 text-white"
                : "bg-white text-neutral-700 hover:bg-neutral-50"
            } rounded-l-md`}
          >
            2D
          </button>
          <button
            onClick={() => setView("3d")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors border-l border-neutral-300 ${
              view === "3d"
                ? "bg-neutral-800 text-white"
                : "bg-white text-neutral-700 hover:bg-neutral-50"
            } rounded-r-md`}
          >
            3D
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Title */}
        <text x={width / 2} y="20" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0E1111" fontFamily="system-ui">
          Token Embeddings in {is3D ? "3D" : "2D"} Space (SVD)
        </text>
        <text x={width / 2} y="36" textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui">
          1000 Most Frequent Tokens, 10 K-Means Clusters
        </text>

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#a3a3a3" strokeWidth="1.5" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#a3a3a3" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui">
          Dimension 1
        </text>
        <text x="15" y={height / 2} textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui" transform={`rotate(-90 15 ${height / 2})`}>
          Dimension 2
        </text>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <g key={frac}>
            <line
              x1={padding}
              y1={padding + frac * (height - 2 * padding)}
              x2={width - padding}
              y2={padding + frac * (height - 2 * padding)}
              stroke="#e5e5e5"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <line
              x1={padding + frac * (width - 2 * padding)}
              y1={padding}
              x2={padding + frac * (width - 2 * padding)}
              y2={height - padding}
              stroke="#e5e5e5"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* Points */}
        {data.map((point, idx) => {
          const pos = normalizePoint(point);
          const isHovered = hoveredPoint === point;

          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? "5" : "3.5"}
              fill={CLUSTER_COLORS[point.cluster]}
              fillOpacity={isHovered ? 1.0 : 0.7}
              stroke={isHovered ? "#0E1111" : "none"}
              strokeWidth={isHovered ? "1.5" : "0"}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              className="cursor-pointer transition-all"
            />
          );
        })}

        {/* Tooltip */}
        {hoveredPoint && (
          <g>
            {(() => {
              const pos = normalizePoint(hoveredPoint);
              const tooltipWidth = 160;
              const tooltipHeight = 50;
              const tooltipX = Math.min(Math.max(pos.x - tooltipWidth / 2, padding), width - padding - tooltipWidth);
              const tooltipY = pos.y > height / 2 ? pos.y - tooltipHeight - 15 : pos.y + 15;

              return (
                <>
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    rx="4"
                    fill="#0E1111"
                    fillOpacity="0.95"
                  />
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 18}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="600"
                    fill="white"
                    fontFamily="Monaco, monospace"
                  >
                    {hoveredPoint.token === "\n" ? "\\n" : hoveredPoint.token}
                  </text>
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 34}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#d4d4d4"
                    fontFamily="system-ui"
                  >
                    Cluster {hoveredPoint.cluster}
                  </text>
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 45}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#a3a3a3"
                    fontFamily="system-ui"
                  >
                    {clusterDescriptions[hoveredPoint.cluster].slice(0, 30)}...
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      <figcaption className="mt-4 text-sm leading-relaxed text-neutral-600">
        A classic bigram model has to remember a separate rule for every specific token pair: "after <span className="font-mono text-xs">San</span> comes{" "}
        <span className="font-mono text-xs">Francisco</span>", "after <span className="font-mono text-xs">New</span> comes{" "}
        <span className="font-mono text-xs">York</span>", and so on, for all <strong>50k×50k possibilities</strong>.
        <br />
        <br />
        A <strong>learned bigram model</strong> does something lazier and smarter. It first squishes tokens into clusters of "behave-the-same-way here" – e.g., a
        cluster for "city-prefix-like tokens", a cluster for "opening-quote-like tokens", a cluster for "digits", etc. Then it mostly just learns what tends to come
        after each cluster, instead of after each individual token.
        <br />
        <br />
        So instead of "if the last token was <span className="font-mono text-xs">San</span>, use rule #18,234,712", it's more like "the last token belongs to the
        'city-prefix' cluster, and for that cluster we usually follow with a 'city-name' cluster". All the different tokens in that cluster share the same downstream
        rules, which is where the <strong>compression</strong> comes from.
      </figcaption>
    </figure>
  );
}
