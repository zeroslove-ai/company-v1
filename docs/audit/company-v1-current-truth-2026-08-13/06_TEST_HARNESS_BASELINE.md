# Test and Harness Baseline

The objective here is harness reuse for a future Golden Path, not a count or
rewrite of the approximately 700 tests.

## Existing harness families

| Harness | Location | External dependency | Reuse decision |
|---|---|---|---|
| Node test runner | `package.json` (`node --test test/*.test.mjs`) | none by default | KEEP as deterministic unit/contract baseline |
| HTTP Worker mocks | `test/helpers/http-mocks.mjs`, many API tests | mocked fetch/Supabase | KEEP; good for route protocol and error lifecycle |
| Supabase-shaped API harness | `test/company-player-setup-opening-v1.test.mjs`, `test/csa-app-port-v1.test.mjs`, related tests | fake RPC/REST responses | KEEP with explicit mock-vs-live labels |
| Story/Extract integration harness | `test/turn-pipeline-integration.test.mjs`, phase tests, `test/clothing-csa-e2e-runtime.test.mjs` | mostly mocked provider/DB | REUSE after current protocol contract is frozen |
| Runtime authority tests | `test/runtime-*.test.mjs`, `test/phase12*.test.mjs` | deterministic fixtures | KEEP as acceptance seed; do not assume live parity |
| Frontend state/view-model tests | `test/frontend-*.test.mjs`, `test/company-game-view-model.test.mjs` | DOM/test doubles; no live network | KEEP for projection-only boundaries |
| Live canary script | `scripts/live-playtest-canary.mjs` | real Worker, TEST Supabase, provider | Golden Path candidate, but stateful/reset-capable and needs owner guard review |
| Live phase E2E | `scripts/live-phase-2-e2e.mjs` | local Worker plus real secrets/provider | REFERENCE_ONLY until current protocol and environment are pinned |
| Live CSA/Extract diagnostic | `scripts/live-csa-extract-diagnostic.mjs` | real TEST state/provider; reset paths | REFERENCE_ONLY; useful diagnostic, not unattended acceptance |
| API smoke | `scripts/smoke-api-worker.mjs` | deployed Worker | KEEP as deployment smoke, not gameplay proof |
| Frontend smoke | `scripts/smoke-frontend-worker.mjs` | deployed frontend | KEEP as deployment smoke |
| Reset preflight | `scripts/runtime-reset-operational-preflight.mjs` | read/write operational assumptions | KEEP only as guarded operator tool; prohibited during audit |

## What the current suite proves

- It provides broad deterministic coverage for parser, reducer, CSA planner,
  frontend view model, opening recovery, and contract regressions.
- It exercises mocked Supabase boundaries and therefore cannot prove the live
  DB function body, grants, migration order, or deployed Worker SHA.
- Live scripts can call the real TEST Worker/DB and provider, but they are
  stateful and some contain reset behavior. They must be explicitly scoped to
  the TEST game before any future use.
- Test count is not a current-truth KPI. The useful unit is a Golden Path
  harness with provenance from setup through commit and replay.

## Golden Path reuse candidate

The most reusable path is:

1. preflight/read TEST game and assert game ID;
2. reserve setup/opening and capture raw Story + parser result;
3. submit one stored Player action;
4. observe Story stream and raw final Story;
5. Extract once and record evidence envelope;
6. commit once;
7. read back context/history and compare durable fields;
8. write an immutable evidence artifact with runtime SHA/provider metadata.

`live-playtest-canary.mjs` already contains much of this shape, including TEST
game guards and artifact/report handling. It also contains reset-on-failure and
multi-turn behavior, so it is not automatically safe as a user-canary runner.

## Harness unknowns

- Whether every live script targets the same currently deployed baseline.
- Whether real Story/Extract model calls still match the current provider wire
  contracts without compatibility behavior.
- Whether reset/preflight scripts and deployed RPC signatures agree with the
  current live DB.
- Whether the frontend session cache is fully cleared on a server reset.

These are follow-up acceptance questions, not changes made by this audit.
