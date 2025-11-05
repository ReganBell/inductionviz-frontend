import { useState, useEffect, useMemo } from "react";

interface TrainingData {
  steps: number[];
  loss: (number | null)[];
  learning_rate: number[];
  heads: {
    [key: string]: {
      prev_tok: number[];
      induction: number[];
      layer: number;
      head: number;
    };
  };
  composition: {
    [key: string]: number[];
  };
  final_composition: {
    [key: string]: number;
  };
  final_head_scores: {
    [key: string]: {
      prev_tok: number;
      induction: number;
    };
  };
}

const HEAD_COLORS: Record<number, string> = {
  0: "#EF4444", // red
  1: "#F97316", // orange
  2: "#F59E0B", // amber
  3: "#10B981", // green
  4: "#3B82F6", // blue
  5: "#6366F1", // indigo
  6: "#8B5CF6", // purple
  7: "#EC4899", // pink
};

export function EvolutionWidget() {
  const [data, setData] = useState<TrainingData | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedPrevHead, setSelectedPrevHead] = useState<string>("L0H3");
  const [selectedIndHead, setSelectedIndHead] = useState<string>("L1H6");
  const [isPlaying, setIsPlaying] = useState(false);

  // Load training data
  useEffect(() => {
    fetch("/training_evolution.json")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Error loading training data:", err));
  }, []);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !data) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= data.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // 100ms per step

    return () => clearInterval(interval);
  }, [isPlaying, data]);

  if (!data) {
    return (
      <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">Loading training data...</div>
      </div>
    );
  }

  const currentStep = data.steps[currentStepIdx];
  const currentLoss = data.loss[currentStepIdx];

  // Get current metrics for selected heads
  const prevHeadMetrics = data.heads[selectedPrevHead];
  const indHeadMetrics = data.heads[selectedIndHead];

  const currentPrevTok = prevHeadMetrics?.prev_tok[currentStepIdx] || 0;
  const currentInduction = indHeadMetrics?.induction[currentStepIdx] || 0;

  // Get composition score between selected heads
  const compositionKey = `${selectedIndHead}_${selectedPrevHead}`;
  const currentComposition = data.final_composition[compositionKey] || 0;

  // Calculate valid loss range (excluding null/infinity)
  const validLosses = data.loss.filter((l) => l !== null && l !== undefined);
  const minLoss = Math.min(...validLosses);
  const maxLoss = Math.max(...validLosses);

  return (
    <div className="my-12 p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Evolution of Induction Circuits
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Watch how the {selectedPrevHead} → {selectedIndHead} circuit emerges during training
        </p>
      </div>

      {/* Timeline Scrubber */}
      <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Step {currentStep.toLocaleString()} / {data.steps[data.steps.length - 1].toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Loss: {currentLoss === null ? "∞" : currentLoss.toFixed(4)}
          </div>
        </div>

        {/* Loss curve background */}
        <div className="relative h-24 mb-4">
          <svg className="w-full h-full" preserveAspectRatio="none">
            {/* Loss curve */}
            <polyline
              points={data.steps
                .map((_, idx) => {
                  const x = (idx / (data.steps.length - 1)) * 100;
                  const loss = data.loss[idx];
                  if (loss === null || loss === undefined) return null;
                  const y = 100 - ((loss - minLoss) / (maxLoss - minLoss)) * 80;
                  return `${x},${y}`;
                })
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#93C5FD"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Current position indicator */}
            <line
              x1={`${(currentStepIdx / (data.steps.length - 1)) * 100}%`}
              y1="0"
              x2={`${(currentStepIdx / (data.steps.length - 1)) * 100}%`}
              y2="100"
              stroke="#3B82F6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={data.steps.length - 1}
          value={currentStepIdx}
          onChange={(e) => {
            setCurrentStepIdx(parseInt(e.target.value));
            setIsPlaying(false);
          }}
          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
              (currentStepIdx / (data.steps.length - 1)) * 100
            }%, #DBEAFE ${(currentStepIdx / (data.steps.length - 1)) * 100}%, #DBEAFE 100%)`,
          }}
        />

        {/* Playback controls */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStepIdx(0)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Reset
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Visual Architecture */}
      <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Q-Composition: How Layer 1 heads rely on Layer 0 heads
        </h4>

        <div className="relative w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden" style={{ height: "260px" }}>
          <svg className="absolute inset-0 w-full h-full">
            {/* Draw Q-composition connections */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((l1Head) =>
              [0, 1, 2, 3, 4, 5, 6, 7].map((l0Head) => {
                const compKey = `L1H${l1Head}_L0H${l0Head}`;
                const finalScore = data.final_composition[compKey] || 0;
                if (finalScore <= 0.001) return null;

                // Calculate positions (Layer 0 top, Layer 1 bottom)
                const totalWidth = 7 * 60; // 8 heads, 60px spacing
                const l0X = l0Head * 60 - totalWidth / 2 + 240;
                const l0Y = 60;
                const l1X = l1Head * 60 - totalWidth / 2 + 240;
                const l1Y = 180;

                // Show connections emerging over training
                // Use a simple linear emergence based on training progress
                const trainingProgress = currentStepIdx / (data.steps.length - 1);
                const normalizedScore = Math.max(0, finalScore / 0.05);
                const intensity = Math.pow(normalizedScore, 2);

                // Scale visibility by training progress
                const emergenceOpacity = Math.min(trainingProgress * 1.2, 1) * intensity;
                const opacity = Math.min(emergenceOpacity * 0.7, 0.7);
                const strokeWidth = Math.max(0.5, intensity * 6);

                // Highlight key circuit
                const l0Key = `L0H${l0Head}`;
                const l1Key = `L1H${l1Head}`;
                const isKeyCircuit = l0Key === selectedPrevHead && l1Key === selectedIndHead;

                return (
                  <line
                    key={`comp-${l1Head}-${l0Head}`}
                    x1={l0X}
                    y1={l0Y + 24}
                    x2={l1X}
                    y2={l1Y - 24}
                    stroke={isKeyCircuit ? "#EC4899" : "#0066ff"}
                    strokeWidth={isKeyCircuit ? strokeWidth + 2 : strokeWidth}
                    opacity={isKeyCircuit ? Math.min(opacity + 0.3, 0.9) : opacity}
                    strokeLinecap="round"
                  />
                );
              })
            )}
          </svg>

          {/* Layer 0 Heads */}
          <div className="absolute left-0 top-0 w-full">
            <div className="absolute left-5 top-11 text-xs font-semibold text-gray-600">
              Layer 0
            </div>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((head) => {
              const totalWidth = 7 * 60;
              const x = head * 60 - totalWidth / 2 + 240;
              const y = 60;
              const headKey = `L0H${head}`;
              const isSelected = headKey === selectedPrevHead;

              return (
                <div
                  key={`l0h${head}`}
                  onClick={() => setSelectedPrevHead(headKey)}
                  className="absolute cursor-pointer transition-all"
                  style={{
                    left: `${x - 24}px`,
                    top: `${y - 24}px`,
                    width: "48px",
                    height: "48px",
                  }}
                  title={`L0H${head} - prev_tok: ${(data.heads[headKey].prev_tok[currentStepIdx] * 100).toFixed(0)}%`}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-2 text-white shadow-lg"
                        : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: HEAD_COLORS[head],
                            borderColor: HEAD_COLORS[head],
                          }
                        : undefined
                    }
                  >
                    {head}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Layer 1 Heads */}
          <div className="absolute left-0 top-0 w-full">
            <div className="absolute left-5 top-11" style={{ top: "171px" }}>
              <span className="text-xs font-semibold text-gray-600">Layer 1</span>
            </div>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((head) => {
              const totalWidth = 7 * 60;
              const x = head * 60 - totalWidth / 2 + 240;
              const y = 180;
              const headKey = `L1H${head}`;
              const isSelected = headKey === selectedIndHead;

              return (
                <div
                  key={`l1h${head}`}
                  onClick={() => setSelectedIndHead(headKey)}
                  className="absolute cursor-pointer transition-all"
                  style={{
                    left: `${x - 24}px`,
                    top: `${y - 24}px`,
                    width: "48px",
                    height: "48px",
                  }}
                  title={`L1H${head} - induction: ${(data.heads[headKey].induction[currentStepIdx] * 100).toFixed(0)}%`}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-2 text-white shadow-lg"
                        : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: HEAD_COLORS[head],
                            borderColor: HEAD_COLORS[head],
                          }
                        : undefined
                    }
                  >
                    {head}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Blue lines show Q-composition strength (how much L1 relies on L0).
          <span className="text-pink-600 font-semibold"> Pink = selected circuit</span>.
          <strong> Key circuit: L0H3 → L1H6</strong> (Q-comp: {data.final_composition["L1H6_L0H3"]?.toFixed(3)})
        </div>
      </div>

      {/* Head Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Previous Token Head (Layer 0)
            </div>
            <div className="flex gap-2">
              {["L0H3", "L0H5", "L0H6"].map((head) => (
                <button
                  key={head}
                  onClick={() => setSelectedPrevHead(head)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedPrevHead === head
                      ? "bg-green-100 text-green-900 border-2 border-green-500"
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {head}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Induction Head (Layer 1)
            </div>
            <button
              className="px-3 py-1 text-sm rounded bg-purple-100 text-purple-900 border-2 border-purple-500"
            >
              {selectedIndHead}
            </button>
          </div>
        </div>
      </div>

      {/* Metric Evolution Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Previous Token Head Evolution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            {selectedPrevHead} Previous Token Score
          </h4>

          <div className="relative h-48 mb-2">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={`${(1 - y) * 100}%`}
                  x2="100%"
                  y2={`${(1 - y) * 100}%`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              {/* Score line */}
              <polyline
                points={data.steps
                  .map((_, idx) => {
                    const x = (idx / (data.steps.length - 1)) * 100;
                    const score = prevHeadMetrics.prev_tok[idx];
                    const y = (1 - score) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Current position */}
              <circle
                cx={`${(currentStepIdx / (data.steps.length - 1)) * 100}%`}
                cy={`${(1 - currentPrevTok) * 100}%`}
                r="4"
                fill="#10B981"
              />
            </svg>
          </div>

          <div className="text-center text-sm text-gray-600">
            Current: <strong>{(currentPrevTok * 100).toFixed(1)}%</strong> →
            Final: <strong>{(data.final_head_scores[selectedPrevHead].prev_tok * 100).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Induction Head Evolution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            {selectedIndHead} Induction Score
          </h4>

          <div className="relative h-48 mb-2">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={`${(1 - y) * 100}%`}
                  x2="100%"
                  y2={`${(1 - y) * 100}%`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              {/* Score line */}
              <polyline
                points={data.steps
                  .map((_, idx) => {
                    const x = (idx / (data.steps.length - 1)) * 100;
                    const score = indHeadMetrics.induction[idx];
                    const y = (1 - score) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Current position */}
              <circle
                cx={`${(currentStepIdx / (data.steps.length - 1)) * 100}%`}
                cy={`${(1 - currentInduction) * 100}%`}
                r="4"
                fill="#8B5CF6"
              />
            </svg>
          </div>

          <div className="text-center text-sm text-gray-600">
            Current: <strong>{(currentInduction * 100).toFixed(1)}%</strong> →
            Final: <strong>{(data.final_head_scores[selectedIndHead].induction * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
