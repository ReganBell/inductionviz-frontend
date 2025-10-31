import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_URL } from "./config";
import type { AnalysisResponse, AblationResult, CompositionScores } from "./types";
import { TokenStrip } from "./components/TokenStrip";
import { TopkPanel } from "./components/TopkPanel";
import { HeadInfluencePanel } from "./components/HeadInfluencePanel";
import { AblationPanel } from "./components/AblationPanel";
import { AttentionHeadSelector } from "./components/AttentionHeadSelector";
import { AblateHeadButton } from "./components/AblateHeadButton";

function App() {
  const [text, setText] = useState("^Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large moustache. Mrs Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbours. The Dursleys had a small son called Dudley and in their opinion there was no finer boy anywhere. The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs Potter was Mrs Dursley's sister, but they hadn't met for several years; in fact, Mrs Dursley pretended she didn't have a sister, because her sister and her good- for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbours would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him. This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.");
  const [topK, setTopK] = useState(10);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValueWeighted, setShowValueWeighted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"t1" | "t2">("t1");
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [ablationResult, setAblationResult] = useState<AblationResult | null>(null);
  const [ablationLoading, setAblationLoading] = useState(false);
  const [highlightMode, setHighlightMode] = useState<"attention" | "value-weighted" | "delta">("value-weighted");
  const [computeAblations, setComputeAblations] = useState(false);
  const [compositionScores, setCompositionScores] = useState<CompositionScores | null>(null);
  const [compositionLoading, setCompositionLoading] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showComposition, setShowComposition] = useState(true);

  // Auto-load on mount
  React.useEffect(() => {
    if (!analysis && !loading) {
      handleSubmit(new Event('submit') as any);
    }
  }, []);

  // Auto-load composition scores when switching to T2 or when toggle is turned on
  React.useEffect(() => {
    if (selectedModel === "t2" && showComposition && !compositionScores && !compositionLoading) {
      handleLoadCompositionScores();
    }
  }, [selectedModel, showComposition]);

  const activePosition = useMemo(() => {
    if (!analysis || analysis.positions.length === 0) return null;
    // Use locked index if available, otherwise use active/hover index
    const idx = lockedIdx != null ? lockedIdx : (activeIdx != null ? activeIdx : analysis.positions.length);
    const positionIndex = Math.min(Math.max(idx - 1, 0), analysis.positions.length - 1);
    return analysis.positions[positionIndex];
  }, [analysis, activeIdx, lockedIdx]);

  const handleTokenClick = (idx: number) => {
    // Toggle lock: if clicking the same token, unlock; otherwise lock to new token
    if (lockedIdx === idx) {
      setLockedIdx(null);
    } else {
      setLockedIdx(idx);
      setActiveIdx(idx);
    }
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!text.trim()) {
      setError("Please enter some text.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setActiveIdx(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, top_k: topK, compute_ablations: computeAblations }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `server responded ${res.status}`);
      }
      const payload = (await res.json()) as AnalysisResponse;
      setAnalysis(payload);
      setActiveIdx(payload.positions.length ? payload.positions.length : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAblateHead = async () => {
    // Use the active position from the analysis, not the hover state
    const position = activePosition?.t;
    if (!text.trim() || position === undefined) {
      setError("Please analyze text first.");
      return;
    }
    setAblationLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ablate-head`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          position,
          model_name: selectedModel,
          layer: selectedLayer,
          head: selectedHead,
          top_k: topK,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `server responded ${res.status}`);
      }
      const payload = (await res.json()) as AblationResult;
      setAblationResult(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setAblationLoading(false);
    }
  };

  const handleLoadCompositionScores = async () => {
    if (selectedModel === "t1") {
      setError("Composition scores require a 2-layer model. Please select T2.");
      return;
    }
    setCompositionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/composition-scores?model_name=${selectedModel}`);
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `server responded ${res.status}`);
      }
      const payload = (await res.json()) as CompositionScores;
      setCompositionScores(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setCompositionLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, marginBottom: 4 }}>Induction Heads 🎉</h1>
        <div>
        The idea: build the tiniest imaginable transformer that can still do transformer-y stuff, and figure out why. What happens if you take out all the layers, all the transformer blocks? 
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 14, opacity: 0.7, fontStyle: "italic" }}>Try your own text!</div>
          <button
            onClick={() => setShowTextEditor(!showTextEditor)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,.2)",
              background: showTextEditor ? "rgba(0,0,0,.05)" : "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {showTextEditor ? "Hide Editor" : "Edit Text"}
          </button>
        </div>
      </div>

      {showTextEditor && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginBottom: 24, padding: 16, border: "1px solid rgba(0,0,0,.1)", borderRadius: 10, background: "#FCFCFC" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Text</span>
            <textarea
              value={text}
              onChange={(evt) => setText(evt.target.value)}
              rows={5}
              placeholder="Paste a passage to analyze..."
              style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,.2)", fontFamily: "monospace" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>top-k</span>
            <input
              type="number"
              // min={1}
              value={topK}
              onChange={(evt) => setTopK(parseInt(evt.target.value, 10) || 1)}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={computeAblations}
              onChange={(evt) => setComputeAblations(evt.target.checked)}
            />
            <span>Compute ablations (slow!)</span>
          </label>
          {computeAblations && (
            <div style={{ fontSize: 12, opacity: 0.7, fontStyle: "italic" }}>
              ⚠️ This will run many forward passes (layers × heads per token).
              Enables "Head Delta" highlighting mode.
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: loading ? "rgba(0,0,0,.2)" : "#0066ff",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              width: 160,
            }}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          {error && <div style={{ color: "#d42" }}>{error}</div>}
        </form>
      )}

      {analysis && (
        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ border: "1px solid rgba(0,0,0,.1)", borderRadius: 10, padding: 16 }}>
            <TokenStrip
              tokens={analysis.tokens}
              active={lockedIdx != null ? lockedIdx : activeIdx}
              onHover={setActiveIdx}
              onClick={handleTokenClick}
              locked={lockedIdx}
              attentionData={activePosition?.attn || null}
              valueWeightedData={activePosition?.value_weighted_attn || null}
              headDeltasData={activePosition?.head_deltas || null}
              selectedModel={selectedModel}
              selectedLayer={selectedLayer}
              selectedHead={selectedHead}
              highlightMode={highlightMode}
            />
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                Hover a token (after the first) to inspect predictions. Click to lock selection.
                {highlightMode === "attention" && " Red = attention weight."}
                {highlightMode === "value-weighted" && " Red = attention × ||value|| (mechanistic info flow)."}
                {highlightMode === "delta" && " Green = promoted by head, Red = suppressed (causal effect)."}
              </span>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                <span>Highlight:</span>
                <select
                  value={highlightMode}
                  onChange={(e) => {
                    const newMode = e.target.value as "attention" | "value-weighted" | "delta";
                    // Don't allow delta mode if no ablations were computed
                    if (newMode === "delta" && (!activePosition?.head_deltas || Object.keys(activePosition.head_deltas[selectedModel]).length === 0)) {
                      return;
                    }
                    setHighlightMode(newMode);
                  }}
                  style={{
                    padding: "2px 6px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: "1px solid rgba(0,0,0,.2)",
                  }}
                >
                  <option value="attention">Attention</option>
                  <option value="value-weighted">Value-Weighted</option>
                  <option
                    value="delta"
                    disabled={!activePosition?.head_deltas || Object.keys(activePosition.head_deltas[selectedModel] || {}).length === 0}
                  >
                    Head Delta {(!activePosition?.head_deltas || Object.keys(activePosition.head_deltas[selectedModel] || {}).length === 0) ? "(enable in form)" : ""}
                  </option>
                </select>
              </label>
            </div>
          </div>

          {activePosition ? (
            <>
              <div style={{ fontSize: 14 }}>
                <strong>Context token:</strong> {activePosition.context_token.text || "␠"}{" "}
                → <strong>next:</strong> {activePosition.next_token.text || "␠"}
              </div>
              {activePosition.head_deltas && Object.keys(activePosition.head_deltas[selectedModel]).length > 0 && (
                <HeadInfluencePanel
                  position={activePosition}
                  selectedModel={selectedModel}
                  selectedLayer={selectedLayer}
                  selectedHead={selectedHead}
                  onHeadClick={(layer, head) => {
                    setSelectedLayer(layer);
                    setSelectedHead(head);
                  }}
                />
              )}
            </>
          ) : (
            <div style={{ opacity: 0.7 }}>hover a token to see logits & attention</div>
          )}

          <AttentionHeadSelector
            analysis={analysis}
            selectedModel={selectedModel}
            selectedLayer={selectedLayer}
            selectedHead={selectedHead}
            onModelChange={setSelectedModel}
            onLayerChange={setSelectedLayer}
            onHeadChange={setSelectedHead}
            compositionScores={compositionScores}
            showComposition={showComposition}
            onToggleComposition={setShowComposition}
          />

          <AblateHeadButton
            onClick={handleAblateHead}
            loading={ablationLoading}
            disabled={!activePosition}
            position={activePosition?.t}
            model={selectedModel}
            layer={selectedLayer}
            head={selectedHead}
          />

          {ablationResult && (
            <AblationPanel
              ablation={ablationResult}
              onClose={() => setAblationResult(null)}
            />
          )}

          {activePosition && <TopkPanel position={activePosition} />}

          <div style={{ opacity: 0.7, fontSize: 14 }}>
            device: {analysis.device}
          </div>
        </div>
      )}

      {!analysis && loading && (
        <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>
          Loading analysis...
        </div>
      )}

    </div>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("missing #root");
const root = createRoot(container);
root.render(<App />);
