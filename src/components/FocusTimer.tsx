import { Pause, Play, RotateCcw } from "lucide-react";
import { useStudioStore } from "@/app/store/useStudioStore";
import type { TimerMode } from "@/types/studio";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const TIMER_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short Reset",
  long: "Long Reset"
};

export function FocusTimer() {
  const timerMode = useStudioStore((state) => state.timerMode);
  const remainingSeconds = useStudioStore((state) => state.remainingSeconds);
  const timerRunning = useStudioStore((state) => state.timerRunning);
  const setTimerMode = useStudioStore((state) => state.setTimerMode);
  const startTimer = useStudioStore((state) => state.startTimer);
  const pauseTimer = useStudioStore((state) => state.pauseTimer);
  const resetTimer = useStudioStore((state) => state.resetTimer);

  return (
    <section className="surface-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Focus Cycle</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">{formatTime(remainingSeconds)}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{TIMER_LABELS[timerMode]}</p>
        </div>
        <div className={`status-pill ${timerRunning ? "is-live" : ""}`}>{timerRunning ? "Running" : "Paused"}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["focus", "short", "long"] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => setTimerMode(mode)} className={`pill-button ${timerMode === mode ? "is-active" : ""}`}>
            {TIMER_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={startTimer} className="icon-action">
          <Play className="h-4 w-4" />
          Start
        </button>
        <button type="button" onClick={pauseTimer} className="icon-action">
          <Pause className="h-4 w-4" />
          Pause
        </button>
        <button type="button" onClick={resetTimer} className="icon-action">
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </section>
  );
}
