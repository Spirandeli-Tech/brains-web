import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Descriptions, Empty, Spin, Tag, Tooltip, message } from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  LinkOutlined,
  ReloadOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import devocionaisClient from "@/lib/clients/devocionais";
import type { DevocionalDetail } from "@/lib/clients/devocionais";
import { PageHeader, DataCard } from "@/components/molecules";
import { Markdown } from "@/pages/Implementations/components/Markdown";
import {
  BLOG_STATUS_COLOR,
  BLOG_STATUS_LABEL,
  VIDEO_STATUS_COLOR,
  VIDEO_STATUS_LABEL,
} from "../constants";

export function DevocionalDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [devocional, setDevocional] = useState<DevocionalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      setDevocional(await devocionaisClient.get(slug));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Falha ao carregar o devocional");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !devocional) {
    return (
      <div className="flex justify-center py-20">
        <Spin />
      </div>
    );
  }
  if (!devocional) return <Empty description="Devocional não encontrado" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={devocional.titulo}
        subtitle={devocional.versiculo ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/content/devocionais")}>
              Voltar
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading} />
          </div>
        }
      />

      <DataCard>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Data">
            {dayjs(devocional.data).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Tema">{devocional.tema ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Blog">
            <div className="flex items-center gap-1.5">
              <Tag color={BLOG_STATUS_COLOR[devocional.blog_status]}>
                {BLOG_STATUS_LABEL[devocional.blog_status]}
              </Tag>
              {devocional.blog_status === "published" && (
                <Tooltip title="Abrir no blog">
                  <a href={devocional.blog_url} target="_blank" rel="noreferrer">
                    <LinkOutlined className="text-text-muted" />
                  </a>
                </Tooltip>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Telegram">
            {devocional.telegram_sent_at ? (
              <span>Enviado em {dayjs(devocional.telegram_sent_at).format("DD/MM/YYYY HH:mm")}</span>
            ) : (
              <span className="text-text-muted">Ainda não enviado</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Vídeo" span={2}>
            <div className="flex items-center gap-3 flex-wrap">
              <Tag color={VIDEO_STATUS_COLOR[devocional.video_status]}>
                {VIDEO_STATUS_LABEL[devocional.video_status]}
              </Tag>
              {devocional.video_youtube_url && (
                <a
                  href={devocional.video_youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs"
                >
                  <YoutubeOutlined /> Vídeo longo
                </a>
              )}
              {devocional.video_short_youtube_url && (
                <a
                  href={devocional.video_short_youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs"
                >
                  <YoutubeOutlined /> Short
                </a>
              )}
              {devocional.video_playlist_url && (
                <a href={devocional.video_playlist_url} target="_blank" rel="noreferrer" className="text-xs">
                  Playlist
                </a>
              )}
            </div>
          </Descriptions.Item>
          {devocional.tags.length > 0 && (
            <Descriptions.Item label="Tags" span={2}>
              <div className="flex gap-1 flex-wrap">
                {devocional.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </DataCard>

      {devocional.telegram_mensagem && (
        <DataCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-muted m-0">MENSAGEM DO TELEGRAM</p>
            <Tooltip title="Copiar mensagem">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={() => {
                  void navigator.clipboard.writeText(devocional.telegram_mensagem ?? "");
                  message.success("Copiado");
                }}
              />
            </Tooltip>
          </div>
          <Markdown text={devocional.telegram_mensagem} size="base" />
        </DataCard>
      )}

      <DataCard>
        <p className="text-xs font-semibold text-text-muted mb-3">ROTEIRO</p>
        <Markdown text={devocional.roteiro} size="base" />
      </DataCard>
    </div>
  );
}
