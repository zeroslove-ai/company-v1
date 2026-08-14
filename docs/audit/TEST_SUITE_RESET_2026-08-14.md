# Company v1 Test Suite Reset / Consolidation v1.1

## Result

This document records the test-suite reset performed from the accepted Cut 1
runtime line. The reset changes tests and test fixtures only. It does not change
runtime behavior, content, database schema, migrations, deployment, or live
game state.

The suite is organized around current authority boundaries. Test count is an
inventory value, not an acceptance criterion.

## Baseline and method

- Repository: `zeroslove-ai/company-v1`
- Accepted Cut 1 canonical SHA: `46f6d93ff9b4d9ec02b3242b0939dbe57c058150`
- Test-reset branch: `company/test-suite-consolidation-v1`
- Base branch: `company/runtime-authority-consolidation-v1`
- Runtime baseline: unchanged from the accepted Cut 1 line
- Inventory source: `test/**/*.test.mjs`, `fixtures/**`, `test/fixtures/**`, `package.json`, and the current source readers/writers
- Baseline test files: 79
- Baseline Node test cases: 741 passing
- Final test files: 43
- v1 reset intermediate: 43 files / 447 passing
- v1.1 final test files: 43
- v1.1 final Node test cases: 417 passing
- Final package test command remains the flat cross-platform `test/*.test.mjs` command

The baseline and final counts are reported for auditability only. Correctness
is determined by the invariant matrix below and by the separate live Golden
Path acceptance.

## Disposition summary

| Disposition | File-level result | Unit-level result | Meaning |
|---|---:|---:|---|
| KEEP | 43 final authority-oriented files | 417 runnable cases | Current contracts remain connected to current readers/writers |
| REWRITE | 5 retained contract tests | 5 behavioral rewrites | Dead prompt assertions and source-backed checks were replaced with observable outputs |
| DELETE | 36 initial-reset files plus v1.1 removals | 324 runner cases removed from the 741-case baseline | Superseded, duplicate, fake-integration, UI-only, legacy-phase, or implementation-text coverage |

Forty-two files were renamed into authority-oriented destinations. These are
consolidations of valid existing contracts, not runtime changes. The runner
reduction from the original 741-case baseline is 324 cases. The v1.1
intermediate-to-final reduction is 30 runner cases. A direct declaration scan
differs slightly where files use nested Node test subtests.

## v1.1 semantic cleanup delta

The v1.1 pass rescanned all 43 files, removed all direct `src/**` and
`supabase/migrations/**` source-text/SQL regex tests, removed dead returns and
masked branches, and replaced five retained tests with behavioral assertions.
The remaining file reads are content, manifest, fixture, or preflight-input
data used as test inputs rather than runtime implementation existence checks.

| Changed file | v1.1 result |
|---|---|
| `authority-action-lifecycle.test.mjs` | Removed SQL/source/caller-text checks; retained RPC payload behavior |
| `action-structured-persistence.test.mjs` | Removed migration-text test; retained API/RPC persistence behavior |
| `csa-definition-contract.test.mjs` | Rewrote relational scope behavior; removed frontend/SQL text checks |
| `frontend-recovery-contract.test.mjs` | Rewrote prompt check to structural output; removed frontend source scan |
| `frontend-state-contract.test.mjs` | Removed source-string shell test |
| `frontend-utility-contract.test.mjs` | Removed HTML/CSS/source existence test |
| `frontend-view-model.test.mjs` | Removed source purity scan; retained view-model behavior |
| `product-recovery-contract.test.mjs` | Removed static HTML source test |
| `prompt-boundary-contract.test.mjs` | Rewrote general-NPC payload test; removed unreachable assertions |
| `relation-event-contract.test.mjs` | Removed frontend source scans; retained endpoint behavior |
| `reset-recovery-contract.test.mjs` | Rewrote preflight hash behavior; removed direct SQL/source inspection |
| `runtime-display-contract.test.mjs` | Removed frontend source scan; retained display behavior |
| `setup-opening-bootstrap.test.mjs` | Removed migration-text tests; retained engine/opening behavior |
| `setup-opening.test.mjs` | Removed source-existence/player-candidate text scans |

Before/after semantic scan result:

- source/SQL implementation-text regex tests: 31 identified → 0
- unreachable/dead-return masked assertions: 4 identified → 0
- unconditional skip/todo masking: 0 → 0
- exact prompt prose snapshots: removed from the affected tests

## Final unit/file inventory

The following is the v1 inventory ledger before the v1.1 semantic delta. The
v1.1 delta table above records every file changed by the second scan.

| File | Cases | Authority/domain |
|---|---:|---|
| `action-structured-persistence.test.mjs` | 4 | structured action persistence |
| `action-writer-contract.test.mjs` | 8 | named action writers |
| `api-response-contract.test.mjs` | 2 | API response envelope |
| `authority-action-lifecycle.test.mjs` | 9 | Cut 1 claim/fence/replay lifecycle |
| `content-catalog-contract.test.mjs` | 29 | registered catalog identity |
| `content-media-contract.test.mjs` | 12 | media projection/eligibility |
| `csa-activation-contract.test.mjs` | 3 | CSA activation boundaries |
| `csa-definition-contract.test.mjs` | 13 | CSA definition authority |
| `csa-enactment-contract.test.mjs` | 5 | mandatory enactment structure |
| `csa-runtime-contract.test.mjs` | 3 | CSA runtime projection |
| `csa-scope-contract.test.mjs` | 2 | subject/counterparty scope |
| `db-contract-gate.test.mjs` | 3 | Stage A/B catalog contract |
| `extract-observation-contract.test.mjs` | 30 | Extract evidence boundary |
| `frontend-api-contract.test.mjs` | 4 | frontend API calls |
| `frontend-narrative-contract.test.mjs` | 7 | narrative rendering projection |
| `frontend-projection-contract.test.mjs` | 12 | server-authoritative view model |
| `frontend-recovery-contract.test.mjs` | 5 | recovery/pending state |
| `frontend-state-contract.test.mjs` | 31 | client state transitions |
| `frontend-stream-contract.test.mjs` | 4 | SSE/stream decoding |
| `frontend-utility-contract.test.mjs` | 4 | frontend pure utilities |
| `frontend-view-model.test.mjs` | 7 | game view model |
| `gameplay-state-contract.test.mjs` | 22 | canonical gameplay state shape |
| `live-canary-contract.test.mjs` | 13 | live harness guards, not live execution |
| `map-content-contract.test.mjs` | 10 | map/location catalog |
| `narrative-presentation-contract.test.mjs` | 7 | Story presentation projection |
| `narrative-protocol.test.mjs` | 9 | Fresh narrative protocol |
| `narrative-request-contract.test.mjs` | 4 | narrative request boundary |
| `npc-map-contract.test.mjs` | 17 | NPC/map registration |
| `product-recovery-contract.test.mjs` | 5 | product recovery envelope |
| `prompt-boundary-contract.test.mjs` | 6 | prompt boundary contracts |
| `relation-authority-contract.test.mjs` | 10 | structured relation authority |
| `relation-event-contract.test.mjs` | 3 | relation event evidence |
| `relation-interaction-contract.test.mjs` | 5 | interaction pair resolution |
| `reset-recovery-contract.test.mjs` | 10 | reset/preflight/recovery |
| `runtime-display-contract.test.mjs` | 6 | display projection |
| `scene-runtime-contract.test.mjs` | 55 | scene reducer/runtime contract |
| `setup-opening-bootstrap.test.mjs` | 9 | setup/opening bootstrap |
| `setup-opening.test.mjs` | 24 | setup/opening validation and choices |
| `state-evidence-boundaries.test.mjs` | 12 | evidence-gated durable state |
| `turn-atomicity-contract.test.mjs` | 7 | atomic turn behavior |
| `turn-pipeline-replay.test.mjs` | 4 | pipeline/replay integration |
| `turn-transaction-phase.test.mjs` | 8 | turn phases |
| `turn-transaction-replay.test.mjs` | 7 | transaction/replay authority |

## Deleted tests

Deleted because they tested superseded phase contracts, removed writers, broad
semantic gates, fake integrations, or product/UI experiments that are not a
current runtime authority:

```text
bootstrap.contract.test.mjs
clothing-csa-e2e-runtime.test.mjs
company-map-cast-stabilization.test.mjs
company-prompt-v2.test.mjs
company-supabase-evidence-recovery.test.mjs
compatibility-regressions-v1.test.mjs
csa-app-frontend.test.mjs
csa-app-hardening-v1.test.mjs
csa-app-port-v1.test.mjs
csa-meaning-regression.test.mjs
full-feature-transplant-v1.test.mjs
hospital-mobile.test.mjs
hospital-player-panels.test.mjs
hospital-scroll.test.mjs
hospital-shell-frontend.test.mjs
hospital-tts-relationship-parity.test.mjs
mobile-ui-refinement-v1.test.mjs
open-semantic-contract-v1.test.mjs
phase-0.5-contracts.test.mjs
phase-1-db-contracts.test.mjs
phase-2-api.test.mjs
phase12d-institutional-authority.test.mjs
phase12h-csa-authority.test.mjs
phase12i-playability.test.mjs
phase12j-narrative-authority.test.mjs
phase12p-b-authority.test.mjs
phase2-actor-reference-speaker.test.mjs
phase3-story-contract.test.mjs
phase4-story-projection.test.mjs
phase5-transaction-authority.test.mjs
phase6-csa-commit-reducer.test.mjs
phase7-extract-boundary.test.mjs
phase8-story-protocol.test.mjs
prompt-cache-order-v1.test.mjs
runtime-17-turn-regression-coverage.test.mjs
runtime-opening-clothing-null-hotfix.test.mjs
```

Examples include the old direct-PATCH/legacy compatibility expectations, the
removed CSA preapply writer behavior, exact prompt/source-string tests, and
the Phase12K clothing semantic hard gate. The latter remains preserved as
later-cut evidence; it is not converted into a Cut 1 correctness gate.

## Consolidated destinations

Phase/hotfix names were removed from the active suite where the underlying
contract remains valid. The main destinations are:

- action claim/fencing/replay → `authority-action-lifecycle.test.mjs`
- DB migration/RPC/privilege contract → `db-contract-gate.test.mjs`
- setup/opening/recovery → `setup-opening.test.mjs`, `setup-opening-bootstrap.test.mjs`, `reset-recovery-contract.test.mjs`
- Story/Extract/Commit/replay → `narrative-protocol.test.mjs`, `extract-observation-contract.test.mjs`, `turn-transaction-replay.test.mjs`, `turn-pipeline-replay.test.mjs`
- scene/state/evidence → `scene-runtime-contract.test.mjs`, `state-evidence-boundaries.test.mjs`
- relationships/events → `relation-authority-contract.test.mjs`, `relation-event-contract.test.mjs`, `relation-interaction-contract.test.mjs`
- CSA definitions/runtime/enactment → `csa-definition-contract.test.mjs`, `csa-runtime-contract.test.mjs`, `csa-enactment-contract.test.mjs`
- frontend authority → `frontend-projection-contract.test.mjs`, `frontend-state-contract.test.mjs`, `frontend-recovery-contract.test.mjs`
- media/catalog → `content-media-contract.test.mjs`, `content-catalog-contract.test.mjs`
- live canary harness → `live-canary-contract.test.mjs`

## Fixture disposition

The following unused phase-only or superseded fixtures were removed after
reader inventory:

```text
fixtures/phase-2/story-valid.txt
fixtures/phase-2/story-malformed.txt
fixtures/phase-2/openai-story-sse.txt
fixtures/phase-2/final-handjob-story.txt
fixtures/phase-2/final-exit-story.txt
fixtures/phase-2/extract-valid.json
fixtures/gameplay-state-v1/gameplay-save-v1.json
fixtures/gameplay-state-v1/extract-gameplay-valid.json
fixtures/phase-0.5/state-merge-cases.json
fixtures/phase-0.5/recovery-cases.json
fixtures/phase-0.5/feedback-revision-cases.json
```

Current readers still use the retained canonical save, structured/malformed
Story, invalid Extract, CSA, master, and `test/fixtures` files. Historical live
evidence artifacts beginning with `phase12`, `cut1-`, or other preserved local
evidence names were not treated as disposable fixtures and were not modified.

## Critical invariant matrix

| Domain | Required invariant | Canonical destination |
|---|---|---|
| ACTION | claim, stale takeover, fencing, failure, retry, replay | `authority-action-lifecycle.test.mjs`, `action-writer-contract.test.mjs` |
| TURN | reserve, Story, Extract, Commit, replay, expected-turn conflict | `turn-transaction-replay.test.mjs`, `turn-pipeline-replay.test.mjs`, `turn-atomicity-contract.test.mjs` |
| DB | Stage A/B, approved RPCs, forbidden writers, contract gate | `db-contract-gate.test.mjs` |
| OPENING | setup reservation, exact-four choices, replay, reset/recovery | `setup-opening.test.mjs`, `setup-opening-bootstrap.test.mjs`, `reset-recovery-contract.test.mjs` |
| NARRATIVE | Fresh parser, speaker identity, ACTING, THOUGHT, CHOICE, raw Story preservation | `narrative-protocol.test.mjs`, `narrative-presentation-contract.test.mjs` |
| STATE | scene, physical, sexual, relation, and event evidence boundaries | `scene-runtime-contract.test.mjs`, `state-evidence-boundaries.test.mjs`, relation contracts |
| CLIENT | context refresh, history, reset, pending recovery, no gameplay writer | frontend contract files, `live-canary-contract.test.mjs` |
| CSA | definition authority, Commit-only durability, mandatory enactment shape | CSA contract files |
| MEDIA | TTS/image failures do not become turn durability authority | `content-media-contract.test.mjs` |

## Intentionally unsupported legacy behavior

The suite no longer requires removed direct REST/PATCH writers, removed legacy
lifecycle/Story/Extract/CSA-preapply RPCs, old `error_code` ownership tokens,
phase-specific protocol variants, exact historical prompt prose, or broad
Phase12K clothing semantics. Persisted replay compatibility is retained only
where current readers still consume it.

## Validation

- `npm.cmd test`: PASS, 417/417
- test-file JavaScript syntax checks: PASS
- `git diff --check`: PASS
- API Wrangler dry-run: required final candidate check
- Frontend Wrangler dry-run: required final candidate check
- live canary execution: not run by `npm test`; the harness and guards remain
- runtime source changes: 0
- content changes: 0
- migration changes: 0
- DB writes/resets: 0
- API/frontend deployments: 0
- Production access: 0

No runtime blocker was discovered by this reset. The broad Phase12K clothing
failure remains a known later-cut evidence item and was not made green by
deleting or weakening the current state-evidence contracts.

## Landing

This branch is intentionally stacked on the accepted Cut 1 implementation
branch. PR #65 remains the runtime implementation container; this branch is a
separate Draft PR for test organization only. It must not be treated as a
runtime deployment candidate.
