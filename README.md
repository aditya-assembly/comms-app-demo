# Comms app demo

Offline demo of the Comms product experience for **AgileOne supplier / contractor onboarding** (domestic MSP). Same UI patterns as the production Comms app, with in-memory mock APIs — no backend required.

## Run locally

```bash
npm install
npm run dev
```

Opens [http://localhost:5202](http://localhost:5202) (use cases → Program dashboard → Agent, Sessions, People, etc.).

## Build

```bash
npm run build
```

Output: `dist/`. Use `npm run build:strict` if you want TypeScript checking before build (may require fixing upstream strict issues in copied UI).

## Deploy

- **GitHub:** [github.com/aditya-assembly/comms-app-demo](https://github.com/aditya-assembly/comms-app-demo)
- **Netlify (production):** [comms-app-demo.netlify.app](https://comms-app-demo.netlify.app) — build `npm run build`, publish `dist`, Node 20 (see `netlify.toml`). Continuous deploy: connect the GitHub repo in the Netlify UI and use the same settings.

## Notes

- Auth and workspace state use separate localStorage keys (`comms-demo-auth`, `comms-demo-workspace`) so they do not clash with a local production Comms app.

## QA (supplier onboarding use case)

Same **routing and shell** as production Comms (`/app/*` → `AppShell`: Program dashboard, Agent, Templates, Sessions, Conversations, People, Integrations; session and conversation overlays unchanged). Differences: root **`/`** is the **use cases** picker; **`MockCommsAPI`** replaces all HTTP calls.

| Area | Covered in demo |
|------|------------------|
| Templates | **7** product flow templates (`src/demo/supplier-template-flows.ts`) — General Staffing, Healthcare, recert, multi-state, 1099, MSA+SOW, post-approval |
| Stable IDs | `supplier_onboarding_id` on session metadata + People `reference` (`soi-*`) |
| Intake | People + Integrations CSV import (mocked success) |
| Comms setup | Program dashboard: channel, checklist, reminders, validation narrative |
| Preview → invite | Dashboard copy + Templates/Sessions with scripted step updates |
| Analysis | Pipeline, filters, TAT, SPE queue, export toast |
| Q&A | Agent scripted answers (COI, MSA, programs, CA addenda, SharePoint, Venda, exceptions, escalation) |
| Exceptions | Dashboard cards + Agent |
| CRM / calendar | People + recertification / 60-day copy on dashboard |
