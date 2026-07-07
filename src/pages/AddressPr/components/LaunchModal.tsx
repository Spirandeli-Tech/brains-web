import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, message } from "antd";
import { CaretRightFilled, GithubOutlined } from "@ant-design/icons";
import addressPrClient from "@/lib/clients/address-pr";
import type { ConnectionListItem } from "@/lib/clients/productivity";

interface LaunchModalProps {
  open: boolean;
  connections: ConnectionListItem[];
  initialPrUrl?: string;
  initialConnectionId?: string;
  onClose: () => void;
  onLaunched: () => void;
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

/** Extract PR number from a PR URL for display. */
function prNumberFromUrl(url: string): string | null {
  const m = url.match(/\/pull(?:-requests)?\/(\d+)/);
  return m ? `#${m[1]}` : null;
}

/** Extract owner/repo slug from a GitHub or Bitbucket PR URL. */
function repoSlugFromUrl(url: string): string | null {
  const ghMatch = url.match(/github\.com\/([^/]+\/[^/]+)\/pull/);
  if (ghMatch) return ghMatch[1];
  const bbMatch = url.match(/bitbucket\.org\/([^/]+\/[^/]+)\/pull/);
  if (bbMatch) return bbMatch[1];
  return null;
}

export function LaunchModal({
  open,
  connections,
  initialPrUrl,
  initialConnectionId,
  onClose,
  onLaunched,
}: LaunchModalProps) {
  const [prUrl, setPrUrl] = useState("");
  const [connectionId, setConnectionId] = useState<string>("");
  const [repoName, setRepoName] = useState<string>("");
  const [repos, setRepos] = useState<{ name: string; base_branch: string }[]>([]);
  const [instructions, setInstructions] = useState("");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPrUrl(initialPrUrl ?? "");
    setConnectionId(initialConnectionId ?? connections[0]?.id ?? "");
    setRepoName("");
    setRepos([]);
    setInstructions("");
  }, [open, initialPrUrl, initialConnectionId, connections]);

  const selectedConnectionName = useMemo(
    () => connections.find((c) => c.id === connectionId)?.display_name ?? "",
    [connectionId, connections],
  );

  // Fetch repos when org changes.
  useEffect(() => {
    if (!selectedConnectionName) return;
    setRepoName("");
    addressPrClient.getConnectionRepos(selectedConnectionName).then((list) => {
      setRepos(list);
      if (list.length === 1) {
        setRepoName(list[0].name);
      } else if (list.length > 1 && prUrl) {
        // Smart pre-selection: match repo slug from URL to repo name.
        const slug = repoSlugFromUrl(prUrl);
        if (slug) {
          const match = list.find(
            (r) =>
              slug.toLowerCase().endsWith(`/${r.name.toLowerCase()}`) ||
              r.name.toLowerCase() === slug.split("/")[1]?.toLowerCase(),
          );
          if (match) setRepoName(match.name);
        }
      }
    }).catch(() => {});
  }, [selectedConnectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart pre-selection when URL changes (after repos are loaded).
  useEffect(() => {
    if (!prUrl || repos.length <= 1) return;
    const slug = repoSlugFromUrl(prUrl);
    if (!slug) return;
    const match = repos.find(
      (r) =>
        slug.toLowerCase().endsWith(`/${r.name.toLowerCase()}`) ||
        r.name.toLowerCase() === slug.split("/")[1]?.toLowerCase(),
    );
    if (match) setRepoName(match.name);
  }, [prUrl, repos]);

  const prNumber = prNumberFromUrl(prUrl);
  const repoRequired = repos.length > 1 && !repoName;
  const canLaunch = !!prUrl.trim() && !!connectionId && !repoRequired;

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setLaunching(true);
    try {
      await addressPrClient.launchRun({
        connection_id: connectionId,
        pr_url: prUrl.trim(),
        repo_name: repoName || undefined,
        instructions: instructions.trim() || undefined,
      });
      message.success("Run iniciado!");
      onLaunched();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to launch run");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Novo Address PR Comments"
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* PR URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            URL do PR
          </label>
          <Input
            placeholder="https://github.com/org/repo/pull/123"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            allowClear
          />
          {prNumber && (
            <span className="text-xs text-text-muted">PR {prNumber} detectado</span>
          )}
        </div>

        {/* Org */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Organização
          </label>
          <Select
            placeholder="Selecione a org…"
            value={connectionId || undefined}
            onChange={setConnectionId}
            options={connections.map((c) => ({ label: c.display_name, value: c.id }))}
            optionRender={(opt) => {
              const conn = connections.find((c) => c.id === opt.value);
              return (
                <span className="flex items-center gap-2">
                  {conn && <ProviderIcon provider={conn.provider} />}
                  {opt.label}
                </span>
              );
            }}
          />
        </div>

        {/* Repo */}
        {repos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Repositório
            </label>
            <Select
              placeholder={repos.length > 1 ? "Selecione o repo…" : undefined}
              value={repoName || undefined}
              onChange={setRepoName}
              options={repos.map((r) => ({ label: r.name, value: r.name }))}
              status={repoRequired ? "error" : undefined}
            />
            {repoRequired && (
              <span className="text-xs text-red-500">Selecione o repositório correto</span>
            )}
          </div>
        )}

        {/* Optional instructions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Escopo (opcional)
          </label>
          <Input.TextArea
            placeholder="Ex.: só o comentário/thread #123, ou foque em segurança…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            icon={<CaretRightFilled />}
            loading={launching}
            disabled={!canLaunch}
            onClick={handleLaunch}
          >
            Iniciar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
