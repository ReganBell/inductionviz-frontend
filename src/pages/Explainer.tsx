import React, { useState, useMemo, useEffect } from "react";
import { CombinedAttentionWidget } from "../components/CombinedAttentionWidget";
import { TokenStrip } from "../components/TokenStrip";
import { AttentionCircuitWidget } from "../components/AttentionCircuitWidget";
import { CompetingPatternsDemo } from "../components/CompetingPatternsDemo";
import { CopyingBehaviorDemo } from "../components/CopyingBehaviorDemo";
import { PreviousTokenHeadDemo } from "../components/PreviousTokenHeadDemo";
import { InductionHeadDemo } from "../components/InductionHeadDemo";
import { InductionComparisonWidget } from "../components/InductionComparisonWidget";
import { EvolutionWidget } from "../components/EvolutionWidget";
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

          <AttentionCircuitWidget
            panels={["ov"]}
            initialText="The email was from Michael our new director"
            initialTab={2}
          />

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

          <CompetingPatternsDemo />

          <p className="text-lg leading-relaxed mt-6">
            Luckily, lots of patterns are synonyms and they <em>can</em> share a head. For example, Bash uses <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">fi</code> instead of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in the exact same construction — no problem! We just boost <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">fi</code> as well as <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in the OV entry for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>. As long as other tokens don't attend to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code> except <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">then</code> it's 100% fine for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>'s entry in the OV circuit to equal "what you should do when <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">then</code> attends to you."
          </p>

          <p className="text-lg leading-relaxed mt-6">
            In general though, to store the many patterns present in English (not to mention other languages, programming syntax, and so on), you can see that we will need both the ability to have many different corresponding QK and OV circuits; we will run many different instances of attention that can pick up different patterns.
          </p>

          <AttentionCircuitWidget />
        </section>

        {/* TODO: You should be able to insert any text here and we will highlight in green if the OV circuit for that token is copying */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Copying</h2>

          <p className="text-lg leading-relaxed mt-6">
            Before we go though, we should look at one other behavior we see in the single-layer case: copying. The OV circuit has an entry for every token, answering the question, how should we change our logits when this token is attended to? If we attend to this token, how should that inform our guess about what's coming next? In almost all cases, the answer is, we simply boost the chances that we will see that same token again. The more interesting skip-trigrams like we investigated above are rare, relatively. We don't have to attend to any particular token, so we can use the QK circuit to learn if it actually makes sense for a previous token to come up again; if it does, we can attend to it. Having somewhat constant behavior in the OV circuit makes this coordination a little easier.
          </p>

          <CopyingBehaviorDemo />
        </section>

        {/* Phase 6: Two-Layer Induction */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Two Layers: Induction Heads</h2>

          <p className="text-lg leading-relaxed">
            OK, let's finally add another layer of attention, still no MLP.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            Now, attention heads are allowed to compose — we can run attention on the output of another attention head, and that makes things surprisingly interesting.
          </p>
          {/* TODO: add a bigram panel to this as well */}
          <InductionComparisonWidget />

          <p className="text-lg leading-relaxed mt-6">
            It's where we see the first glimmers of learning from context. Because what makes transformers so special, and what enables their human-like ability to chat with us and generally be useful, is their ability to reason over context. Precursors in NLP were true models of the English language (sometimes others), and <em>translation</em> was the main goal of research. They reflected how english is usually written, based on what they'd seen; that model was then frozen in time. You could say "my name is Regan" and then ask, "what's my name?" and they would not know, unless hand-coded heuristics caused the system to store that kind of information explicitly (as in Facebook's M, from the first wave of too-early chatbots that preceded the real deal). Transformers enabled crossing the chasm into what feels like a real entity, who you can tell things to, that will remember them. Let's try an easier task. We write <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is Regan</code> 100 times, then ask the model to complete, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is ___</code>. Could we do this with a skip-trigram? A <em>little</em> — the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code> might attend back to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code> and encode some vague sense that a name should follow, you could imagine seeing these logits boosted. But that information would still be sourced from a model of the English language as a whole, not the present conversation. So how do we boost the logits for "Regan" just because that's who we're talking about right now?
          </p>


          <p className="text-lg leading-relaxed mt-6">
            An <em>induction head.</em> It's a specific kind of attention head. They are called that because they infer a rule based on repeated observations of a pattern. I don't love the name because a skip-trigram is <em>also</em> an example of doing induction — but you can remember that induction heads are working <em>in context,</em> which is a little cooler and more interesting than skip-trigrams, which model the distribution of training data.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            If you observe the QK and OV action of an attention head that's doing induction, you will see that it attends to <em>past</em> occurrences of the token that comes <em>next</em>. It "sees the future" and attends to that token. So imagine the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code> attending to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>. How does it know to do this?
          </p>

          <p className="text-lg leading-relaxed mt-6">
            It's a pretty interesting coordination problem with a definite evolutionary tinge.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            Basically, two attention heads have to grow to complete two tasks, and they do so without knowledge of the other one, and the system doesn't work (I think) until both of them are online and functioning:
          </p>

          <ol className="text-lg leading-relaxed ml-6 mt-4 space-y-2">
            <li>A "previous token" head</li>
            <li>The induction head itself</li>
          </ol>

          <p className="text-lg leading-relaxed mt-6">
            The previous token head does something pretty simple that doesn't seem very useful: apply a "tag" to every token that indicates which token came right before it. The tag is written into the residual stream in a subspace that's orthogonal to the actual logit/output guess such that we can tuck it away without affecting the output.
          </p>

          {/* TODO: demonstrate in some way the nature of the "tag" ie writing to a subspace that doesn't affect the output */}
          {/* This demo is currently busted */}
          <PreviousTokenHeadDemo />


          <p className="text-lg leading-relaxed mt-6">
            So our tokens would be tagged like:
          </p>

          <ul className="text-lg leading-relaxed ml-6 mt-4 space-y-1">
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My</code></li>
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code></li>
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code></li>
          </ul>

          <p className="text-lg leading-relaxed mt-6">
            The previous token head is a copying head like we saw before, where the OV for tokens simply boosts their own likelihood. But the QK attends to just one token: the token that came immediately before. It attends and copies that output into its own residual stream.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            So, for example, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> would attend to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>, and copy its "logits" — so the output is now effectively a guess heavily slanted toward generating the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> again. You might stop here and think — hold on, don't we need to generate a newline next, or <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Bell</code> or something? Won't this cause us to generate <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is Regan Regan</code>? No, the reason is that the tag is written into an orthogonal subspace. Now that we have two layers, our output from the head doesn't map exactly to our guess about the next token anymore, it's more like an "under-construction" guess: we're allowed to just do partial computation that's served up for later layers in the network to finish up and create a next-token guess with.
          </p>


          <p className="text-lg leading-relaxed mt-6">
            The induction head itself can be found at layer 2. We want the output to be the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>. But we have no way of knowing yet which token comes next. We do know our own identity, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>, so we can just ask the past! What we do is look for a "tag" that's equal to our own identity. It just so happens that <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> has such a tag. We find it, and attend to that token, so now we know that we should tilt our output guess toward <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>.
          </p>

          <InductionHeadDemo />
        </section>

        {/* Phase 7: Evolution (Placeholder) */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">How These Circuits Evolve During Training</h2>

          <p className="text-lg leading-relaxed">
          What’s most interesting about this, I think, is that it’s a case of evolutionary exaptation. We can’t start growing an induction head without signal from a previous token head to latch onto. The thing is, we can’t build a previous token head just because — we promise! — one day it’ll be useful to have. As in biological evolution, it needs to be useful on its own to continue to exist in the face of loss landscape optimization. Luckily, it *is* useful — repeated characters are common enough (think `!!` or `??` ) that warping our language model to slightly boost our prediction of the same character recurring will lower loss by itself. Interestingly, you might think there’s an incentive to have this prediction be “legible” initially, but “hidden” in an orthogonal subspace later, once the induction head is at work (maybe?).

The evolutionary analog is really interesting, and definitely makes me wonder if there are selfish-gene-style effects at work — you could imagine circuit types that somehow establish themselves and prevent the network from functioning without them and yet also are not optimal with respect to the loss landscape.          </p>

          <EvolutionWidget />
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
