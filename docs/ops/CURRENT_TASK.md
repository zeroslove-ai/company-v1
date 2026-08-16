# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-test-rollout-v5
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308675017` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v4`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
V4 final docs SHA: `e3581aad1dc3918d4965d2109d13d9ba7410f00c`.

TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied. **DO NOT REAPPLY OR EDIT IT.**

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only.
Forbidden:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- Production.

## Accepted V4 interpretation

V4 proved the local ASCII Unicode-escape -> UTF-8 -> JSON transport preflight, Setup/Opening, four canonical Opening choices, literal Turn 1 Story -> Extract -> Commit, and final canonical reset.

V4 did **not** prove a runtime/history defect. The reviewed server history route returns `ok({ records, ... })`, so the HTTP JSON shape is `{ ok:true, data:{ records:[...] } }`. The repository canary already unwraps `result.body.data ?? result.body` before reading `records`. V4's temporary acceptance reader reported `keys=[] / value=null`; treat that as a response-shape reader mistake unless canonical `body.data.records` itself is shown empty/missing after a committed action.

Do not patch product source, navigation, history response shape, or add a duplicate compatibility alias because of V4.

## Objective

Finish the Minimal Story Runtime TEST product acceptance once on the exact reviewed/live lineage, using the canonical history response shape and no new harness layer.

Prove:
- provider literal + free-text action transport;
- exact Korean scripted action outbound/committed echo;
- registered A->B navigation to Mina using the actual committed start scene;
- destination presence chronology and stable identity;
- retired semantic-root non-resurrection;
- latest-six raw + older chronological `turn_summary` memory;
- committed refresh/context/history readback;
- replay/idempotence;
- CSA premise separation when practical;
- final canonical reset.

## Required execution

### A. Freeze / read-only preflight

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` exists exactly once. Do not reapply it.
3. Verify the disposable TEST game is clean at turn 0 and retired roots are absent.
4. Verify TEST API Worker source/version/health. Do not redeploy if it remains equivalent to reviewed runtime `a341c04c...`. Deploy only the exact reviewed lineage if actual drift is proven.
5. Do not deploy frontend unless reviewed frontend drift is independently proven and necessary to the acceptance.

### B. Reuse the already-proven byte-safe action construction

6. Construct scripted Korean actions from ASCII-only Unicode escapes in Node/UTF-8-safe code. Do not pass raw Hangul through a shell code-page boundary.
7. Use:
   - meeting room: `\ube0c\ub79c\ub4dc\uc804\ub7b5\ud300 \ud68c\uc758\uc2e4\ub85c \uac04\ub2e4`
   - Mina: `\uc724\ubbfc\uc544 \ubcf4\ub7ec\uac04\ub2e4`
8. Assert no literal `?` or U+FFFD and exact UTF-8 encode/decode + JSON stringify/parse round-trip. No hand-written code-point oracle.
9. This is a local transport check only. Do not create or commit another repository harness layer.

### C. Canonical history reader — mandatory before classifying a product defect

10. For `/api/history`, read the canonical response as `body.data.records` (or reuse the repository canary `historySnapshot()` behavior, which unwraps `result.body.data ?? result.body`).
11. Do not inspect only `body.records` and do not treat an empty key set from the wrapper object as product evidence.
12. After every committed scripted action that requires exact echo proof, capture:
   - HTTP status;
   - full raw JSON body;
   - unwrapped `data.records` length and turn numbers;
   - matching record `player_action` / `player_input`;
   - matching action/turn IDs from committed context where available.
13. A real history/product blocker exists only if the action has successfully committed and the correctly unwrapped canonical history response genuinely omits or alters that committed `player_action`. If so, capture the full raw response plus smallest DB/read-only identity proof, reset if safe, and STOP. Do not patch source in this rollout.

### D. Setup / Opening / literal Turn 1

14. Run Setup + Opening once.
15. Verify exactly four non-empty distinct provider-authored canonical literal choices and committed Opening structured blocks.
16. Turn 1 sends one actual provider Opening literal unchanged through Story -> Extract -> Commit.
17. Verify the committed Turn 1 literal in canonical history through `data.records`.
18. Read committed canonical `scene.location_id` after Turn 1 before choosing movement.

### E. Registered navigation from the actual current scene

19. Registered Mina authority remains `heroine2 -> brand_strategy_office` from repository identity/location data.
20. If the current scene is not `brand_strategy_office`, send the preflighted Mina action directly.
21. If current scene is already `brand_strategy_office`, send the preflighted meeting-room action first and verify `brand_strategy_meeting_room`, then send the preflighted Mina action and verify return to `brand_strategy_office`.
22. For each scripted action, prove exact outbound string == committed canonical history `player_action`.
23. Verify true A->B movement chronology:
   - canonical location changes to B;
   - source presence/speaker does not teleport to B without destination evidence;
   - remote dialogue does not create local presence;
   - Mina resolves to registered `heroine2`, with no duplicate/fake Mina and no other NPC dialogue attributed to her.
24. Player input is intent; Story/Extract determine what actually occurs except deterministic registered navigation mechanics already accepted by the current runtime.

### F. Coherent continuation / memory / minimal state

25. Continue one coherent scenario to about 8–10 ordinary committed turns unless the first deterministic product defect occurs earlier.
26. Mix literal choices and free text. No provider retry/regeneration to obtain prettier output.
27. Establish one meaningful early natural-language work/promise/request/agreement/refusal detail early enough to leave the latest-six raw window.
28. At the memory boundary verify the next-Story committed projection contains exactly six latest raw committed turns plus chronological older natural-language `turn_summary` entries.
29. Verify retired generic semantic roots removed by the Minimal Story Runtime do not reappear as fresh Story authority or save/client fallback.
30. Provider failure to repeat the old detail is not itself a defect; server projection availability is the acceptance condition.

### G. CSA premise separation — only if practical

31. If Level 7 is needed, use only the already-approved TEST-only Level-7 seam at most once for capability; do not seed narrative outcomes.
32. If one valid CSA can be activated naturally through the product path, verify:
   - valid active/applicable company rule is in force from activation time;
   - personal dislike/embarrassment/reluctance may affect reaction but does not make the rule optional;
   - compliance does not imply unrelated consent, comfort, affection, trust, romance or arousal;
   - no finite physical execution grammar is restored.
33. Do not force CSA or sexual coverage and do not retry to manufacture it.

### H. Readback / replay / cleanup

34. Verify refresh/context/frontend readback uses committed authority: canonical scene/display and committed parsed-block choices; no retired client/save semantic mirror takes precedence.
35. Verify history uses committed parsed blocks and natural-language summaries.
36. Perform same-action replay/recovery on one committed ordinary turn. Story/Extract/Commit must acknowledge replay and durable turn identity/state must remain unchanged.
37. One gameplay scenario attempt only after preflight. No provider retry/regeneration and no second scenario attempt.
38. On first deterministic product defect, capture minimal decisive evidence, final reset if safe, mark BLOCKED, and STOP. No source patch in this live task.
39. On PASS, perform one final canonical reset and independently verify:
   - committed_turn=0;
   - game_turns=0 and game_actions=0;
   - processing idle;
   - setup/opening not_started;
   - Level 1 / exp 0;
   - canonical scene `setup` v1 with empty presence;
   - csa_active empty;
   - retired roots absent;
   - no Level-7 acceleration residue.

## Architecture constraints

- Story LLM is narrative authority.
- Extract is one narrow Story-grounded observer plus natural-language `turn_summary`.
- Commit is structural transaction authority, not narrative interpreter.
- No `open_facts`, `open_observations`, generic relation/event/emotion/work ledger, replacement memory bag, entity/vector graph, importance scoring, semantic gateway, finite physical execution authority, fuzzy inference, third memory LLM, retry/regeneration workaround, or new parser generation.
- Registered character/location identity and deterministic navigation are permitted narrow mechanics.
- CSA is institutional lifecycle/context/capability; compliance remains separate from unrelated consent/comfort/affection/trust/romance/arousal.
- Media/image/TTS remain presentation sidecars.
- Historical migrations are immutable.
- Do not add top-level history aliases or other compatibility response shapes merely to satisfy the V4 temporary reader.

## Authorized operations

Authorized:
- read-only Git/PR/deployment/TEST DB inspection;
- local temporary UTF-8/JSON action construction/evidence;
- exact reviewed TEST API deploy only if source drift is proven;
- disposable TEST reset/setup/opening/gameplay/CSA/history/replay;
- approved TEST-only Level-7 seam at most once if needed;
- bounded temporary evidence artifact;
- docs-only terminal record and immutable Issue #68 terminal comment.

Not authorized:
- migration reapply/new DDL/migration edit;
- repository source/runtime/test/config/content behavior edits;
- Production access/deploy;
- preserved manual or QA evidence game access;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility runtime/alias;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if the single scenario closes the remaining product acceptance using the canonical history response contract: byte-safe scripted actions, exact committed action echo, true registered A->B navigation with correct destination chronology/identity, retired-root non-resurrection, latest-six raw + older summary projection, committed readback/history, replay/idempotence, and canonical final reset. CSA is assessed only if naturally exercised.

On PASS or first blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact identities, canonical history raw/unwrapped evidence, product evidence, final reset state, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
