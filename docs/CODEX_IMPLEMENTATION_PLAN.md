# Codex implementation plan

## Current baseline

- Repository: `zeroslove-ai/company-v1`
- Stable branch: `main`
- Current bootstrap branch: `phase/0-bootstrap`
- Pull requests use `phase/*` branches and target `main`.
- Runtime roots: `src/api`, `src/engine`, `src/frontend`, `content`, `docs`, `fixtures`, `test`, `scripts`, `supabase/migrations`, and `supabase/seed`.
- Workers reserved for this product: `game-proxy-company-v1` and `gamebuilder-company-v1`.

This repository is the independent company product baseline. Legacy implementation material is historical reference only: it is superseded, is not a runtime dependency, and direct imports or fallbacks to it are prohibited.

## Phase sequence

1. **Phase 0 — independent repository bootstrap.** Establish repository structure, package scripts, root Wrangler configuration, static API/frontend entries, engine contracts, content skeleton, documentation, and contract tests. Do not create a Supabase project or Cloudflare Worker in this phase.
2. **Phase 0.5 — gameplay, recovery, and state contracts.** Add contracts, fixtures, and static tests for gameplay state, recovery behavior, turn sequencing, and failure handling. Do not create a Supabase project or Cloudflare Worker in this phase.
3. **Phase 1 — company-only DB migration package.** Write migration files in `supabase/migrations` and seeds in `supabase/seed`; do not apply them without explicit authorization.
4. **Phase 2 — vertical game loop.** Implement context, one Story SSE call, one Extract call, and one guarded Commit call. Use zero LLM repair calls. Noncritical omissions and runtime mismatches are fail-open warnings; hard validation and commit conflicts remain blocking.
5. **Phase 3 and later — product capability.** Add company content, CSA, choices, parser, frontend behavior, images, and TTS in separately authorized phases.

## Implementation rules

- Work only within the authorized phase and stop at the first actual error.
- Keep modules explicit and independently testable; use fixtures for static contracts.
- Preserve Story output when a noncritical parser or Extract concern occurs; do not regenerate Story solely to repair it.
- Supabase creation, migration application, Cloudflare resource creation, secret configuration, deployment, and real Story/Extract/Commit/TTS calls require explicit authorization.
- Do not force-push, reset, rebase, create merge commits, or automatically merge pull requests.

## Validation and reporting

Use syntax checks, focused contract tests, and `git diff --check`. Report the starting and final SHA, modified files, validation results, unperformed work, current branch, and PR URL when applicable.
