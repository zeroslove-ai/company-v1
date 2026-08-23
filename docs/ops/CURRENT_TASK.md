# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-story-choice-tail-loss-boundary-v1
Mode: TRACE TURN-7 CHOICE LOSS -> BOUNDED STRUCTURAL FIX ONLY IF PROVEN -> RESUME NARRATIVE ACCEPTANCE
Updated: 2026-08-23 22:52 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385982766`
Operator review: Issue #68 comment `5386002999`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Frozen accepted baseline — preserve

Accepted executable/source before this task:
- `4d84b12b2733f9510f5a4b92bef22041976cca5d`

Current accepted TEST artifacts:
- API `game-proxy-company-r3` version `279cbde2-fe76-4816-81f0-8f3fc27a9f1b`
- Frontend `gamebuilder-company-r3` version `e139f60f-00b6-49ed-891b-070dd2143f57`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN unless direct contradictory evidence appears:
- browser automation recovery on a clean session;
- high/executive first-arrival Opening, selected rank/department preservation, optional/private unfamiliar CSA app;
- low-rank Opening;
- player-inner-thought committed pipeline and visible panel;
- character-specific first-person NPC Mind Monitor direction;
- exact choice click literal round-trip;
- canonical navigation/agency/choice dispatch;
- CSA chronological APPLY/CHANGE/REMOVE and post-CSA continuation;
- mid/end refresh/re-entry reconstruction from the latest acceptance campaign;
- ~390x844 mobile reachability/no-overflow/no-blocking-overlay;
- already accepted choice-tail forms: plain numbering, symmetric whole-line `**...**` / `__...__`, and symmetric number-token-only emphasis such as `**1.** 행동`.

Do not rerun high-rank Opening, browser recovery or mobile merely to accumulate more green evidence.

## 1. Decisive product failure to trace

Preserved disposable TEST campaign:
- game `2241e4e8-559f-42b4-ae7d-962c93d006d3`

The campaign reached eight committed ordinary turns with no retry/regeneration.

Turn 7 exact literal:
- `업무 이야기를 잠시 멈추고 윤민아 대리에게 취미나 주말에 즐기는 일을 물어보며 편하게 대화합니다.`

Observed live:
- Turn 7 committed successfully;
- Story body visibly contained four natural numbered next-action choices;
- after commit the current actionable choice region exposed zero buttons; direct input remained available;
- Turn 8 ordinary refusal/self-state continuation committed and four buttons returned, but that does not clear Turn 7;
- no blocking console/page/network error;
- refresh/re-entry and mobile later worked.

Current source fact at `4d84b12...`:
- `runtime-r3/domain/observer-normalizer.js::projectChoices()` already treats structurally valid Story choices as canonical and keeps them even when Observer choices mismatch, emitting only `choices_observer_mismatch`;
- therefore an Observer mismatch alone cannot explain zero choices if `storyChoiceTail()` succeeds;
- current `storyChoiceTail()` looks only for the final four physical lines after trimming trailing blank lines and delegates each to the bounded `choiceLine()` structural parser;
- frontend `choiceTail()` must remain structurally symmetric with the server.

Do not guess the missing format from the phrase “four natural numbered choices.” Prove the exact stored bytes/line layout first.

## 2. Mandatory read-only loss-boundary trace before editing

Before changing source, inspect the preserved Turn 7 read-only. Do not revise/retry/reset/delete/replay the fixture.

Recover as much as the canonical TEST read surfaces permit, using read-only context/history/turn data and browser evidence; a read-only TEST DB query is permitted only if required to recover the already-committed raw turn and must not mutate anything.

Capture:
1. exact raw committed Story text for Turn 7, especially the final 12 physical lines with visible escaped characters/blank lines;
2. exact `observer_raw.choices` if persisted/readable;
3. exact `observer_applied.choices` and warnings;
4. exact committed turn `choices` array;
5. current context/readback choices for that turn/latest projection if available;
6. frontend presentation `choiceTail()` result or equivalent deterministic reproduction;
7. rendered DOM button count already observed as 0.

Classify the FIRST loss boundary exactly:
- A: raw Story does not actually contain an unambiguous terminal four-choice block;
- B: raw Story contains an unambiguous four-choice block but current server `storyChoiceTail()/choiceLine()` rejects its exact bounded layout;
- C: server parser returns four choices but `projectChoices()/normalizeObserver()` loses them;
- D: normalized/applied has four but persistence loses them;
- E: persistence/readback has four but view/frontend parser loses them;
- F: frontend has four but DOM/render lifecycle loses them;
- G: evidence insufficient to classify safely.

Post the exact classification and evidence in the terminal report.

If classification is G, STOP `BLOCKED_EVIDENCE`; do not speculate or edit source.

## 3. Authorized source correction — only after exact proof

A source change is authorized only if the read-only trace proves a deterministic product boundary.

### If B — bounded Story-tail structural representation

Add only the exact evidenced conventional layout needed to recognize the same four Story-authored literals.

Examples of potentially bounded structural layouts are NOT pre-approved facts; implement only if actually evidenced, such as:
- blank separator lines between otherwise valid numbered terminal choices;
- one purely structural Markdown/list separator around the exact terminal group;
- another symmetric wrapper form that does not alter inner action text.

Requirements:
- Story remains the sole author of choice action text;
- recover exactly four ordered 1→4 distinct non-empty actions;
- preserve each inner action literal character-for-character apart from existing outer whitespace handling and the specifically evidenced structural delimiter;
- server and frontend readers must support the same structural set;
- strip terminal choice presentation from narrative body only when the same canonical four choices are available;
- Observer mismatch may warn but must not erase valid Story choices.

### If C/D/E/F

Fix only the proven first-loss stage. Do not widen parser grammar if parsing was already successful.

### If A

Do not fabricate choices. Stop `FAILED_PROVIDER_CONTRACT` after recording the exact raw tail unless there is an already-existing bounded product contract path that is broken independently of provider content. Do not add fallback-authored choices, retry or a second LLM call in this task.

Forbidden regardless of classification:
- no general Markdown parser;
- no fuzzy/semantic choice matching;
- no punctuation/Unicode normalization sweep;
- no prior-turn choice fallback;
- no deterministic fabricated choices;
- no retry/regeneration or second Story/Observer call;
- no provider/model/temperature/token/timeout/config tuning;
- no DB migration/schema/RLS/grant/reset changes;
- no donor CSA UI/image/TTS work;
- no Production;
- no owner/preserved-game mutation.

## 4. Deterministic regressions

If source changes, first encode the exact preserved Turn 7 raw shape as a deterministic regression before fixing it.

At minimum prove:
1. exact preserved Turn 7 shape reproduces zero choices before the fix and four exact literals after it, if classification B/C/D/E/F warrants a fix;
2. all previously accepted plain/whole-line/number-token wrapper forms remain unchanged;
3. malformed/mixed/unbalanced/wrong-numbering/duplicate/empty/non-terminal pseudo-choice layouts still fail closed;
4. if blank separator lines are the proven root, only blank structural separators inside the terminal four-choice group are ignored; arbitrary prose between choices remains fail-closed;
5. Observer mismatch cannot erase structurally valid Story-authored choices;
6. frontend and server recover identical literals;
7. `renderChoices()` submits the exact recovered full literal once;
8. player thought/MM/agency/navigation/CSA chronology regressions touched by the change remain green.

Run relevant focused R3 tests, full `npm test`, changed JS/MJS `node --check`, and `git diff --check`.

## 5. TEST-only deployment

Only if executable source changes, deploy only the affected R3 TEST artifacts from the exact reviewed source.

Preserve existing bindings/secrets. Do not print, rotate, request, copy or transfer secrets.
No Production, migration or provider/model/config change.
Record exact source SHA and Worker version IDs.

## 6. Mandatory live acceptance after a justified fix

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed or direct-API gameplay substitute. Fresh disposable TEST games only.

### Gate A — exact structural closure

Create one fresh game and reach at least one ordinary committed turn whose Story uses the newly supported exact structure if the provider naturally emits it; if provider does not emit that form, the deterministic exact-shape regression remains the proof for the structural variant, while live must still show four usable Story-authored choices through normal provider output.

Require:
- four visible actionable buttons when Story has a supported terminal four-choice block;
- committed/readback choices exactly equal the Story inner literals;
- one visible choice click -> exactly one normal streamed commit with exact literal;
- no duplicate choice text left as narrative presentation;
- no console/network blocker.

### Gate B — bounded narrative continuation

Use one fresh game and commit 8–10 ordinary turns after Opening, mixing:
- at least three visible choice clicks;
- free input;
- direct NPC conversation/follow-up;
- explicit movement/location change;
- work-context action;
- non-work/social action;
- refusal/change-of-mind or self-state action.

Inspect every turn that visually contains four Story choices. FAIL if any supported unambiguous four-choice terminal block again produces zero committed/current buttons.

Also sample:
- exact player literal remains narrative center;
- time progresses plausibly;
- location/presence coherent;
- player thought remains first-person/action-safe;
- relevant NPC MM remains first-person/character-specific;
- choices are meaningfully diverse;
- no CSA compliance→unsupported positive emotion inference;
- streaming remains visible/non-blocking.

One mid-campaign refresh/re-entry is sufficient because high-rank/mobile/refresh were already GREEN in the preceding acceptance unless the changed frontend code directly affects those surfaces. If frontend choice parsing changes, perform one ~390x844 spot-check that current four choices and direct input remain reachable; do not repeat the full prior mobile campaign.

No retry-until-pass. A new genuine product defect is terminal evidence.

## 7. GREEN criteria

GREEN only if:
- the preserved Turn 7 first-loss boundary is proven, not guessed;
- any source correction is limited to that proven boundary;
- exact deterministic reproducer passes;
- previously accepted choice formats remain green and malformed cases remain fail-closed;
- fresh live 8–10-turn campaign has no supported Story-four-choice -> zero-button loss;
- exact choice click round-trip remains single-commit;
- narrative agency/navigation/thought/MM/time/streaming remain healthy;
- no forbidden work occurred.

Do NOT claim owner-ready after this task.

## 8. Remaining owner-remediation after narrative-surface GREEN

Do not implement here:
1. high-parity Company donor CSA UI + draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.

## 9. Completion report

Post to Issue #68:
- preserved Turn 7 exact raw tail excerpt/layout and first-loss classification A–G;
- observer raw/applied/persisted/readback/presentation evidence;
- exact changed files/source SHA, or explicit no-source-change decision;
- focused/full/syntax/diff validation;
- TEST Worker versions if redeployed;
- deterministic exact-shape regression result;
- fresh live fixture and 8–10-turn coverage;
- choice-button loss recurrence/non-recurrence;
- sampled agency/thought/MM/time/location findings;
- any remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.

## Terminal evidence — 2026-08-23

Classification: B — the preserved Turn 7 Story contained an unambiguous terminal four-choice block, but the server `storyChoiceTail()` accepted only four adjacent physical lines and rejected the exact blank-line-separated layout. `observer_raw.choices` already held four literals; `projectChoices()` therefore emitted `choices_projection_dropped` and `observer_applied.choices: null` before persistence. This was not an Observer-mismatch, persistence, frontend lifecycle, or provider-contract loss.

Preserved fixture read-only evidence (`2241e4e8-559f-42b4-ae7d-962c93d006d3`, Turn 7):

```text
[33] <BLANK>
[34] 한리브 대리는 아무 말 없이 자리에서 일어나 커피포트 쪽으로 걸어갔다. 사무실 안은 여전히 부드러운 오후의 공기가 흐르고 있었다.
[35] <BLANK>
[36] ---
[37] <BLANK>
[38] 1. "감사합니다. 꼭 빌려서 읽어보고 싶어요"라고 답하며 윤민아 대리에게 책을 빌려 달라고 부탁한다.
[39] <BLANK>
[40] 2. "마케팅 에세이면 저도 관심 있어요. 어떤 내용인지 조금 더 들려주실 수 있나요?"라고 이어서 물어본다.
[41] <BLANK>
[42] 3. 고개를 끄덕이며 "관심 있습니다"라고 짧게 답하고, 그다음에 자리로 돌아가 오후 업무를 계속 파악한다.
[43] <BLANK>
[44] 4. 사무실 문쪽에서 손목 진동이 다시 느껴져, 잠시 자리를 비워 상식개변 앱을 확인한다.
```

- `observer_raw.choices`: the four exact literals above.
- `observer_applied.choices`: `null`; warnings: `choices_projection_dropped`.
- committed Turn 7 `choices`: `[]`.
- The preserved browser observation recorded zero current choice buttons with free input still available. A later stale capability prevented a new context fetch for that old fixture (`JWT issued at future`), but the read-only TEST DB row plus the preserved DOM observation fully proved B.
- Existing frontend `frontend-r3/render.js::choiceTail()` already skips blank separators. The deterministic frontend regression confirms it returns the same four exact literals when canonical choices are present; the zero-button result was downstream of the server loss.

Bounded correction:

- `runtime-r3/domain/observer-normalizer.js`: terminal choice-tail scanning now skips only blank structural separators while requiring ordered 1–4, distinct, non-empty lines. No fuzzy/semantic matching, normalization sweep, fallback, retry, or provider change.
- `test/r3-source-correction.test.mjs`: exact preserved Turn 7 literals and malformed/previously accepted forms.
- `test/r3-frontend-contract.test.mjs`: exact frontend parity for the same blank-line-separated tail and full-literal presentation.
- No frontend runtime source change was needed because its existing reader was already structurally symmetric.

Validation:

- focused choice-tail/frontend suite: 38/38 PASS;
- full `npm.cmd test`: 516/516 PASS;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- exact-head CI for final main `475f0a01c1b31c1b3e9bc124b26e6f4691b893d8`: run `32640373861`, SUCCESS;
- source executable deployed to TEST from `2a3611f5de3906d7c797259173fa0d5ed19977d0`; API `game-proxy-company-r3` version `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`; frontend remained `e139f60f-00b6-49ed-891b-070dd2143f57`.

Fresh bare-public acceptance:

- disposable game `f2d7de4a-7705-4322-9416-3b95a62e8a57` at the bare public URL only;
- Opening plus 9 ordinary committed turns; scenario steps were recorded separately from committed turn numbers;
- 4 visible choice clicks and 5 free-input turns, including direct NPC follow-up, social/work context, explicit movement to lunch, refusal/self-state, and continued work conversation;
- every committed turn read back `choices` count 4, `observer_raw.choices` count 4, and `observer_applied.choices` count 4; no recurrence of the zero-button loss;
- final browser state: committed Turn 9, 4 visible choice buttons, saved status, no error, zero console error/warn entries;
- no retry/regeneration, reset, migration, Production access, provider/model/config tuning, or preserved-game mutation.

Final state: source/test work is complete enough for operator review. Do not claim owner-ready; remaining owner-remediation items in this task remain out of scope.
