import React, { useState, useMemo, useEffect } from "react";
import { CombinedAttentionWidget } from "../components/CombinedAttentionWidget";
import { CompletionPreviewWidget } from "../components/CompletionPreviewWidget";
import { TokenStrip } from "../components/TokenStrip";
import { AttentionCircuitWidget } from "../components/AttentionCircuitWidget";
import { CompetingPatternsDemo } from "../components/CompetingPatternsDemo";
import { CopyingBehaviorDemo } from "../components/CopyingBehaviorDemo";
import { PreviousTokenHeadDemo } from "../components/PreviousTokenHeadDemo";
import { InductionHeadDemo } from "../components/InductionHeadDemo";
import { InductionComparisonWidget } from "../components/InductionComparisonWidget";
import { EvolutionWidget } from "../components/EvolutionWidget";
import { TokenEmbeddingDiagram } from "../components/TokenEmbeddingDiagram";
import { GradientForceWidget } from "../components/GradientForceWidget";
import { API_URL } from "../config";
import type { AttentionPatternsResponse, TokenInfo } from "../types";
import NoLayerFigure2 from "./NoLayerFigure2";

const sections = [
  { id: "introduction", title: "Introduction", level: 0 },
  { id: "no-layer-model", title: "No-Layer Model", level: 1 },
  { id: "bigram-widget", title: "Bigram Widget", level: 1 },
  { id: "one-attention-layer", title: "One Attention Layer", level: 0 },
  { id: "skip-trigram", title: "Skip-Trigram Comparison", level: 1 },
  { id: "qk-circuit", title: "QK Circuit", level: 1 },
  { id: "ov-circuit", title: "OV Circuit", level: 1 },
  { id: "competing-patterns", title: "Competing Patterns", level: 1 },
  { id: "attention-explorer", title: "Attention Explorer", level: 1 },
  { id: "copying", title: "Copying", level: 0 },
  { id: "copying-demo", title: "Copying Behavior", level: 1 },
  { id: "two-layers-induction-heads", title: "Two Layers: Induction Heads", level: 0 },
  { id: "induction-comparison", title: "Induction Comparison", level: 1 },
  { id: "prev-token-demo", title: "Previous Token Head", level: 1 },
  { id: "induction-demo", title: "Induction Head Demo", level: 1 },
  { id: "evolution", title: "How These Circuits Evolve During Training", level: 0 },
  { id: "evolution-widget", title: "Evolution Widget", level: 1 },
  { id: "gradient-force", title: "Gradient Force", level: 1 },
];

const PREVIOUS_TOKEN_TAGS = [
  { token: "My", tag: "<BOS>" },
  { token: "name", tag: "My" },
  { token: "is", tag: "name" },
  { token: "Regan.", tag: "is" },
  { token: "My", tag: "Regan." },
  { token: "name", tag: "My" },
  { token: "is", tag: "name" },
];

function TableOfContents({ tocVisible, activeSection }: { tocVisible: boolean, activeSection: string }) {
  return (      <aside
    className={`hidden xl:block fixed left-8 top-24 w-56 transition-opacity duration-300 ${
      tocVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
  >
    <nav className="space-y-0.5">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(section.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className={`block py-1 text-xs transition-colors ${
            section.level === 1 ? "pl-4" : "pl-2"
          } ${
            activeSection === section.id
              ? "text-blue-600 font-medium border-l-2 border-blue-500 -ml-px"
              : "text-neutral-500 hover:text-neutral-700 border-l-2 border-transparent -ml-px"
          } ${
            section.level === 0 ? "font-semibold mt-2" : ""
          }`}
        >
          {section.title}
        </a>
      ))}
    </nav>
  </aside>);
}

export function Explainer() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [tocVisible, setTocVisible] = useState(false);
  const [footnoteVisible, setFootnoteVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      // Show TOC after scrolling past header (roughly 200px)
      setTocVisible(window.scrollY > 200);

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <article className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Distill-style header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 pb-12">
        <p className="text-sm tracking-widest uppercase text-neutral-500">Interp Speedrun #1</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Toy Transformers</h1>
      </header>

      {/* Table of Contents - Fixed sidebar outside main flow */}
      <TableOfContents tocVisible={tocVisible} activeSection={activeSection} />

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-6 pb-24">
      <figure className="pb-6">
        <img src='/toytransformer.jpg' />
        <figcaption className="text-center text-neutral-500 text-sm mt-2">Not whatever this is.</figcaption>
      </figure>


        {/* Introduction */}
        <section id="introduction" className="prose prose-neutral max-w-none">
          <p className="text-lg leading-relaxed mt-6">
            Let's build the tiniest imaginable transformer that can still do transformer-y stuff, and figure out how it works.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            {/* why this paper? it's the first real mechinterp paper *on transformers* -- there were others on CNNs etc before */}
           That's the idea behind <a href="https://transformer-circuits.pub/2021/framework/index.html" className="underline">A Mathematical Framework for Transformer Circuits</a>,  the first paper to use the term "mechanistic interpretability,"
            as this field is now called.<sup 
              onClick={() => setFootnoteVisible(!footnoteVisible)}
              className="cursor-pointer text-blue-600 hover:text-blue-800 underline ml-0.5"
              title="Click to reveal footnote"
            >[1]</sup>
          </p>

          {footnoteVisible && (
            <div className="mt-4 p-4 bg-neutral-50  rounded text-sm text-neutral-700">
              <strong>[1]</strong> For a while people were calling this Bertology, as in BERT, and it's kind of too bad that didn't stick.
            </div>
          )}

          <p className="text-lg leading-relaxed mt-6">
            {/* Maybe experiment #1 */}
           Transformers consist of some number of identical <em>blocks</em> in a stack: GPT-2 had 12, by GPT-4 there are ~120. What if you remove them?
          </p>

          <p className="text-lg leading-relaxed mt-6">
            It's kind of like removing a person's brain
            -- you leave behind the eyes, which can convert input into
             a "format" the brain understands, and the mouth,
             which can convert from  that neural "format" to output that's legible externally.
          </p>

      <div id="no-layer-model">
        {/* <NoLayerFigure /> */}
        <NoLayerFigure2 />
        {/* <img className="mt-6" src='/nolayers.png' /> */}
      </div>

          {/* TODO: don't explain this, no additions until we've fixed everything else */}
          {/* <p className="text-lg leading-relaxed mt-6">
             The embedding matrix maps each token into latent space, and the unembedding matrix maps out a corresponding guess for the token to follow. It can be a little difficult to think about what it means to map from an X-dimensional space (the vocabulary size) to the Y-dimensional latent space of the model. A nice intuition is that it's a more complex version of this:
             {/* diagram of mapping English characters into a 2-D space */}
             {/* Caption: here, were projecting from twenty-six dimensions, where letters are labelled with their exact identity, to two where they are arrayed out on a surface with X and Y coordinates. Notice how vowels cluster together, because the model understands them to be similar.  */}
          {/* </p> */}

          <p className="text-lg leading-relaxed mt-6">
            Connecting the two is the residual stream, something like a filesystem, where early layers can write data to be read and used by later layers.  It also constitutes sort of work-in-progress guess for the output that the brain of the model can refine as it works.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            When you train this, you end up learning a bigram model, the simplest possible "next token predictor."
          </p>

          <img className="my-6 p-6" src='/quicktype.png' />
          {/* <figcaption className="text-center text-neutral-500 text-sm mt-2">The original iOS Quicktype keyboard.</figcaption> */}

          <p className="text-lg leading-relaxed mt-6">
            Remember the original iOS Quicktype keyboard? It was a similar model with a <em>local</em> understanding of text: words follow each other in a sensible way but long sentences will unravel 
            into nonsense. In a bigram model, each token is predicted solely based on the token before it. You simply don't know enough about the situation you're in to do better than a dumb prediction based on occurrence statistics.
          </p>

                  {/* Bigram Widget */}
        <div id="bigram-widget" className="my-12">
          <CombinedAttentionWidget
            panels={["bigram"]}
          />
          {/* Maybe a caption here: we are limited to a single token of context. The sentence at large is about football, but we can only predict football related tokens  */}
        </div>
          {/* It answers the question "What token comes after `football`?" with the simple  */}
        {/* <p className="text-lg leading-relaxed mt-6">
          A traditional bigram model is built by literally counting every single time a particular token follows another.
          A <em>learned</em> bigram model is a little cooler than that, in part because of how small it is.
          Ever hear of "compression = intelligence?"
          The full transition table for GPT-2's token set is ~10GB, but it's sparse (full of zeroes) because most tokens never follow each other. Our model is only <code className="bg-gray-100 rounded px-1.5 py-0.5">d_model</code> numbers (~1KB) and is almost as good.
          That's semantic compression at work. In latent space, we can squash tokens together without too much loss of accuracy — and the visualization below shows exactly how.
        </p>

        <TokenEmbeddingDiagram /> */}

        </section>


        {/* Continue with single attention layer */}
        <section id="one-attention-layer" className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">One Attention Layer</h2>

          <p className="text-lg leading-relaxed">
            They say attention is all you need, so let's see what that gets us. In particular, we add <em>only</em> an attention layer and <em>omit</em> the MLP layer, where the neurons of the network actually live.
          </p>

          <div id="skip-trigram">
            <CombinedAttentionWidget panels={["l1", "bigram"]} />
          </div>


        {/* Completion Preview Widget - NEW */}
        <div id="completion-preview" className="my-12">
          <CompletionPreviewWidget />
        </div>



          <p className="text-lg leading-relaxed mt-6">
            In certain situations, we can do much better than before. The second we use a word like "quarterback", we've provided a <em>huge</em> clue to the model that we're talking about football, a clue that a bigram model would immediately "forget."
            Now, we can attend to signpost words way back in the sequence that inform us as to what sort of context we're operating in.
          </p>


          <p className="text-lg leading-relaxed mt-6">
            The Anthropic paper characterizes our model now in terms of skip-trigrams;
            a skip-trigram is a bigram with an additional third token as evidence.
            That third token can have occurred anywhere in the past.
            Moreover, the attention mechanism lets us take a weighted average over many different skip-trigrams to predict the next token.
          </p>

          <p className="text-lg leading-relaxed mt-6">
           How is this actually implemented? Attention is usually explained in terms of per-token keys, queries, and values, 
           but this paper instead uses the QK and OV <em>circuits</em>, which I find a little more useful.
           The QK circuit is a big matrix that tells us how much a token X should care about any other token Y. We learn this pattern over time as the network trains.
        </p>

          <div id="qk-circuit">
            <AttentionCircuitWidget
              panels={["qk"]}
              initialText="Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large moustache."
              // initialLockedToken={68}
            />
          </div>

          <p className="text-lg leading-relaxed mt-6">
            This matrix has some interesting structure to it, even if it isn't obvious what it's doing.
            You'll notice that it is lower-triangular: that's because tokens are only allowed to attend to tokens that came before them in the sequence.
            Entries in the upper right would involve tokens "cheating" by querying the future as to what tokens are likely to come next.
          </p> 

          <p className="text-lg leading-relaxed mt-6">
            The darker vertical strips represent tokens that the model finds interesting; these are often context clues attended to by many different tokens.
            Again, <pre className="inline-block bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">quarterback</pre> is an example of such a word; others might indicate a legal context or a medical one.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            Tokens can also inform the context with respect to syntax, not meaning. For example, the tokens following a <pre className="inline-block bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">(</pre> are dramatically more likely to be <pre className="inline-block bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">)</pre> because the model knows we need to close the parenthetical.
            Accordingly, the model will learn to pay attention to these tokens.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            What does attending to a token actually do?
            This is decided by the <strong>OV circuit</strong>, which tells us: when we <em>do</em> attend to a token, how should that modulate our prediction for what comes next?
          </p>

          <div id="ov-circuit">
            <AttentionCircuitWidget
              panels={["ov"]}
              initialText="The email was from Michael our new director"
              initialTab={2}
              initialHead={2}
            />
          </div>

          <p className="text-lg leading-relaxed mt-6">
            This is an unusually spicy example. When this head attends to the name "Michael" (or "Chris", "Andrew", "Dave", "Simon", etc) it becomes much more likely to predict a basket of words associated with leadership and seniority: CEO, manager, director, etc.
            This attention head has picked up on the stereotype of (slightly older) white male names in positions of authority.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            The 'Michael' head is a complex, learned stereotype, but the most common pattern is much simpler: the OV circuit just ups our odds of seeing that same token again. 
          </p>

          <div id="copying-demo">
            <CopyingBehaviorDemo />
          </div> 

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
            An important note: the QK circuit and OV circuit act separately. When tokens are attended to, they do not know <em>who</em> is doing the attending. That can be tricky, because competing patterns are inevitable.
          </p>

          <div id="competing-patterns">
            <CompetingPatternsDemo />
          </div>

          <p className="text-lg leading-relaxed mt-6">
            Competing patterns necessitate multiple heads, or instances of the attention mechanism, in the model. One head might learn the sports version of the "beat" pattern and another might learn the musical meaning.
            Luckily, lots of patterns are synonyms and <em>can</em> happily share an attention head.
            Our toy model has eight attention heads, but encodes many more features than that.
          </p>

          <div id="attention-explorer">
            <AttentionCircuitWidget />
          </div>
        </section>

        {/* TODO: You should be able to insert any text here and we will highlight in green if the OV circuit for that token is copying */}
        <section id="copying" className="prose prose-neutral max-w-none mt-12">


        </section>

        {/* Phase 6: Two-Layer Induction */}
        <section id="two-layers-induction-heads" className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">Two Layers: Induction Heads</h2>

          <p className="text-lg leading-relaxed">
            A single layer of attention gave us the power to improve our predictions based on surrounding context. That said, we can only do that based on skip-trigram patterns that were learned from the training set.
            It's impossible for us to teach the model anything new.
          </p>

          <p className="text-lg leading-relaxed mt-6">
          Add just one more layer of attention, and that constraint starts to go away.  
            Now, attention heads can <em>compose</em>. Second-layer heads can work directly on token inputs, as before, but they can also use the outputs of the first layer's heads, written into the residual stream. Composition will allow us to build more complex patterns from simpler ones.
          </p>
          {/* TODO: add a bigram panel to this as well */}
          <div id="induction-comparison">
            <InductionComparisonWidget />
          </div>

          <p className="text-lg leading-relaxed mt-6">
            The single-layer model can't track this repetition because it didn't happen in the training set. The probability of the tokens <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Reg</code> and <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">an</code> recurring are probably slightly higher due to copying, 
            but the model can't begin to understand generic repetition of an entire name, phrase, or idea.
            {/* Because what makes transformers so special, and what enables their human-like ability to chat with us and generally be useful, is their ability to reason over context. Precursors in NLP were true models of the English language (sometimes others), and <em>translation</em> was the main goal of research. They reflected how english is usually written, based on what they'd seen; that model was then frozen in time. You could say "my name is Regan" and then ask, "what's my name?" and they would not know, unless hand-coded heuristics caused the system to store that kind of information explicitly (as in Facebook's M, from the first wave of too-early chatbots that preceded the real deal). Transformers enabled crossing the chasm into what feels like a real entity, who you can tell things to, that will remember them. Let's try an easier task. We write <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is Regan</code> 100 times, then ask the model to complete, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is ___</code>. Could we do this with a skip-trigram? A <em>little</em> — the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code> might attend back to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code> and encode some vague sense that a name should follow, you could imagine seeing these logits boosted. But that information would still be sourced from a model of the English language as a whole, not the present conversation. So how do we boost the logits for "Regan" just because that's who we're talking about right now? */}
          </p>


          <p className="text-lg leading-relaxed mt-6">
            We can only accomplish this by composing heads on separate layers. A head performing this new kind of action is called an <em>induction head.</em>
            {/* How is this done with a two layer model? An <em>induction head.</em> It's a specific kind of attention head that results from <em>composing</em> heads on separate layers. */}
          </p>

          <p className="text-lg leading-relaxed mt-6">
            If you observe the QK and OV action of an attention head that's doing induction, you will see that it does something strange, like it can see the future. It attends to <em>past</em> occurrences of the token coming <em>next</em>. Somehow, it's like it already knows the answer.
            
             {/* It "sees the future" and attends to that token. So imagine the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code> attending to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>. How does it know to do this? */}
          </p>

          <div id="attention-explorer">
            <AttentionCircuitWidget 
            initialText="My name is Regan. My name is "
            initialLayer={1}
            initialHead={7}
            />
          </div>


          {/* <div id="induction-demo">
            <InductionHeadDemo />
          </div> */}

          {/* <p className="text-lg leading-relaxed mt-6">
            It's a pretty interesting coordination problem with a definite evolutionary tinge.
          </p> */}

          <p className="text-lg leading-relaxed mt-6">
            How can that be? Basically, two attention heads have to work together:
            {/* , and they do so without knowledge of the other one, and the system doesn't work (I think) until both of them are online and functioning: */}
          </p>

          <ol className="text-lg leading-relaxed ml-6 mt-4 space-y-2">
            <li>A "previous token" head</li>
            <li>The induction head itself</li>
          </ol>

          <p className="text-lg leading-relaxed mt-6">
            The previous token head does something that may not seem useful at all:  "tag" every token with the token that came right before it, like a nametag that says "I followed X".
          </p>

          <div className="flex justify-center mt-6">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 text-center">
                Previous Token Tagging (My name is Regan. My name is)
              </div> */}
              <div className="grid grid-cols-2 text-sm text-gray-700">
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50  font-semibold text-center">Token</div>
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50  font-semibold text-center">Tagged with</div>
                {PREVIOUS_TOKEN_TAGS.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div className="px-4 py-2 border-b border-gray-100 font-medium text-center">{item.token}</div>
                    <div className="px-4 py-2 border-b border-gray-100 text-center">{item.tag}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <p className="text-lg leading-relaxed mt-6">
            With these tags in place, an induction head can simply try to find a tag matching the current token. Operating at <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>, it will attend to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>, because <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> has a matching tag,
            because it previously followed <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>. Attending to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> will boost the output logits for that token, under the assumption that it's more likely to show up again.
          </p>

          {/* <p className="text-lg leading-relaxed mt-6">
            So our tokens would be tagged like:
          </p>

          <ul className="text-lg leading-relaxed ml-6 mt-4 space-y-1">
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My</code></li>
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">name</code></li>
            <li><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code>: tagged with <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code></li>
          </ul>

          <p className="text-lg leading-relaxed mt-6">
            The previous token head is a copying head like we saw before, where the OV for tokens simply boosts their own likelihood. But the QK attends to just one token: the token that came immediately before. It attends and copies that output into its own residual stream.
          </p> */}

          <p className="text-lg leading-relaxed mt-6">
            {/* So, for example, <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> would attend to <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">is</code>, and copy its "logits" — so the output is now effectively a guess heavily slanted toward generating the token <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">Regan</code> again. */}
             You might stop here and think — hold on, isn't the previous token head going to screw up the output?
            Won't this cause us to favor generating <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">My name is Regan Regan</code>?
            
          </p>

          <p className="text-lg leading-relaxed mt-6">
            No, the reason is that the tag is written into an orthogonal subspace. Now that we have two layers, our output from the head doesn't map exactly to our guess about the next token anymore, it's more like an "under-construction" guess: we're allowed to just do partial computation that's served up for later layers in the network to finish up and create a next-token guess with.
          </p>

        </section>

        {/* Phase 7: Evolution (Placeholder) */}
        <section id="evolution" className="prose prose-neutral max-w-none mt-12">
          <h2 className="font-serif text-3xl mt-12 mb-6">How These Circuits Evolve During Training</h2>

          <p className="text-lg leading-relaxed">
            Initially, this struck me as a classic case of evolutionary exaptation: that's when, in biological evolution, a trait evolves for one purpose (like feathers for insulation) and is later co-opted for a completely different function (flight).
          </p>

          <p className="text-lg leading-relaxed mt-6">
            My original hypothesis was that the "Previous Token Head" (upstream) would have to evolve first—perhaps to serve a simple utility like predicting double-characters (<code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">!!</code> or <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">??</code>)—and only after it was established could the "Induction Head" (downstream) latch onto it to build a complex copy-paste circuit. In a biological system, you'd expect to see hysteresis: a lag where the upstream feature exists for a while before the downstream function emerges.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            It turns out, however, that things work differently when the system is differentiable end-to-end.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            In our training run, we observe lockstep co-evolution rather than sequential exaptation. As you can see in the Gradient Force Widget, the induction capability and the previous-token capability rise at the exact same moment (around step 200).
          </p>

          <div id="evolution-widget">
            <EvolutionWidget />
          </div>
          <div id="gradient-force">
            <GradientForceWidget />
          </div>

          <p className="text-lg leading-relaxed mt-6">
            This happens because of backpropagation. Unlike biological natural selection, which is "blind" to future utility, a neural network's gradient signal is teleological—it allows future needs to reach back in time (or rather, back through the layers) to construct necessary components.
          </p>

          <p className="text-lg leading-relaxed mt-6">
            When the model fails to predict a token like "Regan", the error generates a gradient that flows through the Induction Head (Layer 1) and hits the Source Head (Layer 0). It effectively tells the Layer 0 head: "I could have solved this if you had told me what the previous token was."
          </p>

          <p className="text-lg leading-relaxed mt-6">
            This creates a massive, direct evolutionary pressure—let's call it "Gradient Bullying"—where the downstream induction head forces the upstream head to become a "Previous Token Head" specifically to serve the induction circuit. The upstream organ didn't evolve randomly; it was built to order.
          </p>
        </section>
      </div>
    </article>
  );
}
