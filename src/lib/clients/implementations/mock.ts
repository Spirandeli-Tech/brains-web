import type { ImplementationRun, ImplementationStep, StepKind } from './types'
import { STEP_CATALOG, STEP_BY_KIND } from './constants'

/**
 * In-memory mock so the page is fully usable before the backend lands.
 * The client falls back to this whenever the real API is unreachable.
 */

function step(kind: StepKind, status: ImplementationStep['status'], log: string | null = null): ImplementationStep {
  const def = STEP_BY_KIND[kind]
  return {
    id: `step-${kind}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    sensitive: def.sensitive,
    status,
    log,
    started_at: status === 'pending' ? null : new Date().toISOString(),
    ended_at: status === 'done' || status === 'skipped' ? new Date().toISOString() : null,
  }
}

let RUNS: ImplementationRun[] = [
  {
    id: 'run-beon-123',
    connection_id: 'mock-beon',
    connection_name: 'Beon',
    provider: 'github',
    ticket_url: 'https://beon.atlassian.net/browse/BEON-123',
    ticket_key: 'BEON-123',
    ticket_summary: 'Add retry logic to the scheduling webhook',
    status: 'awaiting_approval',
    worktree_path: '~/Work/Beon/.worktrees/BEON-123',
    branch: 'feature/BEON-123',
    pr_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    steps: [
      step('implement', 'done', 'Implemented retry with exponential backoff. 3 files changed.'),
      step('open_pr', 'awaiting_approval', 'PR text drafted — waiting for your approval.'),
      step('code_review', 'pending'),
      step('address_feedback', 'pending'),
    ],
  },
  {
    id: 'run-novo-45',
    connection_id: 'mock-novoed',
    connection_name: 'NovoED 2026',
    provider: 'github',
    ticket_url: 'https://novoed.atlassian.net/browse/NOVO-45',
    ticket_key: 'NOVO-45',
    ticket_summary: 'Fix Figma token sync on the milvus connector',
    status: 'running',
    worktree_path: '~/Work/NovoED/.worktrees/NOVO-45',
    branch: 'feature/NOVO-45',
    pr_url: 'https://github.com/novoed/milvus_connector/pull/128',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 30).toISOString(),
    steps: [
      step('implement', 'done', 'Done.'),
      step('open_pr', 'done', 'PR #128 opened.'),
      step('code_review', 'running', 'Review agent running over the diff…'),
      step('address_feedback', 'pending'),
      step('qa_notes', 'pending'),
    ],
  },
  {
    id: 'run-eco-12',
    connection_id: 'mock-eco',
    connection_name: 'ECOINTERACTIVE LLC',
    provider: 'bitbucket',
    ticket_url: 'https://ecointeractive.atlassian.net/browse/ECO-12',
    ticket_key: 'ECO-12',
    ticket_summary: 'Migrate billing report query to the new schema',
    status: 'done',
    worktree_path: '~/Work/Ecointeractive/.worktrees/ECO-12',
    branch: 'feature/ECO-12',
    pr_url: 'https://bitbucket.org/ecointeractive/billing/pull-requests/77',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    steps: [
      step('implement', 'done'),
      step('open_pr', 'done', 'PR #77 opened and merged.'),
      step('code_review', 'done'),
      step('address_feedback', 'done', '2 comments addressed.'),
      step('qa_notes', 'done', 'QA Ready comment posted.'),
      step('move_card', 'done', 'Moved to QA.'),
    ],
  },
]

function ticketKeyFromUrl(url: string): string {
  const m = url.match(/([A-Z][A-Z0-9]+-\d+)/)
  return m ? m[1] : 'TICKET-?'
}

export const mockApi = {
  listRuns(): ImplementationRun[] {
    return [...RUNS].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  },

  getRun(id: string): ImplementationRun | undefined {
    return RUNS.find((r) => r.id === id)
  },

  launchRun(connectionId: string, connectionName: string, provider: 'github' | 'bitbucket', ticketUrl: string, steps: StepKind[], instructions?: string): ImplementationRun {
    const key = ticketKeyFromUrl(ticketUrl)
    const run: ImplementationRun = {
      id: `run-${key.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
      connection_id: connectionId,
      connection_name: connectionName,
      provider,
      ticket_url: ticketUrl,
      ticket_key: key,
      ticket_summary: null,
      instructions: instructions?.trim() || null,
      status: 'queued',
      worktree_path: null,
      branch: null,
      pr_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps: STEP_CATALOG.filter((d) => steps.includes(d.kind)).map((d) =>
        step(d.kind, 'pending'),
      ),
    }
    RUNS = [run, ...RUNS]
    return run
  },

  approveStep(runId: string, stepId: string): ImplementationRun | undefined {
    const run = RUNS.find((r) => r.id === runId)
    if (!run) return undefined
    const s = run.steps.find((st) => st.id === stepId)
    if (s) {
      s.status = 'done'
      s.ended_at = new Date().toISOString()
    }
    const next = run.steps.find((st) => st.status === 'pending')
    if (next) next.status = 'running'
    run.status = next ? 'running' : 'done'
    run.updated_at = new Date().toISOString()
    return run
  },

  cancelRun(runId: string): void {
    const run = RUNS.find((r) => r.id === runId)
    if (run) {
      run.status = 'cancelled'
      run.updated_at = new Date().toISOString()
    }
  },
}
