# Verification

Backend: python -m unittest discover -s backend/tests
Frontend: npm --prefix frontend ci && npm --prefix frontend run typecheck && npm --prefix frontend run build
Browser: cd frontend && npx playwright install --with-deps chromium && npm run test:e2e

Browser tests launch real backend/frontend processes and exercise the library, ten-column table, paper reader, comparison, scenario evaluation, evidence answer, export, coverage and mobile overflow. They run against the production build. CHROMIUM_EXECUTABLE_PATH can select an installed Chromium binary in constrained environments.

Provider tests mock OpenAI Responses and embeddings; they check invented citation rejection and cache reuse. They do not establish live provider availability or model quality.

## Results — 2026-11-15

- 25 backend tests passed, including malformed imports, body limits, write-token checks, measurement persistence, unit conversion, citation validation and CSV provenance.
- TypeScript checking and the production Next.js build passed.
- All three browser journeys passed against the production build: desktop research workflow, mobile navigation/unknown evidence, and import → observations → export/reimport → run comparison. The constrained local headless binary required each journey to run in a separate invocation; standard CI runs both with Playwright Chromium.
- Mobile screenshot reviewed at 390 px; the document table scrolls within its container.
- Docker startup and live paid AI requests were not executed in this environment.
- Production launcher `python3 scripts/run_mvp.py` successfully started both servers; proxied health, overview, library, PMMA evidence query and dashboard HTTP checks passed. Shutdown also completed cleanly. The GitHub Codespaces container itself still requires a signed-in creation session and has not been verified remotely.

## Source expansion verification — 2026-11-15

26 backend tests passed after adding the seven related NASA resources. Production build and TypeScript checking passed. Desktop browser journey verifies 23 library rows, source ancestry, paper reader, comparison, scenario, assistant and export.

## PSI import verification — 2026-11-15

27 backend tests passed, including context-only source exclusion, PSI identifier retrieval, source-row preservation and the partial PSI-159 observations API. Production build/TypeScript passed. The desktop browser journey verifies 30 library rows and the displayed 50 s duration and 290.617198 degC peak burner temperature from the first PSI-159 test.
