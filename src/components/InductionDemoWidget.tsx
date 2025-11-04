import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../config";
import type { AttentionPatternsResponse } from "../types";
import { TokenStrip } from "./TokenStrip";

interface InductionDemoWidgetProps {
  text: string;
  onTextChange: (text: string) => void;
  showInput?: boolean;
}

export function InductionDemoWidget({ text, onTextChange, showInput = true }: InductionDemoWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any[] | null>(null);
  const [attention, setAttention] = useState<number[][][][] | null>(null);
  const [activeToken, setActiveToken] = useState<number | null>(null);
  const [lockedToken, setLockedToken] = useState<number | null>(null);
  const [debouncedText, setDebouncedText] = useState(text);

  // Debounce text input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  // Fetch attention patterns
  useEffect(() => {
    if (!debouncedText.trim()) return;

    const fetchAttention = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: debouncedText,
            model_name: "t2",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch attention patterns");
        }

        const data: AttentionPatternsResponse = await response.json();
        setTokens(data.tokens);
        setAttention(data.attention);
        // Auto-select the last token
        if (data.tokens.length > 0) {
          setActiveToken(data.tokens.length - 1);
        }
      } catch (err) {
        console.error("Error fetching attention patterns:", err);
        setError(err instanceof Error ? err.message : "Failed to load attention patterns");
      } finally {
        setLoading(false);
      }
    };

    fetchAttention();
  }, [debouncedText]);

  const handleTokenClick = (idx: number) => {
    if (lockedToken === idx) {
      setLockedToken(null);
    } else {
      setLockedToken(idx);
      setActiveToken(idx);
    }
  };

  // Get attention data for active token - show all heads combined
  const attentionData = useMemo(() => {
    if (!attention || !tokens) return null;
    const tokenIdx = lockedToken !== null ? lockedToken : activeToken;
    if (tokenIdx === null || tokenIdx === 0) return null;

    // attention is [position][layer][head][src_position]
    const positionIdx = tokenIdx - 1;
    if (positionIdx < 0 || positionIdx >= attention.length) return null;

    return {
      t2: attention[positionIdx],
      t1: attention[positionIdx],
    };
  }, [attention, tokens, activeToken, lockedToken]);

  return (
    <div className="border border-warm-gray rounded-lg p-6 bg-off-white">
      {showInput && (
        <>
          <h3 className="text-lg font-semibold mb-4">Try It: Induction in Action</h3>
          <label className="flex flex-col gap-2 mb-4">
            <span className="text-sm font-medium">Enter text with repeated patterns:</span>
            <input
              type="text"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="px-3 py-2 rounded border border-warm-gray font-mono text-sm"
              placeholder="My name is Regan Bell. What's my name again?"
            />
          </label>
        </>
      )}

      {loading && <div className="text-sm opacity-70">Loading...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {tokens && attention && (
        <div className="mt-4">
          <TokenStrip
            tokens={tokens}
            active={lockedToken !== null ? lockedToken : activeToken}
            onHover={setActiveToken}
            onClick={handleTokenClick}
            locked={lockedToken}
            attentionData={attentionData}
            valueWeightedData={null}
            headDeltasData={null}
            selectedModel="t2"
            selectedLayer={1}
            selectedHead={0}
            highlightMode="attention"
          />
          <div className="text-xs opacity-60 mt-2">
            Hover over tokens to see where Layer 1 Head 0 (an induction head) attends. Click to lock.
            Red highlighting shows attention strength.
          </div>
        </div>
      )}
    </div>
  );
}
