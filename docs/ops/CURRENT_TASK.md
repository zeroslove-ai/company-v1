# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-rule-change-temporal-continuity-live-acceptance-continuation-v1
Mode: DEPLOY + LIVE ACCEPTANCE CONTINUATION — PRESERVE IMPLEMENTATION, NO NEW RUNTIME DESIGN
Updated: 2026-08-25 12:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `e5428e4d3afa6de46e0c1fcd0795b923dfb4b4a3`
Previous task: `company-r3-rule-change-temporal-continuity-p1-correction-v1`
Previous terminal: Issue #68 `5404405284`
Operator review: Issue #68 `5404429994`
Operator-approved TEST DB catalog artifact: Issue #68 `5404426864`
Preserved temporal implementation SHA: `b0efb2c56d53dc9e7f85de9953f1ff05a08507dd`
Preserved private-app isolation SHA: `2c6d0be380a891978a163e44400748b6d6362fff`
Preserved S1 closed-world / issuer SHA: `180160ba61195787dfcab254377c922f92f304b5`
Current deployed TEST API before this task: `game-proxy-company-r3` / `9ed28a71-5bda-47aa-89f0-8814ee9447d9`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`RULE_CHANGE_TEMPORAL_CONTINUITY_LIVE_ACCEPTANCE_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`RULE_CHANGE_TEMPORAL_CONTINUITY_LIVE_ACCEPTANCE_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, implementation PR, or report-only branch.
- Mandatory read order before action:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
  7. terminal `5404405284`
  8. operator review `5404429994`
  9. approved catalog artifact `5404426864`
  10. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This continuation exists because the implementation is already written/tested but was not deployed due to `psql` missing in the execution environment.
- Do not redesign or broaden the product.

## 1. Freeze implementation — no new runtime edit expected

Preserve exactly the runtime behavior already on main from:
- `b0efb2c...` — rule-change Story gets presentation-only canonical `time.clock_24h` plus bounded same-scene/no-hour-scale-jump guidance;
- `2c6d0be...` — rule-change Story omits irrelevant private-app product metadata, prior Opening/raw recent/older Story and prior scene_note;
- `180160ba...` — S1 closed-world finite authority, PLAYER sole issuer, exact recipient/counterparty roles.

Do not change runtime/frontend/content/tests merely because the previous deploy environment lacked `psql`.

Before deployment:
- confirm current main contains `b0efb2c...` and no later executable runtime delta invalidates its review;
- confirm `docs/ops/CURRENT_TASK.md` is the only task-lifecycle change introduced by registration;
- do not rerun full `npm test` merely for ceremony: previous focused `76/76` and full `580/580` with deterministic exit 0 are accepted implementation evidence. Run only a narrow sanity check if needed to prove checkout/source integrity. If executable source is unexpectedly different, STOP blocked rather than silently re-reviewing a new implementation.

## 2. Resolve deployment gate through the existing approved artifact path

Previous blocker:
- gate attempted read-only DB collection through local `psql`;
- environment returned `spawn psql ENOENT` before Wrangler;
- deploy count was 0.

The existing repository gate already supports a catalog artifact through `--catalog` / `COMPANY_DB_CATALOG_PATH`.

Operator comment `5404426864` contains an approved TEST read-only catalog captured from project `fmcrspgxstsmxxsmkeee` using the same catalog SQL shape as `scripts/company-db-contract-gate.mjs`.

Required procedure:
1. Copy the JSON object from Issue #68 `5404426864` exactly into an ephemeral temporary file OUTSIDE the repository/worktree.
2. Do not commit that artifact.
3. Set `COMPANY_DB_CATALOG_PATH` to that temp file or pass it through the existing supported `--catalog` path.
4. Use the existing `scripts/deploy-api-with-contract-gate.mjs` R3 deployment target and exact worker guard:
   - config `wrangler.r3.api.jsonc`
   - expected worker `game-proxy-company-r3`
5. Preserve any existing explicitly configured DB/scene contract stage. Do not downgrade or alter a stage to make the artifact pass.
6. Let the existing action/scene contract evaluator run normally. This artifact is an input source, not a bypass.
7. If the gate rejects the artifact under the actual configured stage, STOP blocked and report the exact manifest/gate mismatch. Do not weaken the manifest, gate, or DB contract.
8. Only if the gate passes may Wrangler deploy TEST API.

Forbidden:
- installing/changing repo dependencies solely to get `psql`;
- changing `company-db-contract-gate.mjs` or manifests to bypass validation;
- DB writes, DDL, migrations, backfills;
- Production;
- frontend deploy;
- provider/model/temp/token/config/secret workaround.

Record exact TEST Worker version and source/main SHA after deploy.

## 3. Fresh deployed-browser acceptance — exactly one game

After successful TEST API deployment, use the actual deployed TEST frontend/UI.

Create exactly ONE fresh disposable adult-profile game.
No second game, reset, regenerate, semantic retry, direct gameplay API substitute, or sample-until-pass.
Preserve this game read-only after the campaign.

### A. Opening

- Complete the normal Opening through the browser.
- Passive unfamiliar private-app discovery remains legal.
- Record canonical durable `day/minute` after Opening and translate minute-of-day to expected `HH:MM` for review.
- Record observer raw/applied MM shape as P2 evidence only.

### B. S1 APPLY — primary temporal/private-app gate

Through visible CSA UI APPLY canonical `성적 업무지시권` for an exact named adult pair, preferably 서원희 -> 박정우 for comparison.

Record full chain:
`structured operation -> Story -> observer raw -> observer applied -> durable state/time -> rendered UI`.

PASS requires:
- exactly one rule-change Story / one Observer / one Commit;
- exactly one grounded server-owned `[공식 공지]`;
- PLAYER remains sole issuer;
- selected recipient/counterparty direction is correct;
- no second pseudo-notice or role relabeling;
- no private-app screen/notification/self-open/flash/disappearance/supernatural authority leak;
- Story time/daypart matches pre-turn canonical `clock_24h` and remains the same immediate scene except for a small plausible elapsed interval;
- no 09:xx -> 21:xx, morning -> after-work/night, or other hour-scale invented jump;
- observer scene_note/turn_summary do not encode a contradictory daypart/time;
- durable post-turn time advances only by observer elapsed time and is compatible with Story.

Stop immediately on the first reproducible P0/P1.

### C. One supported S1 preservation probe

Only after B passes, submit the exact configured-pair kiss probe:
`나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.`

PASS requires same-turn execution rather than confirmation/future deferral/substitution, while reluctance/awkwardness may remain as character reaction.

Do NOT use the known `성기를 직접 검사` probe in this continuation. Its semantic-grounding failure is already preserved evidence and belongs to the expected next P1 task after operator whole-canon review.

### D. Refresh / re-entry

If no P0/P1 has appeared, perform one deliberate browser refresh/re-entry.

PASS requires:
- no duplicate Story/Commit;
- active S1 reconstructs once;
- no phantom pending/rejected turn;
- free input/choices/CSA remain usable.

## 4. Whole-canon observations — measure, do not broaden

During this one campaign, record obvious cross-boundary evidence required for later operator audit:
- Story vs observer raw vs observer applied vs durable scene/time disagreement;
- MM raw `{surface,subconscious}` retention/drop counts for reached turns;
- player-inner-thought invention/drop warnings if observed;
- player-facing internal CSA implementation text leakage if visible;
- any removed/replaced-rule current-authority residue only if naturally encountered.

Do not implement P2 fixes in this task.
Media/TTS remain paused.

Known preserved P1 NOT to fix or sample here:
- S1 supported `성기를 직접 검사` was previously deferred because the finite family IDs are not yet sufficiently LLM-readable for that literal. Expected next lane after this continuation + mandatory operator audit, unless a new earlier P0/P1 appears.

## 5. Stop / terminal law

No runtime patching during the live campaign.
At first reproducible P0/P1:
- preserve fresh game read-only;
- record decisive chain;
- set this same task file to `WAITING_REVIEW`;
- post exactly one BLOCKED terminal;
- STOP.

Success requires:
- approved artifact passed the unchanged contract gate;
- TEST API deployed and exact Worker version recorded;
- exactly one fresh browser game;
- Opening completed;
- S1 APPLY temporal/private-app/issuer gate passed;
- kiss supported same-turn preservation passed;
- refresh/re-entry passed;
- no new P0/P1 occurred before terminal;
- Production/DB migration/frontend deploy/provider config changes/retry/second Story = 0.

On success:
- set this same file to `WAITING_REVIEW`;
- post exactly one terminal:
`RULE_CHANGE_TEMPORAL_CONTINUITY_LIVE_ACCEPTANCE_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`
- STOP.

On blocker/failure:
`RULE_CHANGE_TEMPORAL_CONTINUITY_LIVE_ACCEPTANCE_CONTINUATION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Do not self-register the S1 semantic-grounding task. After any deployed browser campaign, operator must perform the independent whole-canon audit before choosing the next CURRENT_TASK.

## 6. Terminal evidence — COMPLETE

`RULE_CHANGE_TEMPORAL_CONTINUITY_LIVE_ACCEPTANCE_CONTINUATION_COMPLETE_AWAITING_OPERATOR_REVIEW`

- Start / registration main: `546a29ab93442442461eeea860fb39635206dbd1` on `main`.
- Reviewed executable / preserved implementation: `b0efb2c56d53dc9e7f85de9953f1ff05a08507dd`; no executable delta exists from that implementation to registration main.
- TEST contract gate: unchanged R3 gate evaluated the exact operator-approved ephemeral catalog artifact from Issue #68 `5404426864`; dry-run and deploy gate both passed at `stage_a`, contract `company-v1-action-authority` v2. Artifact was outside the repo and was not committed.
- TEST deployment: API-only `game-proxy-company-r3`, Worker version `302dc331-a4f0-4336-a64d-d72689887104`, source `b0efb2c...`; frontend deploy `0`.
- Fresh disposable game: exactly one new game, `98e070d9-b491-47a9-881b-45dc496a4046`; preserved read-only after campaign. Existing preserved games were not opened, reset, or mutated.
- Opening: browser UI completed normal first arrival; passive unfamiliar private-app discovery remained present and NPCs were not shown as knowing it. Final committed Opening time was `Day 1 · 09:05`.
- S1 APPLY primary gate: visible `강함 · 성적 업무지시권`, recipient `서원희`, counterparty `박정우`, female/male scopes. UI committed exactly one turn (`Turn 1`, `Day 1 · 09:10`) from pre-turn `09:05`. Story began with one server-owned `[공식 공지]`, grounded the institutional announcement through company monitor/company messenger channels, preserved PLAYER issuer and recipient/counterparty direction, and did not expose private-app screen/notification/self-open/flash/disappearance/supernatural authority or NPC app awareness. Story remained in the morning/current office scene; no `21:05`, evening, after-work, night, or hour-scale jump appeared. The committed UI showed the expected four Story-authored choices and no contradictory scene-time signal.
- Supported kiss preservation: exact configured-pair literal `나는 서원희 차장에게 박정우 팀장에게 키스하라고 공식적으로 지시한다.` committed as `Turn 2`, `Day 1 · 09:15`. Story preserved the named actor/target direction and executed the kiss in the same Story turn, with no confirmation branch, future deferral, substitution, or second author. Character reaction remained grounded and separate from desire/affection.
- Refresh/re-entry: one deliberate refresh only. The same game reconstructed `Turn 2`, `Day 1 · 09:15`, the exact committed Story and four choices; opening the visible app showed `현재 턴 2` and `활성 규칙 1`. No duplicate Story/Commit, phantom pending turn, or rejected-turn residue was visible; input/choices/app remained usable.
- Observer / MM evidence: the UI showed no Mind Monitor projection on the S1 APPLY turn (fail-open, recorded as P2 evidence only) and showed applied surface/subconscious entries for `서원희` and `이메이` on the supported kiss turn. Raw Observer payload was not directly inspected in the browser-only acceptance path; no P0/P1 was inferred from that absence. This remains for the mandatory independent whole-canon audit.
- Findings: new P0 `0`; new P1 `0`; P2 evidence: S1 MM projection absent in UI and raw/applied MM rate not measured; P3 `0`. The preserved known S1 genital-touch semantic-grounding P1 was not sampled or modified.
- Forbidden counts: runtime/content/frontend/test edits `0`; DB writes `0`; migrations `0`; preserved-game mutation/reset `0`; Production access/deploy `0`; provider/model/config changes `0`; retry/sample loops `0`; second game `0`; duplicate Story/Observer/Commit `0`; new branch/PR/task file `0`; `OWNER_READY` `0`.
- Required next stop: operator must perform the independent `POST_LIVE_CANON_AUDIT_CONTRACT` whole-canon review and record its `WHOLE_CANON_AUDIT_*` conclusion before registering any next task.
