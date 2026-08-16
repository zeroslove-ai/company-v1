# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-same-location-npc-visit-handoff-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Latest operator review before this owner progress refresh: `5310005458` — `ACCEPTED_BLOCKED_EVIDENCE` for this same Task ID.
Remote HEAD before this refresh: `f697a8daf9d0ce69a74447c5405c05eba06d928e`.
The previous watcher attempt never acquired an execution lease. It was blocked only because its local checkout had stray local-only docs commit `a61c3f38616f9aae9234cce0b291f0ceedaf4df5` while remote was already on the canonical READY lineage.

Before execution, the watcher/operator must restore the canonical local worktree to a clean checkout exactly matching the current remote branch HEAD. Do not merge/rebase/cherry-pick the stray local-only docs commit into the canonical lineage. Preserve approved external evidence, but do not commit it.

Accepted TEST live state remains unchanged by this source task:
- `20260816050000 / company_v1_minimal_story_runtime_contract` live once;
- `20260817000100 / company_v1_final_residue_closure` live once;
- reviewed TEST API/Frontend identities remain evidence only; do not deploy in this task.

Forbidden game IDs — do not access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.
Production is forbidden.

## Current progress snapshot

The Minimal Story Runtime reset has already advanced substantially beyond the original authority audit:
- the main semantic cut removed the broad generic NPC relationship/stat/CSA-attitude authority that previously contaminated Story;
- active Story context is now centered on player + canonical scene/time + current actors/canon + active world rules + narrow `npc_scene_state` + recent raw turns + older summaries;
- Extract/Commit authority has been narrowed toward structural/physical evidence instead of generic relationship/event/emotion taxonomies;
- final-residue cleanup has removed additional stale choice/location/presence/frontend compatibility residue;
- both Minimal Story Runtime DB migrations listed above are already applied in TEST;
- earlier TEST/live evidence showed the corrected CSA premise can work: an active/applicable company rule is treated as ordinary workplace reality without automatically granting unrelated consent/comfort/affection/trust/romance/arousal.

This does **not** mean product acceptance is complete. The latest release-candidate product run found the deterministic same-location NPC visit blocker below, so that blocker remains the immediate source task.

## Proven blocker

The release-candidate run produced a deterministic product failure on Turn 5:
- player action: `윤민아 보러간다`;
- before: canonical location `brand_strategy_office`, present `[heroine3, heroine1]`;
- expected exact registered target: `heroine2` (윤민아), whose unique registered/default destination is also `brand_strategy_office`;
- after Commit: location remained `brand_strategy_office`, present remained `[heroine3, heroine1]`, `heroine2_present=false`.

Independent source proof:
1. `resolvePlayerNavigationIntent()` already has exact registered-name/unique-destination authority, but currently returns `null` when `destinations[0] === current`.
2. `projectStorySaveForNavigation()` independently returns the original save when `scene.location_id === locationId`, so even a crafted exact target intent cannot hand off the Story cast in the same broad location.
3. `reduceCanonicalScene()` clears source presence only for an authoritative location change; a same-location target handoff therefore also needs the existing scene/cast path to stop carrying the previous local participants.
4. `test/destination-target-handoff-contract.test.mjs` currently codifies the wrong rule: `same-location ... visits remain unresolved`.

This is not a request for fuzzy NPC search. It is the narrow exact registered `explicit_npc_destination` path already accepted for cross-location visits, extended to the same registered location when the player explicitly goes to see that NPC.

## Objective

Fix the same-location exact registered NPC visit handoff at the root so an action such as `윤민아 보러간다` changes the active scene/cast to 윤민아 even when the player's current broad `location_id` already equals her unique registered destination. Preserve the current location/time; change only the active local scene/cast authority required by the explicit visit.

Source/test only. Do not run live TEST gameplay or deploy.

## Required work

1. Restore/verify a clean local checkout at exact current remote HEAD, then freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED.
2. Re-read the current exact caller chain:
   `player_action -> resolvePlayerNavigationIntent -> projectStorySaveForNavigation -> Story cast -> Extract scene observation -> reduceGameplayCommit/reduceCanonicalScene`.
3. Change `resolvePlayerNavigationIntent()` so an exact registered NPC visit with exactly one canonical destination may return the existing `explicit_npc_destination` intent even when that destination equals the current location.
   - Keep exact registered-name matching and unique registered/default destination proof.
   - Ambiguous, unregistered, casual name mentions, and non-visit phrasing remain unresolved.
   - Location-only same-location text must not invent an NPC target.
4. Change `projectStorySaveForNavigation()` so a canonical `explicit_npc_destination` intent is not discarded merely because the location string is unchanged.
   - Same-location target visit: preserve canonical `location_id`, time, and registered identity; project the active Story cast/focal target to the exact target NPC.
   - Do not carry prior local participants merely because they share the same broad office location.
   - Cross-location behavior must remain unchanged.
5. Close the Commit-side same-location handoff using the existing canonical scene reducer path.
   - The exact destination target must be present after Commit.
   - Prior active-scene NPCs must not survive solely because no map-location change occurred.
   - Additional destination NPCs may appear only through the already-accepted exact destination-phase Story/presence evidence path.
   - Do not create a generic target-state bag, persistent action-target memory, relation/event writer, or second scene reducer.
6. Preserve player agency: do not rewrite the literal player action and do not require the provider to guess the target again once exact registered destination authority has resolved it.
7. Rewrite the incorrect same-location regression. Add/retain behavioral tests covering at least:
   - blocker reproduction: current `brand_strategy_office`, present `[heroine3, heroine1]`, action `윤민아 보러간다` -> intent target `heroine2`, Story projected cast `[heroine2]`, committed active scene includes `heroine2` and does not carry `heroine3/heroine1` without new destination evidence;
   - same-location location-only action does not invent target/presence;
   - casual mention (`윤민아가 로비에서 일한다`) does not become navigation;
   - ambiguous/unregistered names remain unresolved;
   - existing cross-location Mina/general-NPC handoff still passes;
   - exact destination evidence can add a registered accompanying NPC;
   - unknown/fake identities remain rejected;
   - canonical location/time do not change for the same-location visit.
8. Inspect any later Minimal Story Runtime/final-residue changes touching this path and ensure the fix does not resurrect retired scene/location/presence mirrors or save choice caches.
9. Run focused navigation/scene/Story/Commit tests, full `npm.cmd test`, changed JS/MJS syntax checks, and `git diff --check`.
10. No migration/DDL candidate is expected. Do not author one unless a real current DB contract unexpectedly blocks the source change; if so STOP and report rather than broadening scope.

## Owner review carry-forward — mandatory after this blocker closes

The following items come from the latest owner-side progress review. They are **not authorization to broaden this source task**. They are mandatory product-acceptance debt that must be carried into the next operator review/TEST acceptance plan after the same-location blocker is independently accepted.

1. **Opening duplicate THOUGHT leakage**
   - Current risk: Opening generation may emit multiple `[THOUGHT]` blocks; the parser keeps the first as `player_inner_thought` and can demote later duplicates into narrative.
   - Required future proof: Opening contract/parser behavior must ensure player thought does not leak into narrative. Do not create another parser generation merely to solve this.

2. **Explicit player physical/self-state fidelity**
   - Prior QA example: explicit player state such as `벌써 자지가 불끈` could be ignored or rewritten by Story.
   - Required future proof: a positive live regression must show explicit current player physical fact/intent is preserved by Story and, where within the narrow durable contract, by Extract/Commit. Player action remains intent/attempt unless Story establishes success.

3. **Positive compact clothing persistence**
   - Existing tests/live attempts did not prove a successful canonical 4-slot clothing change.
   - Required future proof: use an exact supported slot such as `uniform_top`/`uniform_bottom`/`underwear_top`/`underwear_bottom`, establish a positive Story event, persist it, and prove next-turn/readback continuity. Do not infer unsupported jacket/shirt vocabulary into a slot without evidence.

4. **Long-horizon human-play continuity and choice/reaction quality**
   - Code is intended to use exactly recent six raw turns plus older natural-language summaries, but prior live acceptance evidence once requested a wider recent-turn window and therefore did not prove the exact contract.
   - Required future proof: enough human-style turns to cross the six-raw boundary; verify non-empty/updating older summaries, no continuity cliff, no stuck/repetitive reaction loop, and exactly four literal choices with useful semantic diversity.

5. **Residual authority candidates to audit, deletion-first**
   - `csa/story-projection.js` dead-looking helpers such as `authorityFor()` / `modeFor()` should be caller-checked and removed if truly unused.
   - Re-evaluate whether clothing `required_state` / `compliant` projection is genuinely required for the narrow mechanic or is leftover Story authority. Do not delete it only by name; prove caller/behavior need first.

6. **Release hygiene after product stabilization**
   - PR #67 body is stale relative to the actual Minimal Story Runtime progress and should be refreshed after the product acceptance sequence, not during this focused source fix.
   - PR #67 has accumulated a very large commit history; landing/consolidation strategy is a later operator decision after stable product evidence, not part of this task.

## Architecture constraints

- Story remains narrative authority; this fix supplies exact structural registered target/cast context only.
- `save.scene` remains the sole durable scene/location/presence authority.
- Do not add fuzzy matching, substring target guessing beyond the existing exact registered-name contract, semantic routing, regex outcome verification, compatibility bags, generic memory, retries, provider/model changes, or a new parser.
- Same-location visit handoff is active-scene/cast selection, not evidence that other NPCs physically ceased to exist in the broader office/world.
- Do not infer relationship, consent, comfort, affection, trust, CSA compliance, physical or sexual state from the visit.
- Keep the Minimal Story Runtime final-residue deletions intact.
- The carry-forward QA items above must not be converted into symptom-specific patches inside this task.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- source/test/docs edits on the canonical branch only;
- local focused/full tests and static checks;
- immutable Issue #68 terminal report.

Not authorized:
- TEST gameplay/reset/write;
- DB write/migration/DDL apply;
- API/frontend deploy;
- Production or forbidden-game access;
- provider/model/config/retry/regeneration;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the exact blocker is reproduced by a regression and corrected through the existing registered destination scene/cast authority without weakening identity rules or adding a new semantic system, while cross-location navigation and source-phase isolation remain intact.

This task does not claim the whole game is product-ready. After source acceptance, operator review must carry the six owner-review items above into the next TEST/product-acceptance authority rather than silently declaring final success.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in the same source/test/docs lineage;
- post one immutable terminal report to Issue #68 with START SHA, SOURCE_TEST_SHA/FINAL_SHA, exact root-cause changes, focused/full tests, forbidden-operation confirmation and PR state;
- STOP. Do not generate the next CURRENT_TASK yourself.
