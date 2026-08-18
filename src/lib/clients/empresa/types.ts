export type AgentStatus = 'idle' | 'running' | 'queued'

export type TaskStatus = 'queued' | 'running' | 'done' | 'failed'

export interface AgentData {
  id: string
  slug: string
  human_name: string
  role: string
  area: string
  reports_to: string | null
  bio: string | null
  skills: string[]
  enabled: boolean
  status: AgentStatus
  current_skill: string | null
  current_task_detail: string | null
  queued_count: number
  total_cost_usd: number
}

export interface MessageData {
  id: string
  from_agent: string
  to_agent: string | null
  body: string
  artifact_url: string | null
  task_id: string | null
  created_at: string
}

export interface SendMessagePayload {
  body: string
  artifact_url?: string
}

export type RitualWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface RitualData {
  name: string
  agent_slug: string
  skill: string
  weekday: RitualWeekday | null
  day_of_month: number | null
  time: string
  last_fired: string | null
}

/** SKILL.md (markdown) de uma skill da empresa. */
export interface SkillDoc {
  skill: string
  content: string
}

export interface TaskData {
  id: string
  agent_slug: string
  skill: string
  trigger: string
  payload: Record<string, unknown> | null
  status: TaskStatus
  claimed_by: string | null
  claimed_at: string | null
  finished_at: string | null
  error: string | null
  result_summary: string | null
  cost_usd: number | null
  created_at: string
}

/** Detalhe de uma task: todos os campos + o transcript da execução (atualizado ao vivo enquanto roda). */
export interface TaskDetailData extends TaskData {
  log: string | null
}

/** Estado geral da empresa: desligada (pausada) ou ligada. */
export interface EstadoData {
  pausada: boolean
}

/** Um item do diagnóstico "por que a empresa está parada?". */
export interface DiagnosticoCheck {
  nome: string
  ok: boolean
  detalhe: string
}

export interface DiagnosticoData {
  checks: DiagnosticoCheck[]
  motivos: string[]
}
