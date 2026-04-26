import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type {
  AnalysisBundle,
  AnalysisProgress,
  AnalysisStats,
  AnalyzedDocument,
  Flashcard,
  QuizQuestion,
  ResourceKind,
  ReviewRating,
  ReviewState,
  SearchResult,
  SourcePage,
  StudyChunk,
  StudySection,
  StudySummary
} from "@/types/studio";

GlobalWorkerOptions.workerSrc = workerSrc;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "was",
  "were",
  "which",
  "with",
  "you",
  "your"
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "html",
  "htm",
  "csv",
  "json",
  "tex",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "py",
  "java",
  "js",
  "jsx",
  "ts",
  "tsx",
  "asm",
  "s",
  "rs",
  "go"
]);

const KEY_SENTENCE_BONUS = [
  /\bimportant\b/i,
  /\bremember\b/i,
  /\bkey\b/i,
  /\bmust\b/i,
  /\bwarning\b/i,
  /\bavoid\b/i,
  /\btrap\b/i,
  /\bformula\b/i,
  /\bdefinition\b/i
];

function normalizeWhitespace(text: string) {
  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}

function countWords(text: string) {
  return tokenize(text).length;
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function splitSentences(text: string) {
  return text
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 260);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function getExtension(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

function inferKind(path: string, extension: string): ResourceKind {
  const lower = path.toLowerCase();
  if (/\blab\b|worksheet|practical/.test(lower)) {
    return "lab";
  }
  if (/tutorial|workshop/.test(lower)) {
    return "tutorial";
  }
  if (/slides?|lecture|deck/.test(lower)) {
    return "slides";
  }
  if (/assignment|project/.test(lower)) {
    return "assignment";
  }
  if (/exam|midterm|final|quiz|test/.test(lower)) {
    return "exam";
  }
  if (/reference|formula|handout|guide|appendix/.test(lower)) {
    return "reference";
  }
  if (/notes?|summary|playbook|cheat|outline/.test(lower)) {
    return "note";
  }
  if (["c", "cc", "cpp", "h", "hpp", "py", "java", "js", "jsx", "ts", "tsx", "asm", "s", "rs", "go"].includes(extension)) {
    return "code";
  }
  if (["md", "markdown", "tex"].includes(extension)) {
    return "markdown";
  }
  if (extension === "pdf") {
    return "pdf";
  }
  return "document";
}

function isSupportedFile(file: File) {
  const extension = getExtension(file.name);
  return extension === "pdf" || TEXT_EXTENSIONS.has(extension);
}

function createId(prefix: string, value: string) {
  return `${prefix}-${slugify(value)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readTextFile(file: File) {
  return normalizeWhitespace(await file.text());
}

async function readPdfFile(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages: SourcePage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = normalizeWhitespace(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
    );
    if (text) {
      pages.push({ pageNumber, text });
    }
  }

  return {
    text: pages.map((page) => page.text).join("\n\n"),
    pages
  };
}

function extractHeadings(text: string, fallback: string) {
  const headings = text
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length >= 4 &&
        line.length <= 80 &&
        (/^#+\s+/.test(line) ||
          /^[A-Z][A-Za-z0-9/(),:+\- ]+:?$/.test(line) ||
          (line === line.toUpperCase() && /[A-Z]/.test(line)))
    )
    .map((line) => line.replace(/^#+\s*/, "").replace(/:$/, ""));

  return unique(headings).slice(0, 8).length > 0 ? unique(headings).slice(0, 8) : [titleCase(fallback)];
}

function topSentences(text: string, frequency: Map<string, number>, limit: number) {
  const ranked = splitSentences(text)
    .map((sentence) => {
      const tokens = tokenize(sentence);
      const tokenScore = tokens.reduce((sum, token) => sum + (frequency.get(token) ?? 0), 0);
      const bonus = KEY_SENTENCE_BONUS.reduce((sum, pattern) => sum + (pattern.test(sentence) ? 4 : 0), 0);
      const score = tokenScore / Math.max(tokens.length, 1) + bonus;
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const candidate of ranked) {
    if (picked.some((sentence) => sentence.slice(0, 36) === candidate.sentence.slice(0, 36))) {
      continue;
    }
    picked.push(candidate.sentence);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

function toChunkText(block: string) {
  return normalizeWhitespace(block).replace(/\s+/g, " ");
}

function splitDocumentIntoChunks(document: AnalyzedDocument, frequency: Map<string, number>) {
  const rawBlocks =
    document.pages.length > 0
      ? document.pages.map((page) => ({ text: page.text, pageNumber: page.pageNumber }))
      : document.rawText
          .split(/\n{2,}/)
          .map((text) => ({ text }))
          .filter((block) => block.text.trim().length > 0);

  const chunks: StudyChunk[] = [];

  rawBlocks.forEach((block, index) => {
    const sentences = splitSentences(block.text);
    const groups =
      sentences.length <= 3
        ? [block.text]
        : Array.from({ length: Math.ceil(sentences.length / 3) }, (_, groupIndex) =>
            sentences.slice(groupIndex * 3, groupIndex * 3 + 3).join(" ")
          );

    groups.forEach((group, groupIndex) => {
      const text = toChunkText(group);
      if (text.length < 50) {
        return;
      }
      const tokens = tokenize(text);
      const keywordBonus = KEY_SENTENCE_BONUS.reduce((sum, pattern) => sum + (pattern.test(text) ? 3 : 0), 0);
      const score = tokens.reduce((sum, token) => sum + (frequency.get(token) ?? 0), 0) / Math.max(tokens.length, 1) + keywordBonus;
      chunks.push({
        id: `${document.id}-chunk-${index}-${groupIndex}`,
        documentId: document.id,
        documentName: document.name,
        relativePath: document.relativePath,
        kind: document.kind,
        heading: document.headings[groupIndex % document.headings.length] ?? document.name,
        text,
        tokens,
        score,
        pageNumber: "pageNumber" in block ? (block.pageNumber as number) : undefined
      });
    });
  });

  return chunks;
}

function buildFrequencyMap(documents: { rawText: string }[]) {
  const map = new Map<string, number>();
  documents.forEach((document) => {
    tokenize(document.rawText).forEach((token) => {
      map.set(token, (map.get(token) ?? 0) + 1);
    });
  });
  return map;
}

function buildSummaryTitle(folderLabel: string, documents: AnalyzedDocument[]) {
  const noteHeavy = documents.filter((document) => ["note", "reference", "markdown"].includes(document.kind));
  if (noteHeavy.length > 0) {
    return `${titleCase(folderLabel)} Study Pack`;
  }
  return `${titleCase(folderLabel)} Prep Studio Pack`;
}

function buildOverview(documents: AnalyzedDocument[], chunks: StudyChunk[]) {
  const frequency = buildFrequencyMap(documents);
  const sentences = topSentences(
    chunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((chunk) => chunk.text)
      .join(" "),
    frequency,
    4
  );
  return sentences.join(" ");
}

function rememberBullets(chunks: StudyChunk[]) {
  const rememberFirst = chunks
    .filter((chunk) => /\bimportant\b|\bremember\b|\bkey\b|\bmust\b/i.test(chunk.text))
    .sort((a, b) => b.score - a.score)
    .map((chunk) => chunk.text);

  const fallback = chunks.sort((a, b) => b.score - a.score).map((chunk) => chunk.text);
  return unique([...rememberFirst, ...fallback])
    .map((text) => {
      const sentence = splitSentences(text)[0] ?? text;
      return sentence.replace(/\s+/g, " ").trim();
    })
    .filter((item) => item.length >= 35)
    .slice(0, 8);
}

function pitfallBullets(chunks: StudyChunk[]) {
  const direct = chunks
    .filter((chunk) => /\btrap\b|\bavoid\b|\bwarning\b|\bdon't\b|\bnever\b|\bcommon mistake\b/i.test(chunk.text))
    .map((chunk) => splitSentences(chunk.text)[0] ?? chunk.text);

  if (direct.length > 0) {
    return unique(direct).slice(0, 6);
  }

  return chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((chunk) => `Re-check ${chunk.heading.toLowerCase()} in ${chunk.documentName} before treating it as solved.`)
    .slice(0, 6);
}

function buildActionPlan(documents: AnalyzedDocument[], flashcards: Flashcard[], quizzes: QuizQuestion[]) {
  const labs = documents.filter((document) => document.kind === "lab").length;
  const notes = documents.filter((document) => ["note", "reference", "markdown"].includes(document.kind)).length;
  const exams = documents.filter((document) => document.kind === "exam").length;

  return [
    notes > 0
      ? `Start with the ${notes} note/reference resources to lock in vocabulary and the big picture.`
      : "Start with the strongest overview documents and build vocabulary before drilling details.",
    labs > 0
      ? `Use the ${labs} lab or tutorial resources for worked practice after the notes pass.`
      : "Turn the higher-detail documents into worked practice after the first reading pass.",
    `Run the generated ${flashcards.length} flashcards in short bursts, then use the ${quizzes.length} quiz prompts to check recall.`,
    exams > 0
      ? `Finish with the ${exams} exam-style resources to rehearse timing and identify what still feels shaky.`
      : "Finish by re-testing yourself on the hardest chunks instead of rereading everything."
  ];
}

function extractDefinitionPairs(chunks: StudyChunk[]) {
  const cards: { prompt: string; answer: string; sourceChunk: StudyChunk }[] = [];

  chunks.forEach((chunk) => {
    const lines = chunk.text.split(/(?<=[.!?])\s+/);
    lines.forEach((line) => {
      const normalized = line.trim();
      const delimiterMatch = normalized.match(/^([A-Z][A-Za-z0-9/(),+\- ]{2,70})\s*[:\-]\s+(.{20,220})$/);
      if (delimiterMatch) {
        cards.push({
          prompt: `What is ${delimiterMatch[1].trim()}?`,
          answer: delimiterMatch[2].trim(),
          sourceChunk: chunk
        });
        return;
      }

      const definitionMatch = normalized.match(/^([A-Z][A-Za-z0-9/(),+\- ]{2,70})\s+(is|are|means|refers to|describes)\s+(.{20,220})$/i);
      if (definitionMatch) {
        cards.push({
          prompt: `What does ${definitionMatch[1].trim()} mean?`,
          answer: definitionMatch[3].trim(),
          sourceChunk: chunk
        });
      }
    });
  });

  return cards;
}

function buildFlashcards(documents: AnalyzedDocument[], chunks: StudyChunk[]) {
  const cards: Flashcard[] = [];
  const definitionPairs = extractDefinitionPairs(chunks);

  definitionPairs.slice(0, 18).forEach((pair) => {
    cards.push({
      id: createId("card", `${pair.sourceChunk.documentId}-${pair.prompt}`),
      prompt: pair.prompt,
      answer: pair.answer,
      sourceDocumentId: pair.sourceChunk.documentId,
      sourceLabel: pair.sourceChunk.documentName,
      tags: unique([pair.sourceChunk.kind, ...pair.sourceChunk.tokens.slice(0, 3)]),
      difficulty: Math.max(1, Math.min(5, Math.round(pair.sourceChunk.score / 2) || 2))
    });
  });

  if (cards.length < 18) {
    chunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .forEach((chunk) => {
        const sentence = splitSentences(chunk.text)[0] ?? chunk.text;
        cards.push({
          id: createId("card", `${chunk.documentId}-${chunk.id}`),
          prompt: `What should you remember about ${chunk.heading}?`,
          answer: sentence,
          sourceDocumentId: chunk.documentId,
          sourceLabel: chunk.documentName,
          tags: unique([chunk.kind, ...chunk.tokens.slice(0, 3)]),
          difficulty: Math.max(1, Math.min(5, Math.round(chunk.score / 2) || 2))
        });
      });
  }

  return unique(cards.map((card) => JSON.stringify(card))).map((card) => JSON.parse(card) as Flashcard).slice(0, 36);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildQuizQuestions(flashcards: Flashcard[]) {
  return flashcards.slice(0, 28).map<QuizQuestion>((card, index, list) => {
    const distractors = shuffle(
      list
        .filter((other) => other.id !== card.id)
        .map((other) => other.answer)
        .filter((answer) => answer.length > 0)
    ).slice(0, 3);

    const choices = shuffle(unique([card.answer, ...distractors])).slice(0, 4);
    return {
      id: createId("quiz", `${card.id}-${index}`),
      stem: card.prompt,
      correctAnswer: card.answer,
      choices,
      explanation: `Pulled from ${card.sourceLabel}. Re-open that resource if this felt fuzzy.`,
      sourceDocumentId: card.sourceDocumentId,
      sourceLabel: card.sourceLabel,
      tags: card.tags
    };
  });
}

function buildSections(chunks: StudyChunk[]) {
  const grouped = new Map<string, StudyChunk[]>();
  chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
    .forEach((chunk) => {
      const key = chunk.heading;
      grouped.set(key, [...(grouped.get(key) ?? []), chunk]);
    });

  return Array.from(grouped.entries())
    .slice(0, 6)
    .map<StudySection>(([heading, group], index) => ({
      id: `section-${index}`,
      title: heading,
      body: unique(group.map((chunk) => splitSentences(chunk.text)[0] ?? chunk.text))
        .slice(0, 3)
        .join(" "),
      sourceDocumentIds: unique(group.map((chunk) => chunk.documentId))
    }));
}

function buildRetrievalPrompts(chunks: StudyChunk[]) {
  return chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((chunk) => `Can you explain ${chunk.heading.toLowerCase()} without looking at ${chunk.documentName}?`);
}

function buildMarkdown(summary: Omit<StudySummary, "markdown" | "latex" | "printableHtml">, documents: AnalyzedDocument[]) {
  const documentMap = new Map(documents.map((document) => [document.id, document]));
  return [
    `# ${summary.title}`,
    "",
    `_${summary.subtitle}_`,
    "",
    "## Overview",
    "",
    summary.overview,
    "",
    "## What To Remember",
    "",
    ...summary.remember.map((item) => `- ${item}`),
    "",
    "## Key Notes",
    "",
    ...summary.sections.flatMap((section) => [
      `### ${section.title}`,
      "",
      section.body,
      "",
      `Sources: ${section.sourceDocumentIds
        .map((documentId) => documentMap.get(documentId)?.relativePath ?? documentId)
        .join(", ")}`,
      ""
    ]),
    "## Pitfalls",
    "",
    ...summary.pitfalls.map((item) => `- ${item}`),
    "",
    "## Retrieval Prompts",
    "",
    ...summary.retrievalPrompts.map((item) => `- ${item}`),
    "",
    "## Action Plan",
    "",
    ...summary.actionPlan.map((item) => `1. ${item}`)
  ].join("\n");
}

function buildLatex(summary: Omit<StudySummary, "markdown" | "latex" | "printableHtml">) {
  return [
    "\\documentclass[11pt]{article}",
    "\\usepackage[margin=1in]{geometry}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{enumitem}",
    "\\setlist[itemize]{leftmargin=1.4em}",
    "\\begin{document}",
    `\\section*{${escapeLatex(summary.title)}}`,
    escapeLatex(summary.subtitle),
    "\\subsection*{Overview}",
    escapeLatex(summary.overview),
    "\\subsection*{What To Remember}",
    "\\begin{itemize}",
    ...summary.remember.map((item) => `\\item ${escapeLatex(item)}`),
    "\\end{itemize}",
    "\\subsection*{Key Notes}",
    ...summary.sections.flatMap((section) => [
      `\\paragraph{${escapeLatex(section.title)}} ${escapeLatex(section.body)}`
    ]),
    "\\subsection*{Pitfalls}",
    "\\begin{itemize}",
    ...summary.pitfalls.map((item) => `\\item ${escapeLatex(item)}`),
    "\\end{itemize}",
    "\\subsection*{Retrieval Prompts}",
    "\\begin{itemize}",
    ...summary.retrievalPrompts.map((item) => `\\item ${escapeLatex(item)}`),
    "\\end{itemize}",
    "\\subsection*{Action Plan}",
    "\\begin{enumerate}",
    ...summary.actionPlan.map((item) => `\\item ${escapeLatex(item)}`),
    "\\end{enumerate}",
    "\\end{document}"
  ].join("\n");
}

function buildPrintableHtml(summary: Omit<StudySummary, "markdown" | "latex" | "printableHtml">) {
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\" />",
    `<title>${escapeHtml(summary.title)}</title>`,
    "<style>",
    "body{font-family:Georgia,serif;background:#fff;color:#111;margin:0;padding:40px;line-height:1.6}",
    "main{max-width:850px;margin:0 auto}",
    "h1,h2,h3{font-family:'Avenir Next','Segoe UI',sans-serif;line-height:1.15}",
    "section{margin-top:28px}",
    "ul,ol{padding-left:22px}",
    ".muted{color:#555;font-size:0.95rem}",
    ".card{border:1px solid #ddd;padding:18px;margin-top:14px;border-radius:12px}",
    "@media print{body{padding:0.45in}}",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    `<h1>${escapeHtml(summary.title)}</h1>`,
    `<p class="muted">${escapeHtml(summary.subtitle)}</p>`,
    "<section>",
    "<h2>Overview</h2>",
    `<p>${escapeHtml(summary.overview)}</p>`,
    "</section>",
    "<section>",
    "<h2>What To Remember</h2>",
    "<ul>",
    ...summary.remember.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ul>",
    "</section>",
    "<section>",
    "<h2>Key Notes</h2>",
    ...summary.sections.map(
      (section) =>
        `<div class="card"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></div>`
    ),
    "</section>",
    "<section>",
    "<h2>Pitfalls</h2>",
    "<ul>",
    ...summary.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ul>",
    "</section>",
    "<section>",
    "<h2>Retrieval Prompts</h2>",
    "<ul>",
    ...summary.retrievalPrompts.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ul>",
    "</section>",
    "<section>",
    "<h2>Action Plan</h2>",
    "<ol>",
    ...summary.actionPlan.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ol>",
    "</section>",
    "</main>",
    "</body>",
    "</html>"
  ].join("");
}

function buildSummary(folderLabel: string, documents: AnalyzedDocument[], chunks: StudyChunk[], flashcards: Flashcard[], quizzes: QuizQuestion[]) {
  const baseSummary = {
    title: buildSummaryTitle(folderLabel, documents),
    subtitle: `Generated ${new Date().toLocaleString()} from ${documents.length} study resources inside ${folderLabel}.`,
    overview: buildOverview(documents, chunks),
    remember: rememberBullets(chunks),
    pitfalls: pitfallBullets(chunks),
    actionPlan: buildActionPlan(documents, flashcards, quizzes),
    sections: buildSections(chunks),
    retrievalPrompts: buildRetrievalPrompts(chunks)
  };

  return {
    ...baseSummary,
    markdown: buildMarkdown(baseSummary, documents),
    latex: buildLatex(baseSummary),
    printableHtml: buildPrintableHtml(baseSummary)
  } satisfies StudySummary;
}

function relativePathFor(file: File) {
  const path = "webkitRelativePath" in file ? String((file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "") : "";
  return path || file.name;
}

function folderLabelFrom(files: File[]) {
  const first = relativePathFor(files[0]);
  const firstSegment = first.split("/")[0];
  return firstSegment || "course-content";
}

export async function analyzeSelectedFiles(
  files: File[],
  onProgress?: (progress: AnalysisProgress) => void
) {
  const folderLabel = folderLabelFrom(files);
  const supportedFiles = files.filter(isSupportedFile);
  const skippedFiles = files.filter((file) => !isSupportedFile(file)).map(relativePathFor);
  const documents: AnalyzedDocument[] = [];

  for (let index = 0; index < supportedFiles.length; index += 1) {
    const file = supportedFiles[index];
    const relativePath = relativePathFor(file);
    onProgress?.({
      current: index + 1,
      total: supportedFiles.length,
      label: relativePath
    });

    const extension = getExtension(file.name);
    const kind = inferKind(relativePath, extension);

    try {
      const payload =
        extension === "pdf"
          ? await readPdfFile(file)
          : {
              text: await readTextFile(file),
              pages: [] as SourcePage[]
            };

      if (!payload.text || countWords(payload.text) < 15) {
        skippedFiles.push(relativePath);
        continue;
      }

      const headings = extractHeadings(payload.text, file.name);
      const frequency = buildFrequencyMap([{ rawText: payload.text }]);
      const snippets = topSentences(payload.text, frequency, 3);
      documents.push({
        id: createId("doc", relativePath),
        file,
        name: file.name,
        relativePath,
        extension,
        kind,
        wordCount: countWords(payload.text),
        estimatedMinutes: Math.max(1, Math.ceil(countWords(payload.text) / 180)),
        excerpt: snippets[0] ?? payload.text.slice(0, 180),
        rawText: payload.text,
        headings,
        snippets,
        pages: payload.pages,
        tags: unique([kind, ...tokenize(relativePath).slice(0, 3)])
      });
    } catch {
      skippedFiles.push(relativePath);
    }
  }

  if (documents.length === 0) {
    throw new Error("Prep Studio could not extract usable text from the selected folder. Use PDF, Markdown, text, HTML, LaTeX, CSV, JSON, or code files.");
  }

  const frequency = buildFrequencyMap(documents);
  const chunks = documents.flatMap((document) => splitDocumentIntoChunks(document, frequency));
  const flashcards = buildFlashcards(documents, chunks);
  const quizzes = buildQuizQuestions(flashcards);
  const summary = buildSummary(folderLabel, documents, chunks, flashcards, quizzes);

  const stats: AnalysisStats = {
    generatedAt: Date.now(),
    totalFiles: files.length,
    supportedFiles: supportedFiles.length,
    skippedFiles: skippedFiles.length,
    documents: documents.length,
    chunks: chunks.length,
    flashcards: flashcards.length,
    quizzes: quizzes.length,
    words: documents.reduce((sum, document) => sum + document.wordCount, 0),
    notes: documents.filter((document) => document.kind === "note").length,
    labs: documents.filter((document) => document.kind === "lab").length,
    slides: documents.filter((document) => document.kind === "slides").length,
    pdfs: documents.filter((document) => document.extension === "pdf").length,
    code: documents.filter((document) => document.kind === "code").length
  };

  return {
    folderLabel,
    documents,
    chunks,
    summary,
    flashcards,
    quizzes,
    skippedFiles,
    stats
  } satisfies AnalysisBundle;
}

export function searchStudyResources(bundle: AnalysisBundle, query: string, kinds: ResourceKind[] = []) {
  const normalizedQuery = query.trim().toLowerCase();
  const tokens = tokenize(normalizedQuery);
  const kindFilter = new Set(kinds);

  return bundle.documents
    .filter((document) => (kindFilter.size > 0 ? kindFilter.has(document.kind) : true))
    .map<SearchResult>((document) => {
      const matchingChunks = bundle.chunks
        .filter((chunk) => chunk.documentId === document.id)
        .map((chunk) => {
          const haystack = `${chunk.heading} ${chunk.text}`.toLowerCase();
          const tokenHits = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
          const exactHit = normalizedQuery.length > 0 && haystack.includes(normalizedQuery) ? 3 : 0;
          return { chunk, score: tokenHits * 3 + exactHit + chunk.score / 5 };
        })
        .sort((a, b) => b.score - a.score);

      const documentHaystack = `${document.name} ${document.relativePath} ${document.excerpt}`.toLowerCase();
      const documentScore = tokens.reduce((sum, token) => sum + (documentHaystack.includes(token) ? 2 : 0), 0);
      const matchedChunk = matchingChunks[0]?.chunk;
      return {
        document,
        matchedChunk,
        score: documentScore + (matchingChunks[0]?.score ?? 0),
        excerpt: matchedChunk?.text ?? document.excerpt
      };
    })
    .filter((result) => (normalizedQuery ? result.score > 0 : true))
    .sort((a, b) => b.score - a.score);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadTextFile(filename: string, content: string, contentType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openPrintableDocument(html: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

export function nextReview(state: ReviewState, rating: ReviewRating): ReviewState {
  const now = Date.now();
  if (rating === "again") {
    return {
      dueAt: now + 15 * 60 * 1000,
      intervalDays: 0,
      ease: Math.max(1.3, state.ease - 0.2),
      reps: 0,
      attempts: state.attempts + 1,
      correct: state.correct,
      lastReviewedAt: now
    };
  }

  const multiplier = rating === "hard" ? 1.2 : rating === "good" ? state.ease : state.ease + 0.25;
  const nextInterval = state.reps === 0 ? 1 : Math.max(1, Math.round(state.intervalDays * multiplier));

  return {
    dueAt: now + nextInterval * 24 * 60 * 60 * 1000,
    intervalDays: nextInterval,
    ease: rating === "easy" ? state.ease + 0.08 : state.ease,
    reps: state.reps + 1,
    attempts: state.attempts + 1,
    correct: state.correct + 1,
    lastReviewedAt: now
  };
}

export function initialReviewState(): ReviewState {
  return {
    dueAt: Date.now(),
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
    attempts: 0,
    correct: 0
  };
}
