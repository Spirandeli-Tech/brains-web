import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Checkbox, Form, Input, Modal, Select, Spin, Tag, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, SafetyCertificateOutlined, SearchOutlined } from "@ant-design/icons";
import { contractsClient } from "@/lib/clients/contracts";
import type { ContractListItem } from "@/lib/clients/contracts";
import { productivityClient } from "@/lib/clients/productivity";
import type { ConnectionData, OrganizationInfo } from "@/lib/clients/productivity";

const PROVIDER_OPTIONS = [
  { label: "GitHub", value: "github" },
  { label: "Bitbucket", value: "bitbucket" },
];

interface ConnectionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  connection?: ConnectionData | null;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-text-primary mb-3 mt-0">{title}</h4>
      {children}
    </div>
  );
}

function OrgOption({ org }: { org: OrganizationInfo }) {
  return (
    <div className="flex items-center gap-2">
      {org.avatar_url ? (
        <Avatar src={org.avatar_url} size={20} shape="square" />
      ) : (
        <Avatar size={20} shape="square">{org.slug[0]?.toUpperCase()}</Avatar>
      )}
      <span className="font-medium">{org.slug}</span>
      {org.description && (
        <span className="text-text-muted text-xs truncate">— {org.description}</span>
      )}
    </div>
  );
}

function repoName(fullPath: string) {
  return fullPath.split("/").pop() || fullPath;
}

export function ConnectionModal({ open, onClose, onSuccess, connection }: ConnectionModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [availableRepos, setAvailableRepos] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [repoSearch, setRepoSearch] = useState("");

  const provider = Form.useWatch("provider", form);
  const pat = Form.useWatch("pat", form);
  const username = Form.useWatch("username", form);
  const workspace = Form.useWatch("workspace", form);
  const contractId = Form.useWatch("contract_id", form);

  const canValidate = !!provider && !!pat && pat.length >= 5 && !!username;
  const isEditing = !!connection;

  // Reset everything when modal opens
  useEffect(() => {
    if (!open) return;

    contractsClient.listContracts().then(setContracts).catch(() => {});
    setOrganizations([]);
    setTokenValid(null);
    setAvailableRepos([]);
    setSelectedRepos([]);
    setRepoSearch("");

    if (connection) {
      form.setFieldsValue({
        provider: connection.provider,
        username: connection.username,
        workspace: connection.workspace,
        contract_id: connection.contract_id,
        custom_name: connection.custom_name,
        is_primary: connection.is_primary,
      });
      setSelectedRepos(connection.selected_repos || []);
    } else {
      form.resetFields();
      form.setFieldValue("provider", "github");
      form.setFieldValue("is_primary", false);
    }
  }, [open, connection, form]);

  const handleValidate = useCallback(async () => {
    if (!canValidate) return;

    setValidatingToken(true);
    setTokenValid(null);
    setOrganizations([]);

    try {
      const result = await productivityClient.validateToken({
        provider: provider as "github" | "bitbucket",
        pat,
        username,
      });
      setTokenValid(result.valid);
      if (result.valid) {
        setOrganizations(result.organizations);
        const label = provider === "bitbucket" ? "workspace" : "organization";
        message.success(`Token valid — ${result.organizations.length} ${label}(s) found`);
      } else {
        message.error("Invalid token. Check your PAT and username.");
      }
    } catch {
      setTokenValid(false);
      message.error("Failed to validate token");
    } finally {
      setValidatingToken(false);
    }
  }, [canValidate, provider, pat, username]);

  const fetchRepos = useCallback(async (ws: string) => {
    if (!provider || !pat || !username) return;

    setLoadingRepos(true);
    try {
      const repos = await productivityClient.listRepos({
        provider: provider as "github" | "bitbucket",
        pat,
        username,
        workspace: ws || undefined,
      });
      setAvailableRepos(repos);
      // On create, select all by default
      if (!connection) {
        setSelectedRepos(repos);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load repositories";
      message.error({ content: msg, duration: 10 });
    } finally {
      setLoadingRepos(false);
    }
  }, [provider, pat, username, connection]);

  const fetchConnectionRepos = useCallback(async () => {
    if (!connection) return;
    setLoadingRepos(true);
    try {
      const repos = await productivityClient.listConnectionRepos(connection.id);
      setAvailableRepos(repos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load repositories";
      message.error({ content: msg, duration: 10 });
    } finally {
      setLoadingRepos(false);
    }
  }, [connection]);

  // Fetch repos when workspace changes after validation
  useEffect(() => {
    if (tokenValid && workspace) {
      fetchRepos(workspace);
    }
  }, [workspace, tokenValid, fetchRepos]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (connection) {
        const payload: Record<string, unknown> = {};
        if (values.pat) payload.pat = values.pat;
        if (values.username !== connection.username) payload.username = values.username;
        if (values.workspace !== connection.workspace) payload.workspace = values.workspace || null;
        if (values.contract_id !== connection.contract_id) payload.contract_id = values.contract_id || null;
        if (values.custom_name !== connection.custom_name) payload.custom_name = values.custom_name || null;
        if (!!values.is_primary !== connection.is_primary) payload.is_primary = !!values.is_primary;
        payload.selected_repos = selectedRepos;
        await productivityClient.updateConnection(connection.id, payload);
        message.success("Connection updated");
      } else {
        await productivityClient.createConnection({
          provider: values.provider,
          pat: values.pat,
          username: values.username,
          workspace: values.workspace || undefined,
          contract_id: values.contract_id || undefined,
          custom_name: values.custom_name || undefined,
          selected_repos: selectedRepos,
          is_primary: !!values.is_primary,
        });
        message.success("Connection created");
      }

      onSuccess();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      message.error(error instanceof Error ? error.message : "Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  const workspaceLabel = provider === "bitbucket" ? "Workspace" : "Organization";

  const removeRepo = (repo: string) => {
    setSelectedRepos((prev) => prev.filter((r) => r !== repo));
  };

  const toggleRepo = (repo: string, checked: boolean) => {
    setSelectedRepos((prev) =>
      checked ? [...prev, repo] : prev.filter((r) => r !== repo)
    );
  };

  const toggleAllRepos = (checked: boolean) => {
    setSelectedRepos(checked ? [...availableRepos] : []);
  };

  // Build the sorted + filtered repo list for the checkbox section
  const sortedRepos = [...availableRepos].sort((a, b) =>
    repoName(a).localeCompare(repoName(b))
  );
  const filteredRepos = repoSearch
    ? sortedRepos.filter((r) => r.toLowerCase().includes(repoSearch.toLowerCase()))
    : sortedRepos;

  const showRepoSection = availableRepos.length > 0 || selectedRepos.length > 0;

  return (
    <Modal
      title={isEditing ? "Edit Connection" : "New Connection"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? "Save" : "Create Connection"}
      confirmLoading={saving}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <FormSection title="Provider">
          <Form.Item name="provider" rules={[{ required: true, message: "Select a provider" }]}>
            <Select options={PROVIDER_OPTIONS} disabled={isEditing} />
          </Form.Item>
        </FormSection>

        <FormSection title="Authentication">
          <Form.Item
            name="pat"
            label="Personal Access Token"
            rules={isEditing ? [] : [{ required: true, message: "Enter your PAT" }]}
          >
            <Input.Password
              placeholder={isEditing ? "Leave empty to keep current token" : "Enter your personal access token"}
            />
          </Form.Item>

          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Enter your username" }]}>
            <Input placeholder="Your GitHub/Bitbucket username" />
          </Form.Item>

          <div className="flex items-center gap-3 mb-4">
            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={handleValidate}
              loading={validatingToken}
              disabled={!canValidate}
            >
              Validate Connection
            </Button>
            {tokenValid === true && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Valid</Tag>
            )}
            {tokenValid === false && (
              <Tag color="error" icon={<CloseCircleOutlined />}>Invalid</Tag>
            )}
          </div>

          <Form.Item name="workspace" label={workspaceLabel}>
            <Select
              allowClear
              showSearch
              placeholder={
                validatingToken
                  ? "Loading..."
                  : organizations.length > 0
                    ? `Select ${workspaceLabel.toLowerCase()}`
                    : isEditing
                      ? workspace || "Validate to change"
                      : "Validate connection to load options"
              }
              loading={validatingToken}
              disabled={validatingToken || (organizations.length === 0 && !isEditing)}
              options={organizations.map((org) => ({
                label: org.slug,
                value: org.slug,
              }))}
              optionRender={(option) => {
                const org = organizations.find((o) => o.slug === option.value);
                return org ? <OrgOption org={org} /> : option.label;
              }}
            />
          </Form.Item>
        </FormSection>

        {showRepoSection && (
          <FormSection title={`Repositories (${selectedRepos.length} selected)`}>
            {/* Selected repos as tags */}
            {selectedRepos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3 p-2 bg-bg-card border border-border-subtle rounded-lg max-h-28 overflow-y-auto">
                {[...selectedRepos]
                  .sort((a, b) => repoName(a).localeCompare(repoName(b)))
                  .map((repo) => (
                    <Tag
                      key={repo}
                      closable
                      onClose={() => removeRepo(repo)}
                      className="m-0"
                    >
                      {repoName(repo)}
                    </Tag>
                  ))}
              </div>
            )}

            {/* Repo picker (only when availableRepos loaded from API) */}
            {availableRepos.length > 0 && (
              <>
                <Input
                  prefix={<SearchOutlined className="text-text-muted" />}
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  allowClear
                  size="small"
                  className="mb-2"
                />
                <div className="flex items-center justify-between mb-1">
                  <Checkbox
                    checked={selectedRepos.length === availableRepos.length}
                    indeterminate={selectedRepos.length > 0 && selectedRepos.length < availableRepos.length}
                    onChange={(e) => toggleAllRepos(e.target.checked)}
                  >
                    <span className="text-xs">Select all ({availableRepos.length})</span>
                  </Checkbox>
                </div>
                <div className="max-h-40 overflow-y-auto border border-border-subtle rounded-lg p-2 flex flex-col gap-0.5">
                  {filteredRepos.map((repo) => (
                    <Checkbox
                      key={repo}
                      checked={selectedRepos.includes(repo)}
                      onChange={(e) => toggleRepo(repo, e.target.checked)}
                    >
                      <span className="text-sm">{repoName(repo)}</span>
                      <span className="text-xs text-text-muted ml-1">({repo})</span>
                    </Checkbox>
                  ))}
                  {filteredRepos.length === 0 && (
                    <span className="text-sm text-text-muted py-2 text-center">No repos match "{repoSearch}"</span>
                  )}
                </div>
              </>
            )}

            {/* Button to load repos from stored connection in edit mode */}
            {availableRepos.length === 0 && isEditing && (
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={fetchConnectionRepos}
                loading={loadingRepos}
              >
                Load available repositories
              </Button>
            )}
          </FormSection>
        )}

        {loadingRepos && (
          <div className="flex items-center gap-2 mb-4 text-text-muted text-sm">
            <Spin size="small" /> Loading repositories...
          </div>
        )}

        <FormSection title="Link">
          <Form.Item name="contract_id" label="Contract">
            <Select
              allowClear
              placeholder="Select a contract (optional)"
              options={contracts
                .filter((c) => c.status === "active")
                .map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          {!contractId && (
            <Form.Item
              name="custom_name"
              label="Connection Name"
              rules={[{ required: !contractId, message: "Enter a name for this connection" }]}
            >
              <Input placeholder="e.g. Personal Projects, Freelance Work" />
            </Form.Item>
          )}
        </FormSection>

        <FormSection title="User Activity">
          <Form.Item name="is_primary" valuePropName="checked" className="mb-0">
            <Checkbox>
              <span className="text-sm">
                Use this connection's token for user-wide activity
              </span>
              <p className="text-xs text-text-muted m-0 mt-1">
                Only one connection per provider can be primary. Required for the "By user" screen.
              </p>
            </Checkbox>
          </Form.Item>
        </FormSection>
      </Form>
    </Modal>
  );
}
