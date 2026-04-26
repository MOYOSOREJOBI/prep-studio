import { useEffect, useMemo, useState } from "react";
import { Gamepad2, RotateCw, Trophy } from "lucide-react";
import { useStudioStore } from "@/app/store/useStudioStore";

function EmptyGames() {
  return (
    <div className="empty-panel">
      <Gamepad2 className="h-10 w-10 text-[var(--muted)]" />
      <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">No games yet.</h1>
      <p className="mt-3 max-w-2xl text-center text-base leading-8 text-[var(--muted)]">
        Analyze a folder first and Prep Studio will build quiz prompts from the material so you can actively test what
        you’ve loaded into the workspace.
      </p>
    </div>
  );
}

export function GamesPage() {
  const analysis = useStudioStore((state) => state.analysis);
  const gameQuestionIds = useStudioStore((state) => state.gameQuestionIds);
  const gameIndex = useStudioStore((state) => state.gameIndex);
  const gameScore = useStudioStore((state) => state.gameScore);
  const gameStreak = useStudioStore((state) => state.gameStreak);
  const selectedChoice = useStudioStore((state) => state.selectedChoice);
  const answeredChoiceCorrect = useStudioStore((state) => state.answeredChoiceCorrect);
  const startGame = useStudioStore((state) => state.startGame);
  const answerGame = useStudioStore((state) => state.answerGame);
  const nextGameQuestion = useStudioStore((state) => state.nextGameQuestion);
  const resetGame = useStudioStore((state) => state.resetGame);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [sourceChoice, setSourceChoice] = useState<string>();
  const [sourceScore, setSourceScore] = useState(0);

  useEffect(() => {
    if (analysis && gameQuestionIds.length === 0) {
      startGame();
    }
  }, [analysis, gameQuestionIds.length, startGame]);

  const currentQuestion = useMemo(() => {
    if (!analysis) {
      return undefined;
    }
    const currentId = gameQuestionIds[gameIndex];
    return analysis.quizzes.find((question) => question.id === currentId);
  }, [analysis, gameIndex, gameQuestionIds]);

  const sourceRounds = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return analysis.quizzes.slice(0, 8).map((question, index, list) => {
      const distractors = list
        .filter((other) => other.id !== question.id)
        .map((other) => other.sourceLabel)
        .filter((label, labelIndex, array) => array.indexOf(label) === labelIndex)
        .slice(0, 3);
      return {
        id: question.id,
        clue: question.explanation,
        correctSource: question.sourceLabel,
        choices: [...new Set([question.sourceLabel, ...distractors])].sort((left, right) =>
          index % 2 === 0 ? left.localeCompare(right) : right.localeCompare(left)
        )
      };
    });
  }, [analysis]);

  if (!analysis || analysis.quizzes.length === 0) {
    return <EmptyGames />;
  }

  const sourceRound = sourceRounds[sourceIndex];
  const lastQuestion = gameIndex >= gameQuestionIds.length - 1;
  const lastSourceRound = sourceIndex >= sourceRounds.length - 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Game 1</p>
              <h1 className="mt-2 font-display text-4xl tracking-[-0.05em]">Choice Sprint</h1>
              <p className="mt-3 text-base leading-8 text-[var(--muted)]">
                Score {gameScore} · streak {gameStreak} · question {Math.min(gameIndex + 1, gameQuestionIds.length)} of {" "}
                {gameQuestionIds.length}
              </p>
            </div>
            <button type="button" onClick={resetGame} className="secondary-action">
              <RotateCw className="h-4 w-4" />
              Restart
            </button>
          </div>

          {currentQuestion ? (
            <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
              <p className="section-label">Prompt</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--text)]">{currentQuestion.stem}</h2>
              <div className="mt-5 grid gap-3">
                {currentQuestion.choices.map((choice) => {
                  const isPicked = selectedChoice === choice;
                  const isCorrect = choice === currentQuestion.correctAnswer;
                  const isResolved = Boolean(selectedChoice);
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => answerGame(choice)}
                      disabled={isResolved}
                      className={`game-choice ${isResolved && isCorrect ? "is-correct" : ""} ${isResolved && isPicked && !isCorrect ? "is-wrong" : ""}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {selectedChoice ? (
                <div className="mt-5 rounded-[20px] border border-[var(--line)] bg-[color:rgba(0,0,0,0.08)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <Trophy className="h-4 w-4 text-[var(--accent)]" />
                    {answeredChoiceCorrect ? "Correct" : "Not quite"}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{currentQuestion.explanation}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (lastQuestion) {
                        resetGame();
                        return;
                      }
                      nextGameQuestion();
                    }}
                    className="primary-action mt-4"
                  >
                    {lastQuestion ? "Restart sprint" : "Next question"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Game 2</p>
              <h1 className="mt-2 font-display text-4xl tracking-[-0.05em]">Source Hunt</h1>
              <p className="mt-3 text-base leading-8 text-[var(--muted)]">
                Match the clue to the source file. Score {sourceScore} · round {sourceIndex + 1} of {sourceRounds.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSourceIndex(0);
                setSourceChoice(undefined);
                setSourceScore(0);
              }}
              className="secondary-action"
            >
              <RotateCw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {sourceRound ? (
            <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
              <p className="section-label">Clue</p>
              <p className="mt-3 text-base leading-8 text-[var(--text)]">{sourceRound.clue}</p>
              <div className="mt-5 grid gap-3">
                {sourceRound.choices.map((choice) => {
                  const resolved = Boolean(sourceChoice);
                  const isPicked = sourceChoice === choice;
                  const isCorrect = choice === sourceRound.correctSource;
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={resolved}
                      onClick={() => {
                        setSourceChoice(choice);
                        if (choice === sourceRound.correctSource) {
                          setSourceScore((score) => score + 1);
                        }
                      }}
                      className={`game-choice ${resolved && isCorrect ? "is-correct" : ""} ${resolved && isPicked && !isCorrect ? "is-wrong" : ""}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {sourceChoice ? (
                <div className="mt-5 rounded-[20px] border border-[var(--line)] bg-[color:rgba(0,0,0,0.08)] p-4">
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    Correct source: <strong className="text-[var(--text)]">{sourceRound.correctSource}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (lastSourceRound) {
                        setSourceIndex(0);
                        setSourceChoice(undefined);
                        setSourceScore(0);
                        return;
                      }
                      setSourceIndex((index) => index + 1);
                      setSourceChoice(undefined);
                    }}
                    className="primary-action mt-4"
                  >
                    {lastSourceRound ? "Restart source hunt" : "Next clue"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
