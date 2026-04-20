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
