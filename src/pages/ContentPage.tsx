import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileCode2, FileText, Filter, SearchX } from "lucide-react";
import { useStudioStore } from "@/app/store/useStudioStore";
import { formatBytes, searchStudyResources } from "@/lib/studioAnalysis";
import type { ResourceKind } from "@/types/studio";

function EmptyLibrary() {
  return (
    <div className="empty-panel">
      <SearchX className="h-10 w-10 text-[var(--muted)]" />
      <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Analyze a folder to unlock the library.</h1>
      <p className="mt-3 max-w-2xl text-center text-base leading-8 text-[var(--muted)]">
        Once Prep Studio has scanned your <code>course-content</code> folder, this page becomes the resource finder for
        all of your notes, labs, slides, references, and code.
      </p>
    </div>
  );
}

export function ContentPage() {
  const analysis = useStudioStore((state) => state.analysis);
  const selectedDocumentId = useStudioStore((state) => state.selectedDocumentId);
  const selectedKinds = useStudioStore((state) => state.selectedKinds);
  const searchQuery = useStudioStore((state) => state.searchQuery);
  const selectDocument = useStudioStore((state) => state.selectDocument);
  const toggleKind = useStudioStore((state) => state.toggleKind);
  const clearKindFilters = useStudioStore((state) => state.clearKindFilters);
  const deferredQuery = useDeferredValue(searchQuery);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const results = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return searchStudyResources(analysis, deferredQuery, selectedKinds as ResourceKind[]);
  }, [analysis, deferredQuery, selectedKinds]);

  const selectedDocument = useMemo(() => {
    if (!analysis) {
      return undefined;
    }
    return (
      analysis.documents.find((document) => document.id === selectedDocumentId) ??
      results[0]?.document ??
      analysis.documents[0]
    );
  }, [analysis, results, selectedDocumentId]);

  useEffect(() => {
    if (!selectedDocument) {
      setPreviewUrl(undefined);
      return undefined;
    }
    if (!["pdf", "html", "htm"].includes(selectedDocument.extension)) {
      setPreviewUrl(undefined);
      return undefined;
    }
    const url = URL.createObjectURL(selectedDocument.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedDocument]);

  useEffect(() => {
    if (!selectedDocumentId && results[0]) {
      selectDocument(results[0].document.id);
    }
  }, [results, selectDocument, selectedDocumentId]);

  if (!analysis) {
    return <EmptyLibrary />;
  }

  const kinds = Array.from(new Set(analysis.documents.map((document) => document.kind)));
  const relatedCards = analysis.flashcards.filter((card) => card.sourceDocumentId === selectedDocument?.id).length;
  const relatedQuestions = analysis.quizzes.filter((question) => question.sourceDocumentId === selectedDocument?.id).length;

  return (
    <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="surface-card min-h-0 overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="section-label">Resource Finder</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">
              {results.length} result{results.length === 1 ? "" : "s"}
            </h1>
          </div>
          <button type="button" onClick={clearKindFilters} className="secondary-action">
            Clear filters
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <button key={kind} type="button" onClick={() => toggleKind(kind)} className={`pill-button ${selectedKinds.includes(kind) ? "is-active" : ""}`}>
              <Filter className="h-3.5 w-3.5" />
              {kind}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto pr-1 app-scroll" style={{ maxHeight: "calc(100vh - 290px)" }}>
          {results.map((result) => (
            <button
              key={result.document.id}
              type="button"
              onClick={() => selectDocument(result.document.id)}
              className={`library-row ${selectedDocument?.id === result.document.id ? "is-selected" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-left text-base font-semibold text-[var(--text)]">{result.document.name}</h2>
                  <p className="mt-1 text-left text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    {result.document.relativePath}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {result.document.kind}
                </span>
              </div>
              <p className="mt-3 text-left text-sm leading-7 text-[var(--muted)]">{result.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{result.document.wordCount.toLocaleString()} words</span>
                <span>{result.document.estimatedMinutes} min read</span>
                <span>{formatBytes(result.document.file.size)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card min-h-0 overflow-hidden p-5">
        {selectedDocument ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-[var(--line)] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="section-label">Selected Resource</p>
                  <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">{selectedDocument.name}</h1>
                </div>
                {previewUrl ? (
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="secondary-action">
                    <ExternalLink className="h-4 w-4" />
                    Open raw file
                  </a>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{selectedDocument.relativePath}</span>
                <span>{selectedDocument.wordCount.toLocaleString()} words</span>
                <span>{selectedDocument.estimatedMinutes} min read</span>
                <span>{relatedCards} flashcards</span>
                <span>{relatedQuestions} quiz prompts</span>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:overflow-hidden">
              <div className="space-y-4 xl:overflow-y-auto xl:pr-1 app-scroll" style={{ maxHeight: "calc(100vh - 270px)" }}>
                <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Summary</h2>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{selectedDocument.excerpt}</p>
                </article>

                <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
                  <h2 className="text-lg font-semibold text-[var(--text)]">Headings and signals</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedDocument.headings.map((heading) => (
                      <span key={heading} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--soft)]">
                        {heading}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {selectedDocument.snippets.map((snippet) => (
                      <div key={snippet} className="rounded-[18px] border border-[var(--line)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                        {snippet}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-solid)] p-5">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-[var(--accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Text preview</h2>
                  </div>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                    {selectedDocument.rawText.slice(0, 4000)}
                    {selectedDocument.rawText.length > 4000 ? "\n\n…truncated for preview…" : ""}
                  </pre>
                </article>
              </div>

              <div className="min-h-[420px] overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--panel-solid)]">
                {previewUrl ? (
                  <iframe title={selectedDocument.name} src={previewUrl} className="h-full min-h-[520px] w-full border-0" />
                ) : (
                  <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm leading-7 text-[var(--muted)]">
                    This resource is best previewed as extracted text. PDF and HTML files get an in-app viewer here.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-panel">
            <SearchX className="h-10 w-10 text-[var(--muted)]" />
            <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">No resource selected.</h1>
            <p className="mt-3 max-w-xl text-center text-base leading-8 text-[var(--muted)]">
              Refine your filters or search terms, then pick a result to inspect the underlying material and its
              generated study outputs.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
