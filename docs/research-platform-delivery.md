# The Flamels extended research platform

The complete `COngtuthien/SpaceFire-AI` source was cloned and adapted to The Flamels at reference commit `9817452c3effdf03864dea65f23d1f767b33251b`.

## Delivered

- The complete reference application, including its scientific backend, data processing, analysis, 3D studios, Copilot, knowledge graph, condition similarity, reliability tools and original research documentation.
- FlameAtlas / The Flamels branding, an original flame icon, navy/mint interface, new home copy, isolated browser preferences and an About page retaining upstream attribution.
- Integration with The Flamels GitHub repository and existing public evidence presentation.
- A reproducible installer: full source clone, exact commit pin, SHA-256 manifest for 48 immutable NASA/curation files, verified edition patch, installation, ingestion and production build.
- Windows launch wrappers, a cross-platform Python supervisor, private Codespaces configuration and a single-application Docker definition.
- Preservation of the original FlameAtlas MVP, its sources, existing sessions and independent database schema.

## Reliability corrections

The reference checkout does not include some supplementary NASA reports. The edition repairs graph references that otherwise contained `None#page=...`; retains curated file/table/page locators; labels upstream curated evidence separately from locally indexed full text; and provides a source-availability page with the NASA investigation link. It does not fabricate missing documents or their contents.

The backend dependency set includes SOCKS support needed by provider SDKs in proxy environments. The default provider configuration is OpenAI with no key included. Provider calls remain optional and server-side.

## Verification

The adapted application passed TypeScript checking and a Next.js production build. Its backend suite collected 288 tests: 284 passed and four tests requiring absent NASA source files were explicitly skipped. Four installer-integrity tests cover pin/checksum integrity, source corruption, path containment and preservation of unmanaged folders.

GitHub CI also performs a fresh full setup, backend tests and the edition's nine browser checks, including all five conceptual 3D studios. Consult the actual workflow result for those checks; adding a test does not mean it passed.

The managed local preview could not start the extended Next.js application because its preview launcher supplied Vite-specific `--host` / `--strictPort` flags. That failed attempt is not counted as a visual verification. The public static presentation and platform introduction use their supported static preview separately.

Windows wrappers are supplied, but this execution environment is Linux; no native Windows execution is claimed. A Docker definition is supplied, but no Docker engine was available here to build it.

## Publication scope

The repository stores the installer, patch and verified source manifest. Setup materializes the **entire** reference source and committed data in the ignored runtime directory. It preserves the original README and source authorship; it does not claim upstream authorship for The Flamels. The reference explicitly provides no license file, and this edition does not assign a new one to upstream material.

The public Site serves the existing evidence atlas and the new platform introduction/setup page. It does not host the extended Python backend. Run that full-stack application locally, in a private Codespace or on your own Docker host. Model-written synthesis requires your own provider configuration.
