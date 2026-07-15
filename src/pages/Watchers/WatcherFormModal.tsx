import { useEffect, useState } from "react";
import { Button, InputNumber, Modal, Select, message } from "antd";
import watchersClient from "@/lib/clients/watchers";
import type { Watcher } from "@/lib/clients/watchers";
import { productivityClient } from "@/lib/clients/productivity";
import type { ConnectionListItem } from "@/lib/clients/productivity";

interface WatcherFormModalProps {
  open: boolean;
  watcher: Watcher | null;
  onClose: () => void;
  onSaved: () => void;
}

export function WatcherFormModal({ open, watcher, onClose, onSaved }: WatcherFormModalProps) {
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [connectionId, setConnectionId] = useState<string>("");
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const isEdit = !!watcher;

  useEffect(() => {
    if (!open) return;
    // W1 only knows how to check GitHub (`gh search prs`) — Bitbucket
    // connections would just fail every tick, so keep them out of the picker.
    productivityClient
      .listConnections()
      .then((list) => setConnections(list.filter((c) => c.provider === "github")))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setConnectionId(watcher?.connection_id ?? "");
    setIntervalMinutes(watcher?.interval_minutes ?? 10);
  }, [open, watcher]);

  const canSave = !!connectionId && intervalMinutes >= 1;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit && watcher) {
        await watchersClient.updateWatcher(watcher.id, {
          connection_id: connectionId,
          interval_minutes: intervalMinutes,
        });
        message.success("Watcher atualizado");
      } else {
        await watchersClient.createWatcher({
          kind: "github_review_requested",
          connection_id: connectionId,
          interval_minutes: intervalMinutes,
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
      title={isEdit ? "Editar watcher" : "Novo watcher — PRs aguardando review"}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
    >
      <div className="flex flex-col gap-4 pt-2">
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
            PRs onde você é reviewer requisitado nessa org viram review automaticamente
            (a review para em aguardando aprovação antes de publicar).
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
