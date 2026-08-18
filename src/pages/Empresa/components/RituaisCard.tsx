import { useState } from "react";
import { Empty, Modal, Spin, message } from "antd";
import dayjs from "dayjs";
import empresaClient from "@/lib/clients/empresa";
import type { AgentData, RitualData, RitualWeekday, SkillDoc } from "@/lib/clients/empresa";
import { AgentAvatar } from "./AgentAvatar";
import { avatarClassForArea } from "../utils";

interface RituaisCardProps {
  rituais: RitualData[];
  agents: AgentData[];
}

const WEEKDAY_LABEL: Record<RitualWeekday, string> = {
  mon: "Segundas",
  tue: "Terças",
  wed: "Quartas",
  thu: "Quintas",
  fri: "Sextas",
  sat: "Sábados",
  sun: "Domingos",
};

/** Agenda do ritual em português legível: "Segundas · 08:00" ou "Dia 1 do mês · 09:00". */
function scheduleLabel(ritual: RitualData): string {
  if (ritual.weekday) return `${WEEKDAY_LABEL[ritual.weekday]} · ${ritual.time}`;
  if (ritual.day_of_month != null) return `Dia ${ritual.day_of_month} do mês · ${ritual.time}`;
  return ritual.time;
}

function lastFiredLabel(lastFired: string | null): string {
  if (!lastFired) return "nunca";
  return dayjs(lastFired).format("DD/MM");
}

function agentInfo(slug: string, agents: AgentData[]) {
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) return { name: slug, colorClass: "bg-gray-400" };
  return { name: agent.human_name, colorClass: avatarClassForArea(agent.area) };
}

/** Lista compacta dos rituais agendados da empresa (tarefas recorrentes dos agentes). */
export function RituaisCard({ rituais, agents }: RituaisCardProps) {
  const [selected, setSelected] = useState<RitualData | null>(null);
  const [doc, setDoc] = useState<SkillDoc | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const openRitual = async (ritual: RitualData) => {
    setSelected(ritual);
    setDoc(null);
    setDocLoading(true);
    try {
      const skillDoc = await empresaClient.getSkillDoc(ritual.skill);
      setDoc(skillDoc);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Falha ao carregar a skill");
      setSelected(null);
    } finally {
      setDocLoading(false);
    }
  };

  if (rituais.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Nenhum ritual agendado ainda."
      />
    );
  }

  const selectedAgent = selected ? agentInfo(selected.agent_slug, agents) : null;

  return (
    <div className="flex flex-col gap-2">
      {rituais.map((ritual) => {
        const agent = agentInfo(ritual.agent_slug, agents);
        return (
          <div
            key={ritual.name}
            onClick={() => openRitual(ritual)}
            className="flex items-center gap-3 bg-bg-card border border-border-subtle rounded-xl px-3 py-2 cursor-pointer hover:bg-bg-hover transition-colors"
          >
            <AgentAvatar name={agent.name} colorClass={agent.colorClass} size="sm" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-sm font-semibold text-text-primary truncate">
                {ritual.skill}
              </span>
              <span className="text-xs text-text-secondary">{scheduleLabel(ritual)}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-[11px] text-text-muted">último disparo</span>
              <span className="text-xs text-text-secondary">
                {lastFiredLabel(ritual.last_fired)}
              </span>
            </div>
          </div>
        );
      })}

      <Modal
        open={selected != null}
        onCancel={() => setSelected(null)}
        footer={null}
        width={720}
        title={
          selected
            ? `${selected.skill} — ${selectedAgent?.name ?? selected.agent_slug}`
            : undefined
        }
      >
        {docLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary m-0 max-h-[60vh] overflow-y-auto">
            {doc?.content ?? ""}
          </pre>
        )}
      </Modal>
    </div>
  );
}
