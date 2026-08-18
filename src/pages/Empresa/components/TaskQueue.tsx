import { useMemo, useState } from "react";
import { Empty, Segmented, Table } from "antd";
import type { TableProps } from "antd";
import type { AgentData, TaskData, TaskStatus } from "@/lib/clients/empresa";
import { StatusPill } from "@/components/atoms";
import { TASK_STATUS_PILL, formatUsd, relative } from "../utils";
import { TaskDetailModal } from "./TaskDetailModal";

interface TaskQueueProps {
  tasks: TaskData[];
  agents: AgentData[];
}

type TaskFilter = "all" | TaskStatus;

const FILTER_OPTIONS: { label: string; value: TaskFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Na fila", value: "queued" },
  { label: "Rodando", value: "running" },
  { label: "Concluídas", value: "done" },
  { label: "Falhas", value: "failed" },
];

const columns: TableProps<TaskData>["columns"] = [
  {
    title: "Agente",
    dataIndex: "agent_slug",
    key: "agent_slug",
    render: (slug: string) => (
      <span className="text-sm font-medium text-text-primary">{slug}</span>
    ),
  },
  {
    title: "Skill",
    dataIndex: "skill",
    key: "skill",
    render: (skill: string) => <span className="text-sm text-text-secondary">{skill}</span>,
  },
  {
    title: "Trigger",
    dataIndex: "trigger",
    key: "trigger",
    render: (trigger: string) => <span className="text-xs text-text-muted">{trigger}</span>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: TaskStatus) => (
      <StatusPill variant={TASK_STATUS_PILL[status].variant}>
        {TASK_STATUS_PILL[status].label}
      </StatusPill>
    ),
  },
  {
    title: "Custo",
    dataIndex: "cost_usd",
    key: "cost_usd",
    render: (cost: number | null) => (
      <span className="text-xs text-text-muted">{cost != null ? formatUsd(cost) : "—"}</span>
    ),
  },
  {
    title: "Criada",
    dataIndex: "created_at",
    key: "created_at",
    render: (createdAt: string) => (
      <span className="text-xs text-text-muted">{relative(createdAt)}</span>
    ),
  },
];

export function TaskQueue({ tasks, agents }: TaskQueueProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        options={FILTER_OPTIONS}
        value={filter}
        onChange={(value) => setFilter(value as TaskFilter)}
      />
      <Table<TaskData>
        columns={columns}
        dataSource={filteredTasks}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedTask(record),
          className: "cursor-pointer",
        })}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                filter === "all"
                  ? "Nenhuma task na fila ainda."
                  : "Nenhuma task com esse status."
              }
            />
          ),
        }}
      />
      <TaskDetailModal
        task={selectedTask}
        agents={agents}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
