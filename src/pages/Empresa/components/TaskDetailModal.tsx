import { useCallback, useEffect, useRef, useState } from "react";
import { Collapse, Modal, Spin, message } from "antd";
import empresaClient from "@/lib/clients/empresa";
import type { AgentData, TaskData, TaskDetailData } from "@/lib/clients/empresa";
import { StatusPill } from "@/components/atoms";
import { AgentAvatar } from "./AgentAvatar";
import { TASK_STATUS_PILL, avatarClassForArea, formatUsd, relative } from "../utils";

const LIVE_POLL_INTERVAL_MS = 3000;

interface TaskDetailModalProps {
  task: TaskData | null;
  agents: AgentData[];
  onClose: () => void;
}

function agentInfo(slug: string, agents: AgentData[]) {
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) return { name: slug, colorClass: "bg-gray-400" };
  return { name: agent.human_name, colorClass: avatarClassForArea(agent.area) };
}

/** Modal de detalhe de uma task: cabeçalho, payload, resultado/erro e o transcript ao vivo. */
export function TaskDetailModal({ task, agents, onClose }: TaskDetailModalProps) {
  const [detail, setDetail] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  const pollRef = useRef<number | null>(null);
  const logRef = useRef<HTMLPreElement | null>(null);

  const taskId = task?.id ?? null;

  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!taskId) return;
      try {
        const data = await empresaClient.getTask(taskId);
        setDetail(data);
      } catch (err) {
        if (!silent) {
          message.error(err instanceof Error ? err.message : "Falha ao carregar a task");
        }
      }
    },
    [taskId],
  );

  // Busca inicial ao abrir (e limpa o estado ao trocar de task / fechar).
  useEffect(() => {
    setDetail(null);
    if (!taskId) return;
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [taskId, fetchDetail]);

  // Ao vivo: enquanto o modal está aberto e a task roda, poll a cada 3s.
  const isRunning = (detail?.status ?? task?.status) === "running";
  useEffect(() => {
    if (!taskId || !isRunning) return;
    pollRef.current = window.setInterval(() => fetchDetail(true), LIVE_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [taskId, isRunning, fetchDetail]);

  // Auto-scroll pro fim do transcript a cada atualização.
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [detail?.log]);

  const shown = detail ?? task;
  const agent = shown ? agentInfo(shown.agent_slug, agents) : null;
  const pill = shown ? TASK_STATUS_PILL[shown.status] : null;

  return (
    <Modal
      open={task != null}
      onCancel={onClose}
      footer={null}
      width={800}
      title="Detalhe da task"
    >
      {!shown || (loading && !detail) ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <AgentAvatar name={agent?.name ?? "?"} colorClass={agent?.colorClass ?? "bg-gray-400"} />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {agent?.name}
                </span>
                {pill && <StatusPill variant={pill.variant}>{pill.label}</StatusPill>}
              </div>
              <span className="text-xs text-text-secondary truncate">{shown.skill}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-xs text-text-muted">
              trigger: <span className="text-text-secondary">{shown.trigger}</span>
            </span>
            <span className="text-xs text-text-muted">
              custo:{" "}
              <span className="text-text-secondary">
                {shown.cost_usd != null ? formatUsd(shown.cost_usd) : "—"}
              </span>
            </span>
            <span className="text-xs text-text-muted">
              criada: <span className="text-text-secondary">{relative(shown.created_at)}</span>
            </span>
            <span className="text-xs text-text-muted">
              finalizada:{" "}
              <span className="text-text-secondary">{relative(shown.finished_at)}</span>
            </span>
          </div>

          {/* Payload */}
          {shown.payload != null && (
            <Collapse
              size="small"
              items={[
                {
                  key: "payload",
                  label: "Payload",
                  children: (
                    <pre className="text-xs text-text-secondary bg-bg-card border border-border-subtle rounded-lg p-2 m-0 overflow-x-auto">
                      {JSON.stringify(shown.payload, null, 2)}
                    </pre>
                  ),
                },
              ]}
            />
          )}

          {/* Resultado / erro */}
          {shown.status === "done" && shown.result_summary && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-primary">Resultado</span>
              <div className="bg-status-success-bg text-status-success-text rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
                {shown.result_summary}
              </div>
            </div>
          )}
          {shown.status === "failed" && shown.error && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-primary">Erro</span>
              <div className="bg-status-danger-bg text-status-danger-text rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
                {shown.error}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">Transcript</span>
              {isRunning && (
                <span className="text-xs text-status-danger-text animate-pulse select-none">
                  ● ao vivo
                </span>
              )}
            </div>
            <pre
              ref={logRef}
              className="whitespace-pre-wrap bg-gray-900 text-gray-100 text-xs leading-relaxed rounded-lg p-3 m-0 max-h-[360px] overflow-y-auto"
            >
              {detail
                ? (detail.log ?? "Sem transcript ainda.")
                : "Carregando transcript…"}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
