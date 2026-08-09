# Runtime Core Reset progress

## Phase 1 — stored action authority

- Base: `company/runtime-core-reset-v1-plan` at `7f0dbf71ebc093395fbeffdcd46cd05b4bc8f58a`.
- Working branch: `company/runtime-core-reset-v1-action-authority`.
- Phase 0 fact inventory and target-state plan remain in the existing runtime-reset documents; this file records only the implementation delta.
- `game_actions.structured_action` is resolved once and reused as the authority for Story, Extract, Commit, replay, recovery, and feedback revision.
- A non-null request must match the stored action exactly; a non-null request without persistence fails with a non-retryable 409.
- `csa_active` and `csa_rules` can change only from a stored, revalidated transaction plan. Ordinary Extract deltas cannot mutate rule definitions.
- The API reservation mock and integration fixtures preserve the same structured action shape as the production RPC.

## Remaining phases

- Phase 2: canonical scene/presence and movement writer.
- Phase 3: observation-only Extract semantics and single Commit reducer.
- Later phases: UI, TTS/image projections, setup/opening cleanup, and operational migration work.

## Forbidden regressions

- No new matcher, verifier, semantic gate, or fallback authority.
- No database or migration changes, Supabase writes, live LLM calls, Worker deployment, or operating-save repair in this phase.

## Verification

Latest local verification: `npm.cmd test` — 600/600 passed.
Implementation commit: `c11d5e6ea1dcd828d0243bf898d1b9aa99ba5bdd`.
