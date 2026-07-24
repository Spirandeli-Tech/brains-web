import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Popconfirm, Select, Table, Tag, Tooltip, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { Video } from "@/lib/clients/content";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  FORMAT_COLOR,
  FORMAT_LABEL,
  VIDEO_FORMATS,
  VIDEO_STATUSES,
  VIDEO_STATUS_COLOR,
  VIDEO_STATUS_LABEL,
} from "./constants";
import { CadenceStrip } from "./CadenceStrip";
import { VideoFormModal } from "./VideoFormModal";

export function VideosPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [formatFilter, setFormatFilter] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  // Bumped on every reload so the strip recounts without owning the fetch.
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideos(await contentClient.listVideos(statusFilter, formatFilter));
      setRefreshKey((key) => key + 1);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, formatFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (video: Video) => {
    try {
      await contentClient.deleteVideo(video.id);
      message.success("Video deleted");
      void load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const columns: ColumnsType<Video> = [
    {
      title: "",
      key: "thumb",
      width: 76,
      render: (_, record) =>
        record.thumb_url ? (
          <img
            src={record.thumb_url}
            alt=""
            className="w-16 h-9 object-cover rounded border border-border-subtle"
          />
        ) : (
          <div className="w-16 h-9 rounded bg-bg-hover border border-border-subtle flex items-center justify-center">
            <PictureOutlined className="text-text-muted text-xs" />
          </div>
        ),
    },
    {
      title: "Publish date",
      dataIndex: "publish_date",
      key: "publish_date",
      width: 130,
      render: (value: string | null) =>
        value ? (
          <span className="whitespace-nowrap">{dayjs(value).format("DD/MM/YYYY")}</span>
        ) : (
          <span className="text-text-muted">Not scheduled</span>
        ),
    },
    {
      title: "Title",
      key: "title",
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{record.title}</span>
          {record.series && (
            <span className="text-xs text-text-muted">
              {record.series}
              {record.episode_number ? ` · ep. ${record.episode_number}` : ""}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      width: 180,
      render: (keyword: string | null) =>
        keyword ? (
          <Tag color="geekblue">{keyword}</Tag>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      title: "Format",
      key: "format",
      width: 130,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={FORMAT_COLOR[record.format] ?? "default"}>
            {FORMAT_LABEL[record.format] ?? record.format}
          </Tag>
          {record.format === "episode" && record.derivative_count > 0 && (
            <Tooltip title={`${record.derivative_count} derivative(s) — cuts and podcast`}>
              <span className="text-xs text-text-muted">+{record.derivative_count}</span>
            </Tooltip>
          )}
          {record.parent_id && (
            <Tooltip title="Derived from an episode">
              <span className="text-xs text-text-muted">↳</span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: Video["status"]) => (
        <Tag color={VIDEO_STATUS_COLOR[status]}>{VIDEO_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: "Scripts",
      dataIndex: "script_count",
      key: "script_count",
      width: 80,
      align: "center",
      render: (count: number) =>
        count > 0 ? count : <span className="text-text-muted">—</span>,
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <div
          className="flex gap-0.5"
          // The row itself opens the detail page; the buttons must not.
          onClick={(event) => event.stopPropagation()}
        >
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
            title="Delete this video?"
            description="Its scripts are deleted too."
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
        title="Videos"
        subtitle="The publication calendar — what gets recorded and when"
        actions={
          <div className="flex items-center gap-3">
            <Select
              allowClear
              placeholder="All formats"
              className="w-36"
              value={formatFilter}
              onChange={setFormatFilter}
              options={VIDEO_FORMATS.map((f) => ({ value: f, label: FORMAT_LABEL[f] }))}
            />
            <Select
              allowClear
              placeholder="All statuses"
              className="w-44"
              value={statusFilter}
              onChange={setStatusFilter}
              options={VIDEO_STATUSES.map((s) => ({ value: s, label: VIDEO_STATUS_LABEL[s] }))}
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
              New Video
            </Button>
          </div>
        }
      />
      <CadenceStrip refreshKey={refreshKey} />
      <DataCard>
        <Table<Video>
          columns={columns}
          dataSource={videos}
          rowKey="id"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/content/videos/${record.id}`),
            className: "cursor-pointer",
          })}
        />
      </DataCard>

      <VideoFormModal
        open={formOpen}
        video={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={() => void load()}
      />
    </div>
  );
}
