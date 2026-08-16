# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-same-location-npc-visit-handoff-land-recovery-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Why this recovery exists

The preceding task `minimal-story-runtime-same-location-npc-visit-handoff-v1` produced terminal report Issue #68 comment `5310184982` and reported a PASS, but its source/test/docs commits were never pushed.

Independent operator verification found:
- canonical remote branch/PR #67 still at `2b52d52c36047df5c039b13de6083f48e13578db` before this registration;
- reported local `SOURCE_TEST_SHA: 7596d36` is not resolvable on GitHub;
- reported local `FINAL_DOCS_SHA: b6d8f0bd9fe136bb4f2765149e64b4a95015c5b7` is not resolvable on GitHub;
- the terminal itself states the final clean clone was two local commits ahead of remote and records `no push`;
- remote `docs/ops/CURRENT_TASK.md` therefore also remained READY for the original task instead of landing its local WAITING_REVIEW state.

Operator review `5310195753` classifies the prior result as `ACCEPTED_BLOCKED_LANDING`: useful behavioral/test evidence, but not a source-reviewable or canonical implementation.

Do not advance to TEST/product acceptance until this recovery is landed and reviewed.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Before changing source:
1. fetch origin;
2. discard/isolate any old watcher-local unpushed implementation/docs lineage for the prior task;
3. restore the canonical worktree to a clean checkout exactly matching the current remote branch HEAD created by this registration;
4. freeze that exact SHA as START_SHA;
5. verify PR #67 is still OPEN / DRAFT / UNMERGED and its head equals START_SHA.

Do not merge/rebase/cherry-pick the old local-only `7596d36` / `b6d8f0bd...` lineage into the canonical branch. Reproduce and review the change from current remote source.

Forbidden game IDs — do not access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.

No live TEST gameplay/reset/write is authorized.

## Objective

Land the already-proven same-location exact registered NPC visit handoff correction onto the canonical remote branch and make it independently reviewable.

Behavioral target remains narrow:
- with current canonical location `brand_strategy_office` and present `[heroine3, heroine1]`, player action `윤민아 보러간다` resolves exact registered target `heroine2` even though her unique destination is the same broad location;
- Story projection changes the active local cast/focal target to `heroine2` while preserving canonical location/time;
- Commit canonical scene includes `heroine2` and does not retain prior active-scene participants solely because the map location string did not change;
- cross-location behavior and exact destination-phase evidence remain unchanged;
- ambiguous, unregistered, casual mention, location-only, and fake identity cases remain unresolved/rejected.

This is not fuzzy NPC search and not a new semantic target system.

## Required work

1. Re-read the exact current caller chain from the registration SHA:
   `player_action -> resolvePlayerNavigationIntent -> projectStorySaveForNavigation -> Story cast -> Extract scene observation -> reduceGameplayCommit/reduceCanonicalScene`.
2. Reproduce the same-location blocker in a regression before accepting any implementation.
3. Apply the minimal root-cause source change through the existing authority path only:
   - `resolvePlayerNavigationIntent()` may return existing `explicit_npc_destination` for an exact registered NPC visit with exactly one canonical destination even when destination equals current location;
   - keep exact registered-name matching and unique destination proof;
   - `projectStorySaveForNavigation()` must not discard that validated target only because location is unchanged; preserve time/location and project target-only active Story cast/focal target;
   - Commit must carry the already-validated target through the canonical scene reducer and replace prior same-location active-scene cast only for this validated handoff;
   - do not add a second scene reducer, persistent target bag, relationship/event writer, semantic router, or fuzzy matcher.
4. Preserve destination-phase evidence behavior: a registered accompanying/destination NPC may be added only through existing accepted evidence; unknown/fake identities remain rejected.
5. Rewrite/retain tests covering at minimum:
   - blocker reproduction and corrected resolve -> Story projection -> Commit result;
   - canonical location/time unchanged for same-location visit;
   - prior `[heroine3, heroine1]` not carried without new destination evidence;
   - same-location location-only action does not invent target/presence;
   - casual mention such as `윤민아가 로비에서 일한다` does not become navigation;
   - ambiguous/unregistered names remain unresolved;
   - cross-location Mina/general-NPC handoff remains green;
   - exact registered accompanying-NPC destination evidence remains supported;
   - unknown/fake identities remain rejected.
6. Inspect current Minimal Story Runtime final-residue source around this path and prove the change does not resurrect retired scene/location/presence mirrors, save choice caches, generic relationship/stat/CSA-attitude authority, or pre-Story semantic gates.
7. Run:
   - focused navigation/scene/Story/Commit tests;
   - full `npm.cmd test`;
   - `node --check` for changed JS/MJS;
   - `git diff --check`.
8. Commit source/test changes on the canonical branch.
9. Update this CURRENT_TASK to `Status: WAITING_REVIEW` in the same lineage after tests pass.
10. **Mandatory landing gate:** perform a normal fast-forward `git push` of the complete source/test/docs lineage to `origin/company/scene-location-presence-v1`.
11. After push, independently verify:
   - local HEAD == remote branch HEAD;
   - PR #67 head == that same FINAL_SHA;
   - the final source/test commits are resolvable from GitHub;
   - this CURRENT_TASK is remotely `WAITING_REVIEW`;
   - PR #67 remains OPEN / DRAFT / UNMERGED.
12. Only after those remote checks pass, post one immutable terminal report to Issue #68 with START_SHA, SOURCE_TEST_SHA, FINAL_SHA, focused/full tests, exact changed files/root cause, remote/PR HEAD equality, and forbidden-operation confirmation.
13. STOP. Do not create the next CURRENT_TASK.

## Carry-forward product acceptance debt — preserve, do not execute here

After this source blocker is canonically landed and independently reviewed, the next product-acceptance planning must still carry:
1. Opening duplicate `[THOUGHT]` leakage risk without creating another parser generation.
2. Explicit player physical/self-state fidelity positive proof.
3. Positive compact 4-slot clothing persistence proof using supported slots only.
4. Long-horizon human-play continuity across the six-raw-turn boundary plus useful four-choice diversity and no repetitive reaction loop.
5. Deletion-first caller review of residual CSA Story projection helpers/fields such as dead `authorityFor()` / `modeFor()` candidates and whether clothing `required_state` / `compliant` is genuinely needed.
6. PR #67 body/history/landing hygiene only after product stabilization.

Do not convert these into incidental patches in this recovery.

## Architecture constraints

- Story remains narrative authority.
- `save.scene` remains sole durable scene/location/presence authority.
- Exact registered identity/navigation resolution is structural context only.
- Same-location visit handoff selects the active scene/cast; it does not imply other employees cease to exist in the broader office/world.
- Do not infer relationship, consent, comfort, affection, trust, CSA compliance, physical state, or sexual state from the visit.
- No fuzzy/substring target guessing beyond the existing exact registered-name contract.
- No semantic gate, regex outcome verifier, retry/regeneration, provider/model change, new parser, compatibility bag, or generic memory authority.
- No migration/DDL candidate is expected. If current DB contract unexpectedly blocks this source-only recovery, STOP and report instead of broadening scope.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- source/test/docs edits on the canonical branch;
- local focused/full tests and static checks;
- normal fast-forward push of this task lineage to the canonical branch;
- immutable Issue #68 terminal report after remote equality is proven.

Not authorized:
- TEST gameplay/reset/write;
- DB write/migration/DDL apply;
- API/frontend deploy;
- Production or forbidden-game access;
- provider/model/config/retry/regeneration;
- new branch/PR;
- merge, PR Ready, rebase, squash, force-push.

## Acceptance

PASS only if:
- the behavioral blocker is reproduced and corrected through the existing exact registered destination -> Story cast -> canonical scene reducer path;
- required regressions/static checks pass;
- no retired authority is resurrected;
- and, unlike the previous attempt, the complete source/test/docs lineage is actually fast-forward landed so GitHub branch HEAD == PR #67 head == reported FINAL_SHA and remote CURRENT_TASK is WAITING_REVIEW.

A local-only PASS is BLOCKED, not COMPLETE.
