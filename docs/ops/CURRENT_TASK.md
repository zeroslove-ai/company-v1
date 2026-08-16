# Company v1 — CURRENT TASK

Status: READY
Task ID: physical-sexual-state-authority-residue-audit-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306868867` ACCEPTED `opening-literal-choice-live-closure-v2` at terminal docs SHA `06ed6ed4a41b964f35182960ebec69e7bd7d4565` with reviewed harness SHA `5c14561f478859309c26100c6d9217734a23018b`.

Architecture already accepted on this lineage includes open-ended Story/Extract observation, simplified CSA natural-rule authority, canonical Scene authority, setup/opening world-definition cleanup with dynamic registered-ID integrity, committed parsed-block replay authority, simplified recent-raw + natural-language turn-summary memory, and removal of multiple legacy semantic/mirror residues. Opening literal choice transport is now live-accepted and must not be revisited without new evidence.

Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is historical READ-ONLY evidence only and is forbidden to mutate/reset. Production is forbidden.

## Objective

Perform one architecture-first source + migration-history audit of the remaining player/NPC physical and sexual durable-state boundaries. Produce a precise REMOVE-OR-PROVE map for every finite vocabulary, writer, reducer, mirror, validator, compatibility adapter, and UI/media consumer that can affect posture, contact, clothing, intimate/sexual facts, or sexual event/image state.

This is an audit/decision cut, not an implementation or live-play cut. The next implementation task must be derivable from concrete caller/writer/data proof rather than assumptions.

## Required work

1. Freeze START HEAD and verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED and contains the accepted lineage above.
2. Inventory the full fresh Story -> Extract -> Commit -> save/history -> next Story/UI path for physical/intimate/sexual meaning. Include at minimum:
   - player intent/action handling versus Story-established outcome;
   - Extract schemas/prompts/normalizers for arbitrary physical/contact/intimate/sexual observations;
   - Commit reducers/writers touching player/NPC physical state, posture, contact, clothing, sexual state/event state;
   - `npc_scene_state`, player physical state, compact clothing state, sexual ledgers/projections, and any compatibility mirrors;
   - current Story context projection/readback for those states;
   - frontend consumers that display clothing/physical/relationship/intimate state;
   - media/image selection consumers, including real sexual image families/pools/tags/action families.
3. Search for all finite semantic vocabularies and gates in this domain: posture enums, contact/action kinds, sexual action/type/stage enums, relation-kind reuse, regex existence gates, allowlists, fallback-to-other/default taxonomies, mandatory physical execution tokens, direct player-input success inference, or arbitrary save-patch paths.
4. For every finite mechanic classify exactly one of:
   - `REMOVE`: no current deterministic product/integrity consumer and it restricts open-ended Story/Extract meaning;
   - `KEEP_WITH_PROVEN_CONSUMER`: identify exact source caller/UI/media/integrity consumer and why a finite projection is required;
   - `NARROW_PROJECTION_ONLY`: may classify/project for UI/media, but classification failure must fail open and must never erase/reject the underlying narrative fact or block Commit;
   - `HISTORICAL_COMPATIBILITY_ONLY`: current fresh path does not use it; identify exact stored-data/replay reader that still requires it and deletion condition.
5. Explicitly prove whether compact clothing remains one canonical UI continuity state. If duplicate clothing copies/writers exist, identify deletion target; do not delete the proven UI state itself merely because it is finite.
6. Explicitly prove the media/image boundary. Existing `image_library`, sex/general pools, sexual image families (including manual/oral/penetration/climax or current equivalents), tags/action families, and deterministic image selection are presentation adapters when callers prove them. They may return no/alternate image on classification miss, but must not gate Story/Extract fact occurrence or persistence.
7. Explicitly inspect sexual-event/state persistence. Determine whether any sexual ledger/state is a true gameplay/mechanical/UI consumer, a media-selection adapter, duplicate semantic memory, or stale compatibility residue. Do not assume either deletion or preservation from the name.
8. Explicitly inspect physical posture/contact persistence. Player input is intent/attempt, not success. Story/Extract evidence must be the source of occurrence. Identify any path that writes success directly from input or structural ACTING metadata and mark it for removal unless a deterministic non-semantic consumer proves necessity.
9. Verify institutional CSA compliance state is separate from consent/comfort/affection/trust/emotion and does not act as physical-story authority. Any remaining CSA physical execution grammar is REMOVE-OR-PROVE against actual current consumers.
10. Inspect current migrations and live-contract source definitions read-only. Historical applied migrations are immutable. If a future cleanup needs DB changes, specify additive migration requirements only; do not author/apply one in this audit.
11. Audit tests in this domain as `KEEP / REWRITE / DELETE`. Stale tests do not justify compatibility runtime or finite semantic gates.
12. Produce a concise audit artifact under `docs/audit/` and update CURRENT_TASK to WAITING_REVIEW in the same docs-only lineage. The audit must name exact files/functions/fields and propose the next coherent implementation cut with deletion targets and protected consumers.

## Architecture constraints

- Story LLM authors narrative; Extract LLM observes arbitrary meaningful facts grounded in exact Story evidence.
- Server owns registered identity, exact evidence/provenance, action/turn identity, structural validation, transactionality, idempotence/dedupe/replay, and narrow deterministic projections.
- No required event/relation/emotion/posture/contact/sexual semantic taxonomy for a fact to exist.
- No generic-other enum as a hidden closed-world gate.
- Unknown optional projection/classification must fail open without erasing the underlying fact or blocking the turn.
- No direct player-input success inference and no arbitrary LLM save patch.
- One durable domain -> one canonical writer; duplicate writers/mirrors are deletion targets once caller/data proof is complete.
- Compact clothing may remain if its actual frontend continuity consumer is proven; richer facts must not be erased for not fitting it.
- Image/media/TTS are presentation sidecars. Finite image taxonomies may remain with proven consumers, but cannot define whether narrative actions/facts occurred.
- CSA owns institutional rule identity/lifecycle/applicability/transaction mechanics only to the extent proven; compliance is not consent/comfort/affection/trust/emotion.
- Choices remain provider-authored exactly four literal strings; this task must not touch choice authority.

## TEST Level-7 / acceptance policy

No live TEST play is authorized in this audit. Preserve the existing single TEST-only Level-7 acceleration seam. Do not change Production progression and do not create another acceleration writer.

The next implementation/live acceptance plan produced by this audit must be scenario-coverage driven and deep enough, when authorized later, to exercise ordinary conversation, arbitrary physical/contact/emotion/relation/event facts, strong CSA context with compliance/resistance, posture/contact outside old enums, clothing UI continuity, an explicitly tested intimate/sexual path, memory after facts leave the immediate raw window, choices/free text, and media/image classification remaining presentation-only.

## Authorized operations

Authorized:
- read-only Git/source/history/migration inspection;
- read-only PR #67 verification;
- read-only TEST DB catalog/function inspection only if needed to resolve current contract identity;
- docs/audit artifact and CURRENT_TASK docs-only commits on the existing #67 branch;
- local/source tests only if needed to understand existing contracts; no runtime behavior changes.

Not authorized:
- gameplay/runtime/frontend/source/test behavior edits;
- migration authoring/application or DDL;
- TEST gameplay/setup/opening/reset or direct DB mutation;
- API/frontend deployment;
- Production access;
- any mutation/reset/access of preserved manual game beyond repository evidence already present;
- provider/model/temperature/token changes, retry/regeneration;
- parser relaxation/new parser, fuzzy repair, semantic hard gate, compatibility runtime;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the audit traces the current physical/sexual authority end-to-end and every finite mechanic/writer/mirror is classified with concrete caller/data proof, with a next implementation cut that removes duplicate/closed semantic authority while explicitly protecting proven compact-clothing and media/image consumers.

If current evidence cannot distinguish a consumer or stored-data dependency, mark it unresolved with the exact proof needed; do not guess and do not implement around uncertainty.

## Completion

On PASS or first deterministic blocker:
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, FINAL_SHA, audit artifact path, key REMOVE/KEEP/NARROW/HISTORICAL decisions, exact next implementation recommendation, PR state, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next task yourself.
