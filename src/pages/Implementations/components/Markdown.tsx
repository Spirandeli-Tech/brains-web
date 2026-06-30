import React, { Fragment } from "react";
import { Linkify } from "./Linkify";

/** Render inline markdown: **bold**, *italic*, `code`, and URLs via Linkify. */
function renderInline(text: string, key: string | number): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  if (parts.length === 1) return <Linkify key={key} text={text} />;
  return (
    <Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono border border-gray-200">{part.slice(1, -1)}</code>;
        return <Linkify key={i} text={part} />;
      })}
    </Fragment>
  );
}

/**
 * Lightweight Markdown renderer for step logs.
 * Handles: ## headings, **bold**, *italic*, `code`, ```fenced blocks```, - lists.
 * Applies Linkify to plain text segments.
 */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";
  let i = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1.5 pl-1">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    i++;

    // Fenced code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <pre key={`code-${i}`} className="rounded p-2 my-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap" style={{ background: "#1e1e2e", color: "#cdd6f4" }}>
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // ## H2
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-sm font-semibold text-text-primary mt-3 mb-1 first:mt-0">
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    // ### H3
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xs font-semibold text-text-primary mt-2 mb-0.5">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // - or * list item
    const listMatch = line.match(/^[-*] (.*)/);
    if (listMatch) {
      listItems.push(
        <li key={i} className="text-xs text-text-muted">
          {renderInline(listMatch[1], `li-${i}`)}
        </li>
      );
      continue;
    }

    // Numbered list: 1. item
    const numMatch = line.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      listItems.push(
        <li key={i} className="text-xs text-text-muted">
          {renderInline(numMatch[1], `li-${i}`)}
        </li>
      );
      continue;
    }

    // Empty line — flush list and add spacing
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      flushList();
      elements.push(<hr key={i} className="my-2 border-border-divider" />);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={i} className="text-xs text-text-muted m-0 leading-relaxed">
        {renderInline(line, `p-${i}`)}
      </p>
    );
  }

  flushList();

  // Unclosed code block
  if (codeLines.length > 0) {
    elements.push(
      <pre key="code-final" className="rounded p-2 my-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap" style={{ background: "#1e1e2e", color: "#cdd6f4" }}>
        {codeLines.join("\n")}
      </pre>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}
