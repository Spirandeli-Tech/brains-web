import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  Tag,
  TimePicker,
  Tooltip,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import automationsClient from "@/lib/clients/automations";
import type {
  Automation,
  AutomationFrequency,
  AutomationRun,
  AutomationRunStatus,
  CreateAutomationPayload,
} from "@/lib/clients/automations";
import { PageHeader, DataCard } from "@/components/molecules";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FREQUENCY_LABELS: Record<AutomationFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const RUN_STATUS_COLOR: Record<AutomationRunStatus, string> = {
  pending: "default",
  running: "processing",
  done: "success",
  failed: "error",
};

function formatFrequency(automation: Automation): string {
  const time = automation.time_of_day.slice(0, 5);
  if (automation.frequency === "daily") return `Daily at ${time}`;
  if (automation.frequency === "weekly" && automation.day_of_week != null) {
    return `Every ${DAY_NAMES[automation.day_of_week]} at ${time}`;
  }
  if (automation.frequency === "monthly" && automation.day_of_month != null) {
    return `Monthly on day ${automation.day_of_month} at ${time}`;
  }
  return FREQUENCY_LABELS[automation.frequency];
}

function RunRow({ run }: { run: AutomationRun }) {
  return (
    <div className="flex items-center gap-3 py-1 text-sm">
      <Tag color={RUN_STATUS_COLOR[run.status]}>{run.status}</Tag>
      <span className="text-gray-500">{run.scheduled_for}</span>
      {run.error && (
        <Tooltip title={run.error}>
          <span className="text-red-500 truncate max-w-xs">{run.error}</span>
        </Tooltip>
      )}
    </div>
  );
}

function AutomationCard({
  automation,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  automation: Automation;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  toggling: string | null;
  deleting: string | null;
}) {
  const hasActiveRuns = automation.recent_runs.some(
    (r) => r.status === "pending" || r.status === "running"
  );

  const collapseItems =
    automation.recent_runs.length > 0
      ? [
          {
            key: "runs",
            label: `Recent runs (${automation.recent_runs.length})`,
            children: (
              <div className="flex flex-col gap-1">
                {automation.recent_runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </div>
            ),
          },
        ]
      : [];

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasActiveRuns && <Badge status="processing" />}
            <span className="font-medium truncate">{automation.name}</span>
          </div>
          <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
            {automation.skill}
          </code>
          <span className="text-xs text-gray-500">{formatFrequency(automation)}</span>
          {automation.connection_name && (
            <span className="text-xs text-gray-400">Org: {automation.connection_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={automation.enabled}
            loading={toggling === automation.id}
            onChange={(checked) => onToggle(automation.id, checked)}
            size="small"
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleting === automation.id}
            onClick={() => onDelete(automation.id)}
          />
        </div>
      </div>

      {collapseItems.length > 0 && (
        <Collapse size="small" ghost items={collapseItems} />
      )}
    </div>
  );
}

interface CreateFormValues {
  name: string;
  skill: string;
  connection_name?: string;
  work_dir?: string;
  frequency: AutomationFrequency;
  day_of_week?: number;
  day_of_month?: number;
  time_of_day?: dayjs.Dayjs;
}

function CreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form] = Form.useForm<CreateFormValues>();
  const [creating, setCreating] = useState(false);
  const frequency = Form.useWatch("frequency", form);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const payload: CreateAutomationPayload = {
        name: values.name,
        skill: values.skill,
        frequency: values.frequency,
        connection_name: values.connection_name || undefined,
        work_dir: values.work_dir || undefined,
        day_of_week: values.day_of_week,
        day_of_month: values.day_of_month,
        time_of_day: values.time_of_day
          ? values.time_of_day.format("HH:mm:ss")
          : undefined,
      };
      await automationsClient.createAutomation(payload);
      message.success("Automation created");
      form.resetFields();
      onCreated();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to create automation"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="New Automation"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={creating}
      okText="Create"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Daily status update" />
        </Form.Item>

        <Form.Item
          name="skill"
          label="Skill"
          rules={[{ required: true }]}
          extra="The Claude Code skill to run, e.g. /daily-status"
        >
          <Input placeholder="/daily-status" />
        </Form.Item>

        <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
            ]}
          />
        </Form.Item>

        {frequency === "weekly" && (
          <Form.Item
            name="day_of_week"
            label="Day of Week"
            rules={[{ required: true }]}
          >
            <Select
              options={DAY_NAMES.map((d, i) => ({ label: d, value: i }))}
            />
          </Form.Item>
        )}

        {frequency === "monthly" && (
          <Form.Item
            name="day_of_month"
            label="Day of Month"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={31} style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item name="time_of_day" label="Time">
          <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="connection_name" label="Connection (optional)">
          <Input placeholder="Spirandeli" />
        </Form.Item>

        <Form.Item name="work_dir" label="Work directory (optional)">
          <Input placeholder="/Users/you/Work/MyProject" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

const POLL_INTERVAL_MS = 10000;

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const fetchAutomations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await automationsClient.listAutomations();
      setAutomations(data);
    } catch (error) {
      if (!silent) {
        message.error(
          error instanceof Error ? error.message : "Failed to load automations"
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  useEffect(() => {
    const hasActive = automations.some((a) =>
      a.recent_runs.some((r) => r.status === "pending" || r.status === "running")
    );
    if (hasActive) {
      pollRef.current = window.setInterval(
        () => fetchAutomations(true),
        POLL_INTERVAL_MS
      );
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [automations, fetchAutomations]);

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id);
    try {
      await automationsClient.updateAutomation(id, { enabled });
      await fetchAutomations(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to update automation"
      );
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await automationsClient.deleteAutomation(id);
      message.success("Automation deleted");
      await fetchAutomations(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to delete automation"
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Automations"
        subtitle="Schedule Claude Code skills to run automatically on a recurring schedule"
        actions={
          <div className="flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => fetchAutomations()}
              loading={loading}
            >
              Reload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Automation
            </Button>
          </div>
        }
      />

      <DataCard>
        {loading && automations.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : automations.length > 0 ? (
          <div className="flex flex-col gap-3">
            {automations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onToggle={handleToggle}
                onDelete={handleDelete}
                toggling={toggling}
                deleting={deleting}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No automations yet."
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Automation
            </Button>
          </Empty>
        )}
      </DataCard>

      <CreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          fetchAutomations(true);
        }}
      />
    </div>
  );
}
