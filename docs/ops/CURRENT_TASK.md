# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-test-rollout-v4
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308625192` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v3`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
V3 final docs SHA: `389a3002558c143010dbee7a11216f3448bab7a2`.

## V4 rollout result — WAITING_REVIEW / BLOCKED

- V4 execution identity: `minimal-story-runtime-test-rollout-v4` on `company/scene-location-presence-v1`, starting from `e8c5bc5bc4bbffecf1ba32ae592be08e53950e3c`, with task blob `ad1e4863d9c508c59b21dc5f098f3e8e52effbe1`.
- Local ASCII-only escaped-source UTF-8/JSON preflight: PASS. Evidence: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-minimal-story-runtime-rollout-v4-utf8-preflight.json`.
- TEST gameplay: Turn 1 Story -> Extract -> Commit PASS; opening returned exactly four canonical choices. The first direct navigation action then failed the required exact committed/history `player_action` echo contract: the expected preflighted Mina action was not found in the returned history echo (`found=false`, `keys=[]`, `value=null`).
- This is a deterministic product acceptance blocker, not a harness encoding blocker. No source/runtime or migration change was made and no retry/regeneration or second scenario was attempted.
- V4 rollout artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-minimal-story-runtime-rollout-v4.json`.
- Final disposable TEST reset: PASS. Readback: `committed_turn=0`, `processing_status=idle`, `player_setup=not_started`, `opening_state=not_started`, canonical scene `setup` v1, empty presence, retired roots absent, `clean=true`. Final `save_revision=1081`.

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- root `CURRENT_TRUTH.md`
- accepted Minimal Story Runtime audit review `5308024297`
- accepted navigation/scene-phase review `5308377329`.

TEST contract/runtime already live:
- migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied to TEST. **DO NOT REAPPLY OR EDIT IT.**
- V3 reported TEST API Worker Version `37c05efd-b8b9-4be3-b0f8-c823576b0149` healthy on the reviewed runtime lineage. Reverify; do not redeploy if still equivalent.

Disposable TEST game:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only.

Forbidden games/environments:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: DO NOT ACCESS.
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: DO NOT ACCESS.
- Production: forbidden.

## Accepted V3 blocker interpretation

V3 did not reach Setup/Opening or any product request. It failed only because the local harness contained a malformed hand-written expected-code-point array (`0ube0c`, etc.). This is not evidence of a product/runtime/navigation defect.

Do not change runtime, navigation, Story, Extract, Commit, DB schema, provider/model, parser, or semantic behavior because of V3.

Do not create another repository harness-fix task. V4 must use a simpler local-only byte-safe preflight with **no manually maintained expected code-point array** and then proceed directly to one bounded product scenario.

## Objective

Finish the Minimal Story Runtime TEST product acceptance on the exact reviewed/live lineage.

First prove Korean scripted player actions survive the local construction/UTF-8/JSON boundary without an extra hand-written oracle. Then run one coherent product scenario covering:
- exact provider literal + free text;
- registered A->B navigation chosen from the actual committed scene;
- destination presence chronology/identity;
- retired-root non-resurrection;
- CSA premise separation when practical;
- latest-six raw + older chronological `turn_summary` memory;
- committed refresh/history/readback;
- replay/idempotence;
- final canonical reset.

## Required execution

### A. Freeze / live preflight

1. Freeze START HEAD. Verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Read-only verify TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` exists exactly once. Do not reapply it.
3. Read-only verify disposable TEST game is clean at turn 0 and retired roots remain absent before gameplay.
4. Verify TEST API source/version/health. Do not redeploy if still equivalent to reviewed source `a341c04c...`. Deploy only exact reviewed lineage if actual drift is proven.
5. Do not redeploy frontend unless actual reviewed frontend source drift is proven.

### B. Simple local UTF-8/JSON preflight — before Setup/Opening

6. Create the scripted Korean action values inside a UTF-8-safe Node/runtime from ASCII-only Unicode escapes. Do not pass raw Hangul through a shell/code-page boundary.
7. Use these exact escaped sources:
   - meeting room: `\ube0c\ub79c\ub4dc\uc804\ub7b5\ud300 \ud68c\uc758\uc2e4\ub85c \uac04\ub2e4`
   - Mina: `\uc724\ubbfc\uc544 \ubcf4\ub7ec\uac04\ub2e4`
8. Recommended construction is equivalent to:
   - `const meeting = JSON.parse('"\\ube0c\\ub79c\\ub4dc\\uc804\\ub7b5\\ud300 \\ud68c\\uc758\\uc2e4\\ub85c \\uac04\\ub2e4"')`
   - `const mina = JSON.parse('"\\uc724\\ubbfc\\uc544 \\ubcf4\\ub7ec\\uac04\\ub2e4"')`
9. **Do not create or compare against a hand-written expected code-point integer array.** The approved ASCII Unicode-escape source is the oracle.
10. For each final string, locally assert only deterministic transport properties:
   - non-empty;
   - contains neither literal `?` nor U+FFFD replacement character;
   - `Buffer.from(value, 'utf8').toString('utf8') === value` (or exact equivalent);
   - `JSON.parse(JSON.stringify({ player_action: value })).player_action === value`;
   - capture the dynamically derived code-point list and UTF-8 hex as evidence, but do not hard-code them as a second oracle.
11. If this local preflight fails, stop before Setup/Opening and report the exact local expression/error. Do not patch product source or consume the gameplay scenario.

### C. Setup / Opening / literal Turn 1

12. After B passes, run Setup + Opening once.
13. Verify exactly four non-empty distinct provider-authored canonical literal choices and committed Opening structured blocks.
14. Turn 1 sends one actual Opening provider literal unchanged through Story -> Extract -> Commit.
15. Read committed canonical `scene.location_id` after Turn 1 before choosing movement.

### D. Registered navigation from the actual current scene

16. Normal player actions only. No direct save patch, synthetic Extract, forced Opening location, DB state manufacture, or provider retry/regeneration.
17. Registered Mina authority remains `heroine2 -> brand_strategy_office` from immutable repo/catalog identity/location data.
18. If current scene is not `brand_strategy_office`, send the preflighted Mina action directly and verify a true current-location -> office move.
19. If current scene is `brand_strategy_office`, first send the preflighted meeting-room action and verify move to `brand_strategy_meeting_room`; then send the preflighted Mina action and verify return to `brand_strategy_office` with `heroine2` destination identity.
20. For every scripted Korean action, capture exact outbound `player_action` and committed/action-history echoed `player_action`; both must equal the locally preflighted string exactly. Any `?`/U+FFFD corruption before runtime parsing is a harness blocker, not navigation evidence.
21. On a true A->B movement, verify final canonical presence is destination-phase/location-aware: source NPC/speaker/presence evidence does not teleport to B; remote speakers do not become local; accompaniment/presence is accepted only from destination evidence.
22. Story at destination must not create duplicate/fake Mina or attribute another NPC's dialogue to Mina.

### E. Coherent continuation / minimal state / memory

23. Continue one coherent scenario to approximately 8–10 committed ordinary turns unless the first deterministic product defect occurs earlier.
24. Use a mix of the literal Turn 1, registered navigation, and ordinary free-text player actions.
25. Establish one meaningful early natural-language detail (work detail/promise/request/agreement/refusal) early enough to leave the latest-six raw window.
26. Verify retired fresh-save semantic roots remain absent and are not reintroduced as Story authority, including the retired generic NPC stats/relationship/CSA-attitude/runtime/aftereffect/sexual-event/general-event roots removed by the Minimal Story Runtime migration.
27. Verify actual next-Story committed context at the memory boundary:
   - exactly six latest committed raw turns;
   - older `turn_summary` entries chronological and natural-language;
   - early detail is available in older summary memory without a replacement semantic ledger.
28. Provider failure to repeat the old detail is not itself a defect; server projection availability is the acceptance condition. No retry for a prettier narrative.

### F. CSA premise separation — if practical in the same scenario

29. If Level 7 is needed, use only the already-approved TEST-only Level-7 seam at most once and only for capability; do not seed narrative outcomes.
30. Activate one valid CSA through the normal product path if practical and verify:
   - activation-time notice/rule is sufficient; no retroactive memory requirement;
   - once active/applicable, the company rule is in force as altered workplace common sense;
   - dislike/embarrassment/reluctance may affect reaction but cannot make the valid active rule optional/not-in-force;
   - compliance does not imply unrelated consent, comfort, affection, trust, romance, or arousal;
   - no finite physical execution grammar is required/restored.
31. Do not force sexual coverage or retry to obtain it.

### G. Readback / replay / cleanup

32. Verify refresh/context/frontend readback uses committed authority: canonical scene/display and Opening/committed parsed-block choices; no retired save/client semantic mirror takes precedence.
33. Verify history uses committed parsed blocks and natural-language turn summaries.
34. Perform same-action replay/recovery on one committed ordinary turn; Story/Extract/Commit must report replay identity and must not create a duplicate durable transition.
35. One gameplay scenario attempt only after local preflight. No provider retry/regeneration or second scenario attempt.
36. On first deterministic product defect, capture minimal decisive evidence, reset if safe, mark BLOCKED, and stop. Do not patch source inside rollout.
37. On PASS, perform one final canonical reset and independently verify:
   - committed_turn=0;
   - game_turns=0 and game_actions=0;
   - processing idle;
   - setup/opening not_started;
   - Level 1 / exp 0;
   - canonical scene `setup` v1;
   - csa_active empty;
   - retired roots absent;
   - no Level-7 acceleration residue.

## Architecture constraints

- Story LLM is narrative authority.
- Extract is one narrow Story-grounded observer plus natural-language `turn_summary`.
- Commit is structural transaction authority, not narrative interpreter.
- No `open_facts`, `open_observations`, generic relation/event/emotion/work ledger, replacement memory bag, entity/vector graph, importance scoring, semantic gateway, finite physical execution authority, fuzzy inference, third memory LLM, retry/regeneration workaround, or new parser generation.
- Registered character/location identity and exact deterministic navigation are permitted narrow mechanics.
- CSA is institutional lifecycle/context/capability. Compliance remains separate from unrelated consent/comfort/affection/trust/romance/arousal.
- Media/image/TTS remain presentation sidecars.
- Historical migrations are immutable.

## Authorized operations

Authorized:
- read-only Git/PR/deployment/TEST DB inspection;
- local temporary Node/UTF-8/JSON preflight and evidence;
- exact reviewed TEST API deploy only if source drift is proven;
- TEST frontend deploy only if reviewed frontend source drift is proven;
- disposable TEST game reset/setup/opening/gameplay/CSA/history/replay;
- approved TEST-only Level-7 seam at most once if needed;
- bounded temporary evidence artifact;
- docs-only terminal record and immutable Issue #68 terminal comment.

Not authorized:
- migration reapply/new DDL/migration edit;
- repository source/runtime/test/config/content behavior edits;
- Production access/deploy;
- preserved manual game access;
- QA evidence game access;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility bag/runtime;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if the single post-preflight scenario closes the remaining product acceptance: byte-safe Korean scripted action transport, true registered A->B navigation with correct destination chronology/identity, retired-root non-resurrection, CSA premise separation when exercised, latest-six raw + older summary projection, committed readback/history, replay/idempotence, and canonical final reset.

On PASS or first blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact identities, local UTF-8 evidence, product evidence, final reset state, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
