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
import { TokenEmbeddingDiagram } from "../components/TokenEmbeddingDiagram";
import { API_URL } from "../config";
import type { AttentionPatternsResponse, TokenInfo } from "../types";
import NoLayerFigure from "../components/NoLayerFigure";

export function Explainer() {

  return (
    <article className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Distill-style header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 pb-12">
        <p className="text-sm tracking-widest uppercase text-neutral-500">Interp Speedrun #1</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Toy Transformers</h1>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-6 pb-24">
      <figure className="pb-6">
        <img src='/toytransformer.jpg' />
        <figcaption className="text-center text-neutral-500 text-sm mt-2">Not this kind.</figcaption>
      </figure>


        {/* Introduction */}
        <section className="prose prose-neutral max-w-none">
          <p className="text-lg leading-relaxed">
            {/* why this paper? it's the first real mechinterp paper *on transformers* -- there were others on CNNs etc before */}
            Let's walk through <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline">A Mathematical Framework for Transformer Circuits</a>. I think this paper is where the term "mechanistic interpretability" actually comes from. <br></br> <small className="text-neutral-600">(edit: found it on a podcast with Chris a <a href="https://80000hours.org/podcast/episodes/chris-olah-interpretability-research" className="underline">few months before</a>, and it was hinted at back in the <a href="https://distill.pub/2020/circuits/zoom-in/" className="underline">Distill days</a>)</small>
          </p>

          <p className="text-lg leading-relaxed mt-6">
            The idea is to build the tiniest imaginable transformer that can still do transformer-y stuff, and figure out how it works.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            {/* Maybe experiment #1 */}
           Attempt #1: what if you took out <em>all</em> the layers? Well, for one, it's not a transformer anymore: it's the on-ramp and off-ramp with nothing in between, it's just the bun of the sandwich.
          </p>

      <NoLayerFigure />

          {/* TODO: don't explain this, no additions until we've fixed everything else */}
          {/* <p className="text-lg leading-relaxed mt-6">
             The embedding matrix maps each token into latent space, and the unembedding matrix maps out a corresponding guess for the token to follow. It can be a little difficult to think about what it means to map from an X-dimensional space (the vocabulary size) to the Y-dimensional latent space of the model. A nice intuition is that it's a more complex version of this:
             {/* diagram of mapping English characters into a 2-D space */}
             {/* Caption: here, were projecting from twenty-six dimensions, where letters are labelled with their exact identity, to two where they are arrayed out on a surface with X and Y coordinates. Notice how vowels cluster together, because the model understands them to be similar.  */}
          {/* </p> */}
          <p className="text-lg leading-relaxed mt-6">
            When you train this, you end up learning a bigram model, the simplest possible "next token predictor." You simply don't know enough about the situation you're in to do better than a "dumb" prediction based on occurrence statistics.
          </p>

                  {/* Bigram Widget */}
        <div className="my-12">
          <CombinedAttentionWidget
            panels={["bigram"]}
          />
          {/* Maybe a caption here: we are limited to a single token of context. The sentence at large is about football, but we can only predict football related tokens  */}
        </div>
          {/* It answers the question "What token comes after `football`?" with the simple  */}
        <p className="text-lg leading-relaxed mt-6">
          A traditional bigram model is built by literally counting every single time a particular token follows another.
          A <em>learned</em> bigram model is a little cooler than that, in part because of how small it is.
          Ever hear of "compression = intelligence?"
          The full transition table for GPT-2's token set is ~10GB, but it's sparse (full of zeroes) because most tokens never follow each other. Our model is only <code className="bg-gray-100 rounded px-1.5 py-0.5">d_model</code> numbers (~1KB) and is almost as good.
          That's semantic compression at work. In latent space, we can squash tokens together without too much loss of accuracy — and the visualization below shows exactly how.
        </p>

        <TokenEmbeddingDiagram />

        </section>


        {/* Continue with single attention layer */}
        <section className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">One Attention Layer</h2>

          <p className="text-lg leading-relaxed">
            They say attention is all you need, so let's see what that gets us. In particular, we add <em>only</em> an attention layer and <em>omit</em> the MLP layer, where the neurons of the network actually live.
          </p>

          <CombinedAttentionWidget panels={["l1", "bigram"]} />

          <p className="text-lg leading-relaxed mt-6">
            The heart of the model is still the bigram transition table. But now, we're able to bias those predictions given other tokens that came before. In certain situations, we can do much better. 
            The second we use a word like "quarterback", we've provided a huge blinking signpost to the model that we're talking about football.
            In this regime, it makes sense to dramatically boost of all manner of football and generally sports-related tokens.
          </p>


          <p className="text-lg leading-relaxed mt-6">
            The original paper characterizes our model now in terms of skip-trigrams;
            a skip-trigram gets to incorporate an additional previous token as evidence,
            and that token can have occurred anywhere in the past.
            Moreover, the attention mechanism lets us take a weighted average over many different skip-trigrams to predict the next token.
          </p>

          <p className="text-lg leading-relaxed mt-6">
           How does this work? Attention is usually explained in terms of keys, queries, and values.
           This paper uses instead the QK and OV circuits, which I find a little more intuitive.
           The QK circuit (I often like to think of it as an <i>affinity matrix</i>) tells us how much a token X should care about any other token Y, based on their values. We learn this pattern over time as the network trains.
          </p>

          <AttentionCircuitWidget
            panels={["qk"]}
            initialText="Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large moustache."
          />

          <p className="text-lg leading-relaxed mt-6">
            Certain attention patterns are easier to interpret than others, and different attention heads will learn to attend in their own ways.
            A common pattern in a single-layer network is to attend to signposts that indicate something about the regime we're in.
            For example, certain words may signpost a legal context, a sports context, or a medical one.
            Other tokens may change the context of what follows them -- for example, the words following a `(` are inside a parenthetical, and can be expected to vary systematically from those that aren't.
            Accordingly, the model will learn to pay attention to these tokens.
          </p> 

          <p className="text-lg leading-relaxed mt-6">
            What does attending to a token actually do?
            This is decided by the <strong>OV circuit</strong>, which tells us: when we <em>do</em> attend to a token, how should that modulate our prediction for what comes next?
            Crucially, the OV circuit is totally independent of the QK. If I'm token X and you attend to me, I'll give you the same output regardless of your (token) identity.
          </p>

          <AttentionCircuitWidget
            panels={["ov"]}
            initialText="The email was from Michael our new director"
            initialTab={2}
          />

          <p className="text-lg leading-relaxed mt-6">
            This is an unusually spicy skip-trigram. When this head attends to the name "Michael" (or "Chris", "Andrew", "Dave", "Simon", etc) it becomes much more likely to predict a basket of words associated with leadership and seniority: CEO, manager, director, etc.
            This attention head has picked up on the stereotype of (slightly older) white male names in positions of authority.
          </p> 

          {/* <p className="text-lg leading-relaxed mt-6">
            In Ruby, you often see control patterns like:
          </p>

          <pre className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-sm font-mono overflow-x-auto mt-4">
{`if <thing A is true>s
    <do B>
else
  <do C>
end`}
          </pre>

          <p className="text-lg leading-relaxed mt-6">
            Now say that X is <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">else</code> — the next token could be anything, maybe <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">!</code> as in, "do what I say, or else!" Our bigram model thinks <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">where</code> is most likely — reasonable. But say attention has learned the Ruby pattern — in the affinity matrix there's a high value for any occurrence of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code>, so we'll attend to it. Having done so, we ask the OV circuit, "what do we do if we've seen <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">if</code> previously?" And the OV circuit will tell us, "be on the lookout for <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code>, there's a good chance it turns up soon." So we'll boost the probability of <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">end</code> in our guess for the next token. You can imagine bending our probabilistic model of language from its lumpiest, lowest-context form, like wet clay, into a finer approximation of genuine English. More and more training examples, and more architecture with which to accommodate their underlying structure, will continue to shape and smooth the model into the correct shape.
          </p> */}

          <p className="text-lg leading-relaxed mt-6">
            Recall that the QK circuit and OV circuit act separately. When tokens are attended to (and thereby influence the model's next-token guess) they do not who is doing the attending. That can be tricky, because competing patterns are inevitable.
          </p>

          <CompetingPatternsDemo />

          <p className="text-lg leading-relaxed mt-6">
            Luckily, lots of patterns are also synonyms and they <em>can</em> happily share an attention head.
            In fact, they have to. Our model has only seven attention heads, but encodes many learned features and patterns.
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
