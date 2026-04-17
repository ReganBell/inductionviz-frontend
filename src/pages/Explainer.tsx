import React, { useState, useEffect, useRef } from "react";
import { CombinedAttentionWidget } from "../components/CombinedAttentionWidget";
import { CompletionPreviewWidget } from "../components/CompletionPreviewWidget";
import { AttentionCircuitWidget } from "../components/AttentionCircuitWidget";
import { CopyingBehaviorDemo } from "../components/CopyingBehaviorDemo";
import { InductionComparisonWidget } from "../components/InductionComparisonWidget";
import { CompositionFlowDiagram } from "../components/CompositionFlowDiagram";
import { staticData, type StaticAttentionData, type StaticBigramData, type StaticCompletionsData } from "../staticData";
import NoLayerFigure2 from "./NoLayerFigure2";

// --- Section definitions for TOC ---

const sections = [
  { id: "intro", title: "Introduction" },
  { id: "residual-stream", title: "The Residual Stream" },
  { id: "zero-layers", title: "Zero Layers: Bigrams" },
  { id: "qk-ov", title: "QK and OV Circuits" },
  { id: "one-layer", title: "One Layer: Skip-Trigrams" },
  { id: "composition", title: "Composition" },
  { id: "induction", title: "Induction Heads" },
];

// --- Slide layout component ---

function Slide({
  id,
  text,
  widget,
  wide,
}: {
  id: string;
  text: React.ReactNode;
  widget?: React.ReactNode;
  wide?: boolean;
}) {
  if (!widget) {
    return (
      <section id={id} className="mb-20 scroll-mt-24">
        <div className="prose prose-neutral max-w-none">{text}</div>
      </section>
    );
  }

  if (wide) {
    return (
      <section id={id} className="mb-20 scroll-mt-24">
        <div className="prose prose-neutral max-w-none mb-8">{text}</div>
        <div>{widget}</div>
      </section>
    );
  }

  return (
    <section id={id} className="mb-20 scroll-mt-24 grid gap-10 xl:grid-cols-[1fr_1.2fr] xl:items-start">
      <div className="prose prose-neutral max-w-none">{text}</div>
      <div className="xl:sticky xl:top-24">{widget}</div>
    </section>
  );
}

// --- Helper ---

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

// --- TOC ---

function TOC({ activeSection }: { activeSection: string }) {
  return (
    <aside className="hidden 2xl:block fixed left-8 top-24 w-48">
      <nav className="space-y-1">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block py-1 text-xs transition-colors pl-3 border-l-2 ${
              activeSection === s.id
                ? "text-blue-600 font-medium border-blue-500"
                : "text-neutral-400 hover:text-neutral-600 border-transparent"
            }`}
          >
            {s.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}

// --- Previous token tag table ---

const PREV_TOKEN_TAGS = [
  { token: "My", tag: "\u27E8BOS\u27E9" },
  { token: "name", tag: "My" },
  { token: "is", tag: "name" },
  { token: "Regan.", tag: "is" },
  { token: "My", tag: "Regan." },
  { token: "name", tag: "My" },
  { token: "is", tag: "name" },
];

// =============================================================================

export function Explainer() {
  const [activeSection, setActiveSection] = useState("intro");
  const [footnoteVisible, setFootnoteVisible] = useState(false);

  // Static data
  const [quarterbackBigram, setQuarterbackBigram] = useState<StaticBigramData | null>(null);
  const [quarterbackAttnT1, setQuarterbackAttnT1] = useState<StaticAttentionData | null>(null);
  const [quarterbackCompletions, setQuarterbackCompletions] = useState<StaticCompletionsData | null>(null);
  const [hpAttnT1, setHpAttnT1] = useState<StaticAttentionData | null>(null);
  const [michaelAttnT1OV, setMichaelAttnT1OV] = useState<StaticAttentionData | null>(null);
  const [reganAttnT1, setReganAttnT1] = useState<StaticAttentionData | null>(null);
  const [reganAttnT2, setReganAttnT2] = useState<StaticAttentionData | null>(null);
  const [reganSpaceAttnT2, setReganSpaceAttnT2] = useState<StaticAttentionData | null>(null);

  useEffect(() => {
    staticData.quarterbackBigram().then(setQuarterbackBigram);
    staticData.quarterbackAttnT1().then(setQuarterbackAttnT1);
    staticData.quarterbackCompletions().then(setQuarterbackCompletions);
    staticData.hpAttnT1().then(setHpAttnT1);
    staticData.michaelAttnT1OV().then(setMichaelAttnT1OV);
    staticData.reganAttnT1().then(setReganAttnT1);
    staticData.reganAttnT2().then(setReganAttnT2);
    staticData.reganSpaceAttnT2().then(setReganSpaceAttnT2);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= y) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <article className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 pt-14 pb-10">
        <p className="text-sm tracking-widest uppercase text-neutral-400">Interp Speedrun #1</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">A Mathematical Framework for Transformer Circuits</h1>
        <p className="mt-4 text-base text-neutral-500 max-w-2xl">
          An interactive walkthrough of the foundational mechanistic interpretability paper by Elhage, Nanda, Olsson et al. (Anthropic, 2021). We rebuild its key results on real models and let you poke at them.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline hover:text-neutral-600">Read the original paper</a>
        </p>
      </header>

      <TOC activeSection={activeSection} />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 pb-24">

        {/* ================================================================ */}
        {/* INTRODUCTION                                                      */}
        {/* ================================================================ */}

        <Slide
          id="intro"
          text={
            <>
              <p className="text-lg leading-relaxed">
                The paper's core move is to rewrite the transformer in a form where the computation decomposes cleanly into interpretable paths, then work out what simplified versions of the architecture actually do.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                We'll start with zero layers (just embeddings), add one attention layer, then two. At each step you can see what the model can and cannot do, and <em>why</em>, by inspecting its circuits directly.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                This was the first paper to use the term "mechanistic interpretability."
                <sup
                  onClick={() => setFootnoteVisible(!footnoteVisible)}
                  className="cursor-pointer text-blue-600 hover:text-blue-800 underline ml-0.5"
                >[1]</sup>
              </p>
              {footnoteVisible && (
                <div className="mt-3 p-3 bg-neutral-50 rounded text-sm text-neutral-600">
                  <strong>[1]</strong> For a while people were calling this Bertology, as in BERT, and it's kind of too bad that didn't stick.
                </div>
              )}
            </>
          }
        />

        {/* ================================================================ */}
        {/* RESIDUAL STREAM                                                   */}
        {/* ================================================================ */}

        <Slide
          id="residual-stream"
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">The Residual Stream</h2>
              <p className="text-lg leading-relaxed">
                The first conceptual shift: don't think of a transformer as a stack of layers transforming a hidden state. Think of it as a <strong>residual stream</strong>, a running sum that every attention head reads from and writes to.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                It's something like a filesystem, where early layers can write data to be read by later layers. It also constitutes a work-in-progress guess for the output that layers can refine as they go.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                Because everything is additive, you can decompose the final logits as a sum over <em>paths</em> through the network. Each path is a specific sequence of heads. This is what makes "circuits" tractable: you can isolate the contribution of a specific subgraph.
              </p>
            </>
          }
          widget={<NoLayerFigure2 />}
        />

        {/* ================================================================ */}
        {/* ZERO LAYERS: BIGRAMS                                              */}
        {/* ================================================================ */}

        <Slide
          id="zero-layers"
          wide
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">Zero Layers: Bigrams</h2>
              <p className="text-lg leading-relaxed">
                Transformers consist of some number of identical blocks in a stack: GPT-2 had 12, by GPT-4 there are ~120. What if you remove them all?
              </p>
              <p className="text-lg leading-relaxed mt-5">
                With no attention, the model can only learn bigram statistics. The embedding-unembedding product W<sub>U</sub>W<sub>E</sub> is literally a bigram log-likelihood table. Each token is predicted solely based on the token before it.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                Remember the original iOS Quicktype keyboard? Same idea. Words follow each other in a sensible way, but long sentences unravel into nonsense. You simply don't know enough about the context to do better.
              </p>
            </>
          }
          widget={
            <CombinedAttentionWidget
              panels={["bigram"]}
              staticBigramData={quarterbackBigram}
            />
          }
        />

        {/* ================================================================ */}
        {/* QK AND OV CIRCUITS                                                */}
        {/* ================================================================ */}

        <Slide
          id="qk-ov"
          wide
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">QK and OV Circuits</h2>
              <p className="text-lg leading-relaxed">
                Before adding a layer, the key insight: each attention head's computation splits into two independent parts.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                The <strong>QK circuit</strong> (W<sub>Q</sub><sup>T</sup>W<sub>K</sub>) determines <em>where</em> to attend. It scores how much each destination token wants to read from each source token.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                The <strong>OV circuit</strong> (W<sub>O</sub>W<sub>V</sub>) determines <em>what moves</em> once attention is decided. When you attend to a token, how should that change the prediction?
              </p>
              <p className="text-lg leading-relaxed mt-5">
                These are independent: attention patterns and the content being moved are governed by separate low-rank matrices. This separation is what makes head-level interpretability possible.
              </p>
            </>
          }
        />

        {/* QK widget */}
        <Slide
          id="qk-circuit-widget"
          text={
            <>
              <h3 className="font-semibold text-xl mb-4">The QK Circuit in Action</h3>
              <p className="text-base leading-relaxed">
                The matrix is lower-triangular: tokens can only attend backwards. Darker vertical strips are tokens the model finds interesting, like context clues attended to by many positions.
              </p>
            </>
          }
          widget={
            <AttentionCircuitWidget
              panels={["qk"]}
              initialText="Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large moustache."
              staticAttentionData={hpAttnT1}
            />
          }
        />

        {/* OV widget */}
        <Slide
          id="ov-circuit-widget"
          text={
            <>
              <h3 className="font-semibold text-xl mb-4">The OV Circuit in Action</h3>
              <p className="text-base leading-relaxed">
                When this head attends to "Michael" (or "Chris", "Andrew", "Dave", "Simon") it boosts a basket of words associated with leadership and seniority: CEO, manager, director. The head has picked up on the stereotype of white male names in positions of authority.
              </p>
              <p className="text-base leading-relaxed mt-4">
                That's a complex learned association. But the most common OV pattern is much simpler: it just ups the odds of seeing that same token again. Pure copying.
              </p>
            </>
          }
          widget={
            <AttentionCircuitWidget
              panels={["ov"]}
              initialText="The email was from Michael our new director"
              initialTab={2}
              initialHead={2}
              staticAttentionData={michaelAttnT1OV}
            />
          }
        />

        {/* Copying demo */}
        <Slide
          id="copying-demo"
          wide
          text={
            <>
              <h3 className="font-semibold text-xl mb-4">Copying Behavior</h3>
              <p className="text-base leading-relaxed">
                For most tokens, the OV circuit's top prediction is the token itself. Attending to "committee" boosts the odds of seeing "committee" again. This default copying behavior is what makes the QK circuit's job tractable.
              </p>
            </>
          }
          widget={<CopyingBehaviorDemo />}
        />

        {/* ================================================================ */}
        {/* ONE LAYER: SKIP-TRIGRAMS                                           */}
        {/* ================================================================ */}

        <Slide
          id="one-layer"
          wide
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">One Layer: Skip-Trigrams</h2>
              <p className="text-lg leading-relaxed">
                Adding one attention layer gives us skip-trigrams: "if token A appeared somewhere earlier and token B is current, predict C." The QK circuit determines which earlier tokens to attend to; the OV circuit determines how attending to those tokens changes the prediction.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                The second we use a word like "quarterback," we've provided a <em>huge</em> context clue that a bigram model would immediately forget. Now we can attend to signpost words way back in the sequence. Compare:
              </p>
            </>
          }
          widget={
            <CombinedAttentionWidget
              panels={["l1", "bigram"]}
              staticBigramData={quarterbackBigram}
              staticAttentionData={quarterbackAttnT1}
            />
          }
        />

        <Slide
          id="one-layer-limits"
          text={
            <>
              <p className="text-lg leading-relaxed">
                One layer buys you a bag of skip-trigram rules, but no composition. You can't use the output of one head as input to another in a content-dependent way. Every pattern the model recognizes was baked in during training.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                Multiple heads are necessary because competing patterns are inevitable. One head might learn the sports meaning of "beat" and another the musical meaning. Our toy model has eight heads but encodes many more features than that.
              </p>
            </>
          }
        />

        {/* ================================================================ */}
        {/* COMPOSITION                                                       */}
        {/* ================================================================ */}

        <Slide
          id="composition"
          wide
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">Two Layers and Composition</h2>
              <p className="text-lg leading-relaxed">
                With two layers, heads can compose. A second-layer head can read from the residual stream <em>after</em> a first-layer head has written to it. This creates three composition types, named by which input of the downstream head is affected:
              </p>
              <ul className="mt-4 space-y-2 text-lg leading-relaxed">
                <li><strong>Q-composition:</strong> the downstream head's <em>query</em> depends on an upstream head's output. Changes where it attends based on earlier computation.</li>
                <li><strong>K-composition:</strong> the downstream head's <em>key</em> depends on upstream output. Changes what tokens are findable.</li>
                <li><strong>V-composition:</strong> the downstream head's <em>value</em> depends on upstream output. Changes what content gets moved.</li>
              </ul>
              <p className="text-lg leading-relaxed mt-5">
                Composition creates "virtual attention heads" whose behavior is the product of two real heads' matrices. The space of computations expands combinatorially.
              </p>
            </>
          }
          widget={<CompositionFlowDiagram />}
        />

        {/* ================================================================ */}
        {/* INDUCTION HEADS                                                    */}
        {/* ================================================================ */}

        <Slide
          id="induction"
          wide
          text={
            <>
              <h2 className="font-serif text-3xl mb-5">Induction Heads</h2>
              <p className="text-lg leading-relaxed">
                The crown jewel. An induction head implements: "if the current token is A, find a previous occurrence of A, look at the token that came <em>after</em> it, and predict that token next." This is in-context pattern completion, the mechanism behind much of in-context learning.
              </p>
              <p className="text-lg leading-relaxed mt-5">
                A single-layer model can't do this, because the pattern was never in the training set. Compare the 1-layer and 2-layer models on a repeated name:
              </p>
            </>
          }
          widget={
            <InductionComparisonWidget
              staticT1Data={reganAttnT1}
              staticT2Data={reganAttnT2}
            />
          }
        />

        {/* How induction works mechanistically */}
        <Slide
          id="induction-mechanism"
          text={
            <>
              <h3 className="font-semibold text-xl mb-4">How It Works</h3>
              <p className="text-base leading-relaxed">
                It requires K-composition between two heads:
              </p>
              <ol className="mt-3 space-y-3 text-base leading-relaxed list-decimal ml-5">
                <li>
                  A <strong>previous-token head</strong> in layer 0 "tags" every token with the identity of the token that came right before it.
                </li>
                <li>
                  An <strong>induction head</strong> in layer 1 uses K-composition to match the current token against those tags. It finds positions where the current token previously preceded the tag-holder, attends there, and copies the content forward.
                </li>
              </ol>

              <div className="flex justify-center mt-6">
                <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-sm text-sm">
                  <div className="grid grid-cols-2 text-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-center">Token</div>
                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-center">Tagged with</div>
                    {PREV_TOKEN_TAGS.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className="px-4 py-1.5 border-b border-gray-100 font-medium text-center">{item.token}</div>
                        <div className="px-4 py-1.5 border-b border-gray-100 text-center text-neutral-500">{item.tag}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-base leading-relaxed mt-5">
                Operating at <Code>is</Code>, the induction head attends to <Code>Regan</Code> because <Code>Regan</Code> carries a tag saying "I followed <Code>is</Code>." The OV circuit then copies <Code>Regan</Code> into the prediction.
              </p>
              <p className="text-base leading-relaxed mt-4">
                The previous-token head's output doesn't pollute the prediction because it writes into an orthogonal subspace. It's partial computation served up for the next layer to finish.
              </p>
            </>
          }
          widget={
            <AttentionCircuitWidget
              initialText="My name is Regan. My name is "
              initialLayer={1}
              initialHead={7}
              staticAttentionData={reganSpaceAttnT2}
            />
          }
        />

        {/* ================================================================ */}
        {/* CLOSING                                                           */}
        {/* ================================================================ */}

        <section className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="font-serif text-3xl mb-5">Why This Matters</h2>
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed">
              This paper gives you a vocabulary (QK/OV, residual stream, composition types, virtual heads) that the rest of the interpretability literature now depends on. It establishes the methodology of reading circuits as path decompositions, the foundation for later work on indirect object identification, specific skill circuits, and feature analysis.
            </p>
            <p className="text-lg leading-relaxed mt-5">
              Its main limitation, which the paper is clear about, is that it's attention-only. No MLPs. Neuron interpretability and the superposition/features-in-MLPs agenda are what later work (Toy Models of Superposition, sparse autoencoders, the Transformer Circuits thread more broadly) was built to tackle.
            </p>
            <p className="text-lg leading-relaxed mt-5">
              Induction heads became the central case study for the follow-up paper, "In-Context Learning and Induction Heads," which shows they coincide with the ICL phase transition during training. That's next.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-100 text-sm text-neutral-400">
          <p>
            <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline hover:text-neutral-600">Original paper</a>
            {" "}&middot;{" "}
            <a href="https://reganbell.com" className="underline hover:text-neutral-600">reganbell.com</a>
          </p>
        </footer>
      </div>
    </article>
  );
}
