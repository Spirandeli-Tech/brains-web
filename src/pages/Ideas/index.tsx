import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Popconfirm, Select, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import contentClient from "@/lib/clients/content";
import type { Idea } from "@/lib/clients/content";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  FORMAT_LABEL,
  IDEA_STATUSES,
  IDEA_STATUS_COLOR,
  IDEA_STATUS_LABEL,
  IDEA_TYPE_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  THEME_FILTER_LABEL,
} from "../Videos/constants";
import { IdeaFormModal } from "./IdeaFormModal";
import { PromoteModal } from "./PromoteModal";

export function IdeasPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [promoting, setPromoting] = useState<Idea | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIdeas(await contentClient.listIdeas(statusFilter));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (idea: Idea) => {
    try {
      await contentClient.deleteIdea(idea.id);
      message.success("Idea deleted");
      void load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const columns: ColumnsType<Idea> = [
    {
      title: "Title",
      key: "title",
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">{record.title}</span>
            {!record.trustworthy && (
              <Tooltip title="Fact-check left something pending — resolve before scripting">
                <WarningOutlined className="text-amber-500" />
              </Tooltip>
            )}
          </div>
          <span className="text-xs text-text-muted font-mono">{record.slug}</span>
        </div>
      ),
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      width: 100,
      render: (format: string) => FORMAT_LABEL[format] ?? format,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (type: string | null) => (type ? (IDEA_TYPE_LABEL[type] ?? type) : "—"),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => (
        <Tag color={PRIORITY_COLOR[priority] ?? "default"}>
          {PRIORITY_LABEL[priority] ?? priority}
        </Tag>
      ),
    },
    {
      title: "Theme gate",
      key: "theme_filter",
      width: 110,
      render: (_, record) => {
        const entries = Object.entries(record.theme_filter ?? {});
        if (!entries.length) return <span className="text-text-muted">—</span>;
        return (
          <Tooltip
            title={
              <div className="flex flex-col gap-1">
                {entries.map(([key, value]) => (
                  <div key={key}>
                    <b>{THEME_FILTER_LABEL[key] ?? key}:</b> {value}
                  </div>
                ))}
              </div>
            }
          >
            <Tag color="cyan">{entries.length}/3</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: Idea["status"], record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={IDEA_STATUS_COLOR[status]}>{IDEA_STATUS_LABEL[status]}</Tag>
          {record.video_count > 0 && (
            <Tooltip title={`${record.video_count} video(s) from this idea`}>
              <span className="text-xs text-text-muted">×{record.video_count}</span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (source: string) => (
        <span className="text-xs text-text-muted">
          {source === "buscar-trends" ? "/buscar-trends" : "manual"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <div className="flex gap-0.5">
          <Tooltip title="Schedule — turn into a calendar row">
            <Button
              type="text"
              icon={<CalendarOutlined />}
              onClick={() => setPromoting(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(record);
                setFormOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this idea?"
            description="Videos already created from it are kept."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ideas"
        subtitle="The topic bank — what to talk about, before it becomes a video"
        actions={
          <div className="flex items-center gap-3">
            <Select
              allowClear
              placeholder="All statuses"
              className="w-44"
              value={statusFilter}
              onChange={setStatusFilter}
              options={IDEA_STATUSES.map((s) => ({ value: s, label: IDEA_STATUS_LABEL[s] }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New Idea
            </Button>
          </div>
        }
      />
      <DataCard>
        <Table<Idea>
          columns={columns}
          dataSource={ideas}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </DataCard>

      <IdeaFormModal
        open={formOpen}
        idea={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={() => void load()}
      />
      <PromoteModal
        open={promoting !== null}
        idea={promoting}
        onClose={() => setPromoting(null)}
        onSuccess={(videoId) => navigate(`/content/videos/${videoId}`)}
      />
    </div>
  );
}
