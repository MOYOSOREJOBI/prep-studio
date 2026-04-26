import { useEffect, useRef, useState, startTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, FileStack, FolderSearch2, Gamepad2, Layers3, MoonStar, Sparkles, SunMedium } from "lucide-react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useStudioStore } from "@/app/store/useStudioStore";
import { FocusTimer } from "@/components/FocusTimer";
import { GlobalSearch } from "@/components/GlobalSearch";
import { analyzeSelectedFiles } from "@/lib/studioAnalysis";
import { DashboardPage } from "@/pages/DashboardPage";
import { ContentPage } from "@/pages/ContentPage";
import { FlashcardsPage } from "@/pages/FlashcardsPage";
import { GamesPage } from "@/pages/GamesPage";
import { NotesPage } from "@/pages/NotesPage";

function PomodoroTicker() {
  const timerRunning = useStudioStore((state) => state.timerRunning);
  const tickTimer = useStudioStore((state) => state.tickTimer);

  useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }
    const timerId = window.setInterval(() => tickTimer(), 1000);
    return () => window.clearInterval(timerId);
  }, [tickTimer, timerRunning]);

  return null;
}

const NAV_ITEMS = [
  { to: "/studio", label: "Studio", icon: Sparkles },
  { to: "/library", label: "Library", icon: FolderSearch2 },
  { to: "/notes", label: "Notes", icon: BookOpenText },
  { to: "/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/games", label: "Games", icon: Gamepad2 }
];

function AnalysisQuickCard() {
  const analysis = useStudioStore((state) => state.analysis);
  const analysisStatus = useStudioStore((state) => state.analysisStatus);
  const analysisProgress = useStudioStore((state) => state.analysisProgress);
  const analysisError = useStudioStore((state) => state.analysisError);

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">Analyzer</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">{analysis ? analysis.folderLabel : "course-content"}</h2>
        </div>
        <div className={`status-pill ${analysisStatus === "ready" ? "is-live" : ""}`}>
          {analysisStatus === "ready" ? "Ready" : analysisStatus}
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        {analysisStatus === "analyzing" && analysisProgress
          ? `Processing ${analysisProgress.current}/${analysisProgress.total}: ${analysisProgress.label}`
          : analysisError
            ? analysisError
            : analysis
              ? `${analysis.stats.documents} resources analyzed and ready for notes, flashcards, and games.`
              : "Analyze the course-content folder to build your workspace."}
      </p>
    </section>
  );
}

function AppShell() {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useStudioStore((state) => state.theme);
  const toggleTheme = useStudioStore((state) => state.toggleTheme);
  const setAnalysisStatus = useStudioStore((state) => state.setAnalysisStatus);
  const setAnalysisProgress = useStudioStore((state) => state.setAnalysisProgress);
  const setAnalysis = useStudioStore((state) => state.setAnalysis);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function handleSelectedFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setAnalysisStatus("analyzing");
    setAnalysisProgress({ current: 0, total: files.length, label: "Preparing analysis" });

    try {
      const bundle = await analyzeSelectedFiles(files, (progress) => {
        startTransition(() => {
          setAnalysisProgress(progress);
        });
      });
      setAnalysis(bundle);
      setAnalysisStatus("ready");
    } catch (error) {
      setAnalysisStatus("error", error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-frame">
      <PomodoroTicker />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.markdown,.html,.htm,.csv,.json,.tex,.c,.cc,.cpp,.h,.hpp,.py,.java,.js,.jsx,.ts,.tsx,.asm,.s,.rs,.go"
        className="hidden"
        // @ts-expect-error Chromium exposes `webkitdirectory`, but React's typing does not include it.
        webkitdirectory=""
        onChange={(event) => {
          void handleSelectedFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 border-r border-[var(--line)] px-5 py-5 lg:flex">
        <button type="button" onClick={toggleTheme} className="brand-switch">
          <div>
            <p className="section-label">Theme Switch</p>
            <h1 className="mt-2 font-display text-3xl tracking-[-0.05em] text-[var(--text)]">Prep Studio</h1>
          </div>
          {theme === "dark" ? <SunMedium className="h-5 w-5 text-[var(--accent)]" /> : <MoonStar className="h-5 w-5 text-[var(--accent)]" />}
        </button>

        <nav className="surface-card p-3">
          <div className="grid gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <AnalysisQuickCard />
        <FocusTimer />
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:rgba(255,255,255,0.02)] px-4 py-4 backdrop-blur lg:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={toggleTheme} className="brand-switch brand-switch-mobile lg:hidden">
              <span className="font-display text-xl tracking-[-0.04em]">Prep Studio</span>
              {theme === "dark" ? <SunMedium className="h-4 w-4 text-[var(--accent)]" /> : <MoonStar className="h-4 w-4 text-[var(--accent)]" />}
            </button>

            <div className="min-w-[280px] flex-1">
              <GlobalSearch />
            </div>

            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="primary-action">
              <FileStack className="h-4 w-4" />
              {isSubmitting ? "Analyzing…" : "Analyze Folder"}
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden px-4 py-5 lg:px-6 lg:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full overflow-y-auto app-scroll"
            >
              <Routes>
                <Route path="/" element={<Navigate to="/studio" replace />} />
                <Route path="/studio" element={<DashboardPage />} />
                <Route path="/library" element={<ContentPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/flashcards" element={<FlashcardsPage />} />
                <Route path="/games" element={<GamesPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="grid grid-cols-5 gap-2 border-t border-[var(--line)] p-3 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-item ${isActive ? "is-active" : ""}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
