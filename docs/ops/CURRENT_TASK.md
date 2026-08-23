# Company — CURRENT TASK

Status: READY
Task ID: company-r3-choice-number-token-format-and-narrative-acceptance-v1
Mode: FIX NUMBER-TOKEN MARKDOWN CHOICE TAIL -> REDEPLOY TEST -> RESUME NARRATIVE ACCEPTANCE
Updated: 2026-08-23 20:29 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385745211`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Current reviewed executable/source:
- `3de671aaee21afd91599dae065d864e804e7f253`

Current TEST artifacts:
- API `game-proxy-company-r3` version `21efa7c9-f8b0-4c43-8dd7-066dca212b58`
- Frontend `gamebuilder-company-r3` version `36e9e618-ccc1-4ea9-b6cd-ca5a4bb0da0f`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN unless direct contradictory evidence appears:
- first-day / first-arrival Opening while preserving selected department/rank;
- private `상식개변` app remains unfamiliar/private/optional and Opening does not pre-complete voluntary player action;
- committed `player_inner_thought` pipeline from Observer raw through applied/persistence/context/view model;
- player-thought visibility F-boundary correction in `3de671aa...`: non-empty thought opens existing `#player-panel`; fresh live fixture proved visible natural first-person Korean;
- character-specific first-person NPC Mind Monitor direction;
- choice semantic-diversity and elapsed-time guidance;
- existing choice-tail forms: plain `1. 행동` / `1) 행동`, symmetric whole-line `**1. 행동**` / `__1. 행동__`;
- bare-public cold start, exact player agency, canonical navigation, choice dispatch, CSA chronological APPLY/CHANGE/REMOVE and post-CSA continuation.

Do not reopen the player-thought pipeline or redesign these surfaces.

## 1. Decisive new failure

Fresh final-build disposable fixture:
- `a426b1e9-0eda-45e0-9fbe-9c6cea31063e`

Observed through bare-public UI:
- Opening committed at Day 1 09:05 with `brand_strategy` + `intern` preserved;
- player thought is now visibly GREEN: `#player-panel.open === true`, non-empty first-person Korean;
- relevant NPC Mind Monitor rendered character-specific first-person text;
- UI choice button count was 0;
- committed `choices=[]`;
- raw committed Story visibly contained four terminal choice lines whose numbering token alone was Markdown-emphasized: `**1.** 행동...` through `**4.** 행동...`;
- browser console had no blocking warn/error;
- no retry was performed.

This is not a semantic/model failure and not a regression of the previously accepted whole-line wrapper fix. It is one additional conventional structural representation: emphasis around only the numeric list token.

Independent source proof at `3de671aa...`:
- `runtime-r3/domain/observer-normalizer.js::choiceLine()` accepts plain numbering or a wrapper enclosing the entire numbered choice line, but not `**1.** action` / `__1)__ action`;
- `frontend-r3/render.js::choiceTail()` has the same limitation.

## 2. Required narrow correction

Before editing, reproduce the exact `**1.** 행동` through `**4.** 행동` shape deterministically in server and frontend tests.

Correct only this structural choice-tail representation.

Required accepted forms:
1. existing plain: `1. 행동` / `1) 행동`;
2. existing whole-line wrapper: `**1. 행동**`, `__1) 행동__`;
3. newly evidenced number-token-only wrapper: `**1.** 행동`, `**1)** 행동`, `__1.__ 행동`, `__1)__ 행동`.

Rules:
- only symmetric `**` or `__` emphasis around exactly the numbering token may be newly tolerated;
- recover only the action text after the emphasized number token;
- preserve that inner action literal character-for-character apart from existing outer whitespace trim;
- require exactly four ordered, distinct, non-empty terminal choices numbered 1→4;
- server projection and frontend presentation must implement the same supported forms;
- terminal choice lines must disappear from narrative body only when the same canonical four choices are actually available;
- observer mismatch may warn but cannot erase structurally valid Story-authored choices.

Remain fail-closed for:
- unbalanced/mixed emphasis;
- emphasis around arbitrary prose;
- malformed or wrong numbering;
- missing/extra choices;
- duplicate/empty actions;
- non-terminal pseudo-choice lines;
- bullets/fences/general Markdown constructs not explicitly listed above.

Also keep Story prompt guidance requesting plain numbered final lines without Markdown. Runtime correctness must not depend on provider compliance.

Forbidden:
- no general Markdown parser;
- no semantic classifier/matcher/rewriter;
- no fallback-authored choices;
- no second Story/Observer call;
- no retry/regeneration;
- no provider/model/temperature/token/timeout change;
- no DB/migration/schema/RLS/grant/reset work;
- no donor CSA UI/image/TTS work;
- no Production;
- no owner/preserved-game mutation.

## 3. Deterministic regressions

At minimum prove:
1. all previously accepted plain forms stay unchanged;
2. all previously accepted whole-line wrapper forms stay unchanged;
3. exact live failure `**1.** 행동` ... `**4.** 행동` projects four exact action literals server-side;
4. underscore number-token form behaves equivalently;
5. malformed/mixed/unbalanced token wrappers fail closed;
6. wrong numbering, duplicate/empty and non-terminal lines fail closed;
7. Observer mismatch cannot erase structurally valid Story choices;
8. frontend `choiceTail()` recognizes exactly the same structural set and strips the tail only with canonical choices;
9. `renderChoices()` receives four exact full literals and click submits the same literal;
10. player-thought panel correction stays green;
11. first-arrival/MM/time/agency/navigation/choice-dispatch/CSA chronology regressions remain green where touched.

Run focused R3 observer/provider/frontend/turn tests, full `npm test`, changed JS/MJS `node --check`, and `git diff --check`.

## 4. TEST-only deployment

If source changes, deploy only affected R3 TEST artifacts from the exact reviewed source.

Because the same structural assumption exists in server projection and frontend presentation, expect API + frontend deployment if both files change; confirm from actual diff.

Preserve existing bindings/secrets. Do not print, rotate, request or transfer secrets.
No Production or provider/model/config tuning.
Record exact source SHA and Worker version IDs.

## 5. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed, or direct-API gameplay substitute. Fresh disposable TEST games only.

### Gate A — exact new failure closure

Create one fresh game after deployment.

Require:
- Setup -> Opening through visible UI;
- first-arrival/selected role remains correct;
- Story ends in exactly four final choices;
- whether the provider emits plain, whole-line emphasis, or supported number-token emphasis, four usable choice buttons render;
- committed/readback `choices` contains the same four inner literals;
- no duplicate terminal choice lines remain as narrative body content;
- visible player-thought surface remains non-empty, natural first-person Korean and action-safe;
- relevant NPC MM remains natural character-specific first-person;
- click one visible choice once -> exactly one POST/SSE/commit with exact literal payload;
- resulting ordinary turn preserves a grounded player thought and four usable choices;
- refresh/re-entry preserves current thought/MM/time/choices;
- no console/network blocker.

If Gate A fails, STOP without retries and capture exact raw Story tail, observer raw/applied choices, persisted choices, presentation parse result and rendered DOM.

### Gate B — low/high-rank Opening

On exact final deployed source create two independent fresh games using materially different low/junior and high/senior/executive positions.

Both must show:
- explicit first arrival/first appointment;
- selected department/rank preserved;
- no invented prior tenure/relationship;
- private app remains optional/unfamiliar;
- four usable choices;
- visible natural first-person player thought;
- relevant NPC MM as natural character-specific first-person prose.

### Gate C — resume original narrative-quality campaign

Use a fresh game and commit at least 8 ordinary turns after Opening, mixing:
- free input and at least three visible choice clicks;
- direct NPC conversation + follow-up;
- movement/location change;
- work-context action;
- non-work/social action;
- refusal/change-of-mind or explicit self-state action.

Inspect complete Story + committed context for:
- exact player literal remains narrative center;
- player thought remains first-person, substantive, action-safe, non-duplicative, refresh-safe;
- relevant NPC MM remains first-person, character-specific, non-label, non-copied dialogue;
- CSA compliance alone creates no unsupported affection/comfort/desire/arousal/attraction/trust/liking;
- four choices are exact and meaningfully different rather than near-paraphrases/all-work/all-CSA escalation;
- canonical time advances plausibly;
- location/presence remain coherent;
- streaming remains visible/non-blocking.

Refresh/re-enter mid-campaign and at end; committed server context must reconstruct latest thought/MM/time/choices.

### Gate D — mobile

At approximately 390x844 verify player thought/MM/four choices/direct input are reachable and readable, with no blocking overlay, horizontal overflow, console/page/network errors.

## 6. GREEN criteria

GREEN only if:
- exact number-token emphasis failure is fixed structurally without general Markdown/semantic parsing;
- source/runtime/frontend agree on recovered literals;
- player-thought F correction remains live GREEN;
- Gate A click round-trip passes;
- low/high Opening passes;
- 8–10-turn campaign, refresh/re-entry and mobile pass;
- first-arrival/MM/choice diversity/time progression remain qualitatively acceptable;
- frozen agency/navigation/choice-dispatch/CSA chronology remain healthy;
- no forbidden work occurred.

Do NOT claim owner-ready after this task.

## 7. Remaining owner-remediation after this cut

Do not implement here:
1. high-parity Company donor CSA UI + draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.

## 8. Completion report

Post to Issue #68:
- exact number-token format root and supported forms;
- exact changed files/source SHA;
- focused/full tests;
- TEST Worker versions;
- Gate A fixture/raw tail/observer/persisted/button/click evidence;
- Gate B low/high fixture IDs;
- Gate C turn coverage and sampled Story/thought/MM/choice/time findings;
- refresh/re-entry/mobile diagnostics;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.
