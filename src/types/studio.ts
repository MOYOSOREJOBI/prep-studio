export type ThemeMode = "dark" | "light";

export type TimerMode = "focus" | "short" | "long";

export type ResourceKind =
  | "note"
  | "slides"
  | "lab"
  | "tutorial"
  | "assignment"
  | "reference"
  | "exam"
  | "code"
  | "markdown"
  | "pdf"
  | "document";

export type SectionView = "rendered" | "markdown" | "latex";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface SourcePage {
  pageNumber: number;
  text: string;
}

export interface AnalyzedDocument {
  id: string;
  file: File;
  name: string;
  relativePath: string;
  extension: string;
  kind: ResourceKind;
  wordCount: number;
  estimatedMinutes: number;
  excerpt: string;
  rawText: string;
  headings: string[];
  snippets: string[];
  pages: SourcePage[];
  tags: string[];
}

export interface StudyChunk {
  id: string;
  documentId: string;
  documentName: string;
  relativePath: string;
  kind: ResourceKind;
  heading: string;
  text: string;
  tokens: string[];
  score: number;
  pageNumber?: number;
}

export interface StudySection {
  id: string;
  title: string;
  body: string;
  sourceDocumentIds: string[];
}

export interface StudySummary {
  title: string;
  subtitle: string;
  overview: string;
  remember: string[];
  pitfalls: string[];
  actionPlan: string[];
  sections: StudySection[];
  retrievalPrompts: string[];
  markdown: string;
  latex: string;
  printableHtml: string;
}

export interface Flashcard {
  id: string;
  prompt: string;
  answer: string;
  sourceDocumentId: string;
  sourceLabel: string;
  tags: string[];
  difficulty: number;
}

export interface QuizQuestion {
  id: string;
  stem: string;
  correctAnswer: string;
  choices: string[];
  explanation: string;
  sourceDocumentId: string;
  sourceLabel: string;
  tags: string[];
}

export interface AnalysisStats {
  generatedAt: number;
  totalFiles: number;
  supportedFiles: number;
  skippedFiles: number;
  documents: number;
  chunks: number;
  flashcards: number;
  quizzes: number;
  words: number;
  notes: number;
  labs: number;
  slides: number;
  pdfs: number;
  code: number;
}

export interface AnalysisBundle {
  folderLabel: string;
  documents: AnalyzedDocument[];
  chunks: StudyChunk[];
  summary: StudySummary;
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  skippedFiles: string[];
  stats: AnalysisStats;
}

export interface SearchResult {
  document: AnalyzedDocument;
  score: number;
  excerpt: string;
  matchedChunk?: StudyChunk;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  label: string;
}

export interface ReviewState {
  dueAt: number;
  intervalDays: number;
  ease: number;
  reps: number;
  attempts: number;
  correct: number;
  lastReviewedAt?: number;
}

export interface QuizRunAnswer {
  questionId: string;
  selectedChoice: string;
  correct: boolean;
}

