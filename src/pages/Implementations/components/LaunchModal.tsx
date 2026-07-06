import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Segmented, Select, message } from "antd";
import {
  CaretRightFilled,
  CheckOutlined,
  GithubOutlined,
  LockFilled,
  MessageOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import implementationsClient, {
  STEP_CATALOG,
} from "@/lib/clients/implementations";
import type { StepDefinition, StepKind } from "@/lib/clients/implementations";
import type { RepoInfo } from "@/lib/clients/implementations/types";
import type { ConnectionListItem } from "@/lib/clients/productivity";

interface LaunchModalProps {
  open: boolean;
  connections: ConnectionListItem[];
  initialTicketUrl?: string;
  initialConnectionId?: string;
  onClose: () => void;
  onLaunched: () => void;
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

const DEFAULT_STEPS: StepKind[] = STEP_CATALOG.filter((d) => d.defaultEnabled).map((d) => d.kind);
const RESEARCH_DEF = STEP_CATALOG.find((d) => d.kind === "research")!;

/** Quiet uppercase divider that groups the dialog into its two acts. */
function Eyebrow({ label, meta }: { label: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</span>
      <span className="h-px flex-1 bg-border-divider" />
      {meta && <span className="text-[11px] font-semibold text-text-muted">{meta}</span>}
    </div>
  );
}

export function LaunchModal({
  open,
  connections,
  initialTicketUrl,
  initialConnectionId,
  onClose,
  onLaunched,
}: LaunchModalProps) {
  const [ticketUrl, setTicketUrl] = useState("");
  const [connectionId, setConnectionId] = useState<string>("");
  // Holds one repo for single-select orgs, or several for Ecointeractive's
  // multi-select (a ticket can touch more than one of its ~15 repos at once).
  const [repoNames, setRepoNames] = useState<string[]>([]);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [baseBranch, setBaseBranch] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [selectedSteps, setSelectedSteps] = useState<StepKind[]>(DEFAULT_STEPS);
  const [researchMode, setResearchMode] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTicketUrl(initialTicketUrl ?? "");
    setConnectionId(initialConnectionId ?? connections[0]?.id ?? "");
    setRepoNames([]);
    setRepos([]);
    setBaseBranch("");
    setInstructions("");
    setSelectedSteps(DEFAULT_STEPS);
    setResearchMode(false);
  }, [open, initialTicketUrl, initialConnectionId, connections]);

  // Stable name for the selected connection — changes only when the user picks a different org.
  const selectedConnectionName = useMemo(
    () => connections.find((c) => c.id === connectionId)?.display_name ?? "",
    [connectionId, connections],
  );

  // Ecointeractive cascades PRs from the ticket's Fix Version and may touch
  // several of its repos in one run — everyone else keeps the single-repo,
  // single-branch flow.
  const isCascadeOrg = selectedConnectionName === "ECOINTERACTIVE LLC";

  // Fetch repos when the selected org changes. Using the resolved name (not the
  // connections array reference) prevents the effect from firing on every parent
  // re-render and overwriting any base-branch the user already typed.
  useEffect(() => {
    if (!selectedConnectionName) return;
    setRepoNames([]);
    setBaseBranch("");
    implementationsClient.getConnectionRepos(selectedConnectionName).then((list) => {
      setRepos(list);
      if (list.length === 1) {
        setRepoNames([list[0].name]);
        setBaseBranch(list[0].base_branch);
      }
    });
  }, [selectedConnectionName]);

  // Single-select: pre-fill base branch from the chosen repo's default.
  const handleRepoChange = (name: string) => {
    setRepoNames([name]);
    const repo = repos.find((r) => r.name === name);
    if (repo) setBaseBranch(repo.base_branch);
  };

  const ticketKey = useMemo(() => {
    const m = ticketUrl.match(/([A-Z][A-Z0-9]+-\d+)/);
    return m ? m[1] : null;
  }, [ticketUrl]);

  const toggleStep = (kind: StepKind, checked: boolean) => {
    setSelectedSteps((prev) =>
      checked ? [...prev, kind] : prev.filter((k) => k !== kind),
    );
  };

  // The rail mirrors execution order. `research` is never a free-standing toggle —
  // it's driven by Mode and injected right before Implement, exactly as the launch
  // payload below does, so what you compose is what the runner runs.
  const railSteps = useMemo<StepDefinition[]>(
    () =>
      STEP_CATALOG.flatMap((def) => {
        if (def.kind === "research") return [];
        if (def.kind === "implement" && researchMode) return [RESEARCH_DEF, def];
        return [def];
      }),
    [researchMode],
  );

  const isOn = (def: StepDefinition) =>
    def.kind === "research" ? researchMode : selectedSteps.includes(def.kind);

  const onSteps = railSteps.filter(isOn);
  const runCount = onSteps.length;
  const gateCount = onSteps.filter((d) => d.sensitive).length;

  const canLaunch = !!ticketUrl.trim() && !!connectionId && selectedSteps.length > 0 && (repos.length === 0 || repoNames.length > 0);

  const handleLaunch = async () => {
    if (!canLaunch) return;
    const conn = connections.find((c) => c.id === connectionId);
    setLaunching(true);
    try {
      await implementationsClient.launchRun(
        {
          connection_id: connectionId,
          ticket_url: ticketUrl.trim(),
          // Preserve canonical execution order; inject research before implement when enabled.
          steps: STEP_CATALOG
            .filter((d) => d.kind !== "research" && selectedSteps.includes(d.kind))
            .flatMap((d) =>
              d.kind === "implement" && researchMode ? ["research" as StepKind, d.kind] : [d.kind]
            ),
          instructions: instructions.trim() || undefined,
          ...(isCascadeOrg
            ? { repo_names: repoNames.length ? repoNames : undefined }
            : { repo_name: repoNames[0] || undefined }),
          base_branch: baseBranch.trim() || undefined,
        },
        conn ? { connection_name: conn.display_name, provider: conn.provider } : undefined,
      );
      message.success(`Pipeline started${ticketKey ? ` for ${ticketKey}` : ""}`);
      onLaunched();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to start pipeline");
    } finally {
      setLaunching(false);
    }
  };

  const gateWord =
    gateCount === 0 ? "never" : gateCount === 1 ? "once" : gateCount === 2 ? "twice" : `${gateCount} times`;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={580}
      destroyOnClose
      title={
        <div>
          <div className="text-[18px] font-semibold text-text-primary leading-tight">New implementation</div>
          <div className="text-[13px] font-normal text-text-muted mt-1">
            Point Claude at a ticket and choose how far it runs on its own.
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12.5px] text-text-muted">
            Runs <b className="font-semibold text-text-secondary">{runCount} step{runCount === 1 ? "" : "s"}</b>
            {gateCount === 0 ? (
              " · no approval stops."
            ) : (
              <>
                {" · pauses "}
                <span className="font-semibold text-status-warning-text">{gateWord}</span>
                {" for your approval."}
              </>
            )}
          </div>
          <div className="flex gap-2.5">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<CaretRightFilled />}
              loading={launching}
              disabled={!canLaunch}
              onClick={handleLaunch}
            >
              {ticketKey ? `Run ${ticketKey}` : "Run pipeline"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="mt-4">
        {/* Act 1 — the brief: what to build */}
        <section className="mb-6">
          <Eyebrow label="The brief" />

          <div className="mb-3.5">
            <label className="text-[13px] font-semibold text-text-primary block mb-1.5">Ticket</label>
            <Input
              placeholder="https://your-org.atlassian.net/browse/PROJ-123"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              suffix={
                ticketKey ? (
                  <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-brand-primary-soft text-brand-primary-hover border border-brand-primary/20 font-mono text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    {ticketKey}
                  </span>
                ) : (
                  <span />
                )
              }
            />
          </div>

          <div className="mb-3.5">
            <label className="text-[13px] font-semibold text-text-primary block mb-1.5">Organization</label>
            <Select
              className="w-full"
              placeholder="Select an organization"
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

          {repos.length > 0 && (
            <div className="mb-3.5">
              <label className="text-[13px] font-semibold text-text-primary block mb-1.5">
                {isCascadeOrg ? "Repositories" : "Repository"}
              </label>
              {isCascadeOrg ? (
                <Select
                  mode="multiple"
                  className="w-full"
                  placeholder="Select one or more repositories"
                  value={repoNames}
                  onChange={setRepoNames}
                  options={repos.map((r) => ({ label: r.name, value: r.name }))}
                />
              ) : (
                <Select
                  className="w-full"
                  placeholder="Select a repository"
                  value={repoNames[0] || undefined}
                  onChange={handleRepoChange}
                  options={repos.map((r) => ({
                    label: r.name,
                    value: r.name,
                    description: r.base_branch,
                  }))}
                  optionRender={(opt) => (
                    <span className="flex items-center justify-between gap-2">
                      <span>{opt.label}</span>
                      <span className="text-xs text-text-muted font-mono">
                        {repos.find((r) => r.name === opt.value)?.base_branch}
                      </span>
                    </span>
                  )}
                />
              )}
              {isCascadeOrg && repoNames.length > 1 && (
                <p className="text-xs text-text-muted m-0 mt-1">
                  Implement, Open PR, Code review and Address feedback run once per
                  selected repo ({repoNames.length}× repos → {repoNames.length}× those steps).
                </p>
              )}
            </div>
          )}

          <div className="mb-3.5">
            <label className="text-[13px] font-semibold text-text-primary block mb-1.5">
              Base branch
            </label>
            <Input
              placeholder={isCascadeOrg ? "auto — from the ticket's Fix Version" : "main"}
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
            />
            <p className="text-xs text-text-muted m-0 mt-1">
              {isCascadeOrg
                ? "Ecointeractive cascades PRs down the environment chain from the ticket's Fix Version (uat → staging → qa → development). Leave blank to auto-detect, or type a starting environment to override."
                : "The branch to create the feature off of and open the PR against."}
            </p>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-text-primary block mb-1.5">
              Instructions <span className="text-text-muted font-normal">— optional</span>
            </label>
            <Input.TextArea
              placeholder="Extra context for Claude on top of the ticket — constraints, the pattern to follow, what to avoid…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={4000}
              showCount
            />
            <p className="text-xs text-text-muted m-0 mt-1">
              Layered on top of the ticket before Claude starts.
            </p>
          </div>
        </section>

        {/* Act 2 — the pipeline: how far it runs alone */}
        <section>
          <Eyebrow
            label="The pipeline"
            meta={
              <>
                <b className="text-text-secondary font-semibold">{runCount}</b> steps ·{" "}
                <span className="text-status-warning-text">
                  {gateCount} gate{gateCount === 1 ? "" : "s"}
                </span>
              </>
            }
          />

          <div className="mb-4">
            <Segmented
              block
              value={researchMode ? "research" : "direct"}
              onChange={(v) => setResearchMode(v === "research")}
              options={[
                {
                  value: "direct",
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <ThunderboltOutlined />
                      Implement directly
                    </span>
                  ),
                },
                {
                  value: "research",
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <MessageOutlined />
                      Research first
                    </span>
                  ),
                },
              ]}
            />
            <p className="text-xs text-text-muted m-0 mt-2 px-0.5">
              {researchMode
                ? "Claude asks clarifying questions first — a Research gate is added before Implement."
                : "Claude reads the ticket and starts coding right away."}
            </p>
          </div>

          {/* The rail — compose the same track you'll watch the run travel down. */}
          <div className="flex flex-col">
            {(() => {
              let order = 0;
              return railSteps.map((def, i) => {
                const on = isOn(def);
                if (on) order += 1;
                const prev = railSteps[i - 1];
                const prevOn = prev ? isOn(prev) : false;
                const gate = def.sensitive;
                const togglable = def.kind !== "research";

                // Connector bridges this node up to the previous one; its color
                // traces the live route the runner will actually take.
                let connectorStyle: React.CSSProperties = { background: "#E6EAF0" };
                if (i > 0 && on && prevOn) {
                  connectorStyle = gate
                    ? { background: "repeating-linear-gradient(to bottom,#F2D49B 0 4px,transparent 4px 7px)" }
                    : { background: "#C9DBFF" };
                }

                const nodeStyle: React.CSSProperties = on
                  ? gate
                    ? { background: "#B45309", borderColor: "#B45309", color: "#fff", boxShadow: "0 0 0 4px rgba(180,83,9,.12)" }
                    : { background: "#2563EB", borderColor: "#2563EB", color: "#fff", boxShadow: "0 0 0 4px rgba(37,99,235,.10)" }
                  : { background: "#fff", borderColor: "#D6DCE5", color: "transparent" };

                const toggle = togglable ? () => toggleStep(def.kind, !on) : undefined;

                return (
                  <div
                    key={def.kind}
                    role={togglable ? "checkbox" : undefined}
                    aria-checked={togglable ? on : undefined}
                    aria-disabled={!togglable || undefined}
                    tabIndex={togglable ? 0 : undefined}
                    onClick={toggle}
                    onKeyDown={
                      togglable
                        ? (e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              toggle?.();
                            }
                          }
                        : undefined
                    }
                    className={`grid grid-cols-[28px_1fr] gap-3 rounded-[10px] py-[9px] pl-1 pr-2.5 outline-none transition-colors ${
                      togglable ? "cursor-pointer hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand-primary" : ""
                    }`}
                  >
                    {/* node + connector */}
                    <div className="relative flex justify-center">
                      {i > 0 && (
                        <span
                          className="absolute left-1/2 -translate-x-1/2 w-0.5"
                          style={{ top: -9, height: 18, ...connectorStyle }}
                        />
                      )}
                      <span
                        className="relative z-[1] mt-px grid h-5 w-5 place-items-center rounded-full border-[1.5px] transition-all"
                        style={nodeStyle}
                      >
                        {on && (gate ? <LockFilled className="text-[9px]" /> : <CheckOutlined className="text-[10px]" />)}
                      </span>
                    </div>

                    {/* content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm leading-tight ${
                            on ? "font-semibold text-text-primary" : "font-medium text-text-muted"
                          }`}
                        >
                          {def.label}
                        </span>
                        {gate && (
                          <span
                            className={`inline-flex items-center h-[19px] px-2 rounded-full bg-status-warning-bg text-status-warning-text border border-[#F2D49B] text-[10.5px] font-semibold ${
                              on ? "" : "opacity-50"
                            }`}
                          >
                            pauses for you
                          </span>
                        )}
                        {on && (
                          <span className="ml-auto font-mono text-[11px] text-text-disabled tabular-nums pl-2">
                            {String(order).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs m-0 mt-0.5 leading-snug ${on ? "text-text-muted" : "text-text-disabled"}`}>
                        {def.description}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      </div>
    </Modal>
  );
}
