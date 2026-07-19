# Project Brief

## User Story

As a docs consumer (human or LLM), I want the a16n documentation site to publish LLM-friendly indexes (`llms.txt` / `llms-full.txt` / per-page `.md`) and a sustainable, working set of versioned API references so that agents can load prose quickly and pull API docs on demand without drowning in every historical TypeDoc tree.

## Use-Case(s)

### Use-Case 1: Prose-first local/dev builds stay fast

A developer runs `docs:…:prose` (or equivalent). The site builds without regenerating API docs, and without generating API-scoped LLM artifacts. Root LLM indexes cover prose only (or omit API entries that don't exist yet).

### Use-Case 2: Full/API builds publish LLM indexes with the right split

A deploy or `docs:build:all` / API-generating path produces:
- Root `llms.txt` that indexes prose **and** API docs (links)
- Root `llms-full.txt` that inlines **prose only** (API trees excluded)
- Per API version root: `llms.txt` + `llms-full.txt` (and generated `.md` as configured) for on-demand full API pull

### Use-Case 3: Versioned API docs render again, with retention

Historical TypeDoc generation works again on the live site. Per package, only a retained subset of versions is generated: all versions in the current major, plus the newest version of each of the previous N majors (N configurable, default 2).

## Requirements

1. Add [`docusaurus-plugin-llms`](https://github.com/rachfop/docusaurus-plugin-llms) to the docs site with `generateMarkdownFiles: true` (and other options as needed to meet the acceptance criteria).
2. Root `llms.txt` indexes prose and API docs; root `llms-full.txt` excludes generated API documentation content.
3. Each retained API version root exposes its own `llms.txt` and `llms-full.txt`.
4. API-scoped LLM artifacts are only produced when API-doc generation runs — prose-only entrypoints remain fast and do not require/wait on API LLM output.
5. Fix broken versioned TypeDoc generation so API reference pages (e.g. Engine API) render again.
6. Implement per-package version retention: all versions in current major + newest of each of the previous N majors (default N=2); drop older majors entirely.

## Constraints

1. Stay within the existing docs script composition model (`docs:gen:*` / `docs:site:*` / `docs:dev:*` / `docs:build:*`) — do not force API work into prose-only paths.
2. Retention is applied per package independently (engine, models, plugins, etc. each have their own current major and history).
3. Prefer configuring/extending the plugin and existing generators over inventing a parallel docs pipeline.

## Acceptance Criteria

1. `docs:…:prose` (or `docs:gen:prose` → site) does not generate/regenerate API docs or API-version LLM files.
2. An API-generating build produces working versioned API pages for the retained version set.
3. Root `llms.txt` lists API doc links; root `llms-full.txt` does not inline API trees.
4. Each retained API version directory/route has usable `llms.txt` + `llms-full.txt`.
5. Retention behavior matches the examples: at engine `1.x` with N=2 → all `1.x` + latest `0.x`; at hypothetical `4.5.6` with N=2 → all `4.x` + latest `3.x` + latest `2.x`.
6. Docs package tests cover retention logic and (as appropriate) LLM/plugin wiring expectations; full docs test suite and relevant build path(s) pass.
