import { Download, FileText, Printer, ScrollText } from "lucide-react";
import { useStudioStore } from "@/app/store/useStudioStore";
import { downloadTextFile, openPrintableDocument } from "@/lib/studioAnalysis";

function EmptyNotes() {
  return (
    <div className="empty-panel">
      <ScrollText className="h-10 w-10 text-[var(--muted)]" />
      <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">No generated notes yet.</h1>
      <p className="mt-3 max-w-2xl text-center text-base leading-8 text-[var(--muted)]">
        Analyze your <code>course-content</code> folder first. Prep Studio will generate an overview, what-to-remember
        list, key topic notes, pitfalls, retrieval prompts, and export-ready Markdown plus LaTeX.
      </p>
    </div>
  );
}

export function NotesPage() {
  const analysis = useStudioStore((state) => state.analysis);
  const noteView = useStudioStore((state) => state.noteView);
  const setNoteView = useStudioStore((state) => state.setNoteView);

  if (!analysis) {
    return <EmptyNotes />;
  }

  const { summary } = analysis;

  return (
    <div className="space-y-6 pb-10">
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-label">Generated Note Pack</p>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.05em]">{summary.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">{summary.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setNoteView("rendered")} className={`pill-button ${noteView === "rendered" ? "is-active" : ""}`}>
              Readable
            </button>
            <button type="button" onClick={() => setNoteView("markdown")} className={`pill-button ${noteView === "markdown" ? "is-active" : ""}`}>
              Markdown
            </button>
            <button type="button" onClick={() => setNoteView("latex")} className={`pill-button ${noteView === "latex" ? "is-active" : ""}`}>
              LaTeX
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadTextFile(`${analysis.folderLabel}-study-pack.md`, summary.markdown, "text/markdown;charset=utf-8")}
            className="secondary-action"
          >
            <Download className="h-4 w-4" />
            Download `.md`
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(`${analysis.folderLabel}-study-pack.tex`, summary.latex, "application/x-tex;charset=utf-8")}
            className="secondary-action"
          >
            <FileText className="h-4 w-4" />
            Download `.tex`
          </button>
          <button type="button" onClick={() => openPrintableDocument(summary.printableHtml)} className="secondary-action">
            <Printer className="h-4 w-4" />
            Open print view
          </button>
        </div>
      </section>

      {noteView === "rendered" ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="surface-card p-6">
            <p className="section-label">Overview</p>
            <p className="mt-4 text-base leading-8 text-[var(--text)]">{summary.overview}</p>

            <div className="mt-6 grid gap-4">
              {summary.sections.map((section) => (
                <article key={section.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
                  <h2 className="text-xl font-semibold text-[var(--text)]">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{section.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="surface-card p-6">
              <p className="section-label">What To Remember</p>
              <div className="mt-4 grid gap-3">
                {summary.remember.map((item) => (
                  <div key={item} className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-solid)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card p-6">
              <p className="section-label">Pitfalls</p>
              <div className="mt-4 grid gap-3">
                {summary.pitfalls.map((item) => (
                  <div key={item} className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-solid)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card p-6">
              <p className="section-label">Retrieval Prompts</p>
              <div className="mt-4 grid gap-3">
                {summary.retrievalPrompts.map((item) => (
                  <div key={item} className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-solid)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section className="surface-card p-6">
          <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-[var(--soft)]">
            {noteView === "markdown" ? summary.markdown : summary.latex}
          </pre>
        </section>
      )}
    </div>
  );
}
