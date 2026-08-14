# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut3-relation-event-typed-observation-contract-closure
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 3 Relation / Event source authority is structurally accepted at gameplay executable `1a5c5540a0235fb2e53b2452516897af7664eba1`: the duplicate `active_relations` writer was consolidated, Engine-vs-observation precedence is centralized, event/relation replay is idempotent, and general-event participants are restricted to registered identities / canonical player.

Live closure is still blocked. The latest one-shot TEST scenario produced a valid Story with a visible apology to registered `heroine4`, but Fresh Extract returned `relation_updates=[]`, `events.general=[]`, `events.sexual=[]`. Do not infer from this alone that Extract is broken. The quoted apology by itself may not establish a supported durable lifecycle/event, while current source also shows a producer/consumer vocabulary risk: the consumer accepts a closed canonical event/relation vocabulary, but the Extract prompt refers to “canonical types” / `relation_kind` without explicitly exposing the accepted values.

This task must prove which boundary is wrong before changing gameplay semantics.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected PR: base `main`, OPEN / DRAFT / UNMERGED
Current starting HEAD: `8b1f0a75d04d3ff721ee9eab5e16682dcf35d9f8` or a docs-only descendant created by the operator handoff
Accepted gameplay executable before this task: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Accepted deployed TEST Worker from current evidence: `game-proxy-company-v1` / `6f0940d5-3145-4301-bcdf-61bdccc3cdac` — read-only verify if needed; do not deploy in this task.
PR #65/#66 are closed superseded containers. Do not create/reopen another PR or branch.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable and MUST NOT be accessed or mutated in this task.

## Required root-cause classification

Trace the exact fresh path using source and the retained latest live artifact if locally available and hash-matching:

Story raw/parsed blocks -> `buildExtractPrompt()` -> provider Extract JSON -> `normalizeFreshExtractObservationV2()` / relation/event normalization -> `reduceRelationEventDomains()` -> Commit.

Use the retained artifact only if it is still available at:
`C:\Users\JAEWAN\AppData\Local\Temp\company-cut3-relation-event-deterministic.json`
Expected SHA-256: `21E32AA5FB0B87DAE8B7871D1E7CF095E041057F0ACEB37825403D7B17A8DC77`.
Do not modify it. If unavailable or hash differs, say so and continue from immutable Git/Issue evidence; do not reproduce live just to recover it.

Classify the blocker into exactly one primary class, with evidence:

A. `NON_QUALIFYING_STORY_EVIDENCE`
- The complete Story did not actually show a supported canonical durable relation lifecycle, relationship field change, or general/sexual event.
- Example: player apology text exists but NPC acceptance/reconciliation/boundary change/promise outcome is not visibly established.
- If A, make NO gameplay-runtime/prompt semantic patch. Document the exact supported evidence class a later live acceptance must elicit naturally and STOP.

B. `PRODUCER_CONSUMER_VOCABULARY_GAP`
- The Story visibly contains a fact that maps to an EXISTING canonical type accepted by the consumer, but the Extract producer contract does not provide enough machine-readable/explicit vocabulary to emit that type reliably.
- If B, repair only the contract boundary. Do NOT invent a new taxonomy. Reuse the existing canonical enums/sets as the sole vocabulary authority; do not copy a second independent literal list into a prompt.
- If a shared dependency-neutral contract module is required, move/export the EXISTING vocabulary there and make prompt + normalizer/reducer consume it. Delete the superseded duplicate declaration in the same task.

C. `NORMALIZATION_OR_REDUCER_DROP`
- Provider Extract actually emitted a valid existing typed observation supported by exact Story evidence, but normalization/reducer discarded it incorrectly.
- If C, repair only the proven drop and add exact regression coverage.

D. `OTHER_PROVEN_REPOSITORY_CONTRACT_DEFECT`
- Use only if A/B/C are disproven. Name exact owner and evidence. Do not broaden scope.

## Canonical vocabulary facts to verify, not blindly duplicate

Current accepted source shows:
- General event consumer types: `promise`, `refusal`, `conflict`, `intimacy`, `csa_event`, `work_event`, `secret`.
- Relation lifecycle is restricted to the existing `RELATION_KINDS` from `src/engine/csa/execution-policy.js`.
- `npc_observations.<npc>.relationship` supports only `closeness`, `romance_status`, `current_boundary`.
- Exact Story quote evidence and registered actor/target identities remain mandatory.

Verify these at current source before relying on them. If source drift exists after `1a5c554...`, inspect it and STOP if unrelated executable drift changes this contract.

## Architecture invariants

- One canonical Relation/Event reducer/writer remains the only durable authority.
- Player input is intent/attempt only; never synthesize successful relation/event state from the player action.
- Story is observable evidence; Extract is an observer, not a second game author.
- Engine mandatory relation input wins a same-turn conflict with observational Extract through the existing canonical reducer.
- Unknown/unregistered participant => warning + no durable mutation.
- Uncertain/absent optional observation => no durable mutation; ordinary turn continues.
- No fuzzy inference from apology/word similarity/name similarity.
- No retry/regeneration/provider/model/temperature/token workaround.
- No parser relaxation or third parser.
- No new event/relation taxonomy merely to satisfy the canary.
- No semantic hard gate that rejects an ordinary turn because optional Relation/Event extraction is absent.
- Do not add compatibility for stale tests.

## Allowed

- Current branch source/test/docs inspection and edits required by a proven B/C/D repository defect.
- Focused contract tests and full suite.
- Local static analysis / exact artifact read-only inspection.
- Update existing audit/current-truth docs only for verified architecture facts.

## Forbidden

- TEST gameplay run in this task.
- API/frontend deploy.
- DB write/reset/migration/DDL.
- Production access.
- preserved manual-game access.
- new branch/PR, reopen #65/#66, merge, Ready, rebase, squash.
- provider/model/config changes.
- retry/regeneration loop.
- fuzzy repair/inference.
- parser relaxation/new parser.
- player-action-as-success.
- direct DB manufactured relation/event state.

## Validation / deliverable

If A:
- source/artifact evidence proving why the latest Story was non-qualifying;
- no executable gameplay change;
- focused/static checks as applicable;
- propose one exact next live acceptance evidence class without forcing provider output.

If B/C/D and a source change is justified:
- exact before/after producer-consumer ownership map;
- focused tests proving a qualifying existing canonical Story fact can be represented/normalized/reduced;
- negative tests proving vague apology/intent alone does not become a durable fact;
- unknown participants remain fail-open/no-write;
- same-turn Engine precedence and replay idempotence remain intact;
- full current suite, changed JS syntax, `git diff --check`.

Do not run live TEST or deploy under this task. A source candidate must stop for operator review before any deploy/live acceptance.

On completion:
- set Status `WAITING_REVIEW` in a docs-only final commit;
- post one terminal report to Issue #68 with START_SHA, FINAL_SHA, primary classification A/B/C/D, exact evidence, executable files changed (or zero), tests, and forbidden operations confirmation;
- STOP.

## Terminal evidence — 2026-08-15

- Task identity: `cut3-relation-event-typed-observation-contract-closure`.
- Task blob SHA / START_SHA: `1a8985e10814005e7303a909aaa2393c4a35f104`.
- Branch: `company/scene-location-presence-v1`.
- Accepted gameplay executable: `1a5c5540a0235fb2e53b2452516897af7664eba1`.
- Primary classification: **A — `NON_QUALIFYING_STORY_EVIDENCE`**.
- Evidence artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-cut3-relation-event-deterministic.json`; SHA-256 `21E32AA5FB0B87DAE8B7871D1E7CF095E041057F0ACEB37825403D7B17A8DC77`.
- The deterministic Story contained an apology and a request for clarification, but no supported canonical relation lifecycle, boundary change, reconciliation outcome, promise outcome, or other accepted general/sexual event. The only promise-like text was a player choice, not performed Story evidence. Therefore the Story did not qualify for a durable Relation/Event observation.
- Extract completed with `relation_updates: []`, `events.general: []`, and `events.sexual: []`. This is consistent with the non-qualifying evidence; no producer/consumer vocabulary gap or normalization/reducer drop was proven.
- Source trace reviewed: `buildExtractPrompt` → provider Extract → `normalizeFreshExtractObservationV2` → canonical relation/event reducer. No executable source or test change is justified. The only known executable delta from the accepted gameplay SHA remains the previously reviewed canary/test harness work in `scripts/live-playtest-canary.mjs` and `test/live-canary-contract.test.mjs`.
- Validation: focused relation/event/Extract/turn tests `63/63` passed; full `npm.cmd test` `455/455` passed; changed-source syntax checks passed; `git diff --check` passed.
- Forbidden operations performed: no TEST gameplay run, live LLM call, deploy, DB write/reset/migration/DDL, Production access, provider/model/retry/parser/taxonomy/semantic-gate change, or direct state manufacture.
- This task is stopped for operator review. No next task is generated. `Status: WAITING_REVIEW` is the terminal state for this task.
