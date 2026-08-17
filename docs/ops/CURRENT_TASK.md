# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: gameplay-core-simplification-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active **gameplay implementation** execution authority for this branch. PR #69 remains a separate infrastructure-only owner decision and is outside this task.

## Owner authorization

The owner explicitly authorizes the first implementation cut defined by:

- `CURRENT_TRUTH.md`
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`

Owner direction: delete obsolete/gateway/duplicate architecture first, then add back only the smallest functionality required for the intended gameplay. Do not preserve a broken layer merely to avoid changing its callers.

This authorization is for **source/content/test/migration-file implementation only**.

It does **not** authorize:

- merging this branch or any PR;
- merging PR #69;
- deploying API/frontend Workers;
- applying any migration to TEST or Production;
- writing any Supabase row;
- accessing/mutating Production games;
- live gameplay acceptance;
- provider/model changes as a correctness workaround;
- starting Cut 2 automatically.

## Canonical identities

Repository: `zeroslove-ai/company-v1`
Base `main` at design start: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`
Implementation branch: `company/gameplay-core-simplification-v1`
Design-canon file commit: `44f904435440c874edfbd7f53f161d40dbd8faaa`
CURRENT_TRUTH promotion commit: `8fa82cc70a4de7ea9929e72240346c072237f8ef`
Accepted landed Minimal Story Runtime executable ancestor: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
Separate infra PR: #69 — OUT OF SCOPE

## Required read order before edits

1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
6. `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
7. this `docs/ops/CURRENT_TASK.md`
8. latest Issue #68 comments, including the CURRENT_TASK_READY registration for this task.

Then fresh-fetch remote `main`, this branch, open PRs, and verify no newer owner instruction supersedes the task.

## Objective

Perform one deletion-first core simplification cut so the fresh runtime is again explainable as:

`literal input → minimal context → Story → narrow Extract → one Commit → committed readback`

Fix the manual-QA failure classes by removing their duplicate/gateway causes rather than stacking another compatibility layer.

The final source tree should be materially simpler in semantic surface than START, even though a few narrow mechanics are repaired or reconnected.

## Mandatory implementation sequence

### Phase A — prove callers and delete superseded authority

Before adding any replacement behavior, map **fresh runtime** callers for the targets below. Historical persisted-read-only use is not fresh authority.

Delete/collapse/inline where the only fresh purpose is superseded:

- `work_hook` planning/projection/write plumbing;
- universal `workplace fiction` / first-work Story authority;
- semantic scene `scene_id`, `goal`, `focus_thread`, and `beat` if no independent current product consumer exists;
- generic CSA execution-policy / mandatory-enactment / semantic execution gateway layers;
- fresh legacy Extract superset normalization paths;
- duplicate physical evidence translation shapes;
- closed posture taxonomy if it has no independent UI/mechanical consumer;
- sexual event ledger/event taxonomy if the retained small player mechanic does not require it;
- stale `csa_acceptance`, resistance, relationship, work, event, stats writers/readers that imply current authority;
- fresh Extract image/media selection fields;
- dead compatibility helpers whose only callers disappear in this cut.

Do not keep a file merely because tests import it. Update/delete tests protecting removed architecture.

### Phase B — literal choice/input authority

Make one exact action source:

- Opening choices only before later committed choices exist;
- after turn 1, latest committed `game_turns.choices` is the only choice source;
- clicked choice literal must be the exact `game_actions.player_action` and Story input;
- free text uses the same path;
- no old-choice semantic fallback/router.

Add focused regressions for the Opening-choice resurrection bug and literal round trip.

### Phase C — Opening/work semantic removal

Fresh Opening becomes initial world setup, not a work quest.

Remove source/content/RPC contract dependence on:

- `work_hook_id`;
- `work_hook_label`;
- default `첫 업무` hooks;
- default work-scene goals/focus;
- `world_state.work_hook` writes/projection;
- universal `Write natural Korean workplace fiction` instruction.

Keep company/department/role/map/world identity.

Add one additive migration file that redefines current Company setup/minimalization/scene validation functions for the new fresh shape. **Create the migration file only; do not apply it.** Historical migration files remain immutable.

### Phase D — minimal canonical scene

Target fresh scene shape:

```text
{
  version,
  location_id,
  present_npc_ids,
  focal_character_id,
  last_speaker_id,
  updated_turn
}
```

Remove duplicate/semantic fields rather than repairing stale `scene_id=opening` overwrite behavior.

Preserve deterministic exact movement and conservative presence rules. Source-phase speakers must not leak across a movement boundary.

If a real product consumer for `beat` is found, document it in the completion report and keep only the smallest nonsemantic form. Tests alone do not count as a product consumer.

### Phase E — one physical observation path

Fresh physical persistence must have one actor-scoped representation and one actor-scoped exact Story evidence representation.

Keep:

- four-slot clothing as the compact deterministic state;
- free natural-language `position_label` only if a current consumer is proven.

Remove:

- parallel top-level/nested/local evidence forms;
- finite posture grammar when redundant;
- single-NPC actor-assumption shortcuts that can attach player evidence to an NPC.

Ambiguous optional physical observation is dropped. It must not be misattributed and must not fail the turn.

### Phase F — narrow deterministic CSA mechanical effect

For exact supported structured state-setting presets only, connect the exact mechanical state directly to the existing product state.

Required supported case: structured `clothing_state.required_state`.

Rules:

- no natural-language rule inference;
- no generic execution DSL;
- no mandatory-enactment planner;
- no semantic consent/success gate;
- only exact preset state is synchronized;
- unrelated acts remain unrelated;
- other CSA content remains a Story premise.

Delete generic execution gateway modules if caller proof shows the remaining fresh use can be replaced by this narrow direct state-setting path plus CSA lifecycle/transaction code.

### Phase G — player sexual mechanic single writer

Retain only the narrow UI/gameplay fields that have a current product consumer, e.g. erection/progress/count/updated turn.

Connect explicit Story evidence through one fresh Extract observation to one reducer.

Do not resurrect a sexual-event ledger or broad action taxonomy just to update these fields.

Remove the old per-turn `+6` pacing assumption if it is only a legacy tuning constraint; first make the writer correct, then choose a simple product pace with focused tests.

### Phase H — Story contract and character canon

Simplify Story rules rather than adding a verifier.

Story must:

- preserve literal actor/target/material action/directionality and explicit player self-state;
- treat active applicable CSA as an ordinary in-force premise without validity disbelief;
- keep CSA scope exact and not generalize it to unrelated acts;
- progress a currently executable direct request to a meaningful same-turn result instead of repeated preparation/continue loops;
- not force work/meeting/onboarding agenda after the player's focus has moved elsewhere.

Revise heroine prompt cards to separate human characterization from role identity. Department/position/role remain separate fields; remove duplicated permanent work-performance directives.

Project compact active-character body canon to Story. Project intimate body canon only through deterministic visibility from confirmed four-slot clothing state; do not add a semantic visibility classifier.

### Phase I — fresh Extract contraction

Fresh Extract must have one small current contract and must not flow through a legacy semantic superset.

Keep only proven current domains: structural scene observation, narrow physical/player mechanics, elapsed time, Mind Monitor, turn summary, warnings/evidence.

Remove fresh support for generic stats/csa-attitude, relation updates, general event arrays, CSA runtime semantic updates, generic sexual event arrays, and image/media selection.

One inert persisted-read adapter may remain only if old committed rows demonstrably require it. It must not validate/block fresh turns.

### Phase J — tests and residue proof

Tests must assert player-visible/current behavior and authority, not deleted shape.

Required focused scenarios:

1. Opening choices stop being a source once committed-turn choices exist.
2. clicked choice literal round trips exactly to reserved action and Story input.
3. free text literal does the same.
4. movement cannot leave stale `opening` semantic scene identity because that duplicate identity no longer exists in fresh scene.
5. fresh setup/opening does not require/write work hooks/goals/focus.
6. exact structured nude/clothing CSA produces matching four-slot mechanical state without waiting for later narrative rediscovery.
7. on-request CSA exact scope does not imply unrelated contact/consent.
8. ambiguous player-vs-NPC physical evidence is dropped rather than cross-attributed.
9. explicit erection/sexual-progress Story evidence updates the retained player mechanic.
10. active body canon projection includes character-specific body data while hidden intimate canon remains absent when covered.
11. recent six raw turns plus older summary behavior stays intact.
12. removed fresh work/stats/event/relation/csa-attitude/media fields cannot re-enter through a compatibility parser.
13. optional projection failure cannot reject an otherwise valid Story/Commit.

Provider-quality behavior that cannot be deterministically unit tested must be recorded for later TEST manual acceptance. Do not replace it with regex semantic gates.

## Allowed change areas

The task may change only files necessary to accomplish the objective, primarily:

- `src/engine/**`
- `src/api/**` only where current runtime/display contracts require cleanup
- `src/frontend/pages/**` only for exact choice/dead-reader behavior directly required by Cut 1
- `content/characters.json`
- `content/map.json` only if obsolete Opening/work metadata is actually present there
- `supabase/migrations/**` for **one new additive migration file only**
- `test/**`
- `scripts/**` only for existing validation adjustments directly caused by the smaller contract
- `CURRENT_TRUTH.md`
- the new 2026-08-17 canon
- `docs/ops/CURRENT_TASK.md`

Do not edit `.github/workflows/**`; that belongs to PR #69.

## Explicit prohibitions

Do not add:

- semantic action router/verifier;
- finite consent matrix;
- generic relationship/event/open-fact/work ledger;
- generic CSA execution DSL;
- new finite physical/contact/posture action grammar;
- retry/regeneration-until-valid behavior;
- provider/model fallback as architecture repair;
- server-authored semantic choice fallback;
- another compatibility mirror of deleted state;
- Production-specific behavior;
- Cut 2 reaction stats or media redesign except deletion of Cut-1-blocking dead coupling.

Do not apply DB migrations or deploy anything.

## Validation

At minimum before terminal report:

1. run all focused tests added/changed for this cut;
2. run the full existing test suite and distinguish true failures from intentionally removed obsolete assertions;
3. run syntax checks for modified JavaScript modules;
4. run `git diff --check`;
5. search fresh runtime source for removed authority terms and report surviving intentional references vs historical/read-only references, including at least:
   - `work_hook`
   - `npc_work_state`
   - `csa_acceptance`
   - `mandatory_enactment`
   - `execution_action`
   - `relation_updates`
   - generic `events.general`
   - fresh `image_selection`
   - `scene_id` / `focus_thread` / `scene.goal`
6. provide caller proof for any legacy adapter/gateway retained;
7. report files deleted and net source LOC change separately from test/doc LOC;
8. show the final fresh Story payload shape and fresh Extract output shape in the completion report;
9. show the new fresh save scene/world-state shape in the completion report.

Do not optimize for test count. A smaller correct suite protecting the new behavior is preferable to preserving obsolete shape coverage.

## Completion report requirements

Report:

- START SHA and FINAL SHA;
- exact branch;
- changed/deleted files;
- source LOC added/deleted;
- which gateway/legacy modules were deleted vs retained with caller proof;
- final Story input fields;
- final fresh Extract fields;
- final fresh scene/world/physical/player-mechanic state shapes;
- how exact choice authority is now enforced;
- how exact structured clothing CSA state is applied without generic execution grammar;
- how unrelated CSA actions remain independent;
- how actor evidence attribution is made unambiguous;
- how work authority was removed while company setting remains;
- tests/syntax/diff results;
- migration file name and proof it was **not applied**;
- confirmation of zero Worker deploys, zero TEST/Production DB writes, zero Production/game access;
- any bounded unresolved product-quality item that requires later TEST manual play.

## Stop condition

When implementation and local/source validation are complete:

1. update this task status to `WAITING_REVIEW` on this branch;
2. append one terminal execution report to Issue #68;
3. do **not** merge;
4. do **not** deploy;
5. do **not** apply the migration;
6. do **not** create or start `presentation-sidecars-cleanup-v1`;
7. stop for owner/operator review.
