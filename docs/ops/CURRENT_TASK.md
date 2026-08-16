# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-test-rollout-v6
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308724289` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v5`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
V5 final docs SHA: `00bbe055a3d4ae96c4a6cb9ab4a0961f954003fe`.

TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied. **DO NOT REAPPLY OR EDIT IT.**

Known reviewed TEST API Worker from V5 preflight: `game-proxy-company-v1`, Version `37c05efd-b8b9-4be3-b0f8-c823576b0149` (version 168). Reverify before use; do not redeploy if it remains healthy/source-equivalent to the reviewed runtime.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only.
Forbidden:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- Production.

## Accepted V5 interpretation

V5 did **not** prove any product/runtime defect. Setup returned HTTP 200, then a temporary runner mistake sent Opening to `/api/story` rather than the canonical `/api/opening` endpoint. The resulting HTTP 400 is runner evidence only.

Independent operator verification after V5 confirms the disposable TEST game is clean: committed_turn=0, game_turns=0, game_actions=0, Level 1/exp 0, setup/opening not_started, canonical scene `setup` v1 with empty presence, csa_active=[], and all retired Minimal Story Runtime semantic roots absent.

Do not change runtime, Opening prompt/parser, history response shape, navigation, provider/model, or compatibility behavior because of V5.

## Objective

Finish the Minimal Story Runtime TEST product acceptance on the exact reviewed/live lineage in one coherent scenario.

Required proof:
- provider-authored literal + free-text input transport;
- exact byte-safe Korean scripted action outbound/committed echo;
- registered A->B navigation to Mina selected from the actual committed current scene;
- correct destination presence chronology and stable registered identity;
- retired semantic-root non-resurrection;
- exactly six latest raw committed turns plus chronological older natural-language `turn_summary` memory;
- committed context/history/frontend readback authority;
- replay/idempotence;
- CSA premise separation only if naturally practical;
- final canonical reset.

## Critical runner rule — do not repeat V2–V5 harness mistakes

1. Before any provider/gameplay call, inspect/reuse the repository's existing canary/request helpers and current route contract. Do **not** hand-roll an alternate endpoint map.
2. Canonical high-level flow is Setup -> `/api/opening` -> ordinary action Story/Extract/Commit -> `/api/context` + `/api/history` -> replay -> `/api/reset`.
3. `/api/story` is never the Opening endpoint.
4. `/api/history` canonical records are `body.data.records` (or the existing canary equivalent that unwraps `body.data ?? body`). Do not classify `body.records` absence as a product defect.
5. Use the already-proven ASCII Unicode-escape -> UTF-8 -> JSON action construction. No hand-written code-point oracle.
6. Do not add or commit another repository harness layer.
7. A typo/wrapper/temporary-runner bug that is proven before a provider gameplay attempt is not a product defect and must not create another source task. Correct the temporary runner locally before starting the single gameplay scenario. Provider Story/Extract retry/regeneration remains forbidden.

## Required execution

### A. Read-only preflight

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify migration `20260816050000 / company_v1_minimal_story_runtime_contract` exists exactly once; no apply/reapply.
3. Verify disposable TEST baseline is turn 0 / idle / setup+opening not_started / canonical scene setup / retired roots absent.
4. Verify current TEST API source/version/health. Keep current reviewed Worker if equivalent; deploy only the exact reviewed lineage if actual drift is proven.
5. Verify the canonical request flow from current source or existing canary helpers before gameplay: Setup -> `/api/opening`; ordinary Story/Extract/Commit; context/history/replay/reset.

### B. Byte-safe scripted actions

6. Construct these actions from ASCII-only Unicode escapes in Node-safe UTF-8 code:
   - meeting room: `\ube0c\ub79c\ub4dc\uc804\ub7b5\ud300 \ud68c\uc758\uc2e4\ub85c \uac04\ub2e4`
   - Mina: `\uc724\ubbfc\uc544 \ubcf4\ub7ec\uac04\ub2e4`
7. Assert no literal `?` / U+FFFD and exact UTF-8 encode/decode + JSON stringify/parse round-trip.

### C. Setup / canonical Opening / literal Turn 1

8. Run Setup once, then call the canonical `/api/opening` endpoint with the returned setup identity.
9. Verify Opening HTTP 200 and exactly four non-empty distinct provider-authored canonical literal choices plus committed structured Opening blocks.
10. Turn 1 sends one actual Opening literal unchanged through Story -> Extract -> Commit.
11. Read `/api/history` through `body.data.records`; prove committed Turn 1 `player_action` equals the outbound literal exactly.
12. Read committed canonical `scene.location_id` after Turn 1 before choosing movement.

### D. Registered A->B navigation

13. Registered Mina authority remains `heroine2 -> brand_strategy_office` from repository identity/location data.
14. If current scene is not `brand_strategy_office`, send the preflighted Mina action directly.
15. If current scene is already `brand_strategy_office`, send the preflighted meeting-room action first, verify `brand_strategy_meeting_room`, then send Mina action and verify return to `brand_strategy_office`.
16. For every scripted navigation action, prove exact outbound string == canonical committed history `player_action`.
17. Verify true movement chronology and identity:
   - canonical location changes A -> B;
   - destination presence must be grounded in destination evidence;
   - source presence/speaker does not teleport to B;
   - remote dialogue does not create local presence;
   - Mina resolves only to registered `heroine2`; no duplicate/fake Mina or misattributed speaker.

### E. Coherent 8–10 turn continuation / memory

18. Continue the same scenario to about 8–10 ordinary committed turns unless a deterministic product defect appears first.
19. Mix actual provider literals and free text. No retry/regeneration for prettier output.
20. Establish one meaningful work/promise/request/agreement/refusal detail early enough to leave the latest-six raw window.
21. At the boundary, verify committed next-Story projection contains exactly six latest raw turns plus chronological older natural-language `turn_summary` entries.
22. Verify retired generic semantic roots do not reappear as fresh save/Story/frontend authority.
23. Provider failure to repeat an older detail is not itself a defect; committed projection availability is the acceptance condition.

### F. CSA only if naturally practical

24. If Level 7 is necessary, use only the approved TEST-only Level-7 seam at most once; do not seed narrative outcomes.
25. If a valid CSA is naturally activated, verify active/applicable company rule is in force from activation time while personal dislike/embarrassment may affect reaction but does not make the rule optional.
26. Compliance must not imply unrelated consent, comfort, affection, trust, romance or arousal. Do not restore finite physical execution grammar.
27. Do not force CSA or sexual coverage and do not retry to manufacture it.

### G. Readback / replay / cleanup

28. Verify refresh/context/readback uses committed authority: canonical scene/display and committed parsed-block choices; no retired client/save semantic mirror wins.
29. Verify canonical history uses committed parsed blocks and natural-language summaries.
30. Perform same-action Story/Extract/Commit replay on one committed ordinary turn. Replay flags must be true and committed turn/state identity must remain unchanged.
31. One provider gameplay scenario attempt only. On the first deterministic product defect, capture the smallest decisive evidence and reset if safe; do not patch source in this task.
32. Finish with one canonical reset and independently verify:
   - committed_turn=0;
   - game_turns=0 / game_actions=0;
   - processing idle;
   - setup/opening not_started;
   - Level 1 / exp 0;
   - canonical scene `setup` v1, empty presence;
   - csa_active=[];
   - retired semantic roots absent;
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
- Do not add top-level history aliases or other compatibility response shapes for temporary-runner mistakes.

## Authorized operations

Authorized:
- read-only Git/PR/deployment/TEST DB inspection;
- local temporary UTF-8/JSON/request-flow verification;
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
- provider retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility runtime/alias;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if the single coherent product scenario closes the remaining Minimal Story Runtime acceptance: canonical Opening, literal/free-text and exact Korean action transport, registered A->B navigation with correct identity/presence chronology, retired-root non-resurrection, latest-six raw + older summary projection, committed readback/history, replay/idempotence and clean final reset. CSA is assessed only if naturally exercised.

On PASS or first deterministic product blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact identities, canonical history evidence, product result, final reset state, and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
