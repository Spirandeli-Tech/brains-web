import type { StepKind } from './types'

export interface StepDefinition {
  kind: StepKind
  label: string
  description: string
  /** Pauses for human approval before executing when true. */
  sensitive: boolean
  /** Whether the checkbox is pre-checked in the Play dialog. */
  defaultEnabled: boolean
}

/**
 * Canonical catalog of pipeline steps, in execution order.
 * Mirrors docs/features/implementations/README.md (§6).
 */
export const STEP_CATALOG: StepDefinition[] = [
  {
    kind: 'enrich_ticket',
    label: 'Enrich ticket',
    description: 'Analyzes the ticket and posts a grounded technical spec comment to Jira before coding starts.',
    sensitive: false,
    defaultEnabled: false,
  },
  {
    kind: 'move_to_progress',
    label: 'Move to In Progress',
    description: 'Moves the ticket to In Progress so your team sees work has started.',
    sensitive: false,
    defaultEnabled: true,
  },
  {
    kind: 'research',
    label: 'Research & discuss',
    description: 'Claude reads the ticket and asks clarifying questions before coding. You chat until ready.',
    sensitive: true,
    defaultEnabled: false,
  },
  {
    kind: 'implement',
    label: 'Implement',
    description: 'Claude implements the ticket on an isolated worktree.',
    sensitive: false,
    defaultEnabled: true,
  },
  {
    kind: 'open_pr',
    label: 'Open PR',
    description: 'Opens the pull request. Pauses so you can review the text.',
    sensitive: true,
    defaultEnabled: true,
  },
  {
    kind: 'code_review',
    label: 'Code review',
    description: 'Runs the context-free review agent over the diff.',
    sensitive: false,
    defaultEnabled: true,
  },
  {
    kind: 'address_feedback',
    label: 'Address feedback',
    description: 'Reads PR reviews and addresses the comments.',
    sensitive: false,
    defaultEnabled: true,
  },
  {
    kind: 'qa_notes',
    label: 'QA notes',
    description: 'Posts the "QA Ready" comment on the ticket.',
    sensitive: false,
    defaultEnabled: false,
  },
  {
    kind: 'move_card',
    label: 'Move card',
    description: 'Moves the ticket to the correct column. Pauses for approval.',
    sensitive: true,
    defaultEnabled: false,
  },
]

export const STEP_BY_KIND: Record<StepKind, StepDefinition> = STEP_CATALOG.reduce(
  (acc, def) => {
    acc[def.kind] = def
    return acc
  },
  {} as Record<StepKind, StepDefinition>,
)

export function stepLabel(kind: StepKind): string {
  return STEP_BY_KIND[kind]?.label ?? kind
}
