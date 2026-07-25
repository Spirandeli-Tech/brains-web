import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LinkOutlined, ReloadOutlined, YoutubeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import devocionaisClient from "@/lib/clients/devocionais";
import type { Devocional } from "@/lib/clients/devocionais";
import { PageHeader, DataCard } from "@/components/molecules";
import {
  BLOG_STATUS_COLOR,
  BLOG_STATUS_LABEL,
  VIDEO_STATUS_COLOR,
  VIDEO_STATUS_LABEL,
} from "./constants";
import { ScheduleSummary } from "./ScheduleSummary";

export function DevocionaisPage() {
  const navigate = useNavigate();
  const [devocionais, setDevocionais] = useState<Devocional[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDevocionais(await devocionaisClient.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnsType<Devocional> = [
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      width: 110,
      render: (value: string) => (
        <span className="whitespace-nowrap">{dayjs(value).format("DD/MM/YYYY")}</span>
      ),
    },
    {
      title: "Título",
      key: "titulo",
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{record.titulo}</span>
          {record.versiculo && (
            <span className="text-xs text-text-muted">{record.versiculo}</span>
          )}
        </div>
      ),
    },
    {
      title: "Blog",
      key: "blog",
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={BLOG_STATUS_COLOR[record.blog_status]}>
            {BLOG_STATUS_LABEL[record.blog_status]}
          </Tag>
          {record.blog_status === "published" && (
            <Tooltip title="Abrir no blog">
              <a
                href={record.blog_url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <LinkOutlined className="text-text-muted" />
              </a>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Telegram",
      key: "telegram",
      width: 130,
      render: (_, record) =>
        record.telegram_sent_at ? (
          <span className="whitespace-nowrap">
            {dayjs(record.telegram_sent_at).format("DD/MM/YYYY")}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      title: "Vídeo",
      key: "video",
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={VIDEO_STATUS_COLOR[record.video_status]}>
            {VIDEO_STATUS_LABEL[record.video_status]}
          </Tag>
          {record.video_youtube_url && (
            <Tooltip title="Abrir no YouTube">
              <a
                href={record.video_youtube_url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <YoutubeOutlined className="text-text-muted" />
              </a>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Devocionais"
        subtitle="O que já foi escrito, enviado pro Telegram e narrado em vídeo"
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />
        }
      />
      {!loading && <ScheduleSummary devocionais={devocionais} />}
      <DataCard>
        <Table<Devocional>
          columns={columns}
          dataSource={devocionais}
          rowKey="slug"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => navigate(`/content/devocionais/${record.slug}`),
          })}
        />
      </DataCard>
    </div>
  );
}
