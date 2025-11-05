import React, { useState } from "react";
import { InductionComparisonWidget } from "../components/InductionComparisonWidget";
import { PreviousTokenHeadWidget } from "../components/PreviousTokenHeadWidget";
import { InductionHeadWidget } from "../components/InductionHeadWidget";
import { CompositionFlowDiagram } from "../components/CompositionFlowDiagram";

export function InductionExplainer() {
  const [inputText, setInputText] = useState("My name is Regan Bell. What's my name again?");

  return (
    <article className="min-h-screen bg-white text-ink antialiased">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-6 pt-14 pb-12">
        <p className="text-sm tracking-widest uppercase text-neutral-500">Interactive Tutorial</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Induction Heads</h1>
        <p className="mt-3 text-base text-neutral-600">
          Understanding how transformers learn to complete repeated sequences
        </p>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-6 pb-24 space-y-12">

        {/* Introduction */}
        <section className="prose prose-neutral max-w-none">
          <p className="text-lg leading-relaxed">
            One of the most fundamental capabilities of language models is recognizing and completing repeated patterns.
            When you write "My name is Regan Bell. What's my name?" the model should predict "Regan" or "Regan Bell".
            But how does it do this?
          </p>

          <p className="text-lg leading-relaxed mt-4">
            The answer lies in a circuit called an <strong>induction head</strong>. Induction heads are one of the first
            sophisticated behaviors that emerge in transformers during training, and they require at least two layers working together.
          </p>
        </section>

        {/* Full Demo Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">The Full Picture</h2>
          <p className="text-base leading-relaxed mb-6">
            First, let's see the induction mechanism in action. Compare how a 1-layer model (which can't do induction)
            performs versus a 2-layer model (which can). Try the example below, or type your own text with repeated words or phrases.
          </p>
          <InductionComparisonWidget initialText={inputText} />
        </section>

        {/* Explanation */}
        <section className="prose prose-neutral max-w-none">
          <h2 className="text-2xl font-bold mb-4">Two Required Ingredients</h2>
          <p className="text-base leading-relaxed">
            Induction heads work through a clever two-step process. They require composition between layers—
            information from one layer's attention heads feeds into another layer's heads. Here's what each ingredient does:
          </p>
        </section>

        {/* Previous Token Head */}
        <section>
          <PreviousTokenHeadWidget exampleText={inputText} />
        </section>

        {/* Induction Head */}
        <section>
          <InductionHeadWidget exampleText={inputText} />
        </section>

        {/* Composition */}
        <section>
          <CompositionFlowDiagram />
        </section>

        {/* Sandbox Section */}
        <SandboxSection />
      </div>
    </article>
  );
}

// Sandbox with its own state
function SandboxSection() {
  const [sandboxText, setSandboxText] = useState("The cat sat on the mat. The cat");

  return (
    <>
      <section className="mt-12 pt-12 border-t border-warm-gray">
        <h2 className="text-2xl font-bold mb-4">Sandbox: Explore Your Own Patterns</h2>
        <p className="text-base leading-relaxed mb-6">
          Now that you understand the mechanism, try it with your own repeated sequences.
          The model works best with exact repetitions of words or short phrases.
        </p>
        <InductionComparisonWidget initialText={sandboxText} />
      </section>

      {/* Closing */}
      <section className="prose prose-neutral max-w-none mt-12">
        <h2 className="text-2xl font-bold mb-4">Why This Matters</h2>
        <p className="text-base leading-relaxed">
          Induction heads are fundamental building blocks of language models. They demonstrate:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base">
          <li><strong>Composition</strong>: How layers build on each other's computations</li>
          <li><strong>In-context learning</strong>: How models use patterns within the input</li>
          <li><strong>Interpretability</strong>: A clear, understandable circuit we can trace</li>
        </ul>
        <p className="text-base leading-relaxed mt-4">
          Understanding circuits like induction heads is a key step toward making AI systems more transparent and predictable.
        </p>
      </section>
    </>
  );
}
