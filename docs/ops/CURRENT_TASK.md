# Company — CURRENT TASK

Status: READY
Task ID: company-r3-media-tts-live-acceptance-v1
Mode: ACCEPTANCE-ONLY — FREEZE CSA / MEDIA + TTS DEPLOYED BROWSER PRODUCT GATE
Updated: 2026-08-25 06:04 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `fd455df80b5f1e1c3dddd63c814f40e45623ef7c`
Previous task: `company-r3-csa-catalog-actor-scope-projection-s7-closure-v1`
Previous terminal: Issue #68 `5401267206`
Operator review: Issue #68 `5401331690`
Accepted executable implementation: `bcc06683c084537e67a013fbddb577964a372d77`
Accepted TEST API: `game-proxy-company-r3` / `fc98e0c3-db75-4088-bc0c-eddf129af4b6`
Accepted TEST frontend: `gamebuilder-company-r3` / `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Preserved evidence games — READ ONLY, no reset/reuse/mutation:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `1ef46111-5a09-43cd-b61e-c0d36df04d12`
- `c04e91e5-e18f-492f-8b85-32104bb5c3b1`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `bbd1431a-f09f-40f4-82fa-c8827de84693`
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, `docs/redesign/MEDIA_CATALOG_CONTRACT.md`, terminal `5401267206`, operator review `5401331690`, then this task.
- Preserve A′/R3 architecture.
- Freeze accepted three-tier CSA foundation and do not rerun it for pass-seeking.
- This task is acceptance-only. Do not patch source/test/content/prompt/provider/model/config/catalog/DB before a deterministic live P0/P1 is observed and operator review occurs.
- No Production access. No OWNER_READY claim.

Success terminal:
`MEDIA_TTS_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Product blocked terminal:
`MEDIA_TTS_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Browser-control blocked terminal:
`MEDIA_TTS_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Frozen accepted evidence

Freeze as GREEN and do not rerun for pass-seeking:

- 21-slot CSA presentation, bounded selectors, APPLY/CHANGE/REMOVE +1-turn semantics;
- Weak lifecycle, W5 direction, M1/M3, M5 world-norm combination;
- S1 supported/unsupported finite authority, named S2/S3/S5, S7 multi-NPC;
- multi-rule durability/residue;
- existing History/mobile/MM/private-app/compliance-vs-feeling evidence;
- accepted selector implementation `79fbfd6013c2db54d4e6a68af6dc92123e292abb`;
- accepted S1 binding lineage `f607e4e868e18bde61ba8c46d508d3a502551c6f`;
- accepted actor-catalog projection `bcc06683c084537e67a013fbddb577964a372d77`.

A-CSA-004 S6 remains `when practical` and is not silently promoted to GREEN. This task does not reopen S6.

---

# 1. Purpose / current suspected boundary

Close the owner-ready media/TTS lanes in actual deployed browser play without preemptive repair.

Binding product gates:
- `A-MEDIA-001` from `LIVE_ACCEPTANCE_MATRIX.md`;
- `A-DIALOGUE-TTS-001`;
- `M-ACCEPT-001` from `MEDIA_CATALOG_CONTRACT.md`.

Known baseline is evidence only, not a pre-judged failure:
- each heroine currently has effectively one general portrait in the deployed media inventory;
- adult-pool rows exist;
- specialized canon records a reachability defect candidate where frontend may request `general` unconditionally while committed adult evidence may not reach the sex-pool gate.

Do NOT patch from that note alone. First reproduce or falsify it against the exact accepted TEST build.

---

# 2. Preflight — no deploy, no source write

Verify:
- current `main` is executable-equivalent to `bcc06683...` plus docs lifecycle only;
- TEST API exactly `fc98e0c3-db75-4088-bc0c-eddf129af4b6` or proven exact source-equivalent;
- TEST frontend exactly `af6c13bf-ef57-40cb-a4f0-e3569b301bc5` or proven exact source-equivalent;
- no unexpected media/TTS/content/catalog drift;
- current `content/media_catalog.json` remains accepted repository authority;
- no redeploy if workers already match.

Unexpected executable/deployment drift => STOP product blocked. Do not normalize or redeploy in this acceptance task.

Read-only DB/media inventory inspection is allowed only to understand candidate availability and selected asset identity. No DB writes.

---

# 3. Browser readiness barrier before game creation

Open a fresh browser page at bare TEST frontend.

Before Setup:
- DOM read PASS;
- one screenshot PASS;
- Setup fields readable;
- bounded repeat DOM read PASS;
- Media/TTS controls can be located without opening/altering a game.

If DOM/screenshot/browser control is unavailable => STOP `MEDIA_TTS_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`, create zero games, patch nothing.

---

# 4. Exactly one fresh visible adult TEST game

Only after readiness PASS:
- create exactly one fresh adult TEST game through visible valid Setup;
- one Setup submit, one Opening;
- no second game, reset, regeneration, seeding, sample-until-pass, preserved-game reuse, or direct gameplay API substitution;
- require visible Turn 0, readable Story, four full choices, compact actions where present, free input.

Record fresh game ID.

The campaign should prefer one heroine already naturally reachable in the opening/nearby scene and keep the same heroine through ordinary -> adult -> refusal/de-escalation whenever practical so image authority can be compared coherently.

---

# 5. Media lane — ordinary scene

Establish one ordinary, non-work or lightly social heroine interaction with no sexual act/state.

Record:
- committed Story and actual focal/present heroine;
- visible image, if any;
- `/media/image` request parameters and response via browser/network or equivalent read-only browser inspection;
- selected `character_id`, requested/effective pool, image ID/asset identity when available.

PASS requires:
- image character matches grounded current heroine;
- no unrelated heroine;
- ordinary scene does not use false sex-pool media;
- image failure/no candidate fails open and does not block Story/Commit.

Single generic portrait repetition alone is catalog-quality evidence, not necessarily P1 unless it creates materially false current-scene presentation.

---

# 6. Media lane — genuinely committed adult/intimate scene

Through visible free input, create a plausible explicit adult/intimate interaction with the same registered adult heroine where Story actually commits the act/state. Do not rely on a mere request; the Story must establish occurrence.

Use natural interaction. Do not use CSA solely to manufacture media evidence unless necessary to establish a valid product-supported adult context; if CSA is used, do not rerun frozen semantic acceptance.

PASS requires:
- committed Story clearly establishes the adult/intimate act/state;
- correct current heroine remains media authority;
- `/media/image` can reach an appropriate `sex` pool candidate when approved media exists for that heroine/scene family;
- selected asset meaning is not obviously unrelated to the committed scene;
- media sidecar does not alter or block Story/Commit.

If a genuinely committed adult scene with known available sex-pool candidates systematically requests/returns only `general` or no sex candidate because committed evidence is not projected, classify deterministic P1 at the exact media projection/request boundary and STOP. Do not hotfix in this task.

---

# 7. Refusal / non-occurrence lane

After or before the committed adult scene as natural continuity permits, make one explicit adult request that the heroine refuses or that otherwise does not occur.

PASS requires:
- refused/non-occurring request alone does not switch media to `sex`;
- no false asset implying the refused act occurred;
- Story agency/refusal remains intact;
- media failure remains local.

If the same current image remains from a prior committed adult scene, distinguish cache/stale-media behavior from a new false selection using visible/network evidence.

---

# 8. De-escalation / scene-end lane

Clearly stop or de-escalate the intimate interaction and return to ordinary conversation or leave/change context using visible free input.

PASS requires:
- stale sex media is removed or replaced by semantically safe current-scene media;
- removed/de-escalated intimate state is not still visually asserted;
- no unrelated heroine image;
- Story remains player-primary.

One same-game refresh/re-entry after de-escalation:
- no duplicate commit;
- same committed Story reconstructed;
- media meaning remains coherent and does not resurrect stale sex media merely due refresh.

---

# 9. TTS lane

Use an actual registered-character dialogue turn with clearly rendered heroine dialogue.

## TTS OFF
Before enabling TTS:
- verify toggle is visibly OFF;
- across at least one committed dialogue turn, browser/network evidence must show zero `/media/tts` calls while OFF.

A background/preload/silent synthesis while OFF is P1.

## TTS ON
Enable using the visible control once.

For one eligible registered-character dialogue:
- one visible TTS action/automatic playback according to current UI contract;
- request speaker must match the registered heroine who actually spoke;
- submitted text must correspond to committed dialogue, not narrator/private thought/uncommitted text;
- returned audio must be playable/eligible or fail locally with explicit non-blocking UI if the side service is unavailable;
- Story/Commit cannot depend on TTS success.

## Replay
Use visible replay once if available:
- replay must target the same committed dialogue/speaker;
- it must not silently cause uncontrolled repeated synthesis;
- record whether implementation reuses existing result or intentionally makes one bounded replay request.

Systematic parser/Story-format mismatch that makes heroine dialogue permanently ineligible is a product defect; one service/network failure that is explicit and non-blocking may be P2/P3 depending on impact.

---

# 10. Inspection / stop law

For every media/TTS checkpoint record:
`literal input -> committed Story semantics -> current scene/focal actor -> media/TTS request -> sidecar response -> visible UI`.

At first deterministic P0/P1:
- STOP immediately;
- preserve fresh game read-only;
- no retry/resample/regeneration/alternate heroine/game;
- no same-task source/test/content/provider/model/config/catalog patch;
- no redeploy;
- terminal `MEDIA_TTS_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`.

Browser observability failure after a gameplay action:
1. do not resend/reclick/repeat the action;
2. read-only context/network footprint may classify whether it committed;
3. at most one read-only reattachment/re-entry to the same fresh game for inspection;
4. if visible state still cannot be reconciled, STOP browser-control blocked;
5. never patch product from browser-control failure.

---

# 11. Forbidden

- source/test/content/prompt/provider/model/config/secret/timeout edits = 0;
- API/frontend redeploy = 0 when exact accepted workers are already present;
- DB/schema/migration/ledger/history repair/backfill/direct gameplay mutation = 0;
- `supabase db push` forbidden;
- Production access/deploy = 0;
- preserved evidence game access/mutation/reset = 0;
- gameplay retry/regeneration/sample-until-pass = 0;
- direct API gameplay substitution = 0;
- new branch/PR/CURRENT_TASK file = 0;
- OWNER_READY claim forbidden.

---

# 12. Terminal report contract

Report:
- start/final main SHA and proof source writes 0;
- current CURRENT_TASK final blob;
- exact API/frontend Worker versions and deploy counts;
- media catalog read-only identity/inventory facts used;
- browser readiness;
- fresh game ID;
- ordinary scene Story/focal heroine + image request/response/visible result;
- committed adult scene + image request/response/visible result and sex-pool reachability;
- refused/non-occurring request + image result;
- de-escalation/scene-end + stale-media result;
- refresh/re-entry media coherence;
- TTS OFF zero-call proof;
- TTS ON speaker/text/request/result;
- replay behavior;
- browser reattachment count;
- gameplay resend/retry count;
- DB/schema/migration/history writes 0;
- Production 0;
- preserved evidence access/mutation 0;
- P0/P1/P2/P3 findings and exact first broken boundary if blocked.

Success:
`MEDIA_TTS_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Product blocked:
`MEDIA_TTS_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Browser-control blocked:
`MEDIA_TTS_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.