# Company — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: FREEZE LOCAL R3 GREEN -> WAIT OWNER CSA 7/9 POLICY OR NEW REAL DEFECT
Updated: 2026-08-22 22:15 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. This file is the sole execution/control-plane authority. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, or competing authority.

## 0. This task is intentionally NOT executable

`Status: WAITING_OWNER_DECISION` is a hold/gate state.

Codex/Hermes/watchers MUST NOT create an `EXECUTION: STARTED` lease from this file and MUST NOT run gameplay, source edits, tests, deploys, migrations, or live mutations merely because this file changed.

A new executable `Status: READY` task requires a wake condition in Section 4 and a new operator/owner handoff.

## 1. Binding authority

Continue under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- Issue #68 owner lean-development directives `5380380688` and `5380381500`;
- accepted operator review `5380606535`;
- reviewed terminal `5380597794`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Lean-development rule remains binding: optimize for a natural, stable, fun product, not QA ceremony. Do not add semantic engines, compatibility layers, blocker taxonomies, diagnostic metadata, harness projects, or repeated campaigns without a real product reason.

## 2. Accepted local R3 state — GREEN and frozen

Reviewed terminal:
- terminal `5380597794`;
- execution lease `5380562269`;
- previous CURRENT_TASK blob `1afa9d5ed3051c99591e04014b2703dbf9d3734c`;
- final/main SHA `98c422c93b3e009ff269daab79b532d07f13be94`;
- source changed: NO.

Accepted executable source remains:
- `9e91227302a041f1d588e3b260aa3951da3ea9bd`.

Accepted TEST identities remain:
- API `game-proxy-company-r3` version `23da269d-45df-4c39-89e0-35dc99b82505`;
- frontend `gamebuilder-company-r3` version `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 2.1 Retained history/readback — GREEN

Disposable evidence game:
`901769c1-0762-43f2-836c-9056d1fdb168`

Accepted read-only/UI evidence:
- 20 committed gameplay articles in order Turn 0..19;
- Turn 14 appears exactly once after the explicit failed-turn retry;
- Turns 15..19 preserve exact Korean literal order/text;
- `committed_turn=19`, `revision=19`;
- current location `brand_strategy_meeting_room`;
- current `scene_note` coherent;
- no missing, duplicate, reordered, or mutated committed gameplay.

Do not mutate this game merely to re-prove accepted parity.

### 2.2 Export — GREEN

Current R3 history export was exercised exactly once.

Accepted evidence:
- UTF-8 MD artifact;
- 20 headers Turn 0..19;
- Turn 14 exactly once;
- Turns 15..19 exact Korean literals;
- no mojibake, truncation, or duplicate committed gameplay.

### 2.3 Desktop/mobile UI — GREEN

Accepted surfaces:
- desktop `1482x1319`;
- mobile `390x844`.

On both:
- Story/history usable;
- four current choices usable where present;
- direct input + submit visible/reachable;
- no material blocking overlay;
- no horizontal overflow or control collision preventing play.

### 2.4 TTS / feedback retained surfaces

TTS is exposed and one on/off user-facing toggle check is GREEN:
- aria-pressed true -> false;
- Story/history stayed on Turn 19;
- direct input remained usable.

Feedback control is present but disabled in current R3. No feedback mutation was attempted. Do not build or enable a legacy feedback feature merely for QA completion unless owner/product canon explicitly requires it.

### 2.5 Previously accepted product areas remain frozen

Absent new contradictory product evidence, do not rerun pass-seeking matrices for:
- generic player agency + self-state 3/3 batch;
- actor/target/action/topic/refusal/movement fidelity probes;
- canonical location chain;
- scene_note replacement;
- presence/Mind Monitor exercised path;
- frontend submit/SSE lifecycle;
- failed-turn stage-lease + explicit Retry recovery;
- history/export/mobile/TTS retained surfaces;
- CSA rules 1,2,3,4,5,6,8 GREEN.

## 3. Only remaining accepted blocker

Canonical CSA rules 7 and 9 remain frozen provider/model capability-family exceptions.

They continue to block `OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` under the current owner policy.

This hold state does NOT authorize:
- rerunning rules 7/9;
- retry-until-pass sampling;
- provider/model/temperature/token/config/timeout changes;
- prompt-tuning loops;
- deterministic sexual/consent/compliance executor machinery;
- NER/keyword/fuzzy/semantic router/classifier/gate;
- second Story/choice LLM;
- hidden retry/regeneration;
- migration or architecture workaround.

## 4. Wake conditions

This hold may be replaced by a new executable CURRENT_TASK only when at least one is explicit and current:

### A. Owner decision on CSA 7/9
Examples:
- owner accepts the provider-capability limitation and removes those rules from release blocking;
- owner changes/redesigns the canonical product requirement;
- owner explicitly authorizes trying a different provider/model/config or other otherwise-frozen capability path;
- owner explicitly asks for a bounded new investigation of those rules.

Do not infer A from a generic watcher notification.

### B. New real user-visible product defect
A fresh defect report/evidence that can materially affect play, including examples such as:
- lost/duplicated commit;
- input literal mutation;
- player-agency substitution as a repeatable pattern;
- broken movement/location/scene continuity;
- refresh/reconnect losing gameplay;
- enabled UI control swallowing/duplicating actions;
- blocking mobile/desktop layout regression;
- deterministic durable state corruption.

One stylistic Story miss, one no-tail choice miss, one `choices_observer_mismatch`, or one known clean provider timeout is not enough by itself.

### C. Explicit owner instruction for a different product/release task
Examples:
- start a named new R3 feature;
- perform an explicit release checkpoint;
- authorize Production work;
- change product canon/architecture scope.

## 5. While waiting — forbidden work

Until a wake condition is present:
- no `EXECUTION: STARTED`;
- no new gameplay fixture/campaign;
- no CSA rerun;
- no 30/50-turn campaign;
- no source/test/config/content change;
- no migration/DB write/reset;
- no API/frontend deploy;
- no Production;
- no preserved/manual-game mutation;
- no provider/model/config/timeout tuning;
- no semantic machinery or compatibility project;
- no repetitive local QA cluster;
- no new CURRENT_TASK file/branch.

Read-only inspection is allowed only when required to evaluate a new owner instruction or new defect report.

## 6. Next operator behavior

When a wake condition arrives:
1. reread Issue #68 and this exact CURRENT_TASK;
2. independently verify current `main`, TEST identities, and relevant live evidence;
3. post a new operator review stating which wake condition is satisfied;
4. overwrite this existing `docs/ops/CURRENT_TASK.md` in place on `main`;
5. register `Status: READY` only for a bounded product task justified by that wake condition;
6. verify registration is docs-only and exactly one existing path changed before posting `CURRENT_TASK_READY`.

If no wake condition exists, leave this file unchanged and do not manufacture work.

## 7. Current control-plane conclusion

Local R3 runtime/UI product evidence is GREEN and frozen at the reviewed terminal.

Current status is waiting for an explicit owner decision or new real product evidence. The only accepted release blocker is the frozen canonical CSA 7/9 capability family under current policy.
