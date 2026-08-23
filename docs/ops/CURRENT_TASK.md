# Company — CURRENT TASK

Status: READY
Task ID: company-r3-choice-tail-format-and-narrative-acceptance-v1
Mode: FIX TERMINAL CHOICE FORMAT TOLERANCE -> REDEPLOY TEST -> RESUME NARRATIVE SURFACE ACCEPTANCE
Updated: 2026-08-23 19:50 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385603627`
Operator review: Issue #68 comment `5385619025`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Current reviewed source/main:
- `a33874201457ccc964d38447853de87562f640b9`

Current TEST artifacts:
- API `game-proxy-company-r3` version `e3ae7e9c-d058-4ee2-ba5b-0277ec1a19a5`
- Frontend `gamebuilder-company-r3` version `2592437d-1af2-48d3-9a96-bb36afd3b773`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Keep the narrative-surface implementation already landed:
- first-day / first-arrival Opening contract for every selected rank while preserving department/position;
- private `상식개변` app discovery remains optional and does not pre-complete a player action;
- committed `observer_applied.player_inner_thought` projection and dedicated visible player-thought UI;
- bounded character canon supplied to the single Observer for character-specific first-person Mind Monitor;
- Story choice-diversity guidance;
- Observer elapsed-time guidance;
- final prompt-only tightening in `a338742...` requesting a non-empty grounded player thought without making omission turn-fatal.

Frozen earlier GREEN surfaces also remain binding:
- bare-public cold start;
- exact player actor/target/action/request/refusal/self-state/topic/intent preservation;
- exact canonical navigation + refresh persistence;
- choice-button dispatch desktop/mobile;
- CSA APPLY/CHANGE/REMOVE each one chronological streamed atomic turn;
- post-CSA ordinary continuation/control lifecycle;
- compliance does not manufacture unsupported positive private emotion.

Do not reopen these without contradictory evidence.

## 1. Decisive live failure

Fresh post-final-deploy disposable game:
- `a7f22f04-119a-4b86-a477-726d11fdd2d1`

Observed Opening:
- committed successfully at Day 1 09:05;
- visibly established first-day/first-arrival brand-strategy assistant-manager context;
- character-specific Mind Monitor was present;
- Story visibly contained four numbered choices, but each numbered line was wrapped in Markdown bold/emphasis;
- `#choice-list` contained zero buttons;
- free input remained usable;
- console error/warn logs were empty;
- no retry-until-pass was used.

The mandatory 8–10-turn campaign, refresh/re-entry and mobile acceptance therefore did not run on the final deployed build.

Independent source evidence:
- `runtime-r3/domain/observer-normalizer.js::storyChoiceTail()` accepts only plain terminal `1. action` / `1) action` lines;
- `frontend-r3/render.js::choiceTail()` has the same plain-only assumption;
- therefore an unambiguous final line such as `**1. 행동한다.**` remains visible Story prose but is not projected as canonical choices, so committed `latest.choices` becomes empty and no action buttons render.

This is a structural presentation-format compatibility defect, not a semantic-choice or model-quality failure.

## 2. Required narrow correction

Before editing, reproduce the exact structural failure in focused deterministic tests.

Correct only the terminal-four-choice structural boundary.

Required behavior:
- plain `1. 행동` / `1) 행동` remains accepted unchanged;
- an unambiguous symmetric presentation wrapper around the whole terminal numbered line, such as `**1. 행동**` or `__1. 행동__`, is accepted as the same structural choice;
- if the exact failed Story proves an additional conventional outer list marker is present, tolerate only that narrow outer marker as well;
- strip only the structural wrapper/numbering needed to recover the inner action;
- preserve the inner literal player-action text character-for-character apart from existing outer whitespace trimming;
- require exactly four ordered, distinct, non-empty terminal choices;
- malformed/unbalanced emphasis, wrong numbering, embedded prose, duplicate/empty lines, or non-terminal pseudo-choices must still fail closed to no canonical choices;
- server projection and frontend Story presentation must agree so recovered choices render as buttons and those same terminal choice lines are not duplicated as current narrative body content.

Also strengthen the existing Story prompt to say the final four choice lines should be plain numbered text with no Markdown emphasis/bullets/fences. This is output guidance only; runtime correctness must not depend on perfect provider formatting.

Forbidden:
- no general Markdown parser;
- no semantic classifier/matcher/rewriter;
- no fallback authored choices;
- no second Story/observer call;
- no retry/regeneration;
- no provider/model/temperature/token/timeout change;
- no DB/migration/schema/RLS/grant change;
- no reset work;
- no donor-parity CSA UI, image or TTS work;
- no Production;
- no owner/preserved-game mutation.

## 3. Focused regressions

At minimum prove:
1. server `storyChoiceTail`/choice projection accepts plain four-line choice tail exactly as before;
2. server accepts the exact bold/emphasis shape seen in the failed Opening and projects the four inner literals in order;
3. observer mismatch may warn but cannot erase structurally valid Story-authored choices;
4. malformed or partial Markdown wrappers do not create choices;
5. duplicate/wrong-number/non-terminal lines remain rejected;
6. frontend presentation recognizes the same supported structural wrappers and removes the terminal choice tail from narrative body when canonical choices exist;
7. `renderChoices` receives four recovered literals and click payload remains the full literal action;
8. existing player thought/MM/Opening/time contracts remain green;
9. frozen agency/navigation/choice-dispatch/CSA chronology tests remain green where touched.

Run focused R3 observer/provider/frontend/turn tests, full `npm test`, changed JS/MJS syntax checks and `git diff --check`.

## 4. TEST-only deployment

If source changes, deploy only affected R3 TEST artifact(s) from the exact reviewed source.

Likely API + frontend are affected because both server projection and frontend presentation own the same structural tail assumption; confirm from actual diff.

Preserve all existing bindings/secrets. Do not print/rotate/request/transfer secrets.
No Production or provider/model/config tuning.

Record exact source SHA and Worker version IDs.

## 5. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed or direct-API gameplay substitute.
Fresh disposable TEST games only.

### Gate A — exact failure closure

Create one fresh game after deployment.

Require:
- Setup -> Opening through visible UI;
- Opening first-arrival contract still holds;
- Story contains exactly four final choices;
- whether provider outputs plain or supported harmless emphasis, four visible choice buttons render;
- committed/readback `choices` contains the same four inner literal actions;
- no duplicate choice tail remains as narrative body content after presentation parsing;
- click one visible choice and require exactly one POST/SSE/commit with exact literal payload;
- player-thought surface and relevant MM remain present/natural;
- no console/network blocker.

If this gate fails, STOP without retries and report the exact raw final Story tail, observer raw/applied choices, committed choices and rendered DOM.

### Gate B — final-build low/high-rank Opening

On the exact final deployed source create two fresh independent games using materially different rank extremes available in the catalog.

For both require:
- first day/first arrival/first appointment is explicit;
- selected department and rank remain true, including high-rank newly appointed context;
- no invented prior tenure/relationship;
- unfamiliar private app remains optional and no voluntary player action is pre-completed;
- four visible usable choices;
- visible natural first-person player inner thought;
- relevant NPC Mind Monitor surface/subconscious are natural character-specific first-person Korean, not one-word labels or third-person analyst prose.

### Gate C — resume original 8–10-turn narrative-quality campaign

Use a fresh game and commit at least 8 ordinary turns after Opening, with:
- free input and at least three visible choice clicks;
- direct NPC conversation + follow-up;
- movement/location change;
- work-context action;
- non-work/social action;
- refusal/change-of-mind or explicit self-state action.

Inspect sampled complete turn text and committed context for:
- exact player literal remains the narrative center;
- player inner thought is first-person, substantive, refresh-safe and does not invent a different action/decision;
- relevant NPC MM is first-person, character-specific, non-label prose, non-copied dialogue;
- compliance alone creates no unsupported affection/comfort/desire/arousal/attraction/trust/liking;
- four choices remain exact and meaningfully different rather than near-paraphrases/all-work/all-CSA escalation;
- displayed/committed time advances plausibly over normal conversation/movement/work/social actions instead of remaining frozen;
- location/presence remain coherent;
- streaming is visible/non-blocking.

Refresh/re-enter mid-campaign and at the end; latest player thought/MM/time/choices must reconstruct from committed server context.

### Gate D — mobile

At approximately 390x844 verify:
- player-thought and MM are readable/reachable;
- four choice controls + direct input remain reachable;
- no horizontal overflow/blocking overlay;
- no console/page/network errors.

## 6. GREEN criteria

GREEN only if:
- exact bold/emphasized terminal-choice failure is structurally fixed without semantic parsing;
- final deployed build renders four usable buttons and exact literal click round-trip;
- low/high-rank first-arrival Openings pass on the final build;
- player inner thought is visible, substantive, first-person and refresh-safe;
- relevant NPC MM is natural character-specific first-person prose;
- choices are qualitatively diverse across the campaign;
- normal play advances canonical time plausibly;
- refresh/re-entry/mobile pass;
- agency/navigation/choice-dispatch/CSA chronology remain healthy;
- no forbidden work occurred.

Do NOT claim owner-ready after this task.

## 7. Completion report

Post to Issue #68:
- exact root and supported structural formats;
- exact changed files/source SHA;
- focused/full tests run;
- TEST Worker versions;
- Gate A fixture ID + raw Story tail/committed choices/button/click evidence;
- Gate B low/high fixture IDs and qualitative findings;
- Gate C fixture ID, committed-turn coverage, sampled thought/MM/choice/time findings;
- refresh/re-entry/mobile diagnostics;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.

## 8. Remaining owner-remediation phases after this cut

Do not implement here:
1. high-parity Company donor CSA UI + draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.
