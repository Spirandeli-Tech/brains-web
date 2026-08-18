import { useState } from "react";
import { Button, Empty, Input } from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { AgentData, MessageData } from "@/lib/clients/empresa";
import { AgentAvatar } from "./AgentAvatar";
import {
  INVESTOR_AVATAR_CLASS,
  INVESTOR_SLUG,
  avatarClassForArea,
  relative,
} from "../utils";

interface CompanyFeedProps {
  messages: MessageData[];
  agents: AgentData[];
  sending: boolean;
  /** Envia a mensagem pro CEO; resolve true quando deu certo. */
  onSend: (body: string) => Promise<boolean>;
}

function senderInfo(slug: string, agents: AgentData[]) {
  if (slug === INVESTOR_SLUG) {
    return { name: "Lucas (investidor)", colorClass: INVESTOR_AVATAR_CLASS };
  }
  const agent = agents.find((a) => a.slug === slug);
  if (!agent) return { name: slug, colorClass: "bg-gray-400" };
  return { name: agent.human_name, colorClass: avatarClassForArea(agent.area) };
}

export function CompanyFeed({ messages, agents, sending, onSend }: CompanyFeedProps) {
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    const ok = await onSend(body);
    if (ok) setDraft("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Composer — canal único: toda mensagem do investidor vai pro CEO */}
      <div className="flex flex-col gap-2">
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva sua diretriz ou pergunta — a mensagem vai direto pro CEO (canal único da empresa)…"
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={sending}
        />
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!draft.trim()}
          >
            Enviar ao CEO
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Nenhuma mensagem ainda. Mande a primeira diretriz pro CEO."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const sender = senderInfo(msg.from_agent, agents);
            return (
              <div key={msg.id} className="flex gap-3">
                <AgentAvatar name={sender.name} colorClass={sender.colorClass} size="sm" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">
                      {sender.name}
                    </span>
                    {msg.to_agent && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">
                        → @{msg.to_agent}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">{relative(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words m-0">
                    {msg.body}
                  </p>
                  {msg.artifact_url && (
                    <a
                      href={msg.artifact_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs w-fit"
                    >
                      artefato
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
