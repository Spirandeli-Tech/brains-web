import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
// Trailing punctuation that shouldn't be part of the link.
const TRAILING = /[.,;:!?)\]]+$/;

interface LinkifyProps {
  text: string | null | undefined;
  /** Tailwind classes applied to each rendered <a>. */
  linkClassName?: string;
}

/**
 * Renders text with any URLs turned into clickable links. Stops click
 * propagation so clicking a link inside a clickable row doesn't also trigger
 * the row's handler (e.g. opening the step drawer).
 */
export function Linkify({ text, linkClassName = "text-brand-primary underline" }: LinkifyProps) {
  if (!text) return null;

  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (!URL_RE.test(part)) {
          // reset lastIndex since URL_RE is global
          URL_RE.lastIndex = 0;
          return <Fragment key={i}>{part}</Fragment>;
        }
        URL_RE.lastIndex = 0;
        const trailingMatch = part.match(TRAILING);
        const trailing = trailingMatch ? trailingMatch[0] : "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
              onClick={(e) => e.stopPropagation()}
            >
              {href}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}
