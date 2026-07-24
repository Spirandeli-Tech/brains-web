import { ApiClient } from '../api-client'
import type {
  CadenceWeek,
  CreateDerivativePayload,
  CreateIdeaPayload,
  CreateScriptPayload,
  CreateVideoPayload,
  Idea,
  PromoteIdeaPayload,
  UpdateIdeaPayload,
  UpdateVideoPayload,
  Video,
  VideoDetail,
  VideoScript,
} from './types'

export class ContentClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  // --- Ideas ---

  async listIdeas(statusFilter?: string): Promise<Idea[]> {
    const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ''
    return this.client.get<Idea[]>(`/content/ideas${qs}`)
  }

  async createIdea(payload: CreateIdeaPayload): Promise<Idea> {
    return this.client.post<Idea>('/content/ideas', payload, true)
  }

  async updateIdea(id: string, payload: UpdateIdeaPayload): Promise<Idea> {
    return this.client.patch<Idea>(`/content/ideas/${id}`, payload)
  }

  async deleteIdea(id: string): Promise<void> {
    return this.client.delete<void>(`/content/ideas/${id}`)
  }

  /** Creates the calendar row from an idea; the idea itself is kept and marked
   * `promoted`, because one idea legitimately spawns several videos. */
  async promoteIdea(id: string, payload: PromoteIdeaPayload): Promise<Video> {
    return this.client.post<Video>(`/content/ideas/${id}/promote`, payload, true)
  }

  // --- Videos ---

  async listVideos(statusFilter?: string, formatFilter?: string): Promise<Video[]> {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status_filter', statusFilter)
    if (formatFilter) params.set('format_filter', formatFilter)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return this.client.get<Video[]>(`/content/videos${qs}`)
  }

  /** Scheduled versus planned, week by week. The gaps are the point. */
  async getCadence(weeks = 6): Promise<CadenceWeek[]> {
    return this.client.get<CadenceWeek[]>(`/content/cadence?weeks=${weeks}`)
  }

  async listDerivatives(videoId: string): Promise<Video[]> {
    return this.client.get<Video[]>(`/content/videos/${videoId}/derivatives`)
  }

  async createDerivative(videoId: string, payload: CreateDerivativePayload): Promise<Video> {
    return this.client.post<Video>(`/content/videos/${videoId}/derivatives`, payload, true)
  }

  async getVideo(id: string): Promise<VideoDetail> {
    return this.client.get<VideoDetail>(`/content/videos/${id}`)
  }

  async createVideo(payload: CreateVideoPayload): Promise<Video> {
    return this.client.post<Video>('/content/videos', payload, true)
  }

  async updateVideo(id: string, payload: UpdateVideoPayload): Promise<Video> {
    return this.client.patch<Video>(`/content/videos/${id}`, payload)
  }

  async deleteVideo(id: string): Promise<void> {
    return this.client.delete<void>(`/content/videos/${id}`)
  }

  // --- Scripts ---

  async listScripts(videoId: string): Promise<VideoScript[]> {
    return this.client.get<VideoScript[]>(`/content/videos/${videoId}/scripts`)
  }

  async createScript(videoId: string, payload: CreateScriptPayload): Promise<VideoScript> {
    return this.client.post<VideoScript>(`/content/videos/${videoId}/scripts`, payload, true)
  }

  async deleteScript(videoId: string, scriptId: string): Promise<void> {
    return this.client.delete<void>(`/content/videos/${videoId}/scripts/${scriptId}`)
  }
}
