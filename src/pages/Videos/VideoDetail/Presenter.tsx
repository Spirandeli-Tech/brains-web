import { useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { CloseOutlined, ExpandOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { Slide } from "@/lib/cola";

// One slide at a time, built to be screen-shared: real Fullscreen API, arrow-key
// navigation, a progress readout. Ported from labs/apps/sites/estudos/src/Presenter.tsx.
export function Presenter({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const atStart = index === 0;
  const atEnd = index === slides.length - 1;

  function go(delta: number) {
    setIndex((i) => Math.min(Math.max(i + delta, 0), slides.length - 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current?.requestFullscreen();
    }
  }

  if (!slides.length) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-page flex items-center justify-center p-8">
        <div className="max-w-md text-center text-text-muted text-sm leading-relaxed">
          <p>
            Essa cola ainda não tem seções pra virar slides. Adicione <code>**Título**</code>{" "}
            + bullets antes de apresentar.
          </p>
          <Button className="mt-4" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-bg-page flex flex-col gap-6 p-[6vh_7vw]"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs tracking-wide text-text-muted whitespace-nowrap">
          Slide {index + 1} de {slides.length}
        </span>
        <div className="flex-1 h-[3px] rounded bg-border-subtle overflow-hidden min-w-[40px]">
          <div
            className="h-full bg-brand-primary rounded transition-[width] duration-300"
            style={{ width: `${((index + 1) / slides.length) * 100}%` }}
          />
        </div>
        <Button size="small" icon={<ExpandOutlined />} onClick={toggleFullscreen}>
          {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        </Button>
        <Button size="small" icon={<CloseOutlined />} onClick={onClose} />
      </div>

      <div className="flex-1 flex items-center gap-4">
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          disabled={atStart}
          onClick={() => go(-1)}
          aria-label="Slide anterior"
        />

        <div key={index} className="flex-1 min-w-0 text-center px-2 py-3">
          {slide.title && (
            <h2 className="font-serif font-semibold tracking-tight text-[clamp(1.75rem,1rem+2.6vw,3.25rem)] leading-tight mb-6 text-text-primary text-balance">
              {slide.title}
            </h2>
          )}
          {slide.highlight ? (
            <p
              className="font-semibold text-[clamp(1.375rem,1rem+1.8vw,2.25rem)] leading-snug max-w-[46ch] mx-auto px-8 py-7 rounded-2xl bg-bg-card text-text-primary"
              dangerouslySetInnerHTML={{ __html: slide.highlight.text }}
            />
          ) : (
            <ul className="list-none m-0 p-0 max-w-[62ch] mx-auto flex flex-col gap-3 text-left">
              {slide.items.map((item, i) => (
                <li
                  key={i}
                  className={
                    item.kind !== "normal"
                      ? "relative pl-0 text-lg leading-relaxed px-4 py-3 rounded-lg bg-bg-card text-text-primary"
                      : "relative pl-5 text-lg leading-relaxed text-text-primary before:content-[''] before:absolute before:left-1 before:top-3 before:w-1.5 before:h-1.5 before:rounded-full before:bg-text-disabled"
                  }
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              ))}
            </ul>
          )}
        </div>

        <Button
          shape="circle"
          icon={<RightOutlined />}
          disabled={atEnd}
          onClick={() => go(1)}
          aria-label="Próximo slide"
        />
      </div>

      <div className="flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={i === index}
            className={`w-1.5 h-1.5 rounded-full border-0 p-0 cursor-pointer transition-transform ${
              i === index ? "bg-brand-primary scale-125" : "bg-border-subtle"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
