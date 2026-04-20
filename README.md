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

- **Netlify:** connect this repo with build command `npm run build`, publish directory `dist`, or use the included `netlify.toml`.

## Notes

- Auth and workspace state use separate localStorage keys (`comms-demo-auth`, `comms-demo-workspace`) so they do not clash with a local production Comms app.
