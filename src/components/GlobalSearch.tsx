import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudioStore } from "@/app/store/useStudioStore";
import { searchStudyResources } from "@/lib/studioAnalysis";
import type { ResourceKind } from "@/types/studio";

export function GlobalSearch() {
  const navigate = useNavigate();
  const analysis = useStudioStore((state) => state.analysis);
  const searchQuery = useStudioStore((state) => state.searchQuery);
  const selectedKinds = useStudioStore((state) => state.selectedKinds);
  const setSearchQuery = useStudioStore((state) => state.setSearchQuery);
  const selectDocument = useStudioStore((state) => state.selectDocument);
  const deferredQuery = useDeferredValue(searchQuery);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!analysis || !deferredQuery.trim()) {
      return [];
    }
    return searchStudyResources(analysis, deferredQuery, selectedKinds as ResourceKind[]).slice(0, 5);
  }, [analysis, deferredQuery, selectedKinds]);

  return (
    <div className="relative">
      <label className="search-shell">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Find a note, lab, formula, concept, or source"
          className="search-input"
        />
      </label>

      {focused && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <button
              key={result.document.id}
              type="button"
              onMouseDown={() => {
                selectDocument(result.document.id);
                navigate("/library");
              }}
              className="search-result-row"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-[var(--text)]">{result.document.name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {result.document.kind}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{result.excerpt}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
