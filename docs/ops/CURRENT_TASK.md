# Company — CURRENT TASK (R4 candidate branch only)

Status: RUNNING
Task ID: company-core-r4-bounded-rebuild-20261015
Branch: rebuild/company-core-r4-20261015
Base main: 7780759fd595247bd05d13f89ce44847e4551d8a
Updated: 2026-10-15 18:48 KST — Story/Observer budget reservation implemented and R4/full structural suites pass; report/commit/push closeout in progress, task remains RUNNING

## Branch-local owner direction

The owner requested a separate R4 candidate branch and the bounded rebuild specification. The owner then supplied the execution instruction; runtime work is RUNNING in the isolated worktree. This branch does not change main's manual-play lock, R3 deployments, protected data, or product canon.

Owner execution instruction received on 2026-10-15 KST. Execute docs/rebuild-r4/IMPLEMENTATION_SPEC_KO.md continuously without routine phase-by-phase approval waits. The earlier manual-playtest hold remains binding for main and existing R3 deployments/evidence, not an excuse to halt this separately requested candidate work.

## Owner clarification (2026-10-15 KST)

The product is the existing adult, character-first interactive fiction `상식개변: 회사편`, governed by `CURRENT_TRUTH.md` and `docs/redesign/COMPANY_CANON.md`. Do not flatten it into a generic company-life simulator or omit the player-private app premise, authored identities/dramatization, world, source images, voice mappings, or reader-facing presentation. Do not edit canonical source records to fit R4.

Lunch, cafeteria, notices, on-call assignments, and generic employee scenarios in the R4 specification are technical fixtures only. Keep them in tests or an explicitly selected demo provider. They must not be default product content or evidence of narrative acceptance. Product-facing narrative acceptance requires actual source characters and world premise, a small scene-appropriate cast, distinct in-character behavior, continuity, and unrestricted non-work choices. Inspect representative source-character results before any long campaign; fixture runs are not product-quality evidence.

Preserve the original media catalog/image locators, `voice_id` mappings, and the established reader UI path. Only display media grounded in the committed scene; keep image/TTS sidecars non-authoritative. Record unavailable storage bytes or synthesis service configuration as unverified rather than silently substituting demo assets. Preserve the existing adult character-first product and its authored catalog without changing the canon. This task does not authorize creating or improving explicit content or sexual coercion. Live model rule scenes are allowed only for an already-canonical non-explicit, non-coercive case; if none exists in the source catalog, mark that live acceptance unverified and rely on clearly-labeled structural tests.

## Owner priority update (2026-10-15)

The highest implementation priority is the canonical 상식개변 rule lifecycle and character reactions: prospective APPLY/CHANGE/REMOVE state → Story context → one Observer → atomic Commit → next-turn continuity. Keep active authority separate from historical events; preserve the exact structured command through retry/feedback; character scope comes from a server-owned canonical selector resolver; Observer and media cannot modify rules. Distinct authored character cards and the private-app premise remain in the Story payload. Do not add generic emotion/relationship/action engines.

The existing `content/csa_catalog.json` has 21 canonical presets. Connect the unchanged source catalog and its selector contracts to the server-owned rule pipeline; do not add presets, broaden supported action families, change meanings, or replace the product with a generic test game. The current catalog offers no suitable non-explicit, non-coercive live-model rule example, so APPLY/CHANGE/REMOVE NPC reaction acceptance remains unverified. Synthetic descriptors remain structural-only and cannot stand in for product evidence.

## Scope

Preserve the two-call Story -> Observer -> atomic Commit spine and reuse original Company content/presentation assets. Independently rebuild the turn-command/context/state/persistence/recovery boundaries. Fixture acceptance is structural only; product-facing narrative acceptance follows the canon and source-character requirements above. Only already-canonical finite rule behavior is in scope; no new rule semantics or generic execution engine. A core candidate result is not full content, release, or player-enjoyment approval.

## Deliverables

A runnable local browser candidate with real disposable persistence; unified command/turn/retry/feedback semantics; grounded memory retrieval; safe versioned media/GIF presentation; tests tied to actual failures; actual model/browser evidence where authorized; PROGRESS.md and FINAL_REPORT.md under docs/rebuild-r4; pushed commits and a draft PR.

## Protected scope

No main or PR #104 mutation, force-push, historical migration edits, existing Worker changes, remote DB activation/migration/repair, preserved game writes, new paid services, or production rollout. Local test databases are allowed. Remote preview requires a separately authorized isolated target. The product canon on main is not amended by this experimental plan.

## Execution

Follow specification sections 10-12. First deliver a thin Setup -> Opening -> one turn -> DB -> reload flow, then finish the remaining boundaries. Continue useful independent work when externally blocked. Never relabel in-memory/scripted checks as live product evidence. Final status: LOCAL_CANDIDATE_READY, PARTIAL_BLOCKED, or FAILED_NEEDS_FIX. Full product/owner approval is separate.

## Current result

The R4 candidate has a server-owned prospective rule-state/context/commit path, actual source-character Story payload evidence, 40-turn actual-model memory evidence, DB restart restore, desktop/mobile UI checks, and bounded Story/Observer call reservations. The task remains RUNNING. Actual rule-reaction acceptance and source image bytes remain unverified; the final report distinguishes live-model evidence from isolated structural and scripted fixtures. See docs/rebuild-r4/PROGRESS.md and docs/rebuild-r4/FINAL_REPORT.md.
