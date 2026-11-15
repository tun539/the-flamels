# Source expansion — 2026-11-15

Re-read The Flamels, tab Trang tính1, A1:J30. The original ten data links and five Drive papers remain unchanged. Seven related NASA resources were added by following the research topics in C2/C3, with parent_ids and discovery_method recording how they were found. These related resources are not presented as new direct Sheet links.

| ID | Reading scope | Relationship |
| --- | --- | --- |
| nasa-bass-report | NTRS 20210011385 abstract and metadata | BASS-II topic in C3 and paper-03 |
| nasa-saffire-vi | NTRS 20240002981 abstract and metadata | Saffire topic in C3 |
| nasa-sofie | NASA Science facility description/objectives | SoFIE topic in C3 |
| nasa-sofie-gel | NASA Science experiment description | Child investigation of SoFIE |
| nasa-flare | NASA Glenn experimental approach | FLARE topic in C3 |
| nasa-fire-synthesis | NASA research summary | Combustion research topic in C3 |
| psi-25 | Search-index metadata only | PSI search in C2, BASS-II topic |

Library total: 23 resources. Three new curated findings were added from two NTRS abstracts. No numerical run records were created. The existing six investigation records remain six, to avoid counting program descriptions as equivalent independent experiments. PSI-25 and PSI-117 direct pages returned no readable text; neither is indexed as scientific evidence. PDF full text for the new NTRS reports has not been extracted.

## Update an existing Codespace

Stop the running MVP with Ctrl+C in its terminal, then run:

```sh
git pull --ff-only origin main
npm --prefix frontend run build
.venv/bin/python scripts/run_mvp.py
```

The launcher reseeds the library idempotently and preserves previously imported investigations. Open the existing port-3000 URL and refresh Library. If the automatic background launcher owns the running servers, stop and restart the Codespace after the pull/build; postStartCommand runs the launcher again. The live Codespace was not updated from this session because its port requires GitHub browser authentication.
