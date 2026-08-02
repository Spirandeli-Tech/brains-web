export type BlogStatus = 'draft' | 'scheduled' | 'published'
export type VideoStatus = 'none' | 'assembled' | 'published'

export interface Devocional {
  slug: string
  titulo: string
  data: string
  versiculo: string | null
  resumo: string | null
  blog_url: string
  blog_status: BlogStatus
  imagem_url: string | null
  telegram_sent_at: string | null
  video_status: VideoStatus
  video_youtube_url: string | null
  video_short_youtube_url: string | null
}

export interface DevocionalDetail extends Devocional {
  tema: string | null
  tags: string[]
  roteiro: string
  telegram_mensagem: string | null
  video_title: string | null
  video_thumbnail_text: string | null
  video_published_at: string | null
  video_playlist_url: string | null
}
