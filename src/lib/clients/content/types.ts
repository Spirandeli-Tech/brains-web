export type IdeaStatus = 'idea' | 'review' | 'promoted' | 'discarded'
export type VideoStatus = 'idea' | 'script_ready' | 'recorded' | 'edited' | 'published'
/** `episode` is the product (8–15min, Sunday); `short` and `podcast` derive from
 * it. `message` and `series` only ever apply to an idea, never to a video. */
export type ContentFormat = 'episode' | 'short' | 'podcast' | 'message' | 'series'
export type VideoFormat = 'episode' | 'short' | 'podcast'

export interface Idea {
  id: string
  slug: string
  title: string
  format: ContentFormat
  type: string | null
  priority: string
  status: IdeaStatus
  hook: string | null
  why_now: string | null
  visual_refs: string | null
  trustworthy: boolean
  fact_check: string | null
  /** The 3-question theme gate (#9 demand, #10 angle, #11 immediate value). */
  theme_filter: Record<string, string>
  source: string
  video_count: number
  created_at: string
  updated_at: string
}

export interface CreateIdeaPayload {
  title: string
  slug?: string
  format?: ContentFormat
  type?: string | null
  priority?: string
  status?: IdeaStatus
  hook?: string | null
  why_now?: string | null
  visual_refs?: string | null
  trustworthy?: boolean
  fact_check?: string | null
  theme_filter?: Record<string, string>
}

export type UpdateIdeaPayload = Partial<CreateIdeaPayload>

export interface PromoteIdeaPayload {
  format?: ContentFormat
  publish_date?: string | null
  keyword?: string | null
  series?: string | null
  episode_number?: number | null
}

export interface VideoScript {
  id: string
  video_id: string
  version: number
  body: string
  titles: string[]
  caption: string | null
  hashtags: string[]
  cover: string | null
  facts_used: string | null
  growth_checklist: GrowthChecklistItem[]
  short_cuts: string[]
  persona: string | null
  created_at: string
}

export interface GrowthChecklistItem {
  item?: string
  status?: string
  reason?: string
}

export interface Video {
  id: string
  idea_id: string | null
  idea_title: string | null
  /** Set on cuts and podcasts: the episode they were cut from. */
  parent_id: string | null
  title: string
  slug: string | null
  keyword: string | null
  format: ContentFormat
  series: string | null
  episode_number: number | null
  publish_date: string | null
  status: VideoStatus
  thumb_url: string | null
  youtube_url: string | null
  ctr_48h: string | null
  retention_48h: string | null
  learning: string | null
  script_count: number
  derivative_count: number
  created_at: string
  updated_at: string
}

export interface VideoDetail extends Video {
  scripts: VideoScript[]
  derivatives: Video[]
}

export interface CreateDerivativePayload {
  format: VideoFormat
  title?: string | null
  keyword?: string | null
  publish_date?: string | null
  status?: VideoStatus
}

export interface CadenceWeek {
  week_number: number
  starts_on: string
  ends_on: string
  is_current: boolean
  counts: Record<string, number>
  target: Record<string, number>
  missing: Record<string, number>
  state: 'empty' | 'partial' | 'complete'
  series: string[]
  video_ids: string[]
}

export interface CreateVideoPayload {
  title: string
  idea_id?: string | null
  slug?: string | null
  keyword?: string | null
  format?: ContentFormat
  series?: string | null
  episode_number?: number | null
  publish_date?: string | null
  status?: VideoStatus
  thumb_url?: string | null
  youtube_url?: string | null
}

export interface UpdateVideoPayload extends Partial<CreateVideoPayload> {
  ctr_48h?: string | null
  retention_48h?: string | null
  learning?: string | null
}

export interface CreateScriptPayload {
  body: string
  titles?: string[]
  caption?: string | null
  hashtags?: string[]
  cover?: string | null
  facts_used?: string | null
  growth_checklist?: GrowthChecklistItem[]
  short_cuts?: string[]
  persona?: string | null
}
