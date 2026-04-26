import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { useMemo } from "react";
import { useStudioStore } from "@/app/store/useStudioStore";
import { initialReviewState } from "@/lib/studioAnalysis";

function EmptyFlashcards() {
  return (
    <div className="empty-panel">
      <RotateCw className="h-10 w-10 text-[var(--muted)]" />
      <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">No flashcards yet.</h1>
      <p className="mt-3 max-w-2xl text-center text-base leading-8 text-[var(--muted)]">
        Analyze your study folder first. Prep Studio will turn important definitions, repeated ideas, and key sections
        into usable flashcards instead of leaving them buried in source files.
      </p>
    </div>
  );
}

export function FlashcardsPage() {
  const analysis = useStudioStore((state) => state.analysis);
  const flashcardIndex = useStudioStore((state) => state.flashcardIndex);
  const flashcardFace = useStudioStore((state) => state.flashcardFace);
  const flashcardProgress = useStudioStore((state) => state.flashcardProgress);
  const flipFlashcard = useStudioStore((state) => state.flipFlashcard);
  const nextFlashcard = useStudioStore((state) => state.nextFlashcard);
  const previousFlashcard = useStudioStore((state) => state.previousFlashcard);
  const rateFlashcard = useStudioStore((state) => state.rateFlashcard);
  const resetFlashcards = useStudioStore((state) => state.resetFlashcards);

  const orderedCards = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return [...analysis.flashcards].sort((left, right) => {
      const leftDue = flashcardProgress[left.id]?.dueAt ?? 0;
      const rightDue = flashcardProgress[right.id]?.dueAt ?? 0;
      return leftDue - rightDue;
    });
  }, [analysis, flashcardProgress]);

  if (!analysis || orderedCards.length === 0) {
    return <EmptyFlashcards />;
  }

  const activeCard = orderedCards[flashcardIndex % orderedCards.length];
  const reviewState = flashcardProgress[activeCard.id] ?? initialReviewState();
  const dueCards = orderedCards.filter((card) => (flashcardProgress[card.id]?.dueAt ?? 0) <= Date.now()).length;

  return (
    <div className="space-y-6 pb-10">
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-label">Generated Flashcards</p>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.05em]">
              Card {flashcardIndex + 1} of {orderedCards.length}
            </h1>
            <p className="mt-3 text-base leading-8 text-[var(--muted)]">
              {dueCards} due now · source: {activeCard.sourceLabel}
            </p>
          </div>
          <button type="button" onClick={resetFlashcards} className="secondary-action">
            <RotateCw className="h-4 w-4" />
            Reset queue
          </button>
        </div>
      </section>

      <section className="surface-card p-6">
        <button type="button" onClick={flipFlashcard} className="flashcard-shell">
          <p className="section-label">{flashcardFace === "front" ? "Prompt" : "Answer"}</p>
          <div className="mt-6 font-display text-3xl leading-tight tracking-[-0.04em] text-[var(--text)]">
            {flashcardFace === "front" ? activeCard.prompt : activeCard.answer}
          </div>
          <p className="mt-8 text-sm leading-7 text-[var(--muted)]">
            Click the card to {flashcardFace === "front" ? "reveal the answer" : "flip back to the prompt"}.
          </p>
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button type="button" onClick={previousFlashcard} className="secondary-action">
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            <button type="button" onClick={nextFlashcard} className="secondary-action">
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Reps {reviewState.reps} · ease {reviewState.ease.toFixed(2)}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {([
            ["again", "Again"],
            ["hard", "Hard"],
            ["good", "Good"],
            ["easy", "Easy"]
          ] as const).map(([rating, label]) => (
            <button key={rating} type="button" onClick={() => rateFlashcard(activeCard.id, rating)} className="pill-button justify-center py-3">
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
