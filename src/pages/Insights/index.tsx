import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Empty, Spin, message } from "antd";
import { CheckOutlined, CloseOutlined, LeftOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import insightsClient from "@/lib/clients/insights";
import type { Insights, PlannerHighlight, PlannerTicket } from "@/lib/clients/insights";
import proposalsClient from "@/lib/clients/proposals";

const POLL_INTERVAL_MS = 5000;
const ORG_TICKET_PREVIEW = 6;

// tone → accent (highlights). Hexes mirror the status tokens in index.css.
const TONE: Record<string, { dot: string; label: string }> = {
  urgent: { dot: "#B91C1C", label: "Urgente" },
  warning: { dot: "#B45309", label: "Atenção" },
  info: { dot: "#2563EB", label: "Andamento" },
};

function priorityRank(p: string | null): number {
  const s = (p ?? "").toLowerCase();
  if (s.includes("highest") || s.includes("blocker")) return 0;
  if (s.includes("high")) return 1;
  if (s.includes("medium")) return 2;
  if (s.includes("low")) return 3;
  return 4;
}

function priorityAccent(p: string | null): string {
  const r = priorityRank(p);
  if (r === 0) return "#B91C1C";
  if (r === 1) return "#B45309";
  if (r <= 3) return "#9CA3AF";
  return "#E6EAF0";
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftISO(s: string, days: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function dayStamp(iso: string): string {
  const d = parseISO(iso);
  const wd = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const day = d.toLocaleDateString("pt-BR", { day: "2-digit" });
  const mon = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${wd} · ${day} ${mon}`.toUpperCase();
}

const TODAY_ISO = toISO(new Date());

// Fallback only: render **bold** from a legacy wall-of-text narrative.
function renderNarrative(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-text-primary font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function HighlightRow({ h }: { h: PlannerHighlight }) {
  const tone = TONE[h.tone] ?? TONE.info;
  return (
    <li className="flex items-start gap-3 py-2">
      <span
        className="mt-[7px] h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: tone.dot }}
        aria-hidden
      />
      <span className="text-[15px] leading-relaxed text-text-secondary">
        {h.org && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted mr-2">
            {h.org}
          </span>
        )}
        {h.text}
      </span>
    </li>
  );
}

function TicketRow({ t }: { t: PlannerTicket }) {
  const accent = priorityAccent(t.priority);
  return (
    <div className="flex items-center gap-3 py-2 pl-3 border-l-2" style={{ borderColor: accent }}>
      {t.url ? (
        <a
          href={t.url}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-text-muted hover:text-brand-primary shrink-0 w-[104px]"
        >
          {t.key}
        </a>
      ) : (
        <span className="font-mono text-xs text-text-muted shrink-0 w-[104px]">{t.key}</span>
      )}
      <span className="text-sm text-text-primary truncate flex-1">{t.summary}</span>
      {t.priority && (
        <span
          className="text-[11px] font-medium shrink-0 tabular-nums"
          style={{ color: accent }}
        >
          {t.priority}
        </span>
      )}
      {t.status && (
        <span className="text-xs text-text-muted shrink-0 hidden sm:inline">{t.status}</span>
      )}
    </div>
  );
}

function OrgBlock({ org, tickets, error }: { org: string; tickets: PlannerTicket[]; error?: string }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...tickets].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const shown = expanded ? sorted : sorted.slice(0, ORG_TICKET_PREVIEW);
  const hiddenCount = sorted.length - shown.length;
  const urgent = sorted.filter((t) => priorityRank(t.priority) === 0).length;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <h4 className="text-sm font-semibold text-text-primary m-0">{org}</h4>
        {error ? (
          <span className="text-xs text-status-danger-text">indisponível</span>
        ) : (
          <>
            <span className="text-xs text-text-muted">{tickets.length}</span>
            {urgent > 0 && (
              <span className="text-[11px] font-medium" style={{ color: "#B91C1C" }}>
                · {urgent} Highest
              </span>
            )}
          </>
        )}
      </div>
      {error ? (
        <p className="text-xs text-text-muted m-0">{error}</p>
      ) : tickets.length === 0 ? (
        <p className="text-xs text-text-muted m-0">Nada atribuído a você aqui.</p>
      ) : (
        <>
          <div className="flex flex-col">
            {shown.map((t) => (
              <TicketRow key={t.key} t={t} />
            ))}
          </div>
          {(hiddenCount > 0 || expanded) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-brand-primary hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              {expanded ? "Ver menos" : `Ver mais ${hiddenCount}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [date, setDate] = useState<string>(TODAY_ISO);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const isToday = date === TODAY_ISO;

  const fetchInsights = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setInsights(await insightsClient.getInsights(date));
      } catch (err) {
        if (!silent) message.error(err instanceof Error ? err.message : "Falha ao carregar os insights");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [date],
  );

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    const status = insights?.run?.status;
    if (status === "queued" || status === "running") {
      pollRef.current = window.setInterval(() => fetchInsights(true), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [insights, fetchInsights]);

  const decide = async (id: string, action: "accept" | "dismiss") => {
    setDecidingId(id);
    try {
      if (action === "accept") {
        await proposalsClient.accept(id);
        message.success("Aceita — trabalho iniciado");
      } else {
        await proposalsClient.dismiss(id);
      }
      await fetchInsights(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Falha ao decidir");
    } finally {
      setDecidingId(null);
    }
  };

  if (loading && !insights) {
    return (
      <div className="flex justify-center py-24">
        <Spin />
      </div>
    );
  }

  const run = insights?.run ?? null;
  const status = run?.status;
  const building = status === "queued" || status === "running";
  const failed = status === "failed";
  const boards = run?.board_summary ?? {};
  const highlights = run?.highlights ?? [];
  const proposals = insights?.proposals ?? [];

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-5">
      {/* ── Dispatch hero ─────────────────────────────────────────── */}
      <section className="bg-bg-card border border-border-subtle rounded-2xl shadow-card px-7 py-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.14em] text-text-muted">INSIGHTS</span>
            <Button
              type="text"
              size="small"
              aria-label="Dia anterior"
              icon={<LeftOutlined className="text-[10px]" />}
              onClick={() => setDate(shiftISO(date, -1))}
            />
            <span className="font-mono text-[11px] tracking-[0.14em] text-text-muted w-[116px] text-center whitespace-nowrap">
              {dayStamp(date)}
            </span>
            <Button
              type="text"
              size="small"
              aria-label="Próximo dia"
              disabled={isToday}
              icon={<RightOutlined className="text-[10px]" />}
              onClick={() => setDate(shiftISO(date, 1))}
            />
            {!isToday && (
              <Button type="link" size="small" className="px-1" onClick={() => setDate(TODAY_ISO)}>
                Hoje
              </Button>
            )}
          </div>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchInsights()}
            loading={loading}
          >
            Recarregar
          </Button>
        </div>

        {building ? (
          <div className="flex items-center gap-3 py-4 text-text-muted">
            <Spin size="small" />
            <span>Montando seu dia — lendo os boards e sintetizando o plano…</span>
          </div>
        ) : failed ? (
          <div>
            <p className="font-serif text-[22px] leading-snug text-text-primary m-0">
              Não consegui montar o plano deste dia.
            </p>
            {run?.error && <p className="text-sm text-text-muted mt-2 m-0">{run.error}</p>}
          </div>
        ) : !run ? (
          <p className="text-[15px] text-text-muted m-0 py-1">
            Nenhum plano foi gerado neste dia.
          </p>
        ) : (
          <>
            {run?.narrative &&
              (highlights.length > 0 || run.narrative.length <= 180 ? (
                // A short lead (new format) gets the editorial serif treatment.
                <p className="font-serif text-[26px] leading-[1.28] text-text-primary m-0 max-w-[34ch]">
                  {run.narrative}
                </p>
              ) : (
                // Legacy/fallback: a long narrative stays a humble, readable
                // paragraph — never a giant serif wall.
                <p className="text-[15px] leading-relaxed text-text-secondary m-0 max-w-[64ch]">
                  {renderNarrative(run.narrative)}
                </p>
              ))}

            {highlights.length > 0 && (
              <>
                <div className="h-px bg-border-subtle my-5" />
                <ul className="list-none p-0 m-0">
                  {highlights.map((h, i) => (
                    <HighlightRow key={i} h={h} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Sugestões ─────────────────────────────────────────────── */}
      {run && !building && (
        <section>
          <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            Sugestões do dia
          </h3>
          {proposals.length > 0 ? (
            <div className="flex flex-col gap-2">
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-bg-card border border-border-subtle rounded-xl shadow-card px-4 py-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text-primary truncate">{p.title}</span>
                    {p.description && (
                      <span className="text-xs text-text-muted truncate mt-0.5">{p.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => decide(p.id, "dismiss")}
                      loading={decidingId === p.id}
                    >
                      Dispensar
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => decide(p.id, "accept")}
                      loading={decidingId === p.id}
                    >
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card px-4 py-6">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma sugestão acionável neste dia." />
            </div>
          )}
        </section>
      )}

      {/* ── Por organização ───────────────────────────────────────── */}
      {Object.keys(boards).length > 0 && (
        <section>
          <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            Por organização
          </h3>
          <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card px-5 py-4 flex flex-col gap-5">
            {Object.entries(boards).map(([org, b]) => (
              <OrgBlock key={org} org={org} tickets={b.tickets ?? []} error={b.error} />
            ))}
          </div>
        </section>
      )}

      {run?.claude_cost_usd != null && (
        <p className="text-text-muted text-xs text-right m-0 px-1">
          Plano gerado por ${run.claude_cost_usd.toFixed(4)} em Claude
        </p>
      )}
    </div>
  );
}
