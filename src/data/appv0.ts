/* ─────────────────────────────────────────────────
   /src/data/appv0.ts  —  all fake data for the v0 app
   ───────────────────────────────────────────────── */

/* ── Types ── */
export type SessionType = 'collect' | 'test' | 'review' | 'train'
export type SessionMode = 'async' | 'sync' | 'both'
export type SessionStatus = 'draft' | 'active' | 'complete' | 'archived'
export type CommsStatus = 'draft' | 'configured' | 'sent'
export type MessageRole = 'user' | 'ai'
export type MessageType = 'text' | 'config' | 'sent-confirm'

export interface AgendaItem {
  label: string
  detail: string
}

export interface CommsConfig {
  title: string
  type: SessionType
  mode: SessionMode
  delivery: string
  followUps: number
  participants: string
  agenda: AgendaItem[]
}

export interface Message {
  id: string
  role: MessageRole
  msgType: MessageType
  text: string
  config?: CommsConfig
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  status: CommsStatus
  created: string
  sessionId?: string
  messages: Message[]
}

export interface Session {
  id: string
  title: string
  type: SessionType
  mode: SessionMode
  status: SessionStatus
  participants: number
  completed: number
  created: string
  dueDate?: string
  description: string
  tags: string[]
  outcome?: string
}

/* ── Current user ── */
export const CURRENT_USER = {
  name: 'Aditya Kumar',
  initials: 'AK',
  email: 'aditya@harborhealthsupply.com',
  role: 'Operations Lead',
  company: 'Harbor Health Supply',
  plan: 'Pro',
}

/* ── Sessions ── */
export const SESSIONS: Session[] = [
  {
    id: 'sess-001',
    title: 'Backend Engineer Screening — Jan 2025',
    type: 'test',
    mode: 'async',
    status: 'active',
    participants: 12,
    completed: 8,
    created: '2025-01-08',
    dueDate: '2025-01-22',
    description: 'Structured async screening for backend engineering candidates. 5-dimension STAR-format rubric covering technical depth, problem-solving, communication, collaboration, and culture fit.',
    tags: ['engineering', 'hiring'],
    outcome: undefined,
  },
  {
    id: 'sess-002',
    title: 'Vendor COI Renewals — Q1 2025',
    type: 'collect',
    mode: 'async',
    status: 'active',
    participants: 24,
    completed: 18,
    created: '2025-01-06',
    dueDate: '2025-01-31',
    description: 'Annual certificate of insurance renewal for all 24 active vendors. Context pre-filled from Q4 2024 submissions — only expired or changed items flagged.',
    tags: ['operations', 'compliance'],
    outcome: undefined,
  },
  {
    id: 'sess-003',
    title: 'New Hire Onboarding — Maria Chen',
    type: 'collect',
    mode: 'async',
    status: 'complete',
    participants: 1,
    completed: 1,
    created: '2025-01-03',
    description: 'Pre-start onboarding document collection for Maria Chen (Principal Engineer). I-9, direct deposit, emergency contact, equipment preferences, and offer letter signature.',
    tags: ['hr', 'onboarding'],
    outcome: 'All 5 documents collected. Equipment order placed. Start date confirmed Jan 13.',
  },
  {
    id: 'sess-004',
    title: 'Q3 OKR Check-in — Dept Leads',
    type: 'collect',
    mode: 'async',
    status: 'complete',
    participants: 6,
    completed: 6,
    created: '2024-10-01',
    description: 'End-of-quarter OKR health check across all 6 department leads. Rating, blockers, and what needs executive attention before EOQ.',
    tags: ['strategy', 'leadership'],
    outcome: '4 objectives on track. 2 at risk (Auth Migration, Hiring). Leadership brief delivered Oct 3.',
  },
  {
    id: 'sess-005',
    title: 'Candidate Screening — Marketing Manager',
    type: 'test',
    mode: 'async',
    status: 'active',
    participants: 8,
    completed: 3,
    created: '2025-01-10',
    dueDate: '2025-01-24',
    description: 'Structured screening for the Marketing Manager role. Covers brand strategy, demand gen experience, cross-functional collaboration, and a case study component.',
    tags: ['marketing', 'hiring'],
    outcome: undefined,
  },
  {
    id: 'sess-006',
    title: 'Vendor Compliance Attestation — Q4 2024',
    type: 'collect',
    mode: 'async',
    status: 'complete',
    participants: 40,
    completed: 37,
    created: '2024-12-02',
    description: 'Quarterly compliance attestation for all active vendor partners. Each vendor attest to reviewing the updated code of conduct, data handling policy, and insurance requirements.',
    tags: ['operations', 'compliance', 'vendors'],
    outcome: '37 of 40 attested. 3 exceptions flagged: Atlas Supply, TechPro LLC, Metro Freight. Legal notified.',
  },
  {
    id: 'sess-007',
    title: 'Client Kickoff — Solaris Group',
    type: 'collect',
    mode: 'both',
    status: 'active',
    participants: 3,
    completed: 1,
    created: '2025-01-09',
    dueDate: '2025-01-17',
    description: 'Post-sale kickoff workflow for Solaris Group. Async pre-work (use case questionnaire, team roster, integration preferences) before a 45-minute kickoff call.',
    tags: ['customer-success', 'clients'],
    outcome: undefined,
  },
  {
    id: 'sess-008',
    title: 'Contract Renewal — Atlas Supply',
    type: 'collect',
    mode: 'async',
    status: 'draft',
    participants: 1,
    completed: 0,
    created: '2025-01-12',
    dueDate: '2025-01-31',
    description: 'Annual contract renewal and document refresh for Atlas Supply Co. Comms draft generated — not yet sent.',
    tags: ['operations', 'legal'],
    outcome: undefined,
  },
  {
    id: 'sess-009',
    title: 'Performance Review — Eng Team Q4',
    type: 'review',
    mode: 'both',
    status: 'complete',
    participants: 8,
    completed: 8,
    created: '2024-12-16',
    description: 'End-of-year performance review cycle for the engineering team. Async self-review + manager review, followed by 30-minute sync per engineer.',
    tags: ['hr', 'engineering'],
    outcome: 'All 8 reviews complete. 2 promotions approved. Comp adjustments queued for Jan payroll.',
  },
  {
    id: 'sess-010',
    title: 'Weekly Standup — Engineering · Jan W2',
    type: 'collect',
    mode: 'async',
    status: 'complete',
    participants: 8,
    completed: 7,
    created: '2025-01-13',
    description: 'Weekly async standup collection. What did you ship, what\'s blocked, what\'s your focus this week?',
    tags: ['engineering', 'team'],
    outcome: '7/8 responded. 2 blockers surfaced: auth migration (LIN-882 dependency) and design system token delay.',
  },
]

/* ── Conversations (Dispatcher history) ── */
export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-001',
    title: 'Screen backend engineers',
    status: 'sent',
    created: '2025-01-08T08:42:00',
    sessionId: 'sess-001',
    messages: [
      {
        id: 'm1',
        role: 'user',
        msgType: 'text',
        text: 'I need to screen 10-12 backend engineering candidates for a senior backend role. Focus on system design, distributed systems, and problem-solving. STAR format if possible.',
        timestamp: '2025-01-08T08:42:00',
      },
      {
        id: 'm2',
        role: 'ai',
        msgType: 'config',
        text: 'Got it — here\'s a structured async screening designed for senior backend candidates. 5-dimension STAR-format rubric, calibrated for distributed systems depth. Review the draft before sending.',
        config: {
          title: 'Backend Engineer Screening — Jan 2025',
          type: 'test',
          mode: 'async',
          delivery: 'Email · 3 follow-ups · 48hr spacing',
          followUps: 3,
          participants: '12 candidates',
          agenda: [
            { label: 'Technical depth', detail: 'System design for a distributed rate-limiter — STAR format' },
            { label: 'Problem-solving', detail: 'Debugging a data consistency bug at scale — walk me through your approach' },
            { label: 'Communication', detail: 'Describe a complex technical decision you had to explain to non-engineers' },
            { label: 'Collaboration', detail: 'Tell me about a time you resolved a significant technical disagreement on your team' },
            { label: 'Culture fit', detail: 'What does a great engineering environment look like to you?' },
          ],
        },
        timestamp: '2025-01-08T08:42:12',
      },
      {
        id: 'm3',
        role: 'user',
        msgType: 'text',
        text: 'Looks good. Send it.',
        timestamp: '2025-01-08T08:44:03',
      },
      {
        id: 'm4',
        role: 'ai',
        msgType: 'sent-confirm',
        text: 'Session dispatched to 12 candidates. First responses expected within 24–48 hours.',
        timestamp: '2025-01-08T08:44:08',
      },
    ],
  },
  {
    id: 'conv-002',
    title: 'Vendor COI renewals — Q1',
    status: 'sent',
    created: '2025-01-06T09:15:00',
    sessionId: 'sess-002',
    messages: [
      {
        id: 'm1',
        role: 'user',
        msgType: 'text',
        text: 'Send COI renewal requests to all 24 active vendors. Pre-fill from last year\'s submissions where possible — only ask for what actually changed.',
        timestamp: '2025-01-06T09:15:00',
      },
      {
        id: 'm2',
        role: 'ai',
        msgType: 'config',
        text: 'I\'ve pulled last year\'s submission data for all 24 vendors. Most fields will be pre-filled — the session will only surface what\'s changed or expired. Average expected completion time: under 5 minutes per vendor.',
        config: {
          title: 'Vendor COI Renewals — Q1 2025',
          type: 'collect',
          mode: 'async',
          delivery: 'Email · 3 follow-ups · 72hr spacing',
          followUps: 3,
          participants: '24 active vendors',
          agenda: [
            { label: 'Entity confirmation', detail: 'Confirm legal name and EIN haven\'t changed (pre-filled from file)' },
            { label: 'COI upload', detail: 'Upload current certificate of insurance — flag if expired' },
            { label: 'Coverage limits', detail: 'Confirm GL and professional liability limits meet contract minimums' },
            { label: 'Named insured verification', detail: 'Verify named insured matches the signed contract' },
          ],
        },
        timestamp: '2025-01-06T09:15:18',
      },
      {
        id: 'm3',
        role: 'user',
        msgType: 'text',
        text: 'Accept & send',
        timestamp: '2025-01-06T09:16:30',
      },
      {
        id: 'm4',
        role: 'ai',
        msgType: 'sent-confirm',
        text: 'Session dispatched to 24 vendors. Context pre-filled for all. 6 vendors flagged for COI expiry — they\'ll be prompted to upload on first open.',
        timestamp: '2025-01-06T09:16:35',
      },
    ],
  },
  {
    id: 'conv-003',
    title: 'Weekly standup — engineering',
    status: 'configured',
    created: '2025-01-13T08:50:00',
    messages: [
      {
        id: 'm1',
        role: 'user',
        msgType: 'text',
        text: 'Weekly standup for my engineering team of 8. Collect blockers, progress, and focus for this week. Keep it short — 3 minutes max per person.',
        timestamp: '2025-01-13T08:50:00',
      },
      {
        id: 'm2',
        role: 'ai',
        msgType: 'config',
        text: 'Here\'s a compact Monday check-in — 3 targeted questions. I\'ll synthesize responses into a blockers digest by 10 AM. Configured as a recurring cadence (weekly, Mon 9 AM).',
        config: {
          title: 'Weekly Standup — Engineering',
          type: 'collect',
          mode: 'async',
          delivery: 'Email · 1 follow-up · recurring weekly Mon 9 AM',
          followUps: 1,
          participants: '8 team members',
          agenda: [
            { label: 'Shipped last week', detail: 'What did you complete or ship since last Monday?' },
            { label: 'Blocked or at risk', detail: 'Anything blocking you or at risk of slipping? What do you need?' },
            { label: 'Focus this week', detail: 'What\'s your main focus this week?' },
          ],
        },
        timestamp: '2025-01-13T08:50:09',
      },
    ],
  },
]

/* ── Quick action prompts ── */
export const QUICK_ACTIONS = [
  { id: 'screen', label: 'Screen candidates', icon: '🎯', example: 'Screen 10 backend engineering candidates for a senior role' },
  { id: 'collect', label: 'Collect documents', icon: '📄', example: 'Collect COI and W-9 renewals from 24 active vendors' },
  { id: 'standup', label: 'Team standup', icon: '⚡', example: 'Weekly standup for my engineering team of 8' },
  { id: 'onboard', label: 'Onboard someone', icon: '👋', example: 'New hire onboarding for a principal engineer starting Jan 20' },
  { id: 'checkin', label: 'Check in', icon: '🔄', example: 'Monthly 1:1 check-in with my direct report Jordan Lee' },
  { id: 'survey', label: 'Run a survey', icon: '📊', example: 'Q4 employee satisfaction survey — 15 min, anonymous' },
]
