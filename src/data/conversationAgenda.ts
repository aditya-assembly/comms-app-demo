/** Structured agenda + question plan for “Review Comms” before invites send. */

export type ConversationSessionType = 'Collect' | 'Test' | 'Review' | 'Train'

export interface AgendaBlock {
  title: string
  summary: string
  questions: string[]
}

export function buildAgendaBlocks(sessionType: ConversationSessionType, sessionTitle: string): AgendaBlock[] {
  const t = sessionTitle
  switch (sessionType) {
    case 'Collect':
      return [
        {
          title: 'Opening & identity',
          summary: `Confirm participant identity and tie ${t} to the right record in your systems.`,
          questions: [
            'Legal name and entity as it should appear on files',
            'Best contact for corrections or resubmits',
          ],
        },
        {
          title: 'Structured checklist',
          summary: 'Walk the conversation through each required item with uploads and read-backs where needed.',
          questions: [
            'Per-document validation (EIN, policy numbers, effective dates)',
            'Named insured / limits vs contract requirements',
            'Attestation that submissions are complete and accurate',
          ],
        },
        {
          title: 'Exceptions & handoff',
          summary: 'Code gaps, route to human if required, and confirm what happens next.',
          questions: [
            'What’s missing or conditional vs blocked?',
            'Who should receive the manifest when done?',
          ],
        },
      ]
    case 'Test':
      return [
        {
          title: 'Context & warm-up',
          summary: 'Establish role, timebox, and consent for the assessment.',
          questions: [
            'Role and scope confirmation',
            'Logistics and knockout gates (if any)',
          ],
        },
        {
          title: 'Structured assessment',
          summary: 'Agenda-driven probes mapped to your rubric—not free-form chat.',
          questions: [
            'Scenario or competency blocks from your library',
            'Adaptive follow-ups based on depth of answers',
            'Evidence capture (quotes, timestamps) per rubric row',
          ],
        },
        {
          title: 'Close & scoring',
          summary: 'Summarize signal, apply decision rules, and prep ranked outcome.',
          questions: [
            'Per-dimension scores with rationale',
            'Advance / hold / reject recommendation',
          ],
        },
      ]
    case 'Review':
      return [
        {
          title: 'Material walkthrough',
          summary: 'Guide the participant section by section with comprehension checks.',
          questions: [
            'Key policy points restated in plain language',
            '“Explain back” prompts after dense sections',
          ],
        },
        {
          title: 'Verification loops',
          summary: 'Confirm understanding before attestation—not just “I agree.”',
          questions: [
            'Targeted true/false or scenario checks',
            'Clarifications routed to human if confidence is low',
          ],
        },
        {
          title: 'Attestation & record',
          summary: 'Signed record suitable for audit with timestamps and scope.',
          questions: [
            'Identity reconfirmation',
            'Formal attestation + archive to session object',
          ],
        },
      ]
    case 'Train':
      return [
        {
          title: 'Scenario framing',
          summary: 'Set stakes, persona, and success criteria for the drill.',
          questions: [
            'Objective and guardrails for the exercise',
            'Participant goals for the session',
          ],
        },
        {
          title: 'Guided practice',
          summary: 'Role-play or simulation with rubric-aligned coaching.',
          questions: [
            'Branching prompts based on participant choices',
            'Micro-corrections between turns',
          ],
        },
        {
          title: 'Debrief & next steps',
          summary: 'Scores, themes, and concrete improvements.',
          questions: [
            'What went well / what to change next time',
            'Remedial path if below bar',
          ],
        },
      ]
    default:
      return buildAgendaBlocks('Collect', sessionTitle)
  }
}

/** Match Dispatcher keyword routing. */
export function inferSessionTypeFromFlags(flags: {
  isTest: boolean
  isTrain: boolean
  isReview: boolean
  isCollect: boolean
}): ConversationSessionType {
  if (flags.isTest) return 'Test'
  if (flags.isTrain) return 'Train'
  if (flags.isReview) return 'Review'
  if (flags.isCollect) return 'Collect'
  return 'Collect'
}

/** Rough type for use-case cards (EndToEnd flow). */
export function inferSessionTypeForUseCase(uc: { title: string; pillar: string }): ConversationSessionType {
  const t = uc.title.toLowerCase()
  if (t.includes('train') || t.includes('role play') || uc.pillar === 'learning') return 'Train'
  if (
    t.includes('screen') ||
    t.includes('technical interview') ||
    (t.includes('interview') && uc.pillar === 'talent' && !t.includes('prep'))
  )
    return 'Test'
  if (t.includes('review') || t.includes('compliance') || t.includes('verification') || t.includes('attest'))
    return 'Review'
  return 'Collect'
}
