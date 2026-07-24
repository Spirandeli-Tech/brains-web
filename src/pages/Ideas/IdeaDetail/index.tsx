import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Input,
  Segmented,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  MinusCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { CheckState, Idea, IdeaCheck } from "@/lib/clients/content";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  CHECK_STATE_COLOR,
  CHECK_STATE_LABEL,
  FORMAT_LABEL,
  GATE_COLOR,
  GATE_HELP,
  GATE_LABEL,
  IDEA_STATUS_COLOR,
  IDEA_STATUS_LABEL,
  IDEA_TYPE_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  scoreTone,
} from "../../Videos/constants";
import { IdeaFormModal } from "../IdeaFormModal";
import { PromoteModal } from "../PromoteModal";

const STATE_ICON: Record<CheckState, React.ReactNode> = {
  pass: <CheckCircleFilled />,
  partial: <ExclamationCircleFilled />,
  fail: <CloseCircleFilled />,
  unknown: <MinusCircleFilled />,
};

const STATE_OPTIONS: CheckState[] = ["pass", "partial", "fail", "unknown"];

/** Um degrau do stepper. É vertical porque cada check carrega uma nota de texto
 * livre — em horizontal a nota não cabe, e a nota é o que explica o veredito. */
function CheckStep({
  check,
  isLast,
  onChange,
  saving,
}: {
  check: IdeaCheck;
  isLast: boolean;
  onChange: (key: string, patch: { state?: CheckState; note?: string }) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(check.note ?? "");
  const [editing, setEditing] = useState(false);
  const color = CHECK_STATE_COLOR[check.state];

  useEffect(() => {
    setDraft(check.note ?? "");
  }, [check.note]);

  return (
    <div className="flex gap-3">
      {/* Trilha: ícone + linha vertical ligando ao próximo degrau */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-[19px] leading-none mt-0.5" style={{ color }}>
          {STATE_ICON[check.state]}
        </span>
        {!isLast && <span className="w-px flex-1 my-1.5 bg-border-divider" />}
      </div>

      <div className={`flex-1 ${isLast ? "" : "pb-5"}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{check.label}</span>
          <Tag className="!mr-0">{check.rule}</Tag>
          {check.blocking && (
            <Tooltip title="Bloqueante: se reprovar, a ideia é barrada mesmo com score alto">
              <Tag color="red" className="!mr-0">
                bloqueante
              </Tag>
            </Tooltip>
          )}
          {check.derived && (
            <Tooltip title="Derivado do campo 'Fact-check passed' da ideia — não se edita aqui, pra não existirem duas fontes do mesmo fato">
              <Tag icon={<LockOutlined />} className="!mr-0">
                derivado
              </Tag>
            </Tooltip>
          )}
        </div>

        <p className="text-xs text-text-muted mt-1 mb-2">{check.help}</p>

        {check.derived ? (
          <Tag color={check.state === "pass" ? "green" : "red"}>
            {CHECK_STATE_LABEL[check.state]}
          </Tag>
        ) : (
          <Segmented
            size="small"
            value={check.state}
            disabled={saving}
            onChange={(value) => onChange(check.key, { state: value as CheckState })}
            options={STATE_OPTIONS.map((s) => ({
              value: s,
              label: CHECK_STATE_LABEL[s],
            }))}
          />
        )}

        <div className="mt-2">
          {editing && !check.derived ? (
            <div className="flex flex-col gap-1.5">
              <Input.TextArea
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Por que este veredito? Registre a evidência — canal · título · views, ou a frase que prova o ângulo."
              />
              <div className="flex gap-2">
                <Button
                  size="small"
                  type="primary"
                  loading={saving}
                  onClick={() => {
                    onChange(check.key, { note: draft });
                    setEditing(false);
                  }}
                >
                  Salvar nota
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setDraft(check.note ?? "");
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={check.derived ? "" : "cursor-pointer group"}
              onClick={() => !check.derived && setEditing(true)}
            >
              {check.note ? (
                <p className="text-xs whitespace-pre-wrap m-0 text-text-secondary bg-bg-hover rounded p-2 max-h-40 overflow-auto">
                  {check.note}
                </p>
              ) : (
                <p className="text-xs italic m-0 text-text-muted">
                  {check.derived
                    ? "Sem notas de checagem."
                    : "Sem nota — clique para registrar a evidência."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ideas = await contentClient.listIdeas();
      const found = ideas.find((item) => item.id === id) ?? null;
      setIdea(found);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load idea");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Manda só o check tocado. O servidor faz merge, então dois vereditos
   * salvos em sequência não sobrescrevem um ao outro. */
  const handleCheckChange = async (
    key: string,
    patch: { state?: CheckState; note?: string },
  ) => {
    if (!idea) return;
    const current = idea.checks.find((c) => c.key === key);
    setSaving(true);
    try {
      await contentClient.updateIdea(idea.id, {
        checks: {
          [key]: {
            state: patch.state ?? (current?.state as CheckState),
            note: patch.note ?? current?.note ?? null,
          },
        },
      });
      void load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !idea) {
    return (
      <div className="flex justify-center py-20">
        <Spin />
      </div>
    );
  }
  if (!idea) return <Empty description="Idea not found" />;

  const blocked = idea.gate === "rejected";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={idea.title}
        subtitle={idea.slug}
        actions={
          <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/content/ideas")}>
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Tooltip
              title={
                blocked
                  ? "Um check bloqueante reprovou — resolva antes de promover"
                  : "Cria a linha no calendário a partir desta ideia"
              }
            >
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                disabled={blocked}
                onClick={() => setPromoteOpen(true)}
              >
                Promote to video
              </Button>
            </Tooltip>
          </div>
        }
      />

      {/* Placar: o gate primeiro, o número depois — é o gate que decide. */}
      <DataCard>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-text-muted">SCORE</span>
            <span
              className="text-[34px] font-bold leading-none"
              style={{ color: scoreTone(idea.score) }}
            >
              {idea.score}
              <span className="text-base font-medium">%</span>
            </span>
          </div>

          <div className="h-10 w-px bg-border-divider" />

          <div className="flex flex-col gap-1">
            <Tag color={GATE_COLOR[idea.gate]} className="!mr-0 w-fit">
              {GATE_LABEL[idea.gate]}
            </Tag>
            <span className="text-xs text-text-muted max-w-xl">{GATE_HELP[idea.gate]}</span>
          </div>

          <div className="flex gap-1.5 ml-auto">
            {idea.checks.map((check) => (
              <Tooltip
                key={check.key}
                title={`${check.label}: ${CHECK_STATE_LABEL[check.state]}`}
              >
                <span
                  className="w-2.5 h-8 rounded-sm"
                  style={{ background: CHECK_STATE_COLOR[check.state] }}
                />
              </Tooltip>
            ))}
          </div>
        </div>

        {blocked && (
          <Alert
            className="mt-3"
            type="error"
            showIcon
            message="Bloqueada pelo filtro de tema"
            description={
              <>
                Reprovou em <b>{idea.blocking_failed.join(", ")}</b>. O
                {" "}<code>principios-video.md</code> trata o filtro de tema como eliminatório —
                sim nas três ou não grava. Promover está desabilitado até resolver.
              </>
            }
          />
        )}
      </DataCard>

      <DataCard>
        <p className="text-xs font-semibold text-text-muted mb-4">
          CHECKS — cada um cobra uma regra que já existe no principios-video.md ou na persona
        </p>
        <div className="flex flex-col">
          {idea.checks.map((check, index) => (
            <CheckStep
              key={check.key}
              check={check}
              isLast={index === idea.checks.length - 1}
              onChange={handleCheckChange}
              saving={saving}
            />
          ))}
        </div>
      </DataCard>

      <DataCard>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Format">
            {FORMAT_LABEL[idea.format] ?? idea.format}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            {idea.type ? (IDEA_TYPE_LABEL[idea.type] ?? idea.type) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={PRIORITY_COLOR[idea.priority]}>
              {PRIORITY_LABEL[idea.priority] ?? idea.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={IDEA_STATUS_COLOR[idea.status]}>{IDEA_STATUS_LABEL[idea.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Videos from this idea">
            {idea.video_count > 0 ? (
              <a onClick={() => navigate("/content/videos")}>{idea.video_count}</a>
            ) : (
              <span className="text-text-muted">Nenhum ainda</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Source">
            {idea.source === "buscar-trends" ? "/buscar-trends" : "manual"}
          </Descriptions.Item>
          <Descriptions.Item label="Hook" span={2}>
            {idea.hook || <span className="text-text-muted">—</span>}
          </Descriptions.Item>
          <Descriptions.Item label="Why now" span={2}>
            <span className="whitespace-pre-wrap">
              {idea.why_now || <span className="text-text-muted">—</span>}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Visual refs" span={2}>
            <span className="whitespace-pre-wrap">
              {idea.visual_refs || <span className="text-text-muted">—</span>}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(idea.created_at).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {dayjs(idea.updated_at).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        </Descriptions>
      </DataCard>

      <IdeaFormModal
        open={editOpen}
        idea={idea}
        onClose={() => setEditOpen(false)}
        onSuccess={() => void load()}
      />
      <PromoteModal
        open={promoteOpen}
        idea={idea}
        onClose={() => setPromoteOpen(false)}
        onSuccess={(videoId) => navigate(`/content/videos/${videoId}`)}
      />
    </div>
  );
}
