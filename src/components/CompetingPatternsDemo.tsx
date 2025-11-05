import { useState } from "react";

// Head colors matching AttentionCircuitWidget
const HEAD_COLORS = {
  0: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" }, // red
  6: { bg: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95" }, // purple
};

export function CompetingPatternsDemo() {
  const text = "The committee finally reported its findings.)";
  const tokens = text.split(" ");

  // Find the index of ")" and "reported"
  const parenIdx = tokens.findIndex(t => t.includes(")"));
  const reportedIdx = tokens.findIndex(t => t === "reported");

  const [hoveredHead, setHoveredHead] = useState<0 | 6 | null>(null);

  return (
    <figure className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <figcaption className="text-sm font-semibold text-gray-700 mb-4 text-center">
        Competing Patterns: Two Heads, One Query Token
      </figcaption>

      {/* The input text */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Input text:</div>
        <div className="font-mono text-sm" style={{ lineHeight: 1.8 }}>
          {tokens.map((token, idx) => {
            const isQuery = idx === parenIdx;
            const isHead0Key = hoveredHead === 0 && idx === reportedIdx;
            const isHead6Key = hoveredHead === 6 && idx === parenIdx;

            let bgColor = "";
            let border = "";

            if (isQuery) {
              bgColor = "bg-blue-200";
              border = "border-b-2 border-blue-500";
            } else if (isHead0Key) {
              bgColor = "bg-red-200";
              border = `border-b-2`;
            } else if (isHead6Key) {
              bgColor = "bg-purple-200";
              border = `border-b-2`;
            }

            return (
              <span
                key={idx}
                className={`px-1 ${bgColor} ${border}`}
                style={
                  isHead0Key
                    ? { borderColor: HEAD_COLORS[0].border }
                    : isHead6Key
                    ? { borderColor: HEAD_COLORS[6].border }
                    : {}
                }
              >
                {token}
              </span>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <span className="inline-block px-2 py-1 bg-blue-200 rounded mr-2">Query: <code>)</code></span>
          Both heads see this token and activate
        </div>
      </div>

      {/* The two competing heads */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Head 0:0 - Copying */}
        <div
          className="bg-white p-4 rounded-lg border-2 transition-all cursor-pointer"
          style={{
            borderColor: hoveredHead === 0 ? HEAD_COLORS[0].border : "#d1d5db",
          }}
          onMouseEnter={() => setHoveredHead(0)}
          onMouseLeave={() => setHoveredHead(null)}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                backgroundColor: HEAD_COLORS[0].bg,
                color: HEAD_COLORS[0].text,
                border: `1px solid ${HEAD_COLORS[0].border}`,
              }}
            >
              Head 0
            </span>
            <span className="text-sm font-semibold text-gray-700">Punctuation-Driven Copying</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Query:</span>
              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">)</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Attends to:</span>
              <code
                className="px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: HEAD_COLORS[0].bg,
                  color: HEAD_COLORS[0].text,
                }}
              >
                reported
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Effect:</span>
              <span className="text-gray-700">
                Boost logit for <code className="bg-gray-100 px-1 rounded font-mono">reported</code> by{" "}
                <strong className="text-green-600">+2.90</strong>
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Resulting text:</div>
            <div className="text-sm font-mono text-gray-700">
              ...findings.) <span className="bg-red-100 px-1 rounded">reported</span>...
            </div>
          </div>
        </div>

        {/* Head 0:6 - Syntax */}
        <div
          className="bg-white p-4 rounded-lg border-2 transition-all cursor-pointer"
          style={{
            borderColor: hoveredHead === 6 ? HEAD_COLORS[6].border : "#d1d5db",
          }}
          onMouseEnter={() => setHoveredHead(6)}
          onMouseLeave={() => setHoveredHead(null)}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                backgroundColor: HEAD_COLORS[6].bg,
                color: HEAD_COLORS[6].text,
                border: `1px solid ${HEAD_COLORS[6].border}`,
              }}
            >
              Head 6
            </span>
            <span className="text-sm font-semibold text-gray-700">End-of-Block Formatting</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Query:</span>
              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">)</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Attends to:</span>
              <code
                className="px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: HEAD_COLORS[6].bg,
                  color: HEAD_COLORS[6].text,
                }}
              >
                )
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-16">Effect:</span>
              <span className="text-gray-700">
                Boost logit for <code className="bg-gray-100 px-1 rounded font-mono">\n\n</code> by{" "}
                <strong className="text-green-600">+5.71</strong>
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Resulting text:</div>
            <div className="text-sm font-mono text-gray-700">
              ...findings.) <span className="bg-purple-100 px-1 rounded">¶</span> The next paragraph...
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="text-sm text-amber-900">
          <strong>The Conflict:</strong> Both heads see the same query token <code className="bg-white px-1 rounded">()</code>
          {" "}but send contradictory instructions. Head 0 wants to copy "reported" while Head 6 wants to start a new paragraph.
          Head 6's instruction is stronger (+5.71 vs +2.90), so it wins this particular battle.
        </div>
      </div>
    </figure>
  );
}
