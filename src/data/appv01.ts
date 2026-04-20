/* ─────────────────────────────────────────────────
   /src/data/appv01.ts  —  PM Agent framed data
   ───────────────────────────────────────────────── */

export type WorkHealth = 'green' | 'yellow' | 'red'
export type WorkType = 'project' | 'hiring' | 'vendor' | 'client' | 'team' | 'compliance'
export type MessageRole = 'user' | 'ai'
export type MessageType = 'text' | 'config' | 'confirm'
export type ConvStatus = 'draft' | 'configured' | 'active'

export interface AgendaItem {
  label: string
  detail: string
}

export interface WorkConfig {
  title: string
  type: WorkType
  tools: string[]
  team: string[]
  checkInFreq: string
  reportFreq: string
  agenda: AgendaItem[]
}

export interface AgentMessage {
  id: string
  role: MessageRole
  msgType: MessageType
  text: string
  config?: WorkConfig
  timestamp: string
}

export interface AgentConversation {
  id: string
  title: string
  status: ConvStatus
  created: string
  workItemId?: string
  messages: AgentMessage[]
}

export interface WorkItem {
  id: string
  title: string
  type: WorkType
  health: WorkHealth
  team: string[]
  lastCheckin: string
  nextCheckin: string
  blockers: string[]
  progress: number
  tools: string[]
  description: string
  summary?: string
}

export interface AgentReport {
  id: string
  title: string
  created: string
  workItemId: string
  bullets: string[]
  risks: string[]
  decisions: string[]
}

/* ── User ── */
export const CURRENT_USER = {
  name: 'Aditya Kumar',
  initials: 'AK',
  role: 'Director of Operations',
  company: 'Harbor Health Supply',
  plan: 'Pro',
}

/* ── Work items ── */
export const WORK_ITEMS: WorkItem[] = [
  {
    id: 'wi-001',
    title: 'Auth Migration — Engineering',
    type: 'project',
    health: 'yellow',
    team: ['Marco R.', 'Priya S.', 'Leo K.', 'Aisha T.'],
    lastCheckin: '2025-01-13',
    nextCheckin: '2025-01-20',
    blockers: [
      'LIN-882 dependency not resolved — blocking Marco & Leo',
      'Staging environment cert expired — DevOps ticket open',
    ],
    progress: 62,
    tools: ['Linear', 'GitHub', 'PagerDuty'],
    description: 'JWT → OAuth 2.0 migration across all services. Scoped to Q1. PM Agent checks in with the 4 engineers weekly, monitors Linear for status changes, and surfaces blockers before they compound.',
    summary: '4 engineers on track. 2 hard blockers identified this week. Projected completion slipped by 5 days to Feb 14.',
  },
  {
    id: 'wi-002',
    title: 'Q1 Vendor Compliance Attestation',
    type: 'compliance',
    health: 'green',
    team: ['24 vendors'],
    lastCheckin: '2025-01-10',
    nextCheckin: '2025-01-24',
    blockers: [],
    progress: 75,
    tools: ['DocuSign', 'Salesforce'],
    description: 'Annual compliance attestation across all 24 active vendors. PM Agent pre-fills known data, chases non-responders automatically, and flags policy exceptions for legal review.',
    summary: '18 of 24 vendors attested. 3 flagged for policy exceptions — legal review scheduled Jan 22.',
  },
  {
    id: 'wi-003',
    title: 'Backend Engineer Hiring Pipeline',
    type: 'hiring',
    health: 'green',
    team: ['12 candidates', 'Sarah (hiring mgr)'],
    lastCheckin: '2025-01-13',
    nextCheckin: '2025-01-16',
    blockers: [],
    progress: 67,
    tools: ['Greenhouse', 'Lever'],
    description: 'Structured async screening for 12 senior backend candidates. PM Agent runs the STAR-format screening, tracks candidate progress, and surfaces calibrated scores to the hiring manager.',
    summary: '8 of 12 screened. 3 advancing to onsite. 2 candidates unresponsive — follow-up scheduled.',
  },
  {
    id: 'wi-004',
    title: 'Solaris Group — Client Onboarding',
    type: 'client',
    health: 'red',
    team: ['Dana (CSM)', 'Solaris: 3 stakeholders'],
    lastCheckin: '2025-01-09',
    nextCheckin: '2025-01-15',
    blockers: [
      'Primary stakeholder (James) unresponsive for 6 days — at risk of missing kickoff SLA',
    ],
    progress: 33,
    tools: ['Salesforce', 'Jira'],
    description: 'Post-sale kickoff for Solaris Group. PM Agent coordinates async pre-work across 3 stakeholders, tracks completion toward the Jan 17 kickoff call, and escalates if SLA is at risk.',
    summary: 'Only 1 of 3 stakeholders completed pre-work. James Chen has not responded in 6 days. Escalation to account exec triggered.',
  },
  {
    id: 'wi-005',
    title: 'Marketing Manager Hiring',
    type: 'hiring',
    health: 'yellow',
    team: ['8 candidates', 'Nadia (hiring mgr)'],
    lastCheckin: '2025-01-12',
    nextCheckin: '2025-01-17',
    blockers: ['Case study component taking longer than expected — 3 candidates asked for extension'],
    progress: 38,
    tools: ['Greenhouse'],
    description: 'Structured screening for Marketing Manager role. Includes brand strategy, demand gen depth, and a live case study component.',
    summary: '3 of 8 screened. 3 extension requests approved. Hiring manager wants to start onsites week of Jan 20.',
  },
  {
    id: 'wi-006',
    title: 'Atlas Supply — Contract Renewal',
    type: 'vendor',
    health: 'yellow',
    team: ['Atlas Supply: 2 contacts', 'Legal (internal)'],
    lastCheckin: '2025-01-12',
    nextCheckin: '2025-01-19',
    blockers: ['Atlas requested price renegotiation — not in renewal scope, escalated to procurement'],
    progress: 20,
    tools: ['DocuSign', 'Salesforce'],
    description: 'Annual contract renewal for Atlas Supply Co. PM Agent collects updated documents, coordinates signature workflow, and flags scope changes for procurement.',
    summary: 'Initial renewal draft sent. Atlas requesting 12% price reduction — escalated to procurement. Signature pending.',
  },
  {
    id: 'wi-007',
    title: 'Sprint 24 — Engineering',
    type: 'project',
    health: 'green',
    team: ['8 engineers'],
    lastCheckin: '2025-01-13',
    nextCheckin: '2025-01-20',
    blockers: [],
    progress: 71,
    tools: ['Linear', 'GitHub'],
    description: 'Weekly sprint check-in across the engineering team. PM Agent collects async standups, synthesizes blockers, and delivers a digest by 10 AM Monday.',
    summary: '7 of 8 responded. Velocity on track. Design system token delay flagged — unblocked by new token export from Figma.',
  },
  {
    id: 'wi-008',
    title: 'Q4 Performance Reviews',
    type: 'team',
    health: 'green',
    team: ['8 engineers', 'Aditya (mgr)'],
    lastCheckin: '2024-12-20',
    nextCheckin: '—',
    blockers: [],
    progress: 100,
    tools: ['Lattice'],
    description: 'End-of-year performance cycle for the engineering team. Self-reviews, manager reviews, and 30-min sync per person.',
    summary: 'All 8 reviews complete. 2 promotions approved. Comp adjustments queued for January payroll.',
  },
]

/* ── Agent conversations ── */
export const AGENT_CONVERSATIONS: AgentConversation[] = [
  {
    id: 'ac-001',
    title: 'Track auth migration project',
    status: 'active',
    created: '2025-01-06T09:00:00',
    workItemId: 'wi-001',
    messages: [
      {
        id: 'm1', role: 'user', msgType: 'text',
        text: 'Track the auth migration project. The team is Marco, Priya, Leo, and Aisha. We\'re using Linear and GitHub. I need weekly check-ins and a report every Friday for my director.',
        timestamp: '2025-01-06T09:00:00',
      },
      {
        id: 'm2', role: 'ai', msgType: 'config',
        text: 'Got it. I\'ll connect to Linear and GitHub, check in with the 4 engineers every Monday, and deliver a synthesized status brief to you every Friday. I\'ll flag blockers as they surface — not just at report time.',
        config: {
          title: 'Auth Migration — Engineering',
          type: 'project',
          tools: ['Linear', 'GitHub'],
          team: ['Marco R.', 'Priya S.', 'Leo K.', 'Aisha T.'],
          checkInFreq: 'Weekly · Monday 9 AM',
          reportFreq: 'Weekly · Friday 5 PM',
          agenda: [
            { label: 'Progress since last week', detail: 'What shipped or moved forward? Any Linear tickets to close?' },
            { label: 'Blockers & dependencies', detail: 'What\'s blocking you? Any external dependencies at risk?' },
            { label: 'This week\'s focus', detail: 'What\'s your main auth migration task this week?' },
            { label: 'Risk flag', detail: 'Anything that could slip the Feb 7 deadline — even early signals?' },
          ],
        },
        timestamp: '2025-01-06T09:00:14',
      },
      {
        id: 'm3', role: 'user', msgType: 'text',
        text: 'Activate',
        timestamp: '2025-01-06T09:01:45',
      },
      {
        id: 'm4', role: 'ai', msgType: 'confirm',
        text: 'Work stream active. Connected to Linear and GitHub. First check-ins dispatched to the team — first report lands Friday Jan 10.',
        timestamp: '2025-01-06T09:01:52',
      },
    ],
  },
  {
    id: 'ac-002',
    title: 'Monitor vendor compliance — Q1',
    status: 'active',
    created: '2025-01-03T10:15:00',
    workItemId: 'wi-002',
    messages: [
      {
        id: 'm1', role: 'user', msgType: 'text',
        text: 'Run Q1 compliance attestation for all 24 vendors. Deadline Jan 31. Pre-fill whatever we have from last year.',
        timestamp: '2025-01-03T10:15:00',
      },
      {
        id: 'm2', role: 'ai', msgType: 'config',
        text: 'I\'ll pull last year\'s data for all 24 vendors and pre-fill known fields. Each vendor only sees what\'s actually changed or expired. I\'ll chase non-responders automatically and flag policy exceptions for your legal team.',
        config: {
          title: 'Q1 Vendor Compliance Attestation',
          type: 'compliance',
          tools: ['DocuSign', 'Salesforce'],
          team: ['24 active vendors'],
          checkInFreq: 'Every 72 hrs for non-responders',
          reportFreq: 'Weekly · Friday',
          agenda: [
            { label: 'Entity confirmation', detail: 'Legal name and EIN — pre-filled, confirm if unchanged' },
            { label: 'Policy acknowledgment', detail: 'Review and sign updated code of conduct and data handling policy' },
            { label: 'Insurance verification', detail: 'Upload current COI — flag if coverage limits changed' },
            { label: 'Exception disclosure', detail: 'Report any known incidents or policy deviations since last attestation' },
          ],
        },
        timestamp: '2025-01-03T10:15:21',
      },
      {
        id: 'm3', role: 'user', msgType: 'text', text: 'Go', timestamp: '2025-01-03T10:16:33' },
      {
        id: 'm4', role: 'ai', msgType: 'confirm',
        text: 'Running. 24 vendors notified. Pre-filled data applied for 21 of 24 — 3 needed full re-entry. First status report Jan 10.',
        timestamp: '2025-01-03T10:16:39',
      },
    ],
  },
  {
    id: 'ac-003',
    title: 'Coordinate Solaris onboarding',
    status: 'configured',
    created: '2025-01-09T14:30:00',
    workItemId: 'wi-004',
    messages: [
      {
        id: 'm1', role: 'user', msgType: 'text',
        text: 'We just closed Solaris Group. Need to onboard 3 stakeholders before the Jan 17 kickoff call. Dana is the CSM. They\'re in Salesforce.',
        timestamp: '2025-01-09T14:30:00',
      },
      {
        id: 'm2', role: 'ai', msgType: 'config',
        text: 'I\'ll coordinate pre-kickoff async work across all 3 Solaris stakeholders. I\'ll pull their deal context from Salesforce, personalize each check-in, and escalate to Dana if any stakeholder is unresponsive for 48+ hours.',
        config: {
          title: 'Solaris Group — Client Onboarding',
          type: 'client',
          tools: ['Salesforce', 'Jira'],
          team: ['Dana (CSM)', 'Solaris: 3 stakeholders'],
          checkInFreq: 'Daily until kickoff (Jan 17)',
          reportFreq: 'On completion or escalation',
          agenda: [
            { label: 'Use case questionnaire', detail: 'What are your 3 most critical workflows to migrate in the first 90 days?' },
            { label: 'Team roster', detail: 'Who are your internal champions and day-to-day users?' },
            { label: 'Integration preferences', detail: 'Which tools do you need connected on day one?' },
            { label: 'Success definition', detail: 'What does a successful first 30 days look like to you?' },
          ],
        },
        timestamp: '2025-01-09T14:30:18',
      },
    ],
  },
]

/* ── Reports ── */
export const REPORTS: AgentReport[] = [
  {
    id: 'rep-001',
    title: 'Auth Migration — Weekly Brief',
    created: '2025-01-10T17:00:00',
    workItemId: 'wi-001',
    bullets: [
      '4 of 4 engineers responded to Monday check-in',
      'Token refresh service shipped by Priya — merged and in staging',
      'LIN-882 dependency still open — Marco and Leo blocked for 3rd consecutive week',
      'Staging cert expired — DevOps ticket raised, ETA Jan 14',
      'Current projected completion: Feb 14 (+5 days from original Feb 9 target)',
    ],
    risks: [
      'LIN-882 dependency: if not resolved by Jan 17, Q1 deadline is at risk',
      'Staging cert expiry blocking integration tests',
    ],
    decisions: [
      'Escalate LIN-882 to engineering director?',
      'Move integration test suite to a parallel staging environment?',
    ],
  },
  {
    id: 'rep-002',
    title: 'Vendor Compliance — Week of Jan 10',
    created: '2025-01-10T17:05:00',
    workItemId: 'wi-002',
    bullets: [
      '18 of 24 vendors attested (75%) — 7 days into 28-day window',
      '3 vendors flagged policy exceptions: Atlas Supply, TechPro LLC, Metro Freight',
      '6 vendors have not opened the session — 2nd reminder sent Jan 8',
      'Pre-fill accuracy: 21 of 24 vendors had no material changes from last year',
    ],
    risks: [
      '6 non-openers — if still unresponsive by Jan 20, may miss Jan 31 deadline',
      'Atlas Supply exception may require contract review before attestation can close',
    ],
    decisions: [
      'Approve 7-day extension for the 6 non-openers?',
      'Loop legal into Atlas Supply exception now or wait for their response?',
    ],
  },
  {
    id: 'rep-003',
    title: 'Backend Hiring Pipeline — Snapshot',
    created: '2025-01-13T09:30:00',
    workItemId: 'wi-003',
    bullets: [
      '8 of 12 candidates completed screening (67%)',
      '3 candidates advancing to onsite: Rahul M., Jenny C., Chris D.',
      '2 candidates unresponsive — follow-up sent Jan 12, no reply',
      'Average screening completion time: 34 minutes (target was under 45)',
      'Hiring manager calibration call scheduled Jan 16 for the 3 advancing candidates',
    ],
    risks: [
      '2 unresponsive candidates — withdraw from pipeline if no reply by Jan 15?',
    ],
    decisions: [
      'Withdraw the 2 unresponsive candidates and move to next in queue?',
      'Schedule onsite for all 3 advancing candidates this week or wait for more data?',
    ],
  },
  {
    id: 'rep-004',
    title: 'Sprint 24 — Monday Standup Digest',
    created: '2025-01-13T10:00:00',
    workItemId: 'wi-007',
    bullets: [
      '7 of 8 engineers responded (Kenji out — OOO until Jan 16)',
      'No critical blockers this week',
      'Design system token delay resolved — Figma export available',
      'Auth migration work continuing in parallel (2 engineers split across sprints)',
      'Sprint velocity: 34 points delivered vs 38 target — within acceptable range',
    ],
    risks: [],
    decisions: [
      'Reassign Kenji\'s sprint tasks while he\'s OOO or hold until Jan 16?',
    ],
  },
]

/* ── Contacts ── */
export type ContactStatus = 'active' | 'inactive' | 'flagged'
export type EngagementScore = 'A' | 'B' | 'C' | 'D'

export interface ContactSession {
  id: string
  title: string
  date: string
  status: 'complete' | 'active' | 'exception'
  outcome?: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  role?: string
  tags: string[]
  status: ContactStatus
  engagementScore: EngagementScore
  responseRate: number
  avgResponseHours: number
  preferredChannel: 'email' | 'sms' | 'phone'
  bestTime: string
  sessionsTotal: number
  sessionsCompleted: number
  lastActivity: string
  channelStats: { email: number; sms: number; phone: number }
  recentSessions: ContactSession[]
  aiInsight: string
}

export const CONTACTS: Contact[] = [
  {
    id: 'ct-01', name: 'Alex Torres', email: 'alex.torres@constructiq.com', phone: '(512) 555-0182',
    company: 'ConstructIQ LLC', role: 'Operations Lead', tags: ['vendor', 'construction', 'Q1'],
    status: 'active', engagementScore: 'A', responseRate: 94, avgResponseHours: 2.8,
    preferredChannel: 'email', bestTime: 'Mon–Thu, 9–11 AM',
    sessionsTotal: 4, sessionsCompleted: 4, lastActivity: 'Jan 8, 2025',
    channelStats: { email: 96, sms: 70, phone: 88 },
    recentSessions: [
      { id: 's1', title: 'Vendor Onboarding — Q4 2024', date: 'Oct 12', status: 'complete', outcome: 'All docs collected & verified' },
      { id: 's2', title: 'COI Renewal — Jan 2025', date: 'Jan 8', status: 'complete', outcome: 'Policy renewed, new cert on file' },
    ],
    aiInsight: 'Responds to 94% of first-touch emails within 3 hours. Highest engagement Mon–Tue mornings. Never needed more than 1 follow-up. SMS opens but rarely replies — use email.',
  },
  {
    id: 'ct-02', name: 'Linda Zhao', email: 'lzhao@solarisgroup.com', phone: '(858) 555-0763',
    company: 'Solaris Group', role: 'Compliance Officer', tags: ['client', 'compliance', 'healthcare'],
    status: 'active', engagementScore: 'A', responseRate: 97, avgResponseHours: 2.1,
    preferredChannel: 'email', bestTime: 'Tue–Fri, 8 AM–12 PM',
    sessionsTotal: 5, sessionsCompleted: 5, lastActivity: 'Jan 9, 2025',
    channelStats: { email: 98, sms: 62, phone: 88 },
    recentSessions: [
      { id: 's3', title: 'Client Kickoff — Pre-work', date: 'Jan 9', status: 'active', outcome: undefined },
      { id: 's4', title: 'Q4 Compliance Attestation', date: 'Dec 18', status: 'complete', outcome: 'All 12 items signed' },
    ],
    aiInsight: 'Extremely reliable — 97% response rate, replies in ~2 hours. Works best Tuesday through Friday mornings. Avoid Monday mornings. Uses email exclusively for work.',
  },
  {
    id: 'ct-03', name: 'James Park', email: 'james.park@pm.me', phone: '(628) 555-0039',
    role: 'Independent Contractor', tags: ['contractor', 'freelance', 'engineering'],
    status: 'active', engagementScore: 'B', responseRate: 77, avgResponseHours: 14.3,
    preferredChannel: 'sms', bestTime: 'Fri afternoons or weekends',
    sessionsTotal: 3, sessionsCompleted: 3, lastActivity: 'Jan 5, 2025',
    channelStats: { email: 65, sms: 88, phone: 60 },
    recentSessions: [
      { id: 's5', title: 'Contractor Onboarding', date: 'Oct 14', status: 'complete', outcome: 'W-9, NDA, and SOW collected' },
      { id: 's6', title: 'Deliverable Check-in — Sprint 23', date: 'Jan 5', status: 'complete', outcome: 'Auth module shipped, on schedule' },
    ],
    aiInsight: 'Responds best to SMS (88% vs 65% email). Typically replies Friday afternoons or weekends — he\'s likely working during business hours. Give a 2-day window before first follow-up.',
  },
  {
    id: 'ct-04', name: 'Priya Mehta', email: 'p.mehta@atlasglobal.com', phone: '(718) 555-0091',
    company: 'Atlas Supply Co.', role: 'Procurement Lead', tags: ['vendor', 'supply chain', 'contract-renewal'],
    status: 'active', engagementScore: 'B', responseRate: 72, avgResponseHours: 18.5,
    preferredChannel: 'email', bestTime: 'Wed & Thu, 10 AM–2 PM',
    sessionsTotal: 3, sessionsCompleted: 2, lastActivity: 'Jan 12, 2025',
    channelStats: { email: 74, sms: 41, phone: 68 },
    recentSessions: [
      { id: 's7', title: 'Contract Renewal — Atlas Supply', date: 'Jan 12', status: 'active', outcome: undefined },
      { id: 's8', title: 'Q4 Compliance Attestation', date: 'Dec 3', status: 'exception', outcome: 'Escalated — exception: price renegotiation request' },
    ],
    aiInsight: 'Moderate engagement — responds in 18 hours on average. Email works better than SMS. Mid-week is her most responsive window. The Q4 exception was unusual; flag contract scope deviations to procurement early.',
  },
  {
    id: 'ct-05', name: 'Kevin Okafor', email: 'kokafor@gmail.com', phone: '(202) 555-0318',
    role: 'Candidate — Backend Engineer', tags: ['candidate', 'engineering', 'Q1-hiring'],
    status: 'flagged', engagementScore: 'D', responseRate: 22, avgResponseHours: 72,
    preferredChannel: 'phone', bestTime: 'Unknown — low engagement across all channels',
    sessionsTotal: 2, sessionsCompleted: 0, lastActivity: 'Jan 9, 2025',
    channelStats: { email: 20, sms: 28, phone: 42 },
    recentSessions: [
      { id: 's9', title: 'Backend Engineer Screening — Jan 2025', date: 'Jan 9', status: 'exception', outcome: 'Closed after 3 follow-ups — no response' },
    ],
    aiInsight: 'Has not completed any sessions. Phone has the best (but still low) success rate at 42%. Flagged after 3 unanswered follow-ups. Consider withdrawing from pipeline if no response after direct outreach.',
  },
  {
    id: 'ct-06', name: 'Dana Castillo', email: 'dana.c@harborhealthsupply.com', phone: '(415) 555-0247',
    company: 'Harbor Health Supply', role: 'Client Success Manager (Internal)', tags: ['internal', 'csm', 'solaris'],
    status: 'active', engagementScore: 'A', responseRate: 100, avgResponseHours: 0.5,
    preferredChannel: 'email', bestTime: 'Any weekday',
    sessionsTotal: 12, sessionsCompleted: 12, lastActivity: 'Jan 13, 2025',
    channelStats: { email: 100, sms: 91, phone: 95 },
    recentSessions: [
      { id: 's10', title: 'Solaris Onboarding Coordination', date: 'Jan 9', status: 'active', outcome: undefined },
      { id: 's11', title: 'Client Kickoff Prep — Solaris', date: 'Jan 9', status: 'active', outcome: undefined },
    ],
    aiInsight: 'Internal CSM — responds instantly. Acts as a relay for the Solaris relationship. Loop her in on all Solaris-facing communications. No channel preference needed — she monitors everything.',
  },
  {
    id: 'ct-07', name: 'Tom Walters', email: 'twalters@bridgewaterlaw.com', phone: '(312) 555-0882',
    company: 'Bridgewater Legal', role: 'Managing Partner', tags: ['vendor', 'legal', 'retainer'],
    status: 'inactive', engagementScore: 'C', responseRate: 61, avgResponseHours: 26.1,
    preferredChannel: 'phone', bestTime: 'Mon mornings before 10 AM',
    sessionsTotal: 4, sessionsCompleted: 2, lastActivity: 'Nov 30, 2024',
    channelStats: { email: 55, sms: 30, phone: 74 },
    recentSessions: [
      { id: 's12', title: 'Contract Review — Nov 2024', date: 'Nov 30', status: 'complete', outcome: 'Review complete, 2 redlines noted' },
      { id: 's13', title: 'NDA Batch — Oct 2024', date: 'Oct 5', status: 'exception', outcome: 'Escalated — completed via phone call' },
    ],
    aiInsight: 'Responsive by phone (74%) but hard to reach by email. Monday mornings work best — avoid Fridays. Consider calling first for time-sensitive items, email as a backup record.',
  },
  {
    id: 'ct-08', name: 'Maria Chen', email: 'mchen@vertexllc.io', phone: '(415) 555-0247',
    company: 'Vertex Solutions LLC', role: 'Principal Consultant', tags: ['vendor', 'engineering', 'Q1'],
    status: 'active', engagementScore: 'A', responseRate: 89, avgResponseHours: 5.1,
    preferredChannel: 'email', bestTime: 'Tue & Wed, 10 AM–12 PM',
    sessionsTotal: 3, sessionsCompleted: 3, lastActivity: 'Jan 12, 2025',
    channelStats: { email: 91, sms: 44, phone: 76 },
    recentSessions: [
      { id: 's14', title: 'Engineering Screening — Jan 2025', date: 'Jan 8', status: 'complete', outcome: '84/100 — Advancing to final round' },
    ],
    aiInsight: 'Strong responder — replies within 5 hrs on average. Prefers email; phone works for urgent follow-ups. Avoid SMS — 44% open rate suggests she doesn\'t monitor that channel.',
  },
]

/* ── Quick actions ── */
export const QUICK_ACTIONS = [
  { id: 'track-project', label: 'Track a project', icon: '📊', example: 'Track the auth migration — team of 4 engineers using Linear and GitHub, weekly check-ins, Friday report' },
  { id: 'run-standup', label: 'Run standups', icon: '⚡', example: 'Weekly async standup for my engineering team of 8 — blockers, progress, focus' },
  { id: 'hire', label: 'Manage a hiring pipeline', icon: '🎯', example: 'Screen 10 backend engineering candidates for a senior role, STAR format' },
  { id: 'onboard-client', label: 'Onboard a client', icon: '🤝', example: 'Coordinate pre-kickoff onboarding for Solaris Group — 3 stakeholders, kickoff Jan 17' },
  { id: 'vendor-compliance', label: 'Vendor compliance', icon: '✅', example: 'Run Q1 compliance attestation for all 24 active vendors, deadline Jan 31' },
  { id: 'collect-docs', label: 'Collect deliverables', icon: '📄', example: 'Collect signed contracts and COI renewals from 12 vendor partners' },
]
