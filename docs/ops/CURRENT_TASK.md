# Company — CURRENT TASK

Status: READY
Task ID: company-r3-rule-change-temporal-continuity-p1-correction-v1
Mode: TARGETED CORE P1 CORRECTION — RULE-CHANGE STORY TEMPORAL CONTINUITY
Updated: 2026-08-25 11:36 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `b519d58eb9278d63c44e159dee0f68c27889bdda`
Previous task: `company-r3-rule-change-private-app-context-isolation-p1-continuation-v1`
Previous terminal: Issue #68 `5404308956`
Operator / whole-canon review: Issue #68 `5404344945`
Whole-canon conclusion: `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
Preserved private-app isolation implementation: `2c6d0be380a891978a163e44400748b6d6362fff`
Preserved S1 closed-world / issuer implementation: `180160ba61195787dfcab254377c922f92f304b5`
Current TEST API from previous terminal: `game-proxy-company-r3` / `9ed28a71-5bda-47aa-89f0-8814ee9447d9`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`RULE_CHANGE_TEMPORAL_CONTINUITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`RULE_CHANGE_TEMPORAL_CONTINUITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Overwrite it in place for lifecycle state.
- Do NOT create a new CURRENT_TASK file, branch, ops branch, feature branch, implementation PR, or report-only branch.
- Mandatory read order before edit:
  1. `AGENTS.md`
  2. `CURRENT_TRUTH.md`
  3. `docs/redesign/COMPANY_CANON.md`
  4. `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
  5. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
  6. `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`
  7. previous terminal `5404308956`
  8. operator / whole-canon review `5404344945`
  9. this CURRENT_TASK
- Preserve A′/R3: server-owned turn kernel -> one Story LLM -> one post-Story Observer -> atomic Commit + optional sidecars.
- This is implementation conformance, not a product redesign.
- Freeze and preserve `2c6d0be...` field-level private-app context isolation. Do NOT restore prior Opening/raw recent Story, prior scene_note, product/private-app metadata, or `visible app operation` wording into rule-change Story requests.
- Preserve `180160ba...` S1 closed-world authority / sole issuer / exact role labels and all accepted NAV/S7/compatibility/conflict-copy behavior.

### Preserved evidence — READ ONLY

Never reset/retry/mutate:
- `4457dcab-72f8-4d79-b24d-788c73db8252` — latest fresh campaign. Turn 1 temporal contradiction; Turn 3 supported S1 genital-inspection deferral.
- `51141ee0-60f8-428b-9066-a5a69eb20c4e` — prior private-app leak.
- `a91169d9-3c27-4bf4-bbe0-5ac0767d7f33`
- `fdc0d96a-8d6f-49dc-b8cf-6550612a0324`
- `4261b592-e6b9-44cb-a5a7-05057a22ee83`
- all other games previously marked preserved in Issue #68.

## 1. Why this task exists

The previous task successfully removed irrelevant private-app presentation continuity from rule-change Story requests, but live play exposed a new committed temporal contradiction on the same rule-change turn.

Fresh game `4457dcab-72f8-4d79-b24d-788c73db8252`:

- Opening durable state after Turn 0: `day=1, minute=545`, which is 09:05.
- S1 APPLY Turn 1 Story nevertheless began with `오후 9시 5분` and `퇴근 시간이 한참 지난 시간`.
- Observer copied that evening scene into `scene_note` / `turn_summary`.
- Reducer advanced canonical durable time only to `minute=550`, which is 09:10.
- The committed turn therefore contains Story/scene-note reality at approximately 21:05 while canonical time says 09:10.

This is P1 scene-truth corruption, not cosmetic wording.

Current-main source after `2c6d0be...` correctly omits private-app-bearing free text on rule-change Story requests but leaves only raw numeric `time:{day,minute}` without an explicit human-readable 24-hour anchor or a same-scene/no-implicit-time-jump contract.

The fix must restore temporal grounding structurally without reopening the private-app leak.

## 2. First owning boundary to inspect

Read current:
- `runtime-r3/domain/memory.js`
- `runtime-r3/domain/contracts.js`
- `runtime-r3/server/provider.js`
- focused Story-context tests.

Prove before editing:
1. Durable time is canonical and uses `day` plus minute-of-day.
2. Rule-change Story context after `2c6d0be...` still includes raw `time` but omits recent/older Story and prior scene_note.
3. There is no deterministic human-readable time anchor such as `09:05` in the Story payload.
4. No later reducer is responsible for the 21:05 Story invention; the wrong fact originates in Story and is then faithfully observed.

If a different earlier existing boundary is proven, fix that smallest boundary and record why.

## 3. Required correction

Add the smallest deterministic Story-context projection that makes canonical time unambiguous to the single Story LLM.

Preferred shape:
- keep existing durable `time:{day,minute}`;
- derive a presentation-only canonical clock anchor from the same state, for example `clock_24h: "09:05"` or a similarly explicit field;
- optionally include a bounded same-scene temporal rule such as: a rule-change turn continues the current scene at this canonical clock time unless the Story itself narrates a small plausible elapsed interval; do not invent an hour-scale/daypart jump merely because continuity free text was omitted.

Constraints:
- no new durable state field required;
- no DB/schema/migration change;
- no generic timeline/calendar/scheduling engine;
- no post-Story time rewriting;
- no regex/string repair of generated Story;
- do not re-add Opening/raw recent Story, previous scene_note, app_name/private-discovery metadata, or other free text removed by `2c6d0be...`;
- ordinary turns and Opening must retain existing behavior unless the same canonical time projection is safely shared without changing semantics.

If Story chooses not to mention the clock, that is fine. If it does mention time/daypart, it must be consistent with the canonical anchor.

## 4. Deterministic regression requirements

Add/adjust the smallest tests that prove the real Story request boundary:

1. With state `day=1, minute=545`, captured rule-change Story user payload exposes an unambiguous canonical 24-hour time equivalent to `09:05`.
2. The payload must not encode or imply `21:05`, evening, or after-work from that state.
3. The same payload still omits all private-app presentation continuity that `2c6d0be...` removed:
   - product/app presentation metadata unnecessary to the turn;
   - prior Opening/raw recent Story;
   - prior scene_note;
   - `visible app operation` wording.
4. Structured location, present actors, canonical player identity, clothing, active rules, structured rule-change event/binding, S1 subject/counterparty and official-announcement ownership remain available.
5. Existing Opening passive-app premise remains unchanged.
6. Existing ordinary-turn recent continuity remains unchanged.
7. Existing S1 closed-world / sole issuer / exact role labels remain green.
8. Existing rule-change private-app isolation regression remains green.
9. Existing NAV, S7, compatibility, conflict-copy and one-Story/one-Observer tests remain green.

Then:
- changed JS/MJS `node --check`;
- `git diff --check`;
- focused affected tests;
- full repository `npm test` exactly once after focused green, recording deterministic exit result.

Do not claim live semantic compliance from prompt-text assertions alone. Actual deployed browser play remains the product gate.

## 5. DB / deploy law

No DB/schema/RPC/migration change is expected or allowed.

Forbidden:
- `supabase db push`;
- migration apply/repair/history rewrite;
- gameplay backfill;
- preserved-game mutation;
- Production access/deploy;
- provider/model/temperature/token/config/secret workaround.

After implementation lands on `main`:
- verify local/remote main equality;
- deploy TEST API only if runtime/server executable source changed;
- frontend deploy only if frontend executable source actually changed; frontend work is not expected;
- record exact Worker version ID and source SHA.

## 6. Fresh deployed-browser acceptance — exactly one new game

Use the actual deployed TEST browser UI.
Create exactly ONE new disposable adult-profile game.
No second game, reset, regeneration, semantic retry, direct gameplay API substitute, or sample-until-pass.

### A. Opening
- Opening must still be a normal first-arrival scene.
- Passive unfamiliar-app discovery remains allowed.
- Record canonical durable time after Opening.

### B. One S1 APPLY rule-change turn — primary gate
Through visible CSA UI activate canonical `성적 업무지시권` for an exact named adult pair.

PASS requires:
- exactly one rule-change Story/Observer/Commit;
- exactly one grounded server-owned `[공식 공지]`;
- correct PLAYER issuer / subject / counterparty direction;
- no private-app screen/notification/self-open/flash/disappearance/supernatural authority leak;
- Story temporal framing remains consistent with the pre-turn canonical time. If pre-turn is around 09:05, Story must not jump to `오후 9시`, `퇴근 후`, night, or another hour-scale contradiction;
- observer raw/applied scene_note and turn_summary do not encode a contradictory time/daypart;
- durable post-turn time advances only by the observer elapsed amount and agrees with the Story scene.

Stop immediately on any new reproducible P0/P1.

### C. Minimal preservation probe
Only after the APPLY temporal gate passes, submit one supported S1 `kiss` instruction for the exact pair to prove the existing same-turn path was not broken by the time projection change.

Do NOT spend this task trying to fix the already-known Turn-3 `성기 직접 검사` family-grounding P1. If that known P1 is reached/reproduced, record and stop; do not patch it in the same task.

### D. Read-only refresh if no P1 has appeared
One deliberate refresh/re-entry only if the campaign remains P0/P1-clear to that point. No duplicate Story/Commit and active S1 reconstructs once.

## 7. Known next P1 — record only in this task

The preserved fresh Turn 3 showed:
`나는 서원희 차장에게 박정우 팀장의 성기를 직접 검사하라고 공식적으로 지시한다.`

Story deferred into scope/location reconfirmation instead of same-turn execution.
Current S1 context exposes finite IDs (`kiss`, `sexual_touch`, `genital_exposure`, `genital_touch`, `oral`, `penetration`) but lacks LLM-readable family semantics connecting direct genital inspection/touch to `genital_touch`.

Do not broaden this temporal task into that correction. If temporal P1 closes, this S1 semantic-grounding P1 is the expected next lane before P2 integrity, unless whole-canon audit finds an even earlier P0/P1.

## 8. Known P2 observations — record only

- removed/replaced-rule current-authority residue;
- Mind Monitor structured-output reliability;
- player-facing/internal CSA text separation;
- observer player-inner-thought invention/drop reliability where observed.

Media/TTS remain paused.

## 9. Terminal report contract

Report:
- start / implementation / final main SHA;
- exact changed files;
- proven first owning boundary;
- exact canonical time projection added and why it is presentation-only;
- proof private-app context isolation stayed intact;
- focused/full tests and deterministic full-suite exit result;
- TEST Worker version/deploy counts;
- fresh game ID;
- Opening canonical time;
- S1 APPLY Story time/daypart vs durable pre/post time;
- Story -> observer raw -> observer applied -> durable scene/time chain;
- private-app leak check;
- supported kiss preservation probe if reached;
- refresh result if reached;
- new P0/P1/P2/P3 findings;
- all forbidden counts.

Success:
`RULE_CHANGE_TEMPORAL_CONTINUITY_P1_CORRECTION_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked:
`RULE_CHANGE_TEMPORAL_CONTINUITY_P1_CORRECTION_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task. Operator must run the mandatory post-live whole-canon audit before choosing the next lane.