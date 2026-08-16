# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-duplicate-thought-privacy-boundary-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous task:
- Task: `minimal-story-runtime-release-candidate-product-acceptance-v2`
- Terminal: Issue #68 comment `5310274932` — `EXECUTION: BLOCKED`
- Operator review: Issue #68 comment `5310299489` — `CHANGES_REQUIRED`
- Verified remote head before this registration: `a6c7312a1bd221eb88ff086c6a9de75ffdb2e719`.
- Accepted same-location source/test SHA remains `c4ceed11845c127d813c821506f688f02d4c063c` in this lineage.

The blocked product-acceptance run did not mutate TEST state and did not deploy. It stopped during the mandatory deterministic duplicate-THOUGHT preflight.

Independent source proof at the reviewed head confirms the defect in `src/engine/fresh-narrative-parser.js`:
- `parseFreshNarrativeV2()` counts `[THOUGHT]` blocks;
- the first THOUGHT becomes `player_inner_thought`;
- the second and later THOUGHT blocks are currently emitted as ordinary `narrative` blocks;
- `scene_text` is assembled from `scene` + `narrative`, so duplicate private-thought text becomes player-visible narrative;
- `player_inner_thought_duplicate` is only a warning and does not prevent that leak.

This is a narrow parser privacy-boundary source defect. It is not permission to create another parser generation or semantic verification layer.

Forbidden game IDs — do not access:
- Production/sentinel `11111111-1111-4111-8111-111111111111`;
- preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` is also not authorized for access in this source/test task.

Production is forbidden. No TEST gameplay/reset/write is authorized.

## Objective

Correct the existing fresh Story parser privacy boundary so duplicate provider-authored `[THOUGHT]` blocks can never become player-visible narrative, `scene_text`, or Extract observation while preserving the first canonical private thought and the current fail-open Story behavior.

The intended behavior is:

- first canonical THOUGHT -> `player_inner_thought`;
- second and later THOUGHT -> never ordinary narrative and never Extract-visible Story evidence;
- keep `player_inner_thought_duplicate` warning when duplicates occur;
- do not fail/reject the entire Story only because the provider emitted duplicate THOUGHT;
- do not concatenate duplicate private thought into the canonical thought;
- do not invent another durable/private-thought bag merely to preserve discarded duplicate text.

Apply this same contract to Opening and ordinary Story because they share the fresh parser. Do not create an Opening-only parser fork.

## Required work

1. Restore/verify a clean canonical worktree exactly matching the remote registration HEAD, freeze it as `START_SHA`, and verify PR #67 is OPEN / DRAFT / UNMERGED with head == START_SHA.
2. Re-read the current caller/projection chain around:
   - `parseFreshNarrativeV2()`;
   - `scene_text` construction;
   - `buildStoryObservationBlocks()`;
   - Opening parsing/persistence/readback;
   - ordinary Story parsing/Extract handoff;
   - committed `parsed_blocks` replay/presentation.
3. Add a deterministic regression that reproduces the accepted blocker before accepting the implementation:
   - one visible `[SCENE]` block;
   - at least two non-empty `[THOUGHT]` blocks;
   - exactly four distinct `[CHOICE]` blocks;
   - current baseline must demonstrate that duplicate thought text reaches a `narrative` block / `scene_text`.
4. Fix the root in the existing `parseFreshNarrativeV2()` implementation only as needed:
   - preserve the first canonical private THOUGHT as `player_inner_thought`;
   - second and later THOUGHT blocks must not be converted to `narrative`;
   - duplicate THOUGHT text must not appear in `scene_text`;
   - duplicate THOUGHT text must not appear in `buildStoryObservationBlocks()` or any Extract-facing Story evidence;
   - duplicate THOUGHT text must not be persisted in committed `parsed_blocks` under a public/narrative block type;
   - preserve `player_inner_thought_duplicate` warning;
   - keep fail-open usability: duplicate THOUGHT alone must not invalidate an otherwise valid Story.
5. Preserve the current raw Story authority boundary. The raw provider response may of course still contain the duplicate marker/text for audit/history where raw Story is stored; the parser must not reinterpret private content as public narrative. Do not mutate or rewrite raw provider text to hide the defect.
6. Do not broaden the parser into semantic content adjudication. No sentiment/action/consent/relationship/CSA inference and no regex semantic gate are authorized.
7. Exercise edge cases without redesigning unrelated protocol behavior:
   - adjacent duplicate THOUGHT blocks;
   - duplicate THOUGHT separated by visible scene/dialogue/acting blocks;
   - duplicate THOUGHT around paragraph boundaries/whitespace as current parser permits;
   - preserve existing handling of empty/missing THOUGHT unless a privacy leak is directly proven there.
8. Prove unaffected contracts:
   - exactly four canonical choices still round-trip unchanged;
   - dialogue/scene/acting parsing remains unchanged;
   - first `player_inner_thought` is still available to the intended private-thought projection/UI;
   - `scene_text` contains only player-visible scene/narrative material;
   - `buildStoryObservationBlocks()` remains limited to observable scene/narrative/dialogue/acting blocks and never private thought;
   - Opening and ordinary Story use the same corrected parser behavior;
   - committed readback/replay of parsed blocks cannot resurrect a dropped duplicate THOUGHT as narrative.
9. Update the most direct existing regression surfaces rather than adding a parallel harness. Expected relevant tests include:
   - `test/narrative-protocol.test.mjs`;
   - `test/narrative-presentation-contract.test.mjs`;
   - `test/setup-opening.test.mjs` / `test/setup-opening-bootstrap.test.mjs` only where needed to prove shared Opening behavior;
   - any committed parsed-block/readback test directly reached by this parser contract.
10. Deletion-first residual CSA cleanup may be performed only for the exact zero-caller evidence already surfaced by the blocked preflight:
   - independently caller-check `authorityFor()` / `modeFor()` in `src/engine/csa/story-projection.js`;
   - if they are truly zero-caller dead helpers at START_SHA, delete them in this same source cut and adjust direct tests if necessary;
   - do **not** delete or alter clothing `required_state` / `compliant` merely by name. They remain outside this privacy fix unless current caller/behavior proof shows a direct, safe, independently testable zero-authority deletion; otherwise report them as carry-forward only.
   - this optional dead-helper cleanup must not expand into a CSA redesign.
11. Run focused narrative/parser/Opening/presentation/readback tests, full `npm.cmd test`, `node --check` for every changed JS/MJS file, and `git diff --check`.
12. No migration/DDL is expected or authorized. If a current DB contract unexpectedly blocks the parser-only correction, STOP and report rather than broadening scope.
13. Commit source/test changes on the canonical branch.
14. Set this CURRENT_TASK to `Status: WAITING_REVIEW` in the same lineage after tests pass.
15. Perform a normal fast-forward push of the complete source/test/docs lineage to `origin/company/scene-location-presence-v1`.
16. After push, independently verify:
   - local HEAD == remote branch HEAD;
   - PR #67 head == that same FINAL_SHA;
   - source/test commit(s) are GitHub-resolvable;
   - remote CURRENT_TASK is `WAITING_REVIEW`;
   - PR #67 remains OPEN / DRAFT / UNMERGED.
17. Only after the remote checks pass, post one immutable terminal report to Issue #68 containing START_SHA, SOURCE_TEST_SHA, FINAL_SHA, exact privacy-boundary change, focused/full/static test results, remote/PR HEAD equality and forbidden-operation confirmation.
18. STOP. Do not create the next CURRENT_TASK yourself.

## Architecture constraints

- Story LLM remains narrative authority.
- The fresh parser is a structural/privacy projection boundary, not a second semantic author.
- Do not create a third/new parser generation.
- Do not retry/regenerate provider output to avoid duplicate THOUGHT.
- Do not add a runtime semantic gate/judge, regex outcome verifier, fuzzy repair, compatibility bag, or generic memory authority.
- Do not expose duplicate private-thought text through narrative, `scene_text`, Extract observation, media/TTS projection, or committed public parsed blocks.
- Preserve raw Story streaming and raw Story storage; the fix is parsed/presentation privacy, not provider-output rewriting.
- Preserve exact four provider-authored choices and existing literal round-trip authority.
- Preserve the Minimal Story Runtime deletion work and same-location registered-NPC handoff correction already landed.
- No provider/model/config/retry change.

## Authorized operations

Authorized:
- read-only Git/source/PR inspection;
- source/test/docs edits on the canonical branch only;
- local focused/full tests and static checks;
- normal fast-forward push of this task lineage;
- one immutable Issue #68 terminal report after remote equality is proven.

Not authorized:
- TEST gameplay/reset/write or any game access;
- DB write/migration/DDL authoring or apply;
- API/frontend deploy;
- Production or forbidden-game access;
- provider/model/config/retry/regeneration changes;
- new parser generation;
- new branch/PR;
- merge, PR Ready, rebase, squash or force-push.

## Acceptance

PASS only if all of the following are proven:
- the accepted duplicate-THOUGHT leak is reproduced by a regression on the baseline;
- after the fix, first THOUGHT remains the canonical private thought;
- second/later THOUGHT content never becomes ordinary narrative, `scene_text`, Extract observation, or committed public parsed-block content;
- duplicate warning remains;
- an otherwise valid Story remains usable without retry/regeneration;
- Opening and ordinary Story share the corrected behavior;
- choices/dialogue/scene/acting/readback contracts remain green;
- full tests/static checks pass;
- the complete source/test/docs lineage is actually landed remotely with branch HEAD == PR #67 head == reported FINAL_SHA.

A local-only PASS is BLOCKED, not COMPLETE.

## Product-acceptance debt after this source fix — preserve, do not execute here

After independent review of this source correction, the next bounded TEST acceptance must still prove:
1. same-location exact registered NPC handoff live (`윤민아 보러간다`);
2. explicit representable player physical/self-state fidelity;
3. positive supported compact four-slot clothing persistence;
4. continuity after the recent six raw turns through chronological `turn_summary` memory;
5. exactly four literal choices with useful semantic diversity and no repetitive non-progressing reaction loop;
6. CSA activation-time premise coherence while keeping unrelated consent/comfort/affection/trust/romance/arousal separate;
7. canonical time plus refresh/history/replay parity;
8. presentation side-system isolation.

Do not run these live proofs in this source/test task.
