# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-test-rollout-v3
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308588018` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v2`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
Previous rollout final docs SHA: `ba7de91bffd3f8989c684772bcdf0a9eadb5cccb`.

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- root `CURRENT_TRUTH.md`
- accepted Minimal Story Runtime audit review `5308024297`.

TEST contract already live:
- migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied to TEST. **Do not reapply it.**
- latest reviewed TEST API Worker lineage is source/runtime `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`; V2 reported Worker Version `37c05efd-b8b9-4be3-b0f8-c823576b0149`. Reverify current identity before execution; do not redeploy if still equivalent.

Disposable TEST game:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
- operator post-V2 independent read-only verification: committed_turn=0, save_revision=1076, Level 1/exp 0, setup/opening not_started, canonical scene `setup` v1, csa_active=[], actions=0, history=0.
- retired current-save roots absent after reset: `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`, `sexual_event_ledger`, `story_summary_overall`, `story_summary_recent`, `npc_emotion`, `npc_work_state`, and general `event_ledger`.

Forbidden evidence games:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: DO NOT ACCESS.
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: DO NOT ACCESS.
- Production: forbidden.

## V2 blocker and binding interpretation

V2 is accepted as harness failure evidence, not a runtime/navigation defect.

Setup/Opening and unchanged Opening-literal Turn 1 passed. Opening was at `brand_strategy_office`, so the intended normal movement branch was office -> `brand_strategy_meeting_room` -> Mina/office. But the first Korean location action was already corrupted in the bounded operator artifact as `?????? ???? ??` before it could serve as a valid gameplay input. It did not move scene and the run correctly stopped without provider retry or source patch.

Do not alter runtime, navigation, Story, Extract, Commit, DB schema, provider/model, parser, or semantic behavior from this evidence.

## Objective

Complete the unfinished Minimal Story Runtime TEST acceptance on the exact reviewed runtime lineage, but first make the **operator request-construction boundary byte-safe and deterministic** so Korean normal player inputs cannot be corrupted by shell/code-page handling.

After the local harness preflight passes, run exactly one coherent TEST scenario covering registered navigation chosen from the actual committed start scene, CSA premise separation, latest-six raw + older `turn_summary` memory, committed refresh/readback, replay/idempotence, and final canonical reset.

## Required execution

### A. Freeze / live preflight

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` exists exactly once; do not reapply/edit it.
3. Read-only verify the disposable game remains clean turn 0 and retired roots remain absent.
4. Verify current TEST API identity/source lineage. If equivalent to reviewed runtime `a341c04c...`, do not redeploy. Deploy only exact reviewed lineage if actual executable drift is proven.
5. No frontend redeploy unless actual reviewed frontend source drift is proven.

### B. Mandatory local UTF-8 action-construction preflight — before any Setup/Opening

6. Before any gameplay request, prove the local harness can construct, serialize, encode, decode and re-read the scripted Korean actions exactly. This preflight is local/non-provider/non-DB and does not consume the scenario attempt.
7. Do **not** place raw Hangul literals through a shell/code-page boundary that previously produced `?` replacement characters. Use ASCII-only Unicode escape source (or an equivalently byte-safe UTF-8 local mechanism) and construct the final JavaScript/string value inside a UTF-8-safe runtime.
8. Exact approved ASCII-safe scripted values include:
   - meeting-room action: `\ube0c\ub79c\ub4dc\uc804\ub7b5\ud300 \ud68c\uc758\uc2e4\ub85c \uac04\ub2e4` = `브랜드전략팀 회의실로 간다`
   - Mina action: `\uc724\ubbfc\uc544 \ubcf4\ub7ec\uac04\ub2e4` = `윤민아 보러간다`
9. Locally assert for each scripted action before network use:
   - decoded Unicode code points match the expected sequence;
   - UTF-8 encode -> decode is exact;
   - JSON stringify -> parse is exact;
   - serialized payload contains no replacement/question-mark corruption;
   - capture deterministic evidence such as code-point sequence and UTF-8 hex or equivalent exact byte proof.
10. If this local preflight fails, post BLOCKED as harness failure **before Setup/Opening**. Do not consume another gameplay run and do not patch product source.

### C. Setup / Opening / literal input

11. Run Setup + Opening once only after B passes. Verify exactly four provider-authored canonical literal choices and committed Opening structured blocks.
12. Turn 1 sends one actual Opening provider literal unchanged and completes Story -> Extract -> Commit once.
13. Read committed canonical `scene.location_id` after Turn 1 before choosing navigation.

### D. Registered navigation through normal player actions

14. Use normal player actions only; no direct save patch, synthetic Extract, DB manufacture, forced Opening location, or provider retry/regeneration.
15. Registered Mina destination authority: `heroine2` -> `brand_strategy_office`.
16. If current location is not `brand_strategy_office`, send the UTF-8-preflighted Mina action and verify a true A -> office move.
17. If current location is `brand_strategy_office`, send the UTF-8-preflighted meeting-room action first and verify canonical move to `brand_strategy_meeting_room`; then send the UTF-8-preflighted Mina action and verify registered `heroine2` resolves back to `brand_strategy_office`.
18. For every scripted action, capture both exact outbound player_action and committed/action-history echoed player_action; they must match the intended Unicode string exactly. Any `?` replacement before product parsing is a harness blocker, not navigation evidence.
19. For a true A->B move verify destination chronology: source-phase presence/speaker evidence does not teleport, remote speakers do not become local presence, destination NPC appears/accompanies only from destination-phase evidence, and removed scene mirrors do not choose destination.
20. Story must continue at destination without duplicate/fake Mina or another NPC's dialogue being attributed to Mina.

### E. Continue coherent scenario / minimal state

21. Continue ordinary gameplay to normally 8–10 committed ordinary turns unless the first deterministic product defect occurs earlier.
22. Establish one meaningful early work detail, promise, request, agreement/refusal, or other natural-language continuity fact before it leaves the latest-six raw window.
23. Sample current save/Story input after commits and verify retired semantic roots stay absent and do not return as fresh Story authority.
24. Preserve only current narrow authority: canonical scene/time, progression, CSA lifecycle/capability, compact physical/clothing if naturally observed, direct-evidence player sexual state if naturally reached, literal choices, Mind Monitor, media/TTS sidecars, committed parsed blocks, turn summaries, transaction/replay identity.

### F. CSA premise separation

25. If Level 7 is required, use only the already-installed approved TEST-only Level-7 seam, at most once, capability-only; do not seed narrative outcomes.
26. Activate one valid CSA through the normal product path if practical and verify:
   - activation-time company notice/rule is enough; no retroactive memory requirement;
   - once active/applicable, the rule is in force as the altered workplace premise;
   - personal dislike/embarrassment/reluctance can affect reaction but cannot make the active rule optional/not-in-force;
   - CSA compliance does not imply unrelated consent, comfort, affection, trust, romance or arousal;
   - no finite physical execution grammar is required/restored.
27. Do not force sexual coverage. If narrow direct-evidence sexual mechanics occur naturally, verify them; otherwise record not reached without retry.

### G. latest-six + older summary memory

28. Continue until the early fact from step 22 leaves the latest-six raw window.
29. Inspect actual next-Story committed context and prove:
   - exactly six latest committed raw turns are projected;
   - older `turn_summary` entries are chronological natural language;
   - the older meaningful detail remains available to Story without `npc_relationship_state`, generic event/emotion/work ledgers, `open_facts`, or a replacement memory bag.
30. Provider not mentioning the older detail is not itself a defect. Do not retry; verify server projection availability.

### H. Readback / replay / cleanup

31. Verify refresh/context/frontend readback uses committed authority: choices from Opening/committed parsed blocks, canonical scene/display, no stale client/save semantic mirror authority.
32. Perform same-action replay/recovery on one committed ordinary turn and verify Story/Extract/Commit replay flags/identity and no duplicate committed transition.
33. Verify history uses committed parsed blocks + turn summaries. Persisted legacy Extract boundary remains historical read-only; fresh provider output must not enter it.
34. One gameplay scenario attempt only. No retry/regeneration for prettier evidence.
35. On first deterministic product defect, capture smallest decisive evidence, reset if safe, mark BLOCKED and stop; do not patch source inside rollout.
36. On PASS, final canonical reset and independently verify turn/action/history 0, processing idle, setup/opening not_started, Level 1/exp 0, scene setup v1, csa_active empty, retired roots absent, no Level-7 acceleration state.

## Architecture constraints

- Story LLM authors narrative; server is not a second narrative author.
- Extract is one narrow Story-grounded observer + natural-language `turn_summary`, not generic semantic memory.
- Commit is structural transaction authority, not narrative interpreter.
- No `open_facts`, `open_observations`, generic relation/event/emotion/work ledger, entity graph/vector DB, importance scoring, semantic gateway, finite physical execution authority, fuzzy inference, third memory LLM, retry/regeneration workaround, or compatibility bag.
- Registered character/location IDs and deterministic navigation resolution are permitted narrow identity/mechanics.
- CSA is institutional lifecycle/context/capability; compliance remains separate from unrelated consent/comfort/affection/trust/romance/arousal.
- Media/image/TTS remain presentation sidecars.
- Historical migrations immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployment inspection;
- read-only TEST DB verification;
- local temporary UTF-8/JSON harness preflight and evidence;
- exact reviewed TEST API deploy only if drift proven;
- TEST frontend deploy only if actual reviewed source drift proven;
- disposable TEST reset/setup/opening/gameplay/CSA/history/replay;
- existing TEST-only Level-7 seam at most once if needed;
- bounded temporary evidence artifact;
- docs-only terminal record and immutable Issue #68 report.

Not authorized:
- migration reapply/new DDL/migration;
- repository source/runtime/test/config/content edits;
- Production access/deploy;
- access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- access to QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility runtime/bag;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Rollout result

Result: BLOCKED — WAITING_REVIEW

Execution identity:
- Current task blob: `26d9f6f4df97aff5c23b6eb0e9a0652626f3c2f9`
- Start head: `1473d4b9f5cf0c652ba43b4f896a00c603a22d93`
- Reviewed source: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`
- Branch: `company/scene-location-presence-v1`

Preflight result:
- TEST migration was read-only verified present exactly once; no reapply.
- API Worker remained Version `37c05efd-b8b9-4be3-b0f8-c823576b0149`; health/version readback passed; no deploy.
- Disposable TEST baseline was read-only verified clean at turn 0 with retired roots absent.
- Required local ASCII-only Unicode/UTF-8/JSON preflight was attempted before Setup/Opening but failed at harness JavaScript parsing because the expected code-point array used malformed tokens (`0ube0c`, etc.). No gameplay, provider, TEST reset, or DB write was performed in V3.

Stop state:
- Per the task contract, local preflight failure is a BLOCKED harness result and no gameplay retry or corrected preflight was attempted.
- V2/V3 preserved evidence remains outside the repository; no Production, preserved manual game, or QA evidence game was accessed.

Forbidden operations: migration reapply/DDL 0; API/frontend deploy 0; gameplay/DB writes 0; source/runtime/test/config/content/migration edits 0; PR merge/Ready 0.

## Acceptance

PASS only if the one V3 run proves byte-exact Korean scripted player_action transport plus the unfinished Minimal Story Runtime product acceptance: true registered A->B navigation with correct chronology/identity, minimal retired-root absence, CSA premise separation when exercised, latest-six + older-summary projection, committed readback/history, replay/idempotence, and canonical final reset.

On PASS or first blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact identities, local UTF-8 preflight evidence, decisive product evidence, final reset and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
