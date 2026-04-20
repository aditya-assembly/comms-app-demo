# Comms app demo

Offline demo of the Comms product experience for **AgileOne supplier / contractor onboarding** (domestic MSP). Same UI patterns as the production Comms app, with in-memory mock APIs — no backend required.

## Demo intent

This app exists so you can **click through the real shell** (Agent, Templates, Sessions, flow steps) and show prospects something **credible and interactive**, not a slide deck. The mock layer drives **product flow steps end to end**—information, email outreach, conversation-from-template, and action triggers—so each screen updates as you advance. It is **good enough to demo**, not a substitute for production APIs.

## Run locally

```bash
npm install
npm run dev
```

Opens [http://localhost:5202](http://localhost:5202) (use cases → Agent, Templates, Sessions, People, etc. — same shell as production Comms).

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

Same **routing and shell** as production Comms (`/app/*` → `AppShell`: Agent, Templates, Sessions, Conversations, People, Integrations; session and conversation overlays unchanged). Differences: root **`/`** is the **use cases** picker; **`MockCommsAPI`** replaces all HTTP calls.

| Area | Covered in demo |
|------|------------------|
| Templates | **7** product flow templates (`src/demo/supplier-template-flows.ts`) — General Staffing, Healthcare, recert, multi-state, 1099, MSA+SOW, post-approval |
| Stable IDs | `supplier_onboarding_id` on session metadata + People `reference` (`soi-*`) |
| Intake | People + Integrations CSV import (mocked success) |
| Comms setup | Agent + Templates: channel, checklist, reminders, validation narrative (copy in templates / session plan) |
| Preview → invite | Dashboard copy + Templates/Sessions with scripted step updates |
| Analysis | Pipeline, filters, TAT, SPE queue, export toast |
| Q&A | Agent scripted answers (COI, MSA, programs, CA addenda, SharePoint, Venda, exceptions, escalation) |
| Exceptions | Dashboard cards + Agent |
| CRM / calendar | People + recertification / 60-day narrative (Agent / docs) |
