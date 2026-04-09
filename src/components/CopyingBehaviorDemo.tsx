import { useState, useEffect, useMemo } from "react";
import { staticData } from "../staticData";

interface OVPrediction {
  token: string;
  id: number;
  logit: number;
}

// Normalize token for comparison (whitespace-insensitive, case-insensitive)
const normalizeToken = (token: string): string => {
  return token.trim().toLowerCase();
};

// Check if two tokens match (whitespace-insensitive, and matches base words)
const tokensMatch = (token1: string, token2: string): boolean => {
  const norm1 = normalizeToken(token1);
  const norm2 = normalizeToken(token2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if one is a prefix of the other (for cases like "report" vs "reported")
  // Only match if the shorter token is at least 4 characters to avoid false positives
  const shorter = norm1.length < norm2.length ? norm1 : norm2;
  const longer = norm1.length >= norm2.length ? norm1 : norm2;
  
  if (shorter.length >= 4 && longer.startsWith(shorter)) {
    return true;
  }
  
  return false;
};

export function CopyingBehaviorDemo() {
  const [text] = useState("The committee finally reported its findings.");
  const [tokens, setTokens] = useState<Array<{ text: string; id: number }>>([]);
  const [ovPredictions, setOVPredictions] = useState<OVPrediction[][][][]>([]);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staticData.committeeAttnT1OV()
      .then(data => {
        setTokens(data.tokens);
        setOVPredictions(data.ov_predictions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading OV data:", err);
        setLoading(false);
      });
  }, []);

  // Calculate copying rank for each token
  const copyingRanks = useMemo(() => {
    const ranks: (number | null)[] = [];
    
    tokens.forEach((token, idx) => {
      const ovPreds = ovPredictions[idx]?.[0]?.[0];
      if (!ovPreds) {
        ranks.push(null);
        return;
      }
      
      // Find the rank of this token in its own OV predictions (top 5 only)
      // Use whitespace-insensitive matching to catch base word matches
      const rank = ovPreds.slice(0, 5).findIndex(
        (pred) => tokensMatch(pred.token, token.text)
      );
      
      ranks.push(rank >= 0 ? rank + 1 : null); // rank is 0-indexed, so add 1
    });
    
    return ranks;
  }, [tokens, ovPredictions]);

  // Get background color based on copying rank (use single color for all ranks)
  const getCopyingColor = (rank: number | null): string => {
    if (rank === null) return "";
    return "bg-[rgba(46,207,139,.25)]";
  };

  // Get text color based on copying rank (for contrast with lighter backgrounds)
  const getTextColor = (rank: number | null): string => {
    if (rank === null) return "text-neutral-800";
    if (rank <= 2) return "text-neutral-900"; // White text for darker backgrounds
    return "text-neutral-900"; // Dark text for lighter backgrounds
  };

  if (loading) {
    return (
      <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  // Use selectedToken if set, otherwise use hoveredToken
  const activeToken = selectedToken !== null ? selectedToken : hoveredToken;
  
  const activeOV = activeToken !== null && ovPredictions[activeToken]?.[0]?.[0]
    ? ovPredictions[activeToken][0][0]
    : null;

  // Check if the top prediction is a copy of the active token
  const isCopying = activeToken !== null && activeOV && activeOV[0] && tokensMatch(activeOV[0].token, tokens[activeToken]?.text || "");

  return (
    <figure className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <figcaption className="text-sm font-semibold text-gray-700 mb-4 text-center">
        OV Circuit Copying Behavior (Head 0:0)
      </figcaption>

      {/* Instructions */}
      {/* <div className="mb-4 text-sm text-gray-600 text-center">
        Hover over a token to see what Head 0:0's OV circuit predicts when attending to it.
        Click to lock the selection. Tokens are colored green based on how much they copy themselves (darker = higher rank in their own OV predictions).
      </div> */}

      {/* Token strip */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="font-mono text-sm" style={{ lineHeight: 1.8 }}>
          {tokens.map((token, idx) => {
            const isActive = activeToken === idx;
            const isSelected = selectedToken === idx;
            const copyingRank = copyingRanks[idx];
            const bgColor = getCopyingColor(copyingRank);
            const textColor = getTextColor(copyingRank);
            
            return (
              <span
                key={idx}
                onMouseEnter={() => {
                  if (selectedToken === null) {
                    setHoveredToken(idx);
                  }
                }}
                onMouseLeave={() => {
                  if (selectedToken === null) {
                    setHoveredToken(null);
                  }
                }}
                onClick={() => {
                  if (selectedToken === idx) {
                    setSelectedToken(null);
                    setHoveredToken(null);
                  } else {
                    setSelectedToken(idx);
                  }
                }}
                className={`px-1 py-0.5 cursor-pointer transition-all duration-150 rounded ${
                  isActive
                    ? isSelected
                      ? "ring-2 ring-blue-600 ring-offset-1"
                      : "ring-2 ring-blue-500 ring-offset-1"
                    : ""
                } ${
                  bgColor || "hover:bg-gray-100"
                } ${textColor}`}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* OV predictions */}
      {activeOV && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-600">When attending to: </span>
              <code className="bg-blue-100 px-2 py-1 rounded font-mono text-sm">
                {tokens[activeToken!]?.text}
              </code>
            </div>
            {isCopying && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                Copying
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-2">Top predictions (raw logit boosts):</div>

          <div className="space-y-1">
            {activeOV.slice(0, 10).map((pred, i) => {
              const isMatchingToken = tokensMatch(pred.token, tokens[activeToken!]?.text || "");
              const maxLogit = Math.abs(activeOV[0].logit);
              const width = maxLogit > 0 ? (Math.abs(pred.logit) / maxLogit) * 100 : 0;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 font-mono text-sm text-neutral-800 flex items-center gap-1">
                    {pred.token}
                    {isMatchingToken && (
                      <span className="text-[10px] text-green-600">✓</span>
                    )}
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="h-2 rounded-sm bg-neutral-100">
                      <div
                        className={`h-2 rounded-sm transition-all ${
                          isMatchingToken ? "bg-green-400" : "bg-blue-300"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 shrink-0 font-mono text-xs tabular-nums text-neutral-600">
                    {pred.logit >= 0 ? "+" : ""}{pred.logit.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation */}
      {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-900">
          <strong>Key insight:</strong> In most cases, the OV circuit simply boosts the same token
          that was attended to (shown in green with ✓). This "copying" behavior is the default—the
          interesting skip-trigrams and semantic associations are relatively rare exceptions. The
          constant copying behavior makes it easier for the QK circuit to coordinate when tokens
          should actually be repeated.
        </div>
      </div> */}
    </figure>
  );
}
