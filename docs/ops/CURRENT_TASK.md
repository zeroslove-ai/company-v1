# Company v1 — CURRENT TASK

Status: READY
Task ID: cut3-relation-event-live-acceptance-and-closure
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Context

Cut 3 Relationship / Event Authority source redesign is operator-accepted through executable SHA `1a5c5540a0235fb2e53b2452516897af7664eba1` on `company/scene-location-presence-v1` / canonical Draft PR #67. The participant-identity closure removed the last identified source authority gap: unknown general-event participant IDs now degrade to warning + no durable mutation while ordinary turns continue.

The next step is not another source patch. Prove the reviewed executable through the actual TEST API/gameplay path, verify durable relation/event consequences and fail-open behavior, then reset only the dedicated TEST game and close Cut 3 if evidence passes.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Reviewed executable SHA: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Starting branch HEAD: `4b468e265a1d96a0dc29ca4c0c076cfdee41ce5c`

PR #65/#66 remain superseded closed containers. Do not reopen them. Do not create another branch/PR. Do not merge, mark Ready, rebase, or squash.

Before mutation, re-read CURRENT_TRUTH.md, AGENTS.md, 09_CURRENT_TRUTH.md, 10_SOLE_WRITER_DECISION.md, POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md and current source. Current Git/live TEST truth outranks prose.

## Preflight — fail closed before TEST mutation

1. Fetch origin and prove branch HEAD descends from reviewed executable SHA `1a5c5540...`.
2. Prove the diff from `1a5c5540...` to current HEAD is docs/workflow-only. If executable/config/migration drift exists, STOP BLOCKED without deploy/reset.
3. Verify PR #67 is still OPEN / DRAFT / UNMERGED and based on `main`.
4. Identify the dedicated TEST game from current canonical ops/source truth. It must NOT be manual evidence game `78fb1d94-266f-455a-bda4-7656cc2370c1`. If TEST identity is ambiguous, STOP without mutation.
5. Read current TEST Supabase/deployed API identity before any write. Do not infer deployment state from Git.
6. Run focused relation/event/commit tests, full current suite, syntax checks, and `git diff --check` against the reviewed executable. Test count alone is not proof.

## Authorized TEST operation

If and only if preflight passes:

1. Deploy the TEST API from exact reviewed executable SHA `1a5c5540a0235fb2e53b2452516897af7664eba1` or prove that exact executable is already the deployed TEST API identity. Do not deploy a docs-only moving HEAD as executable truth.
2. Do not deploy frontend unless a concrete runtime requirement is proven; this acceptance should use existing API/gameplay paths.
3. No DB migration is expected or authorized for Cut 3. If source/live contract unexpectedly requires DDL/migration, STOP BLOCKED and report the exact mismatch.
4. Reset only the dedicated TEST game using the existing normal reset path before the scoped Golden Path if needed for deterministic evidence. Never reset/mutate the preserved manual 7-turn game.

## Required live Golden Path proof

Exercise actual TEST gameplay/API flow through Setup/Opening/normal turns. Use natural player actions and provider-generated Story/Extract; do not directly manufacture relation/event DB state.

Prove at minimum:

- normal Setup/Opening/turn commit remains healthy after the Cut 3 executable;
- at least one meaningful registered-character relationship/event consequence that is supported by exact Story evidence becomes durable through the canonical Commit path when the provider actually produces qualifying observation;
- durable relation/event state is visible again through committed server context/recovery and does not depend on frontend/session cache;
- replay/recovery does not duplicate accepted active relation/event ledger entries;
- unresolved/unknown optional observation does not corrupt durable state or fail an otherwise valid ordinary turn when naturally encountered; if the provider does not naturally emit such a case, rely on the already-accepted deterministic source test rather than injecting fake gameplay state;
- existing Engine mandatory/CSA relation precedence remains compatible with the canonical reducer when a naturally applicable rule is encountered; do not manufacture or directly patch CSA state solely for this proof;
- no regression to canonical Scene/location/presence authority;
- action/turn/save revisions remain coherent and no action is left stranded in processing/committing state.

Do not force the LLM to create a relation merely to satisfy the acceptance. If several natural scoped turns produce no qualifying relation/event observation, record that as live evidence and STOP BLOCKED for operator review rather than adding prompt hacks, retries, semantic gates, or direct DB state.

## Closure / cleanup proof

After live proof, inspect current source callers/writers for the Cut 3 domains and record exact evidence that:

- `reduceRelationEventDomains()` is the sole fresh-turn durable relation/event reducer;
- `csa-commit-reducer.js` does not independently write `active_relations`;
- `observation-reducers.js` does not independently persist the targeted relation/event domains;
- no newly superseded compatibility writer/gate/test remains merely to preserve old behavior.

If a concrete duplicate writer remains, do not declare Cut 3 closed; STOP with the exact caller/path instead of layering compatibility.

## Final TEST reset

After all acceptance reads/evidence are captured, reset only the dedicated TEST game through the normal reset path and verify clean baseline. Preserve evidence in the terminal report / existing allowed artifacts; do not mutate the manual game.

## Operations boundary

Allowed: read-only Git/source/live TEST inspection; local tests; TEST API deploy of exact reviewed executable if needed; normal dedicated TEST-game Setup/Opening/turn calls for acceptance; dedicated TEST-game reset before/after acceptance as needed.

Forbidden: Production; manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` mutation/reset; DB migration/DDL; direct DB gameplay-state manufacture/repair; frontend deploy unless proven necessary and operator-authorized by a new task; provider/model/temperature/token changes; retry/regeneration loops; fuzzy repair; new semantic hard gate; parser generation; source/runtime patch during this acceptance; new branch/PR; merge/Ready/rebase/squash.

If acceptance discovers a source defect, STOP and report it. Do not patch source under this live-acceptance lease.

## Completion

On success:

- record exact deployed TEST API identity and reviewed executable SHA;
- record scoped Golden Path turns and durable relation/event evidence;
- record source single-writer cleanup proof;
- record final dedicated TEST reset/clean baseline;
- set CURRENT_TASK to WAITING_REVIEW in a separate docs-only commit;
- post terminal COMPLETE to Issue #68 with exact START_SHA / FINAL_SHA, tests, deployed identity, TEST game identity, mutations performed, and explicit Production/manual-game = 0;
- STOP for operator review.

Success phrase:

`CUT 3 RELATIONSHIP / EVENT AUTHORITY LIVE-ACCEPTED — AWAITING OPERATOR REVIEW`
