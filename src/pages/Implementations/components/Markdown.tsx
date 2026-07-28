import React, { Fragment } from "react";
import { Linkify } from "@/components/molecules/Linkify";

/**
 * Inline markers, in priority order. Code first so `**` inside backticks stays literal;
 * bold before italic so `**x**` isn't read as two italics. Captures are lazy and accept
 * anything (newlines included, since a wrapped source line is joined before this runs),
 * which is what lets emphasis nest — the branches below recurse into their own content.
 *
 * The italic delimiter is a *lone* asterisk: `(?<!\*)\*(?!\*)` on both ends. Without that
 * guard, `*"texto **negrito** texto"*` matched italic from the opening `*` up to the first
 * asterisk of `**`, and the whole span came out as three italics and no bold.
 */
const INLINE_RE =
  /(`[^`]+`|\*\*[\s\S]+?\*\*|~~[\s\S]+?~~|(?<!\*)\*(?!\*)[\s\S]+?(?<!\*)\*(?!\*))/;

/** Render inline markdown: **bold**, *italic*, `code`, ~~strike~~, and URLs via Linkify. */
function renderInline(text: string, key: string | number): React.ReactNode {
  const parts = text.split(INLINE_RE);
  if (parts.length === 1) return <Linkify key={key} text={text} />;
  return (
    <Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return (
            <strong key={i} className="font-semibold text-text-primary">
              {renderInline(part.slice(2, -2), `${key}-b${i}`)}
            </strong>
          );
        if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4)
          return (
            <span key={i} className="line-through opacity-60">
              {renderInline(part.slice(2, -2), `${key}-s${i}`)}
            </span>
          );
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return <em key={i}>{renderInline(part.slice(1, -1), `${key}-i${i}`)}</em>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
          return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono border border-gray-200">{part.slice(1, -1)}</code>;
        return <Linkify key={i} text={part} />;
      })}
    </Fragment>
  );
}

/** One bullet, with the items nested under it. Depth comes from indentation. */
type ListItem = { text: string; ordered: boolean; children: ListItem[] };

const LIST_RE = /^([-*]|\d+\.)\s+(.*)$/;
/** A table separator: only pipes, dashes, colons and spaces, with at least one dash. */
/** Sentinel for a paragraph break inside a blockquote — never appears in real prose. */
const QUOTE_BREAK = "\u0000";
const TABLE_SEP_RE = /^\|?[\s:|-]*-[\s:|-]*\|?$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Nested `<ul>`/`<ol>`. `list-outside` so wrapped lines align under the text, not the bullet. */
function renderList(
  items: ListItem[],
  depth: number,
  keyBase: string,
  textSize: string,
  textColor: string
): React.ReactNode {
  if (items.length === 0) return null;
  const Tag = items[0].ordered ? "ol" : "ul";
  const marker = items[0].ordered
    ? "decimal"
    : depth === 0
      ? "disc"
      : depth === 1
        ? "circle"
        : "square";
  return (
    <Tag
      key={keyBase}
      className={`list-outside space-y-0.5 my-1.5 pl-5 ${depth > 0 ? "mt-0.5" : ""}`}
      style={{ listStyleType: marker }}
    >
      {items.map((item, i) => (
        <li key={i} className={`${textSize} ${textColor} leading-relaxed`}>
          {renderInline(item.text, `${keyBase}-${i}`)}
          {renderList(item.children, depth + 1, `${keyBase}-${i}-n`, textSize, textColor)}
        </li>
      ))}
    </Tag>
  );
}

/**
 * Lightweight Markdown renderer for step logs, devocional roteiros and video scripts.
 *
 * Handles: `#`/`##`/`###` headings (with inline markdown inside them), **bold**, *italic*,
 * `code`, ~~strike~~, ```fenced blocks```, `-`/`*`/`1.` lists **nested by indentation**,
 * wrapped list items, `>` blockquotes (indented ones too) and GFM tables.
 * Applies Linkify to plain text segments.
 *
 * Why hand-rolled instead of a library: this renders content the house writes itself
 * (roteiros, logs, checklists), so the surface is known and the bundle stays free of a
 * markdown parser. If arbitrary third-party markdown ever lands here, swap for a real one.
 *
 * `size="base"` swaps the compact log styling (text-xs/muted) for a more legible reading
 * size — used for prose like the devocional roteiro and the video script.
 */
export function Markdown({ text, size = "sm" }: { text: string; size?: "sm" | "base" }) {
  const textSize = size === "base" ? "text-sm" : "text-xs";
  const textColor = size === "base" ? "text-text-secondary" : "text-text-muted";
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  // The open list, as a stack of (indent, siblings) so `  - a` nests under `- b`.
  let listRoot: ListItem[] = [];
  let listStack: { indent: number; items: ListItem[] }[] = [];

  const flushList = (key: number) => {
    if (listRoot.length > 0) {
      elements.push(renderList(listRoot, 0, `ul-${key}`, textSize, textColor));
    }
    listRoot = [];
    listStack = [];
  };

  /** The item a continuation line belongs to: deepest open item. */
  const lastItem = (): ListItem | null => {
    const level = listStack[listStack.length - 1];
    if (!level || level.items.length === 0) return null;
    return level.items[level.items.length - 1];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    // Fenced code block — consume until the closing fence.
    if (trimmed.startsWith("```")) {
      flushList(i);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          className="rounded p-2 my-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap"
          style={{ background: "#1e1e2e", color: "#cdd6f4" }}
        >
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // GFM table — a header row followed by a separator row.
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      TABLE_SEP_RE.test(lines[i + 1].trim())
    ) {
      flushList(i);
      const header = splitRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--; // the outer loop advances past the last consumed line
      elements.push(
        <div key={`table-${i}`} className="my-2 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {header.map((cell, c) => (
                  <th
                    key={c}
                    className={`${textSize} text-left font-semibold text-text-primary px-2 py-1 border-b border-border-divider whitespace-nowrap`}
                  >
                    {renderInline(cell, `th-${i}-${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={`${textSize} ${textColor} px-2 py-1 align-top border-b border-border-divider leading-relaxed`}
                    >
                      {renderInline(cell, `td-${i}-${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings — H1 down to H3, with inline markdown inside them.
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList(i);
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2], `h-${i}`);
      if (level === 1) {
        elements.push(
          <h1 key={i} className="text-base font-semibold text-text-primary mt-4 mb-1.5 first:mt-0">
            {content}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={i} className="text-sm font-semibold text-text-primary mt-3 mb-1 first:mt-0">
            {content}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={i} className="text-xs font-semibold text-text-primary mt-2 mb-0.5">
            {content}
          </h3>
        );
      }
      continue;
    }

    // Horizontal rule — before the list check, so `***` isn't read as a bullet.
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushList(i);
      elements.push(<hr key={i} className="my-2 border-border-divider" />);
      continue;
    }

    // Blockquote — matched on the trimmed line so quotes nested in a list render too.
    // Consecutive `>` lines are ONE quote: a wrapped source line must not become two
    // blockquotes, or emphasis that spans the wrap ends up unbalanced and leaks its `**`.
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushList(i);
      const quoteParts: string[] = [quoteMatch[1]];
      while (i + 1 < lines.length) {
        const nextQuote = lines[i + 1].trim().match(/^>\s?(.*)$/);
        if (!nextQuote) break;
        // `>` on its own is a paragraph break inside the quote.
        quoteParts.push(nextQuote[1].trim() ? nextQuote[1] : QUOTE_BREAK);
        i++;
      }
      const paragraphs = quoteParts
        .join(" ")
        .split(QUOTE_BREAK)
        .map((p) => p.trim())
        .filter(Boolean);
      elements.push(
        <blockquote
          key={i}
          className={`border-l-2 border-border-divider pl-3 my-2 italic ${textSize} text-text-secondary leading-relaxed`}
        >
          {paragraphs.map((paragraph, p) => (
            <p key={p} className="m-0 first:mt-0 mt-1.5">
              {renderInline(paragraph, `bq-${i}-${p}`)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // List item — depth from indentation, via the stack.
    const listMatch = trimmed.match(LIST_RE);
    if (listMatch) {
      const ordered = /^\d+\.$/.test(listMatch[1]);
      const item: ListItem = { text: listMatch[2], ordered, children: [] };

      if (listStack.length === 0) {
        listRoot = [item];
        listStack = [{ indent, items: listRoot }];
        continue;
      }
      while (listStack.length > 1 && indent < listStack[listStack.length - 1].indent) {
        listStack.pop();
      }
      const top = listStack[listStack.length - 1];
      if (indent > top.indent) {
        const parent = top.items[top.items.length - 1];
        parent.children.push(item);
        listStack.push({ indent, items: parent.children });
      } else {
        top.items.push(item);
      }
      continue;
    }

    // Blank line — ends the list only if the next non-blank line leaves it.
    if (!trimmed) {
      const next = lines.slice(i + 1).find((l) => l.trim());
      if (!next || !next.trim().match(LIST_RE)) flushList(i);
      continue;
    }

    // Indented text right under a bullet is that bullet wrapping, not a new paragraph.
    const openItem = lastItem();
    if (openItem && indent > 0) {
      openItem.text += ` ${trimmed}`;
      continue;
    }

    // Regular paragraph — consecutive plain lines are ONE block, for the same reason as
    // blockquotes: emphasis that spans a wrapped source line has to stay balanced. The
    // newlines are kept (`whitespace-pre-line`) so step logs still break where they broke.
    flushList(i);
    const paraLines: string[] = [trimmed];
    while (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextTrimmed = nextLine.trim();
      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        nextTrimmed.startsWith(">") ||
        nextTrimmed.startsWith("|") ||
        /^#{1,3}\s/.test(nextTrimmed) ||
        /^-{3,}$/.test(nextTrimmed) ||
        /^\*{3,}$/.test(nextTrimmed) ||
        LIST_RE.test(nextTrimmed)
      ) {
        break;
      }
      paraLines.push(nextTrimmed);
      i++;
    }
    elements.push(
      <p key={i} className={`${textSize} ${textColor} m-0 leading-relaxed whitespace-pre-line`}>
        {renderInline(paraLines.join("\n"), `p-${i}`)}
      </p>
    );
  }

  flushList(lines.length);

  return <div className={size === "base" ? "space-y-3" : "space-y-0.5"}>{elements}</div>;
}
