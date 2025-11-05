import React, { useState, useMemo, useEffect } from "react";
import { CombinedAttentionWidget } from "../components/CombinedAttentionWidget";
import { TokenStrip } from "../components/TokenStrip";
import { AttentionCircuitWidget } from "../components/AttentionCircuitWidget";
import { API_URL } from "../config";
import type { AttentionPatternsResponse, TokenInfo } from "../types";
import NoLayerFigure from "../components/NoLayerFigure";

export function Explainer() {

  return (
    <article className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Distill-style header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 pb-12">
        <p className="text-sm tracking-widest uppercase text-neutral-500">Interactive Notes</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Induction Heads</h1>
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

          <NoLayerFigure />

          <p className="text-lg leading-relaxed mt-6">
             The embedding matrix maps each token into latent space, and the unembedding matrix maps out a corresponding guess for the token to follow. 
          </p>
          <p className="text-lg leading-relaxed mt-6">
            When you train this, you end up learning a bigram model. I think it's worth considering why that is, intuitively. My answer is that, without attention, you truly have no information to predict the next token beyond the one that came before it.<sup>1</sup> In this environment, even if you had an infinitely smart model, you simply don't know enough about the situation you're in to do better than a "dumb" prediction based on occurrence statistics.
          </p>

                  {/* Bigram Widget */}
        <div className="my-12">
          <CombinedAttentionWidget
            panels={["bigram"]}
          />
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
            The bigram statistics (given X, what's Y?) are still basically the foundation of the model. But now we're able to bias those predictions given other tokens that came before. In certain situations, we can do much better. 
            The second we use a word like "quarterback", we've provided a huge blinking signpost to the model that we're talking about football.
            In this regime, it makes sense to dramatically boost of all manner of football and generally sports-related tokens.
          </p>

          <CombinedAttentionWidget panels={["l1", "bigram"]} />

          <p className="text-lg leading-relaxed mt-6">
          There are a lot of mental models for this, but here’s what I’m using right now: we build up an affinity matrix (also called the QK circuit) that tells us how much token X cares about any other token. We learn this over time as the network trains.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            First, we build up an <em>affinity matrix</em> (also called the <strong>QK circuit</strong>) that tells us how much each token cares about every other token. This is learned during training.
          </p>

          <AttentionCircuitWidget
            panels={["qk"]}
            initialText="Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large moustache."
          />

          <p className="text-lg leading-relaxed mt-6">
            Second, we learn the <strong>OV circuit</strong>, which tells us: when we <em>do</em> attend to a token, how should that modulate our prediction for what comes next?
          </p>

          <p className="text-lg leading-relaxed mt-6">
            Let's break down these two circuits in detail:
          </p>

          <AttentionCircuitWidget />

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
        </section>

        {/* Phase 5: Special Patterns (Placeholder) */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Special Attention Patterns</h2>

          <p className="text-lg leading-relaxed text-neutral-500 italic">
            [Coming soon: We'll explore three types of attention patterns that emerge in the single-layer model:]
          </p>

          <ul className="text-lg leading-relaxed text-neutral-500 italic ml-6 mt-4">
            <li><strong>Syntax Patterns</strong> - like the bracket-closer head that matches opening/closing delimiters</li>
            <li><strong>Abstract Topic Patterns</strong> - like the philosophy cluster head that connects semantically related concepts</li>
            <li><strong>Semantic Fact Patterns</strong> - like the name→title head that links entities with their roles</li>
          </ul>

          <p className="text-lg leading-relaxed text-neutral-500 italic mt-6">
            [Interactive widget will show these three patterns with real examples from the trained model]
          </p>
        </section>

        {/* Phase 6: Two-Layer Induction (Placeholder) */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Two Layers: Induction Heads</h2>

          <p className="text-lg leading-relaxed text-neutral-500 italic">
            [Coming soon: The real magic happens when we add a second layer. Two-layer attention enables <strong>induction heads</strong> - circuits that can complete patterns like "The quarterback threw the football..." by copying from earlier context.]
          </p>

          <p className="text-lg leading-relaxed text-neutral-500 italic mt-6">
            [Explanation will cover:]
          </p>

          <ul className="text-lg leading-relaxed text-neutral-500 italic ml-6 mt-4">
            <li>How Layer 1 creates "previous token" pointers</li>
            <li>How Layer 2 uses these pointers to copy information</li>
            <li>The composition of QK and OV circuits across layers</li>
            <li>Interactive demonstration of pattern completion</li>
          </ul>
        </section>

        {/* Phase 7: Evolution (Placeholder) */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">How These Circuits Evolve During Training</h2>

          <p className="text-lg leading-relaxed text-neutral-500 italic">
            [Coming soon: We'll visualize how attention heads develop during training, showing the phase transition where induction heads suddenly emerge.]
          </p>

          <p className="text-lg leading-relaxed text-neutral-500 italic mt-6">
            [Interactive timeline widget will show:]
          </p>

          <ul className="text-lg leading-relaxed text-neutral-500 italic ml-6 mt-4">
            <li>Training loss over epochs</li>
            <li>Emergence of specific attention patterns</li>
            <li>The "induction bump" - a sudden improvement when induction heads form</li>
            <li>How different heads specialize over time</li>
          </ul>
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
