import type { BlogStatus, VideoStatus } from "@/lib/clients/devocionais";

export const BLOG_STATUS_LABEL: Record<BlogStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

export const BLOG_STATUS_COLOR: Record<BlogStatus, string> = {
  draft: "default",
  scheduled: "gold",
  published: "green",
};

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  none: "Sem vídeo",
  assembled: "Montado",
  published: "Publicado",
};

export const VIDEO_STATUS_COLOR: Record<VideoStatus, string> = {
  none: "default",
  assembled: "blue",
  published: "green",
};
