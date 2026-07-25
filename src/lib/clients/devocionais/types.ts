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
  telegram_sent_at: string | null
  video_status: VideoStatus
  video_youtube_url: string | null
  video_short_youtube_url: string | null
}
