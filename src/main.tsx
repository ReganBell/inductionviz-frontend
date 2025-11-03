import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { API_URL } from "./config";
import type { AnalysisResponse, AblationResult, CompositionScores } from "./types";
import { TokenStrip } from "./components/TokenStrip";
import { TopkPanel } from "./components/TopkPanel";
import { HeadInfluencePanel } from "./components/HeadInfluencePanel";
import { AblationPanel } from "./components/AblationPanel";
import { AttentionHeadSelector } from "./components/AttentionHeadSelector";
import { AblateHeadButton } from "./components/AblateHeadButton";
import { AffinityMatrix } from "./components/AffinityMatrix";
import { Explainer } from "./pages/Explainer";

function Demo() {
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
    <div className="grid-tc gap-y-5">
      {/* Header */}
      <header className="col-page mb-6">
        <h1 className="text-xl md:text-6xl font-bold tracking-tight leading-tight mb-2">Induction Heads</h1>
        <div>The idea: build the tiniest imaginable transformer that can still do transformer-y stuff, and figure out why. What happens if you take out all the layers, all the transformer blocks? </div>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-70 italic">Try your own text!</div>
          <button
            onClick={() => setShowTextEditor(!showTextEditor)}
            className="px-3 py-1.5 rounded-md border border-black/20 bg-white hover:bg-black/5 cursor-pointer text-sm font-medium"
          >
            {showTextEditor ? "Hide Editor" : "Edit Text"}
          </button>
        </div>
      </header>

      {/* Left Contents Sidebar (desktop) */}
      <aside className="col-kicker sticky top-8 self-start hidden md:block">
        <div className="text-xs uppercase tracking-wide opacity-60 mb-2">Contents</div>
        <nav className="flex flex-col gap-2 text-sm">
          <a className="opacity-90 hover:opacity-100 hover:underline" href="#input">Input</a>
          <a className="opacity-90 hover:opacity-100 hover:underline" href="#tokens">Tokens</a>
          <a className="opacity-90 hover:opacity-100 hover:underline" href="#architecture">Architecture</a>
          <a className="opacity-90 hover:opacity-100 hover:underline" href="#ablation">Ablation</a>
          <a className="opacity-90 hover:opacity-100 hover:underline" href="#topk">Top‑k</a>
        </nav>
      </aside>

      {showTextEditor && (
        <form id="input" onSubmit={handleSubmit} className="col-text grid gap-3 mb-6 p-4 border border-black/10 rounded-lg bg-off-white">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Text</span>
            <textarea
              value={text}
              onChange={(evt) => setText(evt.target.value)}
              rows={5}
              placeholder="Paste a passage to analyze..."
              className="p-3 rounded-lg border border-black/20 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>top-k</span>
            <input
              type="number"
              value={topK}
              onChange={(evt) => setTopK(parseInt(evt.target.value, 10) || 1)}
              className="p-2 rounded border border-black/20"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={computeAblations}
              onChange={(evt) => setComputeAblations(evt.target.checked)}
            />
            <span>Compute ablations (slow!)</span>
          </label>
          {computeAblations && (
            <div className="text-xs opacity-70 italic">
              ⚠️ This will run many forward passes (layers × heads per token).
              Enables "Head Delta" highlighting mode.
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2.5 rounded-lg border-none font-semibold w-40 ${
              loading ? "bg-black/20 text-black/40 cursor-not-allowed" : "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          {error && <div className="text-red-600">{error}</div>}
        </form>
      )}

      {analysis && (
        <>
          {/* Token Strip */}
          <div id="tokens" className="col-text border border-black/10 rounded-lg p-4">
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
            <div className="text-xs opacity-60 mt-1.5 flex justify-between items-center">
              <span>
                Hover a token (after the first) to inspect predictions. Click to lock selection.
                {highlightMode === "attention" && " Red = attention weight."}
                {highlightMode === "value-weighted" && " Red = attention × ||value|| (mechanistic info flow)."}
                {highlightMode === "delta" && " Green = promoted by head, Red = suppressed (causal effect)."}
              </span>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <span>Highlight:</span>
                <select
                  value={highlightMode}
                  onChange={(e) => {
                    const newMode = e.target.value as "attention" | "value-weighted" | "delta";
                    if (newMode === "delta" && (!activePosition?.head_deltas || Object.keys(activePosition.head_deltas[selectedModel]).length === 0)) {
                      return;
                    }
                    setHighlightMode(newMode);
                  }}
                  className="px-1.5 py-0.5 text-[11px] rounded border border-black/20"
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

          {/* Affinity Matrix - only show for small token counts */}
          {analysis.tokens.length <= 15 && (
            <div className="col-text">
              <AffinityMatrix
                analysis={analysis}
                selectedModel={selectedModel}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
              />
            </div>
          )}

          {/* Context Info */}
          {activePosition ? (
            <>
              <div className="col-text text-sm">
                <strong>Context token:</strong> {activePosition.context_token.text || "␠"}{" "}
                → <strong>next:</strong> {activePosition.next_token.text || "␠"}
              </div>
              {activePosition.head_deltas && Object.keys(activePosition.head_deltas[selectedModel]).length > 0 && (
                <div className="col-text">
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
                </div>
              )}
            </>
          ) : (
            <div className="col-text opacity-70">hover a token to see logits & attention</div>
          )}

          {/* Architecture Selector */}
          <div id="architecture" className="col-text">
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
          </div>

          {/* Ablation Button */}
          <div id="ablation" className="col-text">
            <AblateHeadButton
              onClick={handleAblateHead}
              loading={ablationLoading}
              disabled={!activePosition}
              position={activePosition?.t}
              model={selectedModel}
              layer={selectedLayer}
              head={selectedHead}
            />
          </div>

          {/* Ablation Results */}
          {ablationResult && (
            <div className="col-text">
              <AblationPanel
                ablation={ablationResult}
                onClose={() => setAblationResult(null)}
              />
            </div>
          )}

          {/* Top-k Panel */}
          {activePosition && (
            <div id="topk" className="col-text">
              <TopkPanel position={activePosition} />
            </div>
          )}

          {/* Device Info */}
          <div className="col-text opacity-70 text-sm">
            device: {analysis.device}
          </div>
        </>
      )}

      {!analysis && loading && (
        <div className="col-text text-center py-10 opacity-70">
          Loading analysis...
        </div>
      )}

    </div>
  );
}

function App() {
  const [view, setView] = useState<"explainer" | "demo">("explainer");

  return (
    <div>
      {/* Simple navigation bar */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView("explainer")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === "explainer"
              ? "bg-black text-white"
              : "bg-white text-black border border-black/20 hover:bg-black/5"
          }`}
        >
          Explainer
        </button>
        <button
          onClick={() => setView("demo")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === "demo"
              ? "bg-black text-white"
              : "bg-white text-black border border-black/20 hover:bg-black/5"
          }`}
        >
          Demo
        </button>
      </div>

      {/* Render selected view */}
      {view === "explainer" ? <Explainer /> : <Demo />}
    </div>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("missing #root");
const root = createRoot(container);
root.render(<App />);
