import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Empty, Spin, Tag, Tooltip, message } from "antd";
import {
  AuditOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import runnerClient from "@/lib/clients/runner";
import type { QueueItem, RunKind, RunnerOverview, RunnerStatus } from "@/lib/clients/runner";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  KIND_COLOR,
  KIND_LABEL,
  RUNNER_POLL_INTERVAL_MS,
  STATUS_COLOR,
  STATUS_LABEL,
  dueLabel,
  elapsedSince,
  relative,
} from "./utils";

const KIND_ICON: Record<RunKind, React.ReactNode> = {
  automation: <ClockCircleOutlined />,
  implementation: <ThunderboltOutlined />,
  code_review: <AuditOutlined />,
  address_pr: <CommentOutlined />,
  planner: <BulbOutlined />,
};

function KindTag({ kind }: { kind: RunKind }) {
  return (
    <Tag color={KIND_COLOR[kind]} icon={KIND_ICON[kind]}>
      {KIND_LABEL[kind]}
    </Tag>
  );
}

function RunnerCard({ runner }: { runner: RunnerStatus }) {
  const secs = Math.round(runner.seconds_since_last_seen);
  return (
    <DataCard className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Badge status={runner.online ? "success" : "error"} />
        <div className="min-w-0">
          <div className="font-medium text-text-primary truncate">
            {runner.runner_id}
          </div>
          <div className="text-xs text-text-muted">
            {runner.online
              ? `online · último sinal há ${secs}s`
              : `OFFLINE · sem sinal há ${relative(runner.last_seen_at)}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {runner.dry_run && <Tag color="orange">dry-run</Tag>}
        {!runner.online && (
          <Tag color="error">nenhum job vai rodar até religar</Tag>
        )}
      </div>
    </DataCard>
  );
}

function CurrentJobCard({ item }: { item: QueueItem }) {
  return (
    <DataCard className="border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge status="processing" />
            <KindTag kind={item.kind} />
            {item.is_manual && <Tag>manual</Tag>}
          </div>
          <div className="text-lg font-semibold text-text-primary truncate">
            {item.title}
          </div>
          <div className="text-sm text-text-muted truncate">
            {[item.connection_name, item.subtitle].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-text-muted">rodando há</div>
          <div className="text-lg font-semibold text-text-primary tabular-nums">
            {elapsedSince(item.started_at)}
          </div>
        </div>
      </div>
    </DataCard>
  );
}

function QueueRow({ item, position }: { item: QueueItem; position: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle last:border-b-0">
      <span className="w-6 text-center text-sm text-text-muted tabular-nums shrink-0">
        {position}
      </span>
      <span className="shrink-0">
        <KindTag kind={item.kind} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary truncate">
          {item.title}
          {item.is_manual && <Tag className="ml-2">manual</Tag>}
        </div>
        <div className="text-xs text-text-muted truncate">
          {[item.connection_name, item.subtitle].filter(Boolean).join(" · ") || "—"}
        </div>
      </div>
      <span className="shrink-0 text-right">
        <Tag color={STATUS_COLOR[item.display_status]}>
          {item.display_status === "waiting" && item.due_at
            ? `Aguardando ${dueLabel(item.due_at)}`
            : STATUS_LABEL[item.display_status]}
        </Tag>
        <div className="text-xs text-text-muted mt-0.5">
          {item.error ? (
            <Tooltip title={item.error}>
              <span className="text-red-500">erro</span>
            </Tooltip>
          ) : (
            `criado ${relative(item.created_at)}`
          )}
        </div>
      </span>
    </div>
  );
}

export function RunnerPage() {
  const [overview, setOverview] = useState<RunnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  const fetchOverview = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await runnerClient.getOverview();
      setOverview(data);
    } catch (err) {
      if (!silent) message.error("Falha ao carregar o status do runner");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    pollRef.current = window.setInterval(() => fetchOverview(true), RUNNER_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchOverview]);

  const current = overview?.current ?? [];
  const queued = overview?.queued ?? [];
  const runners = overview?.runners ?? [];
  const anyOnline = runners.some((r) => r.online);

  return (
    <div>
      <PageHeader
        title="Runner"
        subtitle="O que o runner está executando agora e o que está na fila"
        actions={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchOverview()}
            loading={loading}
          >
            Atualizar
          </Button>
        }
      />

      {loading && !overview ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Runners liveness */}
          <section className="flex flex-col gap-2">
            {runners.length === 0 ? (
              <DataCard>
                <span className="text-text-muted text-sm">
                  Nenhum runner registrou heartbeat ainda.
                </span>
              </DataCard>
            ) : (
              runners.map((r) => <RunnerCard key={r.runner_id} runner={r} />)
            )}
          </section>

          {/* Current job */}
          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
              Agora rodando
            </h2>
            {current.length === 0 ? (
              <DataCard>
                <span className="text-text-muted text-sm">
                  {anyOnline
                    ? "Runner ocioso — nenhum job em execução."
                    : "Nenhum job em execução."}
                </span>
              </DataCard>
            ) : (
              <div className="flex flex-col gap-3">
                {current.map((item) => (
                  <CurrentJobCard key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Queue */}
          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
              Na fila ({queued.length})
            </h2>
            <DataCard>
              {queued.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Fila vazia"
                />
              ) : (
                <div className="flex flex-col">
                  {queued.map((item, i) => (
                    <QueueRow
                      key={`${item.kind}-${item.id}`}
                      item={item}
                      position={i + 1}
                    />
                  ))}
                </div>
              )}
            </DataCard>
          </section>
        </div>
      )}
    </div>
  );
}
