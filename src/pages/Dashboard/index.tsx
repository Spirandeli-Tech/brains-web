import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Empty, Spin, Tag, message } from "antd";
import { CheckOutlined, CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import briefingClient from "@/lib/clients/briefing";
import type { Briefing } from "@/lib/clients/briefing";
import proposalsClient from "@/lib/clients/proposals";
import { PageHeader, DataCard } from "@/components/molecules";

const POLL_INTERVAL_MS = 30000;

const SOURCE_LABELS: Record<string, string> = {
  implementation: "Implementação",
  code_review: "Code review",
  address_pr: "Address PR",
  automation: "Automação",
  watcher: "Watcher",
  system: "Sistema",
};

const DAILY_STATS: { source: string; label: string; color: string }[] = [
  { source: "implementation", label: "Implementações feitas", color: "#42A5F5" },
  { source: "code_review", label: "PRs revisados", color: "#7CB342" },
  { source: "automation", label: "Automações rodadas", color: "#FBC02D" },
  { source: "address_pr", label: "Address PR", color: "#AB47BC" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StatTile({
  label,
  value,
  color,
  inProgress,
}: {
  label: string;
  value: number;
  color: string;
  inProgress: number;
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      <div style={{ height: 4, backgroundColor: color }} />
      <div className="p-4">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
        {inProgress > 0 && (
          <p className="text-xs text-text-muted m-0 mt-1">
            +{inProgress} em andamento (não precisa de você ainda)
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const statCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of briefing?.done ?? []) {
      counts[event.source] = (counts[event.source] ?? 0) + 1;
    }
    return counts;
  }, [briefing]);

  const fetchBriefing = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await briefingClient.getBriefing();
      setBriefing(data);
    } catch (err) {
      if (!silent) {
        message.error(err instanceof Error ? err.message : "Failed to load briefing");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  useEffect(() => {
    if (!briefing) return;
    briefingClient.markSeen().catch(() => {});
  }, [briefing?.date]);

  useEffect(() => {
    if (!briefing) return;
    const hasActive = briefing.awaiting_approval.length > 0 || briefing.proposals.length > 0;
    if (hasActive) {
      pollRef.current = window.setInterval(() => fetchBriefing(true), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [briefing, fetchBriefing]);

  const handleAccept = async (id: string) => {
    setDecidingId(id);
    try {
      await proposalsClient.accept(id);
      message.success("Proposta aceita — run criado");
      await fetchBriefing(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setDecidingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setDecidingId(id);
    try {
      await proposalsClient.dismiss(id);
      await fetchBriefing(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to dismiss proposal");
    } finally {
      setDecidingId(null);
    }
  };

  if (loading && !briefing) {
    return (
      <div className="flex justify-center py-24">
        <Spin />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Bom dia"
        subtitle={briefing?.narrative}
        actions={
          <Button icon={<ReloadOutlined />} size="small" onClick={() => fetchBriefing()} loading={loading}>
            Reload
          </Button>
        }
      />

      <DataCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Estatísticas do dia</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DAILY_STATS.map((stat) => (
            <StatTile
              key={stat.source}
              label={stat.label}
              value={statCounts[stat.source] ?? 0}
              color={stat.color}
              inProgress={briefing?.in_progress[stat.source] ?? 0}
            />
          ))}
        </div>
      </DataCard>

      <DataCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Aguardando você</h3>
        {briefing && briefing.awaiting_approval.length > 0 ? (
          <div className="flex flex-col gap-2">
            {briefing.awaiting_approval.map((item) => (
              <div
                key={`${item.source}-${item.ref_id}`}
                className="flex items-center justify-between gap-3 border border-border-subtle rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag>{SOURCE_LABELS[item.source] ?? item.source}</Tag>
                  <span className="truncate">{item.title}</span>
                  {item.connection_name && (
                    <span className="text-text-muted text-xs shrink-0">{item.connection_name}</span>
                  )}
                </div>
                <Link to={item.url_path}>
                  <Button size="small">Ver</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nada esperando aprovação." />
        )}
      </DataCard>

      <DataCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Propostas</h3>
        {briefing && briefing.proposals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {briefing.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex items-center justify-between gap-3 border border-border-subtle rounded-lg px-3 py-2"
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{proposal.title}</span>
                  {proposal.description && (
                    <span className="text-text-muted text-xs truncate">{proposal.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleDismiss(proposal.id)}
                    loading={decidingId === proposal.id}
                  >
                    Dispensar
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleAccept(proposal.id)}
                    loading={decidingId === proposal.id}
                  >
                    Aceitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma proposta pendente." />
        )}
      </DataCard>

      <DataCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Falhas de hoje</h3>
        {briefing && briefing.failures.length > 0 ? (
          <div className="flex flex-col gap-2">
            {briefing.failures.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag color="error">{SOURCE_LABELS[event.source] ?? event.source}</Tag>
                  <span className="truncate">{event.title}</span>
                </div>
                <span className="text-text-muted text-xs shrink-0">{formatTime(event.occurred_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma falha hoje." />
        )}
      </DataCard>

      <DataCard>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Timeline do dia</h3>
        {briefing && briefing.timeline.length > 0 ? (
          <div className="flex flex-col gap-2">
            {briefing.timeline.map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-sm">
                <span className="text-text-muted text-xs w-12 shrink-0">{formatTime(event.occurred_at)}</span>
                <Tag>{SOURCE_LABELS[event.source] ?? event.source}</Tag>
                <span className="truncate">{event.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nada rodou ainda hoje." />
        )}
      </DataCard>
    </div>
  );
}
