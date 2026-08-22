# Company — CURRENT TASK

Status: READY
Task ID: company-r3-continuous-autonomous-live-qa-v1
Mode: LEAN RETAINED PRODUCT SURFACES CHECKPOINT -> FREEZE LOCAL GREEN -> KNOWN CSA CAPABILITY ONLY
Updated: 2026-08-22 21:52 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops branch, recovery branch, QA framework, or competing execution authority.

## 0. Binding authority

Continue the same Task ID under:
- owner product canon PR #95 `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine canon PR #96 `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `docs/redesign/00_*` through `11_*`;
- Issue #68 owner lean-development directives `5380380688` and `5380381500`;
- operator review `5380522033`;
- this exact CURRENT_TASK blob once registered by `CURRENT_TASK_READY`.

Architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

Lean-development gate is binding:
- optimize for a natural, stable, fun long-play product, not QA ceremony;
- fix real user-visible defects, durable corruption, player-agency loss, continuity breakage, or canonically required features;
- do not create new semantic engines, compatibility layers, diagnostic frameworks, blocker taxonomies, harness projects, or ops docs merely to obtain a green checklist;
- provider/model/temperature/token/config/timeout values remain frozen;
- no Production or preserved manual-game mutation.

`OWNER_READY` / `WAITING_USER_FINAL_PLAYTEST` remain forbidden because canonical CSA rules 7 and 9 have accepted provider/model capability-family exceptions. This task MUST NOT reopen those exceptions.

## 1. Reviewed terminal — accepted GREEN

Reviewed terminal:
- terminal `5380510208`;
- previous CURRENT_TASK blob `a63506ce6a667328a531b78ac1fb45e4de114ff5`;
- execution lease `5380479774`;
- final/main SHA `3087f9a674fbe73fba6e9397a54467a723c98a1c`;
- source changed: NO;
- operator review `5380522033`.

Accepted TEST identities remain:
- API `game-proxy-company-r3` version `23da269d-45df-4c39-89e0-35dc99b82505`;
- frontend `gamebuilder-company-r3` version `05bf9f88-2c02-4db7-9f6d-eb4429fdf31c`.

### 1.1 Explicit failed-turn recovery — GREEN and frozen

Recovered disposable game:
`901769c1-0762-43f2-836c-9056d1fdb168`

Before recovery it had:
- committed_turn/revision `13/13`;
- one failed canonical Turn 14 job;
- error `company_r3_stale_turn_timeout`;
- exact literal `엘리베이터 홀로 이동한다.`;
- no later retry/commit.

The real TEST UI exposed exactly one enabled Retry. It was clicked exactly once.

Accepted recovery evidence:
- one `/turn` POST;
- fresh action_id `5a62f3fa-e541-413b-b6a1-a9af5e8d4f1d`;
- `expected_turn=14`;
- `retry_failed=true`;
- exact literal parity;
- same canonical Turn 14 row;
- `attempt_no=2`;
- status/stage `committed/committed`;
- committed_turn/revision advanced exactly once to `14/14`;
- refresh/readback showed exactly one Turn 14;
- no duplicate row/commit.

Do not rerun or retune stale-turn recovery unless a new deterministic local product failure appears naturally.

### 1.2 Five-turn human-like continuation — GREEN and frozen

Same recovered game committed Turns 15–19 with one UI request and one commit each.

The cluster naturally covered:
- free text;
- Story-authored choice clicks;
- ordinary/social/idle play;
- lobby -> `brand_strategy_meeting_room` movement;
- scene/location/scene_note continuity;
- meeting participants entering naturally;
- final browser refresh/readback.

Final accepted state:
- committed_turn/revision `19/19`;
- 20 committed turns total including Opening;
- current location `brand_strategy_meeting_room`;
- exact literals preserved for Turns 14–19;
- Turn 14 had one allowed fail-open `choices_projection_dropped` empty-tail diagnostic;
- Turns 15–19 emitted four Story-authored choices normally.

No deterministic local runtime/UI/product defect was found.

### 1.3 Frozen product areas

Do not rerun pass-seeking matrices for already accepted areas unless new contradictory evidence appears naturally:
- generic player agency contract and 3/3 self-state batch;
- 한리브/점심 target-topic-action;
- 서원희 허리 target-action;
- movement/destination;
- explicit refusal;
- D1 canonical location chain;
- scene_note replacement;
- exercised D2 presence/Mind Monitor;
- frontend submit/SSE lifecycle;
- failed-turn retry/stage-lease recovery;
- CSA rules 1,2,3,4,5,6,8 GREEN.

Known CSA provider/model capability-family exceptions remain rules 7 and 9. Do not rerun or tune them in this task.

## 2. Goal of this task

Perform exactly ONE lean retained-product-surface checkpoint.

Default is NO source change and NO additional gameplay campaign.

Use the existing recovered disposable game primarily read-only/UI-side to verify surfaces a real user can actually use:
1. history/readback;
2. export/download if actually exposed;
3. desktop + one 390x844 mobile viewport;
4. TTS if actually exposed;
5. feedback if actually exposed.

If a surface is absent and not explicitly required by current R3 canon, record `absent/not part of current R3 surface` and continue. Do not build compatibility features merely because an older edition had them.

## 3. Phase A — current history/readback parity

Use game `901769c1-0762-43f2-836c-9056d1fdb168` without adding turns unless a UI interaction genuinely requires it.

Verify through the current user-facing history/readback surface plus read-only context where useful:
- Opening through Turn 19 remain ordered correctly;
- Turn 14 appears exactly once despite the failed first attempt + explicit retry;
- Turns 15–19 preserve exact literal order/text;
- no committed turn disappears after refresh;
- no duplicate retry attempt is rendered as duplicate committed gameplay;
- current Turn 19 and current location/scene remain coherent after reload.

Do not treat an internal failed attempt row as duplicate gameplay if the product correctly presents only the one committed canonical Turn 14.

STOP only if history/readback visibly loses, duplicates, reorders, or mutates committed gameplay.

## 4. Phase B — export/download only if exposed

If the current R3 UI exposes an export/download action:
- invoke it exactly once;
- verify the resulting exported user-facing history preserves committed turn order;
- verify Turn 14 is represented once as committed gameplay;
- verify recent exact Korean literals are not corrupted/mojibake/truncated into a different action;
- verify no duplicate committed turns are introduced by the retry history.

If export/download is not exposed in current R3:
- record that fact;
- do not add it solely for QA completion unless current canon explicitly requires it.

## 5. Phase C — desktop + 390x844 mobile sanity

Check the accepted TEST frontend at:
- normal desktop viewport;
- one mobile viewport `390x844`.

On both, require user-visible usability only:
- current Story/history can be read;
- current choices, when present, are usable;
- direct-input control is reachable and not hidden;
- connection/current-turn state is understandable;
- no blocking overlay permanently hides Story after load/commit;
- no obvious horizontal overflow or control collision prevents play;
- refresh returns to the same committed game state.

Do not reopen already-frozen frontend submit/SSE work for minor cosmetic differences. Stop only for a deterministic layout/control defect that materially prevents play.

## 6. Phase D — TTS only if exposed

If the current R3 UI visibly exposes TTS:
- perform one lightweight user-facing on/off check;
- confirm toggling does not break Story rendering or gameplay controls;
- when OFF, the UI must not continue visibly acting as though narration is playing;
- do not change provider/model/voice/config or create audio infrastructure in this task.

If TTS is absent from current R3, record absent and continue.

Only a deterministic user-visible TTS defect in an actually exposed retained surface may justify a narrow follow-up.

## 7. Phase E — feedback only if exposed

If the current R3 UI exposes feedback/regeneration:
- do NOT exercise destructive feedback on recovered evidence game `901769c1-0762-43f2-836c-9056d1fdb168`;
- use one fresh disposable TEST game;
- perform at most one feedback action;
- require no duplicate turn, broken history, or durable corruption;
- do not retry/regenerate repeatedly until a preferred Story appears.

If feedback is absent from current R3, record absent and continue. Do not add legacy compatibility merely for this checkpoint.

## 8. Source-change gate

Default: NO source change.

A source correction is allowed only if this checkpoint proves a deterministic real-user defect and all are true:
- a real user can see it or it corrupts durable gameplay;
- the cause is narrow and local;
- correction does not require provider/model/temperature/token/timeout/config changes;
- correction does not add semantic parser/NER/fuzzy matching/classifier/router/gate, physical ontology, consent DSL, deterministic narrative executor, second LLM, hidden retry/regeneration, compatibility bag, or new framework;
- no CSA semantic change;
- no migration unless unavoidable for a proven durable-data defect, in which case STOP for operator review rather than improvising;
- no Production.

For a small local correction:
- focused invariant tests + syntax/diff checks are the default;
- do not run the entire historical suite merely for ceremony;
- deploy only the changed TEST surface exactly once;
- perform one bounded product replay specific to the defect.

If the needed correction is broad architecture or provider/config work, STOP and report instead.

## 9. What is NOT a blocker

Do not create another task solely for:
- one provider-style semantic miss;
- one no-tail choice reliability miss;
- `choices_observer_mismatch` when Story choices remain authoritative;
- a known clean stale timeout with recoverable failed state;
- absent legacy/non-canonical surface;
- minor cosmetic differences that do not block play;
- QA harness inconvenience.

## 10. Terminal report

Post one compact terminal report to Issue #68 with:
- Task ID + CURRENT_TASK blob + lease comment;
- final main/source SHA and whether source changed;
- TEST API/frontend identities;
- history/readback result;
- export/download result or `not exposed`;
- desktop/mobile result;
- TTS result or `not exposed`;
- feedback result or `not exposed`;
- any real deterministic local defect actually found;
- any source correction/test/deploy identity only if such a real defect required it;
- explicit confirmation: no CSA rerun, no 30/50 campaign, no provider/model/config/timeout tuning, no Production, no preserved manual-game mutation.

If all checked retained surfaces are GREEN or legitimately absent:
- report `STATUS: BLOCKED_KNOWN_CSA_CAPABILITY_ONLY` (plain equivalent wording accepted);
- state explicitly that this checkpoint found no remaining proven local runtime/UI defect;
- keep canonical CSA 7/9 capability exceptions frozen;
- do NOT automatically start another repetitive QA cluster or create another framework.

Stop after the terminal report. Do not create the next CURRENT_TASK yourself.
