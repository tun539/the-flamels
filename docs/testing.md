# Verification

Backend: python -m unittest discover -s backend/tests
Frontend: npm --prefix frontend ci && npm --prefix frontend run typecheck && npm --prefix frontend run build
Browser: cd frontend && npx playwright install --with-deps chromium && npm run test:e2e

Browser tests launch real backend/frontend processes and exercise the library, ten-column table, paper reader, comparison, scenario evaluation, evidence answer, export, coverage and mobile overflow. They run against the production build. CHROMIUM_EXECUTABLE_PATH can select an installed Chromium binary in constrained environments.

Provider tests mock OpenAI Responses and embeddings; they check invented citation rejection and cache reuse. They do not establish live provider availability or model quality.

## Results — 2026-11-15

- 25 backend tests passed, including malformed imports, body limits, write-token checks, measurement persistence, unit conversion, citation validation and CSV provenance.
- TypeScript checking and the production Next.js build passed.
- Both browser journeys passed against the production build: desktop research workflow and mobile navigation/unknown evidence. The constrained local headless binary required each journey to run in a separate invocation; standard CI runs both with Playwright Chromium.
- Mobile screenshot reviewed at 390 px; the document table scrolls within its container.
- Docker startup and live paid AI requests were not executed in this environment.
