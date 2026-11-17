# Public source coverage and updates

The distribution includes 42 public source resources: 26 PSI accessions, ten original public data/context links and six related NASA sources. Five private document-derived references are excluded from public source files, generated snapshots and evidence retrieval.

The ten investigation records, 18 imported run combinations and 17 numerical observations are unchanged. Only the inspected PSI summary subset is imported; full raw archives have not been ingested. Context-only investigations remain excluded from combustion evidence retrieval.

Public research summaries include the NTRS BASS-II and Saffire VI abstracts, with their source locators and explicit reading limits. See [source registry](sources.md), [delivery status](completion-status.md) and [data dictionary](data-dictionary.md).

## Update an existing Codespace

```sh
git pull --ff-only origin main
npm --prefix frontend ci
npm --prefix frontend run build
.venv/bin/python scripts/run_mvp.py
```

The launcher updates the public source catalogue and removes excluded legacy document records and their evidence-search entries. Imported investigation records are preserved. Known editorial seed revisions update only when the prior checksum matches; user edits are retained. Restart an existing Codespace after pulling and rebuilding if the background launcher is running.
