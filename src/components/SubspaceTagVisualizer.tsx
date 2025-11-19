import React from 'react';

/**
 * A conceptual visualization of the vector space decomposition.
 * Shows how the Previous Token Head writes information into an orthogonal subspace
 * rather than directly affecting the next-token prediction.
 */
export const SubspaceTagVisualizer = ({
  currentStepToken,
  attendedToken,
  isActive
}: {
  currentStepToken: string | null;
  attendedToken: string | null;
  isActive: boolean;
}) => {

  if (!isActive || !attendedToken || !currentStepToken) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
        <div className="mb-2 text-4xl opacity-20">📐</div>
        <p className="text-sm">Click a token to see how it writes to the residual stream.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 text-sm text-neutral-600 leading-relaxed">
        At position <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">{currentStepToken}</span>,
        we copy the vector for <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded">{attendedToken}</span>.
        <br/>
        <br/>
        <strong>Where does this vector go?</strong>
      </div>

      <div className="relative flex-1 border-l-2 border-b-2 border-neutral-400 min-h-[240px] mb-4">

        {/* Y-Axis Label */}
        <div className="absolute -left-16 top-8 text-[11px] text-neutral-500 -rotate-90 origin-center whitespace-nowrap">
          Unembedding Direction
        </div>
        <div className="absolute -left-16 top-20 text-[10px] text-neutral-400 -rotate-90 origin-center whitespace-nowrap">
          (Immediate Prediction)
        </div>

        {/* X-Axis Label */}
        <div className="absolute bottom-0 right-4 translate-y-7 text-[11px] text-purple-600 font-semibold whitespace-nowrap">
          Orthogonal "Tag" Subspace
        </div>
        <div className="absolute bottom-0 right-12 translate-y-10 text-[10px] text-purple-500 whitespace-nowrap">
          (Memory for Future Layers)
        </div>

        {/* Origin point */}
        <div className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-neutral-600 -translate-x-1 translate-y-1 z-10"></div>

        {/* Grid lines for reference */}
        <div className="absolute inset-0">
          {[0.25, 0.5, 0.75].map((frac) => (
            <React.Fragment key={frac}>
              {/* Horizontal grid lines */}
              <div
                className="absolute w-full border-t border-neutral-200 border-dashed"
                style={{ bottom: `${frac * 100}%` }}
              />
              {/* Vertical grid lines */}
              <div
                className="absolute h-full border-l border-neutral-200 border-dashed"
                style={{ left: `${frac * 100}%` }}
              />
            </React.Fragment>
          ))}
        </div>

        {/* The "Bigram" Vector Reference (What purely predicting would look like) */}
        {/* This would point mostly up, predicting the next token based on bigram stats */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="arrowhead-gray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#a3a3a3" />
            </marker>
            <marker id="arrowhead-purple" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" />
            </marker>
          </defs>

          {/* Reference: Pure bigram prediction vector (mostly vertical, small horizontal) */}
          <line
            x1="0"
            y1="100%"
            x2="10%"
            y2="35%"
            stroke="#d4d4d4"
            strokeWidth="2"
            strokeDasharray="4,4"
            markerEnd="url(#arrowhead-gray)"
          />

          {/* Label for bigram reference */}
          <text x="12%" y="32%" fontSize="10" fill="#a3a3a3" fontFamily="system-ui">
            Bigram
          </text>
          <text x="12%" y="38%" fontSize="9" fill="#d4d4d4" fontFamily="system-ui">
            (predicts next)
          </text>

          {/* The Actual "Tag" Vector (The Previous Token Head's output) */}
          {/* This points SIDEWAYS - strong horizontal (memory), weak vertical (prediction) */}
          <line
            x1="0"
            y1="100%"
            x2="85%"
            y2="88%"
            stroke="#9333ea"
            strokeWidth="3.5"
            markerEnd="url(#arrowhead-purple)"
          />

        </svg>

        {/* The "Payload" Annotation */}
        <div className="absolute right-2 bottom-6 bg-purple-100 border-2 border-purple-400 text-purple-900 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold">
          Encoded: <span className="font-mono">"{attendedToken}"</span>
        </div>

        {/* Arrow label */}
        <div className="absolute left-[45%] bottom-[92%] text-[10px] text-purple-700 font-semibold bg-white px-1 rounded">
          Tag Vector
        </div>
      </div>

      <div className="text-xs bg-purple-50 p-3 rounded-lg border border-purple-200 leading-relaxed">
        <p>
          <strong className="text-purple-900">The Critical Insight:</strong>
          <span className="text-purple-800"> The head writes the identity of "</span>
          <span className="font-mono text-purple-900 bg-white px-1 rounded">{attendedToken}</span>
          <span className="text-purple-800">" into a subspace that is <em>orthogonal</em> (perpendicular) to the unembedding direction.
          It's like whispering to future layers without disturbing the current prediction.</span>
        </p>
      </div>
    </div>
  );
};
