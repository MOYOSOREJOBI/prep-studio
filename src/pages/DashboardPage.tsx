import { ArrowRight, BookOpenText, Brain, FileSearch, FolderTree, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudioStore } from "@/app/store/useStudioStore";

function EmptyState() {
  const analysisStatus = useStudioStore((state) => state.analysisStatus);
  const analysisProgress = useStudioStore((state) => state.analysisProgress);
  const analysisError = useStudioStore((state) => state.analysisError);

  return (
    <div className="space-y-6 pb-8">
      <section className="hero-card">
        <div className="max-w-3xl">
          <p className="section-label">Multi-course Workspace</p>
          <h1 className="mt-3 font-display text-4xl tracking-[-0.06em] sm:text-5xl">
            Turn any folder of notes, labs, slides, and source files into a real study system.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
            Prep Studio now expects a folder called <code>course-content</code>. You can keep it flat or nested by
            course, week, topic, or lab. When you hit <strong>Analyze</strong>, the app reads the files, extracts the
            text locally in your browser, and generates a library, notes pack, flashcards, quiz games, and a printable
            study note.
          </p>
        </div>
        <div className="hero-glow" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FolderTree,
                title: "1. Fill `course-content`",
                body: "Drop in PDFs, Markdown, text, HTML, LaTeX, CSV, JSON, code, notes, labs, or mixed folders."
              },
              {
                icon: FileSearch,
                title: "2. Analyze from the app",
                body: "The browser extracts usable text, categorizes resources, and builds summaries plus prompts."
              },
              {
                icon: Brain,
                title: "3. Study from one place",
                body: "Use the library, note pack, flashcards, and games without hardcoded course data."
              }
            ].map((item) => (
              <article key={item.title} className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="section-label">Status</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
              <h2 className="text-lg font-semibold text-[var(--text)]">Supported inputs</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                PDF, Markdown, text, HTML, LaTeX, CSV, JSON, and common code files all work in the analyzer.
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
              <h2 className="text-lg font-semibold text-[var(--text)]">Export outputs</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Generated notes can be viewed in-app, downloaded as Markdown, exported as LaTeX, or opened in a clean
                print view so you can save them as PDF.
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
              <h2 className="text-lg font-semibold text-[var(--text)]">Analyzer state</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {analysisStatus === "analyzing" && analysisProgress
                  ? `Processing ${analysisProgress.current} of ${analysisProgress.total}: ${analysisProgress.label}`
                  : analysisStatus === "error"
                    ? analysisError ?? "The last analysis attempt failed."
                    : "No folder has been analyzed yet."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
      <p className="section-label">{label}</p>
      <div className="mt-3 font-display text-4xl tracking-[-0.05em]">{value}</div>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{detail}</p>
    </article>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const analysis = useStudioStore((state) => state.analysis);

  if (!analysis) {
    return <EmptyState />;
  }

  const topDocuments = [...analysis.documents].sort((left, right) => right.wordCount - left.wordCount).slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <section className="hero-card">
        <div className="max-w-3xl">
          <p className="section-label">Analyzed Workspace</p>
          <h1 className="mt-3 font-display text-4xl tracking-[-0.06em] sm:text-5xl">{analysis.summary.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">{analysis.summary.overview}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: "Open library", to: "/library" },
              { label: "Read notes", to: "/notes" },
              { label: "Train flashcards", to: "/flashcards" },
              { label: "Play quiz games", to: "/games" }
            ].map((item) => (
              <button key={item.to} type="button" onClick={() => navigate(item.to)} className="primary-action">
                {item.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="hero-glow" />
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Resources"
          value={String(analysis.stats.documents)}
          detail={`${analysis.stats.pdfs} PDFs, ${analysis.stats.notes} note-heavy files, ${analysis.stats.labs} lab/tutorial items`}
        />
        <StatTile
          label="Words"
          value={analysis.stats.words.toLocaleString()}
          detail="Extracted locally from the selected folder and chunked for search plus synthesis."
        />
        <StatTile
          label="Flashcards"
          value={String(analysis.stats.flashcards)}
          detail="Generated from definitions, high-signal sentences, and recurring concepts."
        />
        <StatTile
          label="Games"
          value={String(analysis.stats.quizzes)}
          detail="Ready to use in the multiple-choice and source-hunt quiz flows."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Generated Study Pack</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">What To Remember</h2>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="mt-5 grid gap-3">
            {analysis.summary.remember.map((item) => (
              <article key={item} className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-solid)] p-4">
                <p className="text-sm leading-7 text-[var(--text)]">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Pitfalls</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Do Not Miss These</h2>
            </div>
            <BookOpenText className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="mt-5 grid gap-3">
            {analysis.summary.pitfalls.map((item) => (
              <article key={item} className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-solid)] p-4">
                <p className="text-sm leading-7 text-[var(--text)]">{item}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card p-6">
          <p className="section-label">Best Starting Resources</p>
          <div className="mt-4 grid gap-3">
            {topDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => {
                  useStudioStore.getState().selectDocument(document.id);
                  navigate("/library");
                }}
                className="w-full rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-4 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--panel)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--text)]">{document.name}</h3>
                  <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    {document.kind}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{document.excerpt}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {document.relativePath} · {document.wordCount.toLocaleString()} words
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="section-label">Folder Guidance</p>
          <div className="mt-4 rounded-[24px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
            <h2 className="text-xl font-semibold text-[var(--text)]">Use a simple `course-content` structure</h2>
            <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-[color:rgba(0,0,0,0.08)] p-4 font-mono text-sm leading-7 text-[var(--soft)]">
              course-content/
              <br />
              ├── course-a/
              <br />
              │&nbsp;&nbsp;├── notes/
              <br />
              │&nbsp;&nbsp;├── labs/
              <br />
              │&nbsp;&nbsp;└── slides/
              <br />
              └── course-b/
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;└── everything-you-want/
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Flat dumping works too. Prep Studio uses file names, folder names, extensions, and extracted text to group
              resources into notes, slides, labs, references, exam-style material, and code.
            </p>
            <div className="mt-4 grid gap-3">
              {analysis.summary.actionPlan.map((step) => (
                <div key={step} className="rounded-[18px] border border-[var(--line)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
