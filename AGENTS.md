# AGENTS.md

Repository facts for automated coding assistants. Teams may edit or remove this file.

## Layout
- `api/` (Express, Mongoose), `frontend/` (Vite, React), `crawler/` (GitHub crawl of `bcgovpubcode.yml`), `database/` (MongoDB image), `schema/` (JSON Schema)
- Helm chart: `charts/pubcode` (`charts/pubcode/values.yaml`)
- Workflows: `.github/workflows/` (PR: `pr-open.yml`, `pr-close.yml`, `pr-validate.yml`; merge: `merge.yml`; crawler and schema jobs: `scheduled.yml`; reusable: `.deploy.yml`, `.tests.yml`)

## Build, test, deploy
- Local stack: `docker compose up` (MongoDB, API on port 3005, Caddy frontend on port 3002). Caddy serves `frontend/dist`, so run `cd frontend && npm ci && npm run build` first. API: `cd api && npm ci && npm run dev`. Crawler: `cd crawler && npm ci && npm run dev`
- Frontend (`cd frontend`, Node 24): `npm run dev` (Vite port 3001 in `frontend/vite.config.js`), `npm run build`, `npm run lint`. E2E: `npx cypress run --config baseUrl=http://localhost:3001` with `npm run dev` up. `frontend/cypress.config.js` sets `baseUrl` to `http://localhost:5173`. CI (`.github/workflows/.tests.yml`) overrides `baseUrl` to the deployed route
- Images `api`, `database`, and `frontend` are built in GitHub Actions by `bcgov/actions/builder` (`pr-open.yml`). OpenShift Helm deploys run from GitHub Actions (`pr-open.yml` for pull requests; `merge.yml` deploys test, then prod), not a workstation

## Shared actions
- Shared actions are not in this repo. Use `bcgov/actions/*` and `bcgov/actions-openshift/*` as provided; don't copy or fork them.
- Never pin `@main`. Pin bcgov shared actions to a published release SHA with a `# vX.Y.Z` comment.
