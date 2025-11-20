import React, { useEffect, useState } from "react";

const HEAD_L1 = "L1H0";
const HEAD_L0 = "L0H4";

const TOKEN_SEQUENCE = ["My", "name", "is", "Regan"] as const;
const ACTIVE_POSITION = 3;

type EvolutionHeadMetrics = {
  induction_test?: number[];
  prev_tok?: number[];
};

type EvolutionData = {
  steps: number[];
  heads: Record<string, EvolutionHeadMetrics>;
};

export function GradientForceWidget() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch("/training_evolution.json")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load training_evolution.json", err));
  }, []);

  useEffect(() => {
    if (!isPlaying || !data) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= data.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying, data]);

  if (!data) {
    return <div className="p-8 text-gray-500">Loading circuit data...</div>;
  }

  const cappedStepIndex = Math.min(stepIndex, Math.max(0, data.steps.length - 1));
  const currentStep = data.steps[cappedStepIndex] ?? 0;
  const inductionScore = data.heads[HEAD_L1]?.induction_test?.[cappedStepIndex] ?? 0;
  const prevTokenScore = data.heads[HEAD_L0]?.prev_tok?.[cappedStepIndex] ?? 0;
  const gradientMagnitude = Math.max(0, (0.8 - inductionScore) * 1.5);

  return (
    <div className="max-w-3xl mx-auto my-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      <div className="bg-slate-50 p-6 border-b border-gray-200 text-center">
        <h3 className="text-lg font-bold text-slate-800">The &quot;Gradient Bullying&quot; Mechanism</h3>
        <p className="text-slate-600 text-sm mt-1">
          Watch <span className="text-purple-600 font-bold">{HEAD_L1}</span> (Induction) force{" "}
          <span className="text-orange-600 font-bold">{HEAD_L0}</span> to evolve.
        </p>
      </div>

      <div className="relative h-96 bg-white p-8 flex flex-col justify-between">
        <div className="flex items-center justify-center space-x-12 relative z-10">
          <div className="relative group">
            <div
              className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-4 shadow-lg transition-colors duration-300 ${
                inductionScore > 0.5 ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-xs font-bold text-purple-600 mb-1">{HEAD_L1}</span>
              <span className="text-xs text-gray-500">Induction</span>
              <div className="mt-2 h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${inductionScore * 100}%` }} />
              </div>
            </div>

            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-4 bg-gradient-to-b from-red-500 to-transparent opacity-80 transition-all duration-100"
              style={{
                height: `${gradientMagnitude * 180}px`,
                opacity: gradientMagnitude > 0.1 ? 0.6 : 0.1,
              }}
            >
              <div className="animate-pulse w-full h-full bg-red-400 blur-md" />
            </div>
            {gradientMagnitude > 0.3 && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 text-xs font-bold text-red-600 whitespace-nowrap animate-bounce">
                Gradient Force
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-12 relative z-10 mt-12">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center border-4 shadow-md transition-colors duration-300 ${
                prevTokenScore > 0.1 ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-xs font-bold text-orange-600 mb-1">{HEAD_L0}</span>
              <span className="text-xs text-gray-500">Source</span>
              <div className="mt-2 h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${prevTokenScore * 100}%` }} />
              </div>
            </div>

            <svg className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-24 overflow-visible pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={prevTokenScore > 0.1 ? "#F97316" : "#9CA3AF"} />
                </marker>
              </defs>

              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="80"
                stroke="#9CA3AF"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
                style={{ opacity: Math.max(0.2, 1 - prevTokenScore * 5) }}
              />

              <path
                d="M 32 0 Q 32 40, -60 80"
                fill="none"
                stroke="#F97316"
                strokeWidth={2 + prevTokenScore * 10}
                markerEnd="url(#arrowhead)"
                style={{ opacity: prevTokenScore * 3 }}
                transform="translate(32, 0)"
              />
            </svg>
          </div>
        </div>

        <div className="flex justify-center space-x-8 pt-12 border-t border-gray-100 mt-4">
          {TOKEN_SEQUENCE.map((tok, i) => (
            <div
              key={tok}
              className={`px-3 py-2 rounded font-mono text-sm ${
                i === ACTIVE_POSITION
                  ? "bg-blue-100 border border-blue-300"
                  : i === ACTIVE_POSITION - 1
                  ? "bg-orange-100 border border-orange-300"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              {tok}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-6 border-t border-gray-200">
        <input
          type="range"
          min={0}
          max={Math.max(0, data.steps.length - 1)}
          value={cappedStepIndex}
          onChange={(e) => {
            setStepIndex(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {isPlaying ? "Pause" : "Play Evolution"}
            </button>
            <button
              type="button"
              onClick={() => setStepIndex(0)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step</div>
            <div className="text-2xl font-mono font-bold text-slate-700">{currentStep}</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-900 text-sm">
          <span className="font-bold">Analysis:</span>{" "}
          {currentStep < 200
            ? "L1H0 wants to perform induction but lacks the input. The \"Gradient Force\" (red) is maximizing, pushing L0H4 to change."
            : currentStep < 300
            ? "Phase Change! Under pressure, L0H4 shifts attention to the previous token 'is'. L1H0 immediately utilizes this signal."
            : "Stability. L0H4 is now a dedicated 'Previous Token Head', and L1H0 is a functional 'Induction Head'. The error signal has relaxed."}
        </div>
      </div>
    </div>
  );
}
