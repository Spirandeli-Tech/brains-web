import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Descriptions,
  Empty,
  Popconfirm,
  Segmented,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { VideoDetail, VideoScript, VideoStatus } from "@/lib/clients/content";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  FORMAT_COLOR,
  FORMAT_HINT,
  FORMAT_LABEL,
  VIDEO_STATUSES,
  VIDEO_STATUS_COLOR,
  VIDEO_STATUS_LABEL,
} from "../constants";
import { VideoFormModal } from "../VideoFormModal";
import { ScriptFormModal } from "./ScriptFormModal";
import { DerivativeFormModal } from "./DerivativeFormModal";
import { MetricsFormModal } from "./MetricsFormModal";

function ScriptVersion({
  script,
  onDelete,
}: {
  script: VideoScript;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tag color="blue">v{script.version}</Tag>
          {script.persona && <Tag>{script.persona}</Tag>}
          <span className="text-xs text-text-muted">
            {dayjs(script.created_at).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
        <div className="flex gap-1">
          <Tooltip title="Copy script">
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(script.body);
                message.success("Copied");
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this version?"
            onConfirm={() => onDelete(script.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>

      {script.titles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">Titles</p>
          <ol className="text-sm flex flex-col gap-1 pl-5 m-0">
            {script.titles.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-text-muted mb-1.5">Script</p>
        <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-bg-hover rounded p-3 leading-relaxed m-0">
          {script.body}
        </pre>
      </div>

      {script.short_cuts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">
            Short cuts <span className="font-normal">(named before recording)</span>
          </p>
          <ul className="text-sm flex flex-col gap-1 pl-5 m-0">
            {script.short_cuts.map((cut, index) => (
              <li key={index}>{cut}</li>
            ))}
          </ul>
        </div>
      )}

      {script.growth_checklist.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">Growth checklist</p>
          <div className="flex flex-col gap-1">
            {script.growth_checklist.map((entry, index) => {
              const passed = (entry.status ?? "").toLowerCase().startsWith("ok");
              return (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {passed ? (
                    <CheckCircleOutlined className="text-green-600 mt-0.5" />
                  ) : (
                    <ExclamationCircleOutlined className="text-amber-500 mt-0.5" />
                  )}
                  <span>
                    <b>{entry.item}</b>
                    {entry.reason ? ` — ${entry.reason}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {script.caption && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">Caption + CTA</p>
          <p className="text-sm whitespace-pre-wrap m-0">{script.caption}</p>
        </div>
      )}

      {script.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {script.hashtags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}

      {script.facts_used && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">Verses / facts used</p>
          <p className="text-sm whitespace-pre-wrap m-0">{script.facts_used}</p>
        </div>
      )}
    </div>
  );
}

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [derivativeOpen, setDerivativeOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await contentClient.getVideo(id);
      setVideo(detail);
      setSelectedVersion((current) => current ?? detail.scripts[0]?.version ?? null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (status: VideoStatus) => {
    if (!video) return;
    try {
      await contentClient.updateVideo(video.id, { status });
      message.success(`Moved to ${VIDEO_STATUS_LABEL[status]}`);
      void load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!video) return;
    try {
      await contentClient.deleteScript(video.id, scriptId);
      message.success("Version deleted");
      setSelectedVersion(null);
      void load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete version");
    }
  };

  if (loading && !video) {
    return (
      <div className="flex justify-center py-20">
        <Spin />
      </div>
    );
  }

  if (!video) {
    return <Empty description="Video not found" />;
  }

  const activeScript =
    video.scripts.find((s) => s.version === selectedVersion) ?? video.scripts[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={video.title}
        subtitle={
          [
            video.publish_date
              ? dayjs(video.publish_date).format("DD/MM/YYYY")
              : "Not scheduled",
            FORMAT_HINT[video.format] ?? FORMAT_LABEL[video.format] ?? video.format,
            video.series
              ? `${video.series}${video.episode_number ? ` · ep. ${video.episode_number}` : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/content/videos")}>
              Back
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        }
      />

      {/* The pipeline as a control, not just a label — moving a video forward is
          the most frequent action on this page. */}
      <DataCard>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-text-muted">Pipeline</span>
          <Segmented
            value={video.status}
            onChange={(value) => void handleStatusChange(value as VideoStatus)}
            options={VIDEO_STATUSES.map((s) => ({
              value: s,
              label: VIDEO_STATUS_LABEL[s],
            }))}
          />
          <Tag color={VIDEO_STATUS_COLOR[video.status]}>{VIDEO_STATUS_LABEL[video.status]}</Tag>
        </div>
      </DataCard>

      <Tabs
        items={[
          {
            key: "script",
            label: `Script${video.scripts.length ? ` (${video.scripts.length})` : ""}`,
            children: (
              <DataCard>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {video.scripts.length > 1 ? (
                      <Segmented
                        size="small"
                        value={activeScript?.version}
                        onChange={(value) => setSelectedVersion(value as number)}
                        options={video.scripts.map((s) => ({
                          value: s.version,
                          label: `v${s.version}`,
                        }))}
                      />
                    ) : (
                      <span />
                    )}
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setScriptOpen(true)}
                    >
                      New version
                    </Button>
                  </div>

                  {activeScript ? (
                    <ScriptVersion script={activeScript} onDelete={handleDeleteScript} />
                  ) : (
                    <Empty description="No script yet — write one here or run /social-roteirizar-ideia" />
                  )}
                </div>
              </DataCard>
            ),
          },
          ...(video.parent_id
            ? []
            : [
                {
                  key: "derivatives",
                  label: `Derivatives${
                    video.derivatives.length ? ` (${video.derivatives.length})` : ""
                  }`,
                  children: (
                    <DataCard>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">
                            The plan is 2–3 cuts (Tue/Fri) plus one podcast per episode.
                          </span>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setDerivativeOpen(true)}
                          >
                            Add
                          </Button>
                        </div>
                        {video.derivatives.length ? (
                          <div className="flex flex-col gap-1.5">
                            {video.derivatives.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 border border-border-subtle rounded px-3 py-2 cursor-pointer hover:bg-bg-hover"
                                onClick={() => navigate(`/content/videos/${item.id}`)}
                              >
                                <Tag color={FORMAT_COLOR[item.format] ?? "default"}>
                                  {FORMAT_LABEL[item.format] ?? item.format}
                                </Tag>
                                <span className="text-sm flex-1 truncate">{item.title}</span>
                                <span className="text-xs text-text-muted whitespace-nowrap">
                                  {item.publish_date
                                    ? dayjs(item.publish_date).format("DD/MM")
                                    : "—"}
                                </span>
                                <Tag color={VIDEO_STATUS_COLOR[item.status]}>
                                  {VIDEO_STATUS_LABEL[item.status]}
                                </Tag>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Empty description="No cuts yet — name them before recording (principle #7)" />
                        )}
                      </div>
                    </DataCard>
                  ),
                },
              ]),
          {
            key: "details",
            label: "Details",
            children: (
              <DataCard>
                <div className="flex justify-end mb-3">
                  <Button size="small" icon={<EditOutlined />} onClick={() => setMetricsOpen(true)}>
                    Edit 48h metrics
                  </Button>
                </div>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="Keyword">
                    {video.keyword || <span className="text-text-muted">—</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Slug">
                    <span className="font-mono text-xs">{video.slug || "—"}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="From idea">
                    {video.idea_id ? (
                      <a onClick={() => navigate("/content/ideas")}>{video.idea_title}</a>
                    ) : (
                      <span className="text-text-muted">Created directly</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Derived from">
                    {video.parent_id ? (
                      <a onClick={() => navigate(`/content/videos/${video.parent_id}`)}>
                        Go to the episode
                      </a>
                    ) : (
                      <span className="text-text-muted">This is the episode</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="YouTube">
                    {video.youtube_url ? (
                      <a href={video.youtube_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="CTR 48h">
                    {video.ctr_48h ?? <span className="text-text-muted">—</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Retention 48h">
                    {video.retention_48h ?? <span className="text-text-muted">—</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Learning" span={2}>
                    {video.learning || (
                      <span className="text-text-muted">
                        Nothing recorded yet — this is what turns a growth principle from
                        hypothesis into fact.
                      </span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </DataCard>
            ),
          },
        ]}
      />

      <VideoFormModal
        open={editOpen}
        video={video}
        onClose={() => setEditOpen(false)}
        onSuccess={() => void load()}
      />
      <ScriptFormModal
        open={scriptOpen}
        videoId={video.id}
        onClose={() => setScriptOpen(false)}
        onSuccess={() => {
          setSelectedVersion(null);
          void load();
        }}
      />
      <DerivativeFormModal
        open={derivativeOpen}
        episodeId={video.id}
        episodeTitle={video.title}
        onClose={() => setDerivativeOpen(false)}
        onSuccess={() => void load()}
      />
      <MetricsFormModal
        open={metricsOpen}
        video={video}
        onClose={() => setMetricsOpen(false)}
        onSuccess={() => void load()}
      />
    </div>
  );
}
