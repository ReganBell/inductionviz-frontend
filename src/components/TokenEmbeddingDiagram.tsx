import { useState } from "react";
import seedrandom from "seedrandom";

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


  const points: TokenPoint[] = [];
  const rng = seedrandom("999999"); // Seed for reproducible randomness

  clusterData.forEach((cluster, clusterIdx) => {
    cluster.tokens.forEach((token) => {
      // Add some random spread around the cluster center
      const spread2d = 1.5;
      const spread3d = 2.0;

      points.push({
        token,
        cluster: clusterIdx,
        x2d: cluster.center2d[0] + (rng() - 0.5) * spread2d,
        y2d: cluster.center2d[1] + (rng() - 0.5) * spread2d,
        x3d: cluster.center3d[0] + (rng() - 0.5) * spread3d,
        y3d: cluster.center3d[1] + (rng() - 0.5) * spread3d,
        z3d: cluster.center3d[2] + (rng() - 0.5) * spread3d,
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

export function TokenEmbeddingDiagram() {
  const [hoveredPoint, setHoveredPoint] = useState<TokenPoint | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [data] = useState(() => generateSyntheticData());

  // Get actual tokens for each cluster
  const clusterDescriptions = Array.from({ length: 10 }, (_, clusterIdx) => {
    const tokensInCluster = data
      .filter(p => p.cluster === clusterIdx)
      .map(p => p.token === "\n" ? "\\n" : p.token);
    return tokensInCluster.join(", ");
  });

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

  // Normalize coordinates to SVG space
  const padding = 40;
  const width = 500;
  const height = 300;

  const normalizePoint = (point: TokenPoint) => {
    const rangeX = bounds2d.maxX - bounds2d.minX;
    const rangeY = bounds2d.maxY - bounds2d.minY;

    return {
      x: padding + ((point.x2d - bounds2d.minX) / rangeX) * (width - 2 * padding),
      y: height - padding - ((point.y2d - bounds2d.minY) / rangeY) * (height - 2 * padding),
    };
  };

  return (
    <figure className="my-12 -mx-[25%] p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex gap-6">
        {/* Left: Scatter plot */}
        <div className="flex-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Title */}
        {/* <text x={width / 2} y="20" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0E1111" fontFamily="system-ui">
          Token Embeddings in 2D Space (SVD)
        </text>
        <text x={width / 2} y="36" textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui">
          1000 Most Frequent Tokens, 10 K-Means Clusters
        </text> */}

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#a3a3a3" strokeWidth="1.5" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#a3a3a3" strokeWidth="1.5" />

        {/* Axis labels */}
        {/* <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui">
          Dimension 1
        </text>
        <text x="15" y={height / 2} textAnchor="middle" fontSize="11" fill="#525252" fontFamily="system-ui" transform={`rotate(-90 15 ${height / 2})`}>
          Dimension 2
        </text> */}

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
          const isClusterHighlighted = hoveredCluster === point.cluster;
          const isDimmed = hoveredCluster !== null && hoveredCluster !== point.cluster;

          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r={isHovered || isClusterHighlighted ? "5" : "3.5"}
              fill={CLUSTER_COLORS[point.cluster]}
              fillOpacity={isDimmed ? 0.15 : isHovered || isClusterHighlighted ? 1.0 : 0.7}
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
        </div>

        {/* Right: Cluster list */}
        <div className="w-64 shrink-0">
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">Clusters</h4>
          <div className="space-y-2">
            {clusterDescriptions.map((description, idx) => {
              const tokenCount = data.filter(p => p.cluster === idx).length;
              const isHovered = hoveredCluster === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCluster(idx)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  className={`p-2 rounded cursor-pointer transition-all ${
                    isHovered ? 'bg-neutral-100 shadow-sm' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CLUSTER_COLORS[idx] }}
                    />
                    <span className="text-xs font-semibold text-neutral-700">
                      Cluster {idx}
                    </span>
                    <span className="text-xs text-neutral-400 ml-auto">
                      {tokenCount}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-snug font-mono">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <figcaption className="mt-6 text-sm leading-relaxed text-neutral-600">
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
