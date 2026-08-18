import { useMemo } from "react";
import { Empty } from "antd";
import type { AgentData } from "@/lib/clients/empresa";
import { StatusPill } from "@/components/atoms";
import { AgentAvatar } from "./AgentAvatar";
import {
  INVESTOR_AVATAR_CLASS,
  INVESTOR_SLUG,
  avatarClassForArea,
  borderClassForArea,
  formatUsd,
} from "../utils";

interface OrgChartProps {
  agents: AgentData[];
}

function agentStatusPill(agent: AgentData) {
  if (agent.status === "running") {
    return (
      <StatusPill variant="success">
        rodando{agent.current_skill ? `: ${agent.current_skill}` : ""}
      </StatusPill>
    );
  }
  if (agent.status === "queued") {
    return <StatusPill variant="warning">{agent.queued_count} na fila</StatusPill>;
  }
  return <StatusPill variant="default">disponível</StatusPill>;
}

function AgentCard({ agent }: { agent: AgentData }) {
  const isRunning = agent.status === "running";
  const borderClass = isRunning
    ? `border-2 ${borderClassForArea(agent.area)} shadow-md`
    : "border border-border-subtle shadow-card";
  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 bg-bg-card ${borderClass} rounded-xl px-4 py-3 w-44`}
    >
      {isRunning && (
        <span
          className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full animate-pulse ${avatarClassForArea(agent.area)}`}
        />
      )}
      <AgentAvatar name={agent.human_name} colorClass={avatarClassForArea(agent.area)} />
      <div className="text-sm font-bold text-text-primary text-center leading-tight">
        {agent.human_name}
      </div>
      <div className="text-xs text-text-secondary text-center leading-tight">{agent.role}</div>
      {agentStatusPill(agent)}
      {isRunning && agent.current_task_detail && (
        <div
          className="text-xs text-text-secondary text-center leading-tight line-clamp-2"
          title={agent.current_task_detail}
        >
          {agent.current_task_detail}
        </div>
      )}
      {agent.total_cost_usd > 0 && (
        <div className="text-[11px] text-text-muted">{formatUsd(agent.total_cost_usd)}</div>
      )}
    </div>
  );
}

function LevelConnector() {
  return <div className="w-px h-4 bg-border-subtle mx-auto" />;
}

/** Organograma montado dinamicamente pelo campo reports_to. */
export function OrgChart({ agents }: OrgChartProps) {
  const { ceos, cLevels, operators } = useMemo(() => {
    const ceoAgents = agents.filter((a) => a.reports_to === INVESTOR_SLUG);
    const ceoSlugs = new Set(ceoAgents.map((a) => a.slug));
    const cLevelAgents = agents.filter(
      (a) => a.reports_to !== null && ceoSlugs.has(a.reports_to),
    );
    const placed = new Set([...ceoAgents, ...cLevelAgents].map((a) => a.slug));
    const operatorAgents = agents.filter((a) => !placed.has(a.slug));
    return { ceos: ceoAgents, cLevels: cLevelAgents, operators: operatorAgents };
  }, [agents]);

  if (agents.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Nenhum agente cadastrado ainda."
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Investidor — não é um agente, é a diretriz vinculante da empresa */}
      <div className="flex flex-col items-center gap-1.5 bg-bg-card border border-border-subtle rounded-xl shadow-card px-4 py-3 w-44">
        <AgentAvatar name="Lucas" colorClass={INVESTOR_AVATAR_CLASS} />
        <div className="text-sm font-bold text-text-primary text-center leading-tight">Lucas</div>
        <div className="text-xs text-text-secondary text-center leading-tight">Investidor</div>
        <StatusPill variant="info">diretriz vinculante</StatusPill>
      </div>

      {ceos.length > 0 && (
        <>
          <LevelConnector />
          <div className="flex flex-wrap justify-center gap-3">
            {ceos.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        </>
      )}

      {cLevels.length > 0 && (
        <>
          <LevelConnector />
          <div className="flex flex-wrap justify-center gap-3">
            {cLevels.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        </>
      )}

      {operators.length > 0 && (
        <>
          <LevelConnector />
          <div className="flex flex-wrap justify-center gap-3">
            {operators.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
