import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialReviewState, nextReview } from "@/lib/studioAnalysis";
import type {
  AnalysisBundle,
  AnalysisProgress,
  ReviewRating,
  ReviewState,
  SectionView,
  ThemeMode,
  TimerMode
} from "@/types/studio";

const TIMER_PRESETS: Record<TimerMode, number> = {
  focus: 45 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function presetSeconds(mode: TimerMode) {
  return TIMER_PRESETS[mode];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

interface StudioStore {
  theme: ThemeMode;
  timerMode: TimerMode;
  remainingSeconds: number;
  timerRunning: boolean;
  analysisStatus: "idle" | "analyzing" | "ready" | "error";
  analysisError?: string;
  analysisProgress?: AnalysisProgress;
  analysis: AnalysisBundle | null;
  selectedDocumentId?: string;
  selectedKinds: string[];
  searchQuery: string;
  noteView: SectionView;
  flashcardFace: "front" | "back";
  flashcardIndex: number;
  flashcardProgress: Record<string, ReviewState>;
  gameQuestionIds: string[];
  gameIndex: number;
  gameScore: number;
  gameStreak: number;
  selectedChoice?: string;
  answeredChoiceCorrect?: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setAnalysisStatus: (status: StudioStore["analysisStatus"], error?: string) => void;
  setAnalysisProgress: (progress?: AnalysisProgress) => void;
  setAnalysis: (analysis: AnalysisBundle | null) => void;
  selectDocument: (documentId?: string) => void;
  toggleKind: (kind: string) => void;
  clearKindFilters: () => void;
  setSearchQuery: (query: string) => void;
  setNoteView: (view: SectionView) => void;
  flipFlashcard: () => void;
  nextFlashcard: () => void;
  previousFlashcard: () => void;
  rateFlashcard: (cardId: string, rating: ReviewRating) => void;
  resetFlashcards: () => void;
  startGame: () => void;
  answerGame: (choice: string) => void;
  nextGameQuestion: () => void;
  resetGame: () => void;
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      timerMode: "focus",
      remainingSeconds: presetSeconds("focus"),
      timerRunning: false,
      analysisStatus: "idle",
      analysisError: undefined,
      analysisProgress: undefined,
      analysis: null,
      selectedDocumentId: undefined,
      selectedKinds: [],
      searchQuery: "",
      noteView: "rendered",
      flashcardFace: "front",
      flashcardIndex: 0,
      flashcardProgress: {},
      gameQuestionIds: [],
      gameIndex: 0,
      gameScore: 0,
      gameStreak: 0,
      selectedChoice: undefined,
      answeredChoiceCorrect: undefined,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTimerMode: (mode) =>
        set({
          timerMode: mode,
          remainingSeconds: presetSeconds(mode),
          timerRunning: false
        }),
      startTimer: () => set({ timerRunning: true }),
      pauseTimer: () => set({ timerRunning: false }),
      resetTimer: () =>
        set((state) => ({
          timerRunning: false,
          remainingSeconds: presetSeconds(state.timerMode)
        })),
      tickTimer: () =>
        set((state) => {
          if (!state.timerRunning) {
            return state;
          }
          if (state.remainingSeconds > 1) {
            return { remainingSeconds: state.remainingSeconds - 1 };
          }
          const nextMode: TimerMode = state.timerMode === "focus" ? "short" : "focus";
          return {
            timerRunning: false,
            timerMode: nextMode,
            remainingSeconds: presetSeconds(nextMode)
          };
        }),
      setAnalysisStatus: (analysisStatus, analysisError) => set({ analysisStatus, analysisError }),
      setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
      setAnalysis: (analysis) =>
        set({
          analysis,
          analysisStatus: analysis ? "ready" : "idle",
          analysisError: undefined,
          analysisProgress: undefined,
          selectedDocumentId: analysis?.documents[0]?.id,
          selectedKinds: [],
          searchQuery: "",
          flashcardIndex: 0,
          flashcardFace: "front",
          gameQuestionIds: shuffle((analysis?.quizzes ?? []).map((question) => question.id)).slice(0, 12),
          gameIndex: 0,
          gameScore: 0,
          gameStreak: 0,
          selectedChoice: undefined,
          answeredChoiceCorrect: undefined
        }),
      selectDocument: (selectedDocumentId) => set({ selectedDocumentId }),
      toggleKind: (kind) =>
        set((state) => ({
          selectedKinds: state.selectedKinds.includes(kind)
            ? state.selectedKinds.filter((item) => item !== kind)
            : [...state.selectedKinds, kind]
        })),
      clearKindFilters: () => set({ selectedKinds: [] }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setNoteView: (noteView) => set({ noteView }),
      flipFlashcard: () =>
        set((state) => ({
          flashcardFace: state.flashcardFace === "front" ? "back" : "front"
        })),
      nextFlashcard: () =>
        set((state) => {
          const total = state.analysis?.flashcards.length ?? 0;
          return total === 0
            ? state
            : {
                flashcardIndex: (state.flashcardIndex + 1) % total,
                flashcardFace: "front"
              };
        }),
      previousFlashcard: () =>
        set((state) => {
          const total = state.analysis?.flashcards.length ?? 0;
          return total === 0
            ? state
            : {
                flashcardIndex: (state.flashcardIndex - 1 + total) % total,
                flashcardFace: "front"
              };
        }),
      rateFlashcard: (cardId, rating) =>
        set((state) => ({
          flashcardProgress: {
            ...state.flashcardProgress,
            [cardId]: nextReview(state.flashcardProgress[cardId] ?? initialReviewState(), rating)
          },
          flashcardFace: "front",
          flashcardIndex:
            state.analysis && state.analysis.flashcards.length > 0
              ? (state.flashcardIndex + 1) % state.analysis.flashcards.length
              : 0
        })),
      resetFlashcards: () => set({ flashcardFace: "front", flashcardIndex: 0 }),
      startGame: () =>
        set((state) => ({
          gameQuestionIds: shuffle((state.analysis?.quizzes ?? []).map((question) => question.id)).slice(0, 12),
          gameIndex: 0,
          gameScore: 0,
          gameStreak: 0,
          selectedChoice: undefined,
          answeredChoiceCorrect: undefined
        })),
      answerGame: (choice) =>
        set((state) => {
          const analysis = state.analysis;
          if (!analysis) {
            return state;
          }
          const questionId = state.gameQuestionIds[state.gameIndex];
          const question = analysis.quizzes.find((item) => item.id === questionId);
          if (!question || state.selectedChoice) {
            return state;
          }
          const correct = choice === question.correctAnswer;
          return {
            selectedChoice: choice,
            answeredChoiceCorrect: correct,
            gameScore: state.gameScore + (correct ? 1 : 0),
            gameStreak: correct ? state.gameStreak + 1 : 0
          };
        }),
      nextGameQuestion: () =>
        set((state) => ({
          gameIndex: Math.min(state.gameIndex + 1, Math.max(0, state.gameQuestionIds.length - 1)),
          selectedChoice: undefined,
          answeredChoiceCorrect: undefined
        })),
      resetGame: () =>
        set((state) => ({
          gameQuestionIds: shuffle((state.analysis?.quizzes ?? []).map((question) => question.id)).slice(0, 12),
          gameIndex: 0,
          gameScore: 0,
          gameStreak: 0,
          selectedChoice: undefined,
          answeredChoiceCorrect: undefined
        }))
    }),
    {
      name: "prep-studio-shell-v1",
      partialize: (state) => ({
        theme: state.theme,
        timerMode: state.timerMode,
        remainingSeconds: state.remainingSeconds
      })
    }
  )
);
