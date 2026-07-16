import { useEffect, useState } from "react";
import { Button, InputNumber, Modal, Select, Switch, message } from "antd";
import watchersClient from "@/lib/clients/watchers";
import type { Watcher, WatcherKind } from "@/lib/clients/watchers";
import { productivityClient } from "@/lib/clients/productivity";
import type { ConnectionListItem } from "@/lib/clients/productivity";

interface WatcherFormModalProps {
  open: boolean;
  watcher: Watcher | null;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_OPTIONS = [
  { label: "PRs aguardando minha review", value: "github_review_requested" },
  { label: "Feedback nos meus PRs", value: "github_reviews_received" },
  { label: "Tickets no backlog (fora da sprint)", value: "jira_backlog_assigned" },
];

const DEFAULT_INTERVAL: Record<string, number> = {
  github_review_requested: 10,
  github_reviews_received: 10,
  jira_backlog_assigned: 30,
};

export function WatcherFormModal({ open, watcher, onClose, onSaved }: WatcherFormModalProps) {
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [kind, setKind] = useState<string>("github_review_requested");
  const [connectionId, setConnectionId] = useState<string>("");
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const [autoPublish, setAutoPublish] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const isEdit = !!watcher;
  // github_review_requested is the only kind with an auto-publish choice
  // (comment/request_changes/approve can post unattended); the others always gate.
  const isReviewRequested = kind === "github_review_requested";
  // Both GitHub watchers drive `gh` against a GitHub connection; the backlog
  // watcher hits Jira (any org), so it can use every connection.
  const isGithub = kind === "github_review_requested" || kind === "github_reviews_received";

  useEffect(() => {
    if (!open) return;
    productivityClient
      .listConnections()
      .then((list) =>
        setConnections(isGithub ? list.filter((c) => c.provider === "github") : list),
      )
      .catch(() => {});
  }, [open, isGithub]);

  useEffect(() => {
    if (!open) return;
    const k = watcher?.kind ?? "github_review_requested";
    setKind(k);
    setConnectionId(watcher?.connection_id ?? "");
    setIntervalMinutes(watcher?.interval_minutes ?? DEFAULT_INTERVAL[k] ?? 10);
    setAutoPublish((watcher?.config?.auto_publish as boolean | undefined) ?? true);
  }, [open, watcher]);

  const handleKindChange = (k: string) => {
    setKind(k);
    setConnectionId("");
    setIntervalMinutes(DEFAULT_INTERVAL[k] ?? 10);
  };

  const canSave = !!connectionId && intervalMinutes >= 1;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const config = isReviewRequested ? { auto_publish: autoPublish } : {};
      if (isEdit && watcher) {
        await watchersClient.updateWatcher(watcher.id, {
          connection_id: connectionId,
          interval_minutes: intervalMinutes,
          config: { ...watcher.config, ...config },
        });
        message.success("Watcher atualizado");
      } else {
        await watchersClient.createWatcher({
          kind: kind as WatcherKind,
          connection_id: connectionId,
          interval_minutes: intervalMinutes,
          config,
        });
        message.success("Watcher criado");
      }
      onSaved();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to save watcher");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar watcher" : "Novo watcher"}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Tipo
          </label>
          <Select
            value={kind}
            onChange={handleKindChange}
            disabled={isEdit}
            options={KIND_OPTIONS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Organização
          </label>
          <Select
            placeholder="Selecione a org…"
            value={connectionId || undefined}
            onChange={setConnectionId}
            options={connections.map((c) => ({ label: c.display_name, value: c.id }))}
          />
          <span className="text-xs text-text-muted">
            {kind === "github_review_requested"
              ? "PRs onde você é reviewer requisitado nessa org viram review automaticamente."
              : kind === "github_reviews_received"
                ? "Feedback novo nos seus PRs abertos dessa org vira um run que prepara os fixes e para pra você aprovar antes de commitar/responder."
                : "Tickets atribuídos a você que estão no backlog (fora de qualquer sprint) viram propostas."}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Intervalo (minutos)
          </label>
          <InputNumber
            min={1}
            value={intervalMinutes}
            onChange={(v) => setIntervalMinutes(v ?? 10)}
            style={{ width: "100%" }}
          />
        </div>

        {isReviewRequested && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Publicar sem aprovação
              </label>
              <Switch checked={autoPublish} onChange={setAutoPublish} />
            </div>
            <span className="text-xs text-text-muted">
              {autoPublish
                ? "Comentários e pedidos de mudança são postados sozinhos. Aprovar só sai automático quando o PR está limpo (aberto e sem CHANGES_REQUESTED pendente); senão, para em aguardando aprovação pra você decidir."
                : "Toda review para em aguardando aprovação antes de publicar (fluxo manual clássico)."}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={saving} disabled={!canSave} onClick={handleSubmit}>
            {isEdit ? "Salvar" : "Criar watcher"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
