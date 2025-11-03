import React, { useState, useMemo, useEffect } from "react";
import { BigramWidget } from "../components/BigramWidget";
import { TokenStrip } from "../components/TokenStrip";
import { API_URL } from "../config";
import type { AttentionPatternsResponse, TokenInfo } from "../types";

export function Explainer() {
  const [activeToken, setActiveToken] = useState<number | null>(3); // Default to "else"
  const [lockedToken, setLockedToken] = useState<number | null>(null);

  // State for real attention patterns
  const [inputText, setInputText] = useState<string>("if true then else");
  const [debouncedText, setDebouncedText] = useState<string>("if true then else");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTokens, setRealTokens] = useState<TokenInfo[] | null>(null);
  const [realAttention, setRealAttention] = useState<number[][][][] | null>(null);

  // Debounce the input text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(inputText);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputText]);

  // Fetch attention patterns when text changes
  useEffect(() => {
    if (!debouncedText.trim()) {
      setRealTokens(null);
      setRealAttention(null);
      setError(null);
      return;
    }

    const fetchAttention = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/attention-patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: debouncedText,
            model_name: "t1",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch attention patterns");
        }

        const data: AttentionPatternsResponse = await response.json();
        setRealTokens(data.tokens);
        setRealAttention(data.attention);
      } catch (err) {
        console.error("Error fetching attention patterns:", err);
        setError(err instanceof Error ? err.message : "Failed to load attention patterns");
        setRealTokens(null);
        setRealAttention(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttention();
  }, [debouncedText]);

  // Use real tokens if available, otherwise fall back to example
  const tokens = realTokens || [
    { text: "if", id: 0 },
    { text: " true", id: 1 },
    { text: " then", id: 2 },
    { text: " else", id: 3 },
  ];

  // Get attention data for the currently active token
  const attentionData = useMemo(() => {
    if (realAttention) {
      // Use real attention data from API
      const currentTokenIdx = lockedToken !== null ? lockedToken : (activeToken !== null ? activeToken : 0);
      // realAttention is [position][layer][head][src_position]
      // We need position-1 because attention starts at position 1 (no attention for first token)
      const positionIdx = Math.max(0, currentTokenIdx - 1);

      if (positionIdx >= 0 && positionIdx < realAttention.length) {
        const pattern = realAttention[positionIdx];
        return {
          t1: pattern,
          t2: pattern,
        };
      }
    }

    // Fall back to example data
    const attentionPatterns = [
      [1.0, 0.0, 0.0, 0.0],
      [0.4, 0.6, 0.0, 0.0],
      [0.3, 0.3, 0.4, 0.0],
      [0.75, 0.08, 0.08, 0.09],
    ];
    const currentTokenIdx = lockedToken !== null ? lockedToken : (activeToken !== null ? activeToken : 3);
    const pattern = attentionPatterns[currentTokenIdx] || [0, 0, 0, 0];

    return {
      t1: [[pattern]],
      t2: [[pattern]],
    };
  }, [realAttention, lockedToken, activeToken]);

  const handleTokenClick = (idx: number) => {
    if (lockedToken === idx) {
      setLockedToken(null);
    } else {
      setLockedToken(idx);
      setActiveToken(idx);
    }
  };

  return (
    <article className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Distill-style header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 pb-12">
        <p className="text-sm tracking-widest uppercase text-neutral-500">Interactive Notes</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Induction Heads</h1>
        {/* <p className="mt-3 text-base text-neutral-600">
          <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline">A Mathematical Framework for Transformer Circuits</a> walkthThe beginning of mechanistic interpretability
        </p> */}
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-6 pb-24">

        {/* Introduction */}
        <section className="prose prose-neutral max-w-none">
          <p className="text-lg leading-relaxed">
            Let's walk through <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline">A Mathematical Framework for Transformer Circuits</a>. I think this paper is where the term "mechanistic interpretability" actually comes from. <br></br> <small className="text-neutral-600">(edit: found it on a podcast with Chris a <a href="https://80000hours.org/podcast/episodes/chris-olah-interpretability-research" className="underline">few months before</a>, and it was hinted at back in the <a href="https://distill.pub/2020/circuits/zoom-in/" className="underline">Distill days</a>)</small>
          </p>

          <p className="text-lg leading-relaxed mt-6">
            The idea: build the tiniest imaginable transformer that can still do transformer-y stuff, and figure out why.
          </p>

          <p className="text-lg leading-relaxed mt-6">
           Attempt #1: what if you take out <em>all</em> the layers? Well, for one, it's not a transformer anymore: it's the on-ramp and off-ramp with nothing in between.
          </p>

          <figure className="my-12 mx-auto max-w-2xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Full Transformer */}
              <div className="flex flex-col items-center">
                {/* <div className="text-sm font-medium text-neutral-600 mb-4">Full Transformer</div> */}
                <svg viewBox="0 0 200 320" className="w-full max-w-[200px]">
                  {/* Token input */}
                  <rect x="60" y="10" width="80" height="30" rx="4" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="1.5" />
                  <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui">token</text>

                  {/* Embedding */}
                  <line x1="100" y1="40" x2="100" y2="55" stroke="#a3a3a3" strokeWidth="1.5" />
                  <rect x="50" y="55" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
                  <text x="100" y="77" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Embed</text>

                  {/* Transformer Blocks */}
                  <line x1="100" y1="90" x2="100" y2="105" stroke="#a3a3a3" strokeWidth="1.5"  />
                  <rect x="50" y="105" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="100" y="125" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block 1</text>

                  <line x1="100" y1="135" x2="100" y2="150" stroke="#a3a3a3" strokeWidth="1.5"  />
                  <rect x="50" y="150" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="100" y="170" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block 2</text>

                  {/* Ellipsis for more blocks */}
                  <text x="100" y="200" textAnchor="middle" fontSize="20" fill="#737373" fontFamily="system-ui">⋮</text>

                  <rect x="50" y="210" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="100" y="230" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block N</text>

                  {/* Unembedding */}
                  <line x1="100" y1="240" x2="100" y2="255" stroke="#a3a3a3" strokeWidth="1.5" />
                  <rect x="50" y="255" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
                  <text x="100" y="277" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Unembed</text>

                  {/* Output */}
                  <line x1="100" y1="290" x2="100" y2="315" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                  {/* Arrow marker definition */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
                    </marker>
                  </defs>
                </svg>
              </div>

              {/* Collapsed (No Layers) */}
              <div className="flex flex-col items-center">
                {/* <div className="text-sm font-medium text-neutral-600 mb-4">No Layers</div> */}
                <svg viewBox="0 0 200 320" className="w-full max-w-[200px]">
                  {/* Token input */}
                  <rect x="60" y="10" width="80" height="30" rx="4" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="1.5" />
                  <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui">token</text>

                  {/* Embedding */}
                  <line x1="100" y1="40" x2="100" y2="55" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead1)" />
                  <rect x="50" y="55" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
                  <text x="100" y="77" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Embed</text>

                  {/* Ghosted blocks */}
                  <line x1="100" y1="90" x2="100" y2="255" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,4" />
                  {/* <rect x="50" y="135" width="100" height="75" rx="6" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,4" /> */}
                  {/* <text x="100" y="177" textAnchor="middle" fontSize="11" fill="#a3a3a3" fontStyle="italic" fontFamily="system-ui">removed</text> */}

                  {/* Unembedding */}
                  {/* <line x1="100" y1="240" x2="100" y2="255" stroke="#a3a3a3" strokeWidth="1.5"  /> */}
                  <rect x="50" y="255" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
                  <text x="100" y="277" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Unembed</text>

                  {/* Output */}
                  <line x1="100" y1="290" x2="100" y2="315" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead2)" />

                  {/* Arrow marker definition */}
                  <defs>
                    <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
            {/* <figcaption className="mt-4 text-sm text-neutral-600 text-center">
              Removing all transformer blocks leaves just the embedding and unembedding matrices — essentially a learned bigram model.
            </figcaption> */}
          </figure>

          <p className="text-lg leading-relaxed mt-6">
             The embedding matrix maps each token into latent space, and the unembedding matrix maps out a corresponding guess for the token to follow. 
          </p>
          <p className="text-lg leading-relaxed mt-6">
            When you train this, you end up learning a bigram model. I think it's worth considering why that is, intuitively. My answer is that, without attention, you truly have no information to predict the next token beyond the one that came before it.<sup>1</sup> In this environment, even if you had an infinitely smart model, you simply don't know enough about the situation you're in to do better than a "dumb" prediction based on occurrence statistics.
          </p>

                  {/* Bigram Widget */}
        <div className="my-12">
          <BigramWidget />
        </div>
        <p className="text-lg leading-relaxed mt-6">
        Either way, what you've got is a learned bigram model, squeezed down into however much space you want. Bigram models are both bad and huge: the full transition matrix for the GPT-2 vocabulary takes up 10GB with 32-bit floats. Most transitions between tokens are never observed (I wonder how this holds over the full internet; eg it's kind of spooky that 15% of Google searches are novel) so the sparse version is 1000x smaller than that. So it's maybe not surprising but still kind of cool to see that we can learn a compressed representation that retains most of the "good" in around 1% of the storage.
        </p>

        </section>



        {/* Continue with single attention layer */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Adding One Layer of Attention</h2>

          <p className="text-lg leading-relaxed">
            Ok, so let's allow ourselves one tiny extra piece: a layer of attention. What does that get us?
          </p>

          <p className="text-lg leading-relaxed mt-6">
            We can already do bigram modeling (the last token was X, so Y is probably...). With a <em>single</em> attention layer, we're still basically there, but we can mix in an extra token of evidence now. There are a lot of mental models for this, but here's what I'm using right now: we build up an <em>affinity matrix</em> (also called the QK circuit) that tells us how much token X cares about any other token. We learn this over time as the network trains. We also learn the OV circuit, which tells us, when we <em>do</em> attend to a token, how does that modulate our prediction for what comes next?
          </p>

          <figure className="my-12">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6 shadow-sm">
              <h3 className="font-serif text-2xl mb-4">Attention Pattern Example</h3>

              {/* Text input */}
              <div className="mb-4">
                <label className="block text-sm text-neutral-600 mb-2">
                  Enter text to analyze attention patterns:
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type some text..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 font-mono text-sm shadow-inner outline-none focus:ring-2 focus:ring-neutral-800"
                />
                {loading && (
                  <div className="mt-2 text-xs text-neutral-500 animate-pulse">
                    Loading attention patterns...
                  </div>
                )}
                {error && (
                  <div className="mt-2 text-xs text-red-600">
                    Error: {error}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mb-4">
                <div className="text-sm text-neutral-600 mb-2">
                  Click a token to see what it attends to (highlighted in red)
                </div>
                <div className="text-xs text-neutral-500 mb-3">
                  Try clicking "else" - notice how it highlights "if" in red, showing the learned if...else pattern.
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-neutral-200">
                <TokenStrip
                  tokens={tokens}
                  active={lockedToken !== null ? lockedToken : activeToken}
                  onHover={setActiveToken}
                  onClick={handleTokenClick}
                  locked={lockedToken}
                  attentionData={attentionData}
                  valueWeightedData={attentionData}
                  headDeltasData={null}
                  selectedModel="t1"
                  selectedLayer={0}
                  selectedHead={0}
                  highlightMode="attention"
                />
              </div>

              <figcaption className="mt-4 text-sm text-neutral-600">
                This shows a single attention head that has learned the if...else→end pattern.
                When you click "else" (token 3), it attends most strongly to "if" (token 0) with 75% attention weight.
                This is the <strong>QK circuit</strong> in action - determining which previous tokens are relevant.
              </figcaption>
            </div>
          </figure>

          <p className="text-lg leading-relaxed mt-6">
            In Ruby, you often see control patterns like:
          </p>

          <pre className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-sm font-mono overflow-x-auto mt-4">
{`if <thing A is true>
    <do B>
else
  <do C>
end`}
          </pre>

          <p className="text-lg leading-relaxed mt-6">
            Now say that X is <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">else</code> — the next token could be anything, maybe <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">!</code> as in, "do what I say, or else!" Our bigram model thinks <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">where</code> is most likely — reasonable. But say attention has learned the Ruby pattern — in the affinity matrix there's a high value for any occurrence of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>, so we'll attend to it. Having done so, we ask the OV circuit, "what do we do if we've seen <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code> previously?" And the OV circuit will tell us, "be on the lookout for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code>, there's a good chance it turns up soon." So we'll boost the probability of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in our guess for the next token. You can imagine bending our probabilistic model of language from its lumpiest, lowest-context form, like wet clay, into a finer approximation of genuine English. More and more training examples, and more architecture with which to accommodate their underlying structure, will continue to shape and smooth the model into the correct shape.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            One important limitation is that the QK circuit and OV circuit are completely separate. Each token, like <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>, can only give a <em>single</em> answer for how we should modify our guess given its presence. It does not know which token is attending to it. That's unfortunate because, competing patterns are inevitable.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            Luckily, lots of patterns are synonyms and they <em>can</em> share a head. For example, Bash uses <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">fi</code> instead of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in the exact same construction — no problem! We just boost <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">fi</code> as well as <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in the OV entry for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>. As long as other tokens don't attend to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code> except <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">then</code> it's 100% fine for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>'s entry in the OV circuit to equal "what you should do when <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">then</code> attends to you."
          </p>

          <p className="text-lg leading-relaxed mt-6">
            In general though, to store the many patterns present in English (not to mention other languages, programming syntax, and so on), you can see that we will need both the ability to have many different corresponding QK and OV circuits; we will run many different instances of attention that can pick up different patterns.
          </p>

          {/* Continue with rest of the blog post... */}
          <p className="text-lg leading-relaxed mt-6 text-neutral-500 italic">
            [More sections to be added: Skip Trigrams, Two Layers, Induction Heads, Evolution, etc.]
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="mx-auto max-w-3xl px-6 pb-16 pt-12 border-t border-neutral-200">
        <p className="text-sm text-neutral-500">
          This is an interactive explainer based on mechanistic interpretability research.
        </p>
      </footer>
    </article>
  );
}
