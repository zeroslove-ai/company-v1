# Company — CURRENT TASK

Status: READY
Task ID: company-r3-player-inner-thought-commit-boundary-v1
Mode: TRACE PLAYER THOUGHT LOSS -> MINIMAL COMMIT/PROJECTION FIX -> REDEPLOY TEST -> RESUME NARRATIVE ACCEPTANCE
Updated: 2026-08-23 20:04 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385660241`
Operator review: Issue #68 comment `5385619025`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Frozen accepted baseline

Current reviewed executable/source:
- `fe00bf5943b991b737b3a82ac6bd5d146d59bc91`

Current TEST artifacts:
- API `game-proxy-company-r3` version `21efa7c9-f8b0-4c43-8dd7-066dca212b58`
- Frontend `gamebuilder-company-r3` version `40f7acc5-1b80-47bd-b836-257b71f3d1f7`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN unless direct contradictory evidence appears:
- first-day / first-arrival Opening while preserving selected department/rank;
- private `상식개변` app remains unfamiliar/private/optional and Opening does not pre-complete a voluntary player action;
- character-specific first-person NPC Mind Monitor direction and current live Opening proof;
- choice semantic-diversity and elapsed-time guidance already landed;
- choice-tail structural fix in `fe00bf...`: plain numbered tails plus only symmetric whole-line `**...**` / `__...__` wrappers; exact inner literal preserved;
- fresh Gate A fixture rendered exactly four usable choice buttons with full literal titles;
- bare-public cold start, exact player agency, canonical navigation, choice dispatch, CSA chronological APPLY/CHANGE/REMOVE and post-CSA continuation remain frozen GREEN.

Do not reopen the choice-format fix or redesign these surfaces.

## 1. Decisive remaining failure

Fresh final-build disposable fixture:
- `351a0619-f153-4551-9a0e-7990772cb8b0`

Observed through bare public UI:
- Opening committed successfully at Day 1 09:05;
- correct first-arrival brand-strategy assistant-manager context;
- four visible usable choice buttons;
- character-specific first-person Mind Monitor present;
- no console error/warn blocker;
- `#player-inner-thought` was empty.

Because player inner thought is a mandatory owner narrative surface, Gate A failed. Gate B low/high-rank final-build Opening, Gate C 8–10-turn narrative campaign, refresh/re-entry and Gate D mobile were correctly not claimed.

Important: DOM emptiness alone does NOT identify the source boundary. Do not patch from assumption.

## 2. Required first step — trace the exact failed committed Opening read-only

Before any source edit, inspect fixture `351a0619-f153-4551-9a0e-7990772cb8b0` read-only through the existing TEST context/persistence surfaces.

Capture the exact value/presence at each available stage:
1. provider Observer raw JSON (`player_inner_thought`: missing / null / empty / non-empty);
2. `normalizeObserver()` result / `observer_applied.player_inner_thought`;
3. committed turn persistence/readback value;
4. `/context` or normal server context latest turn value after refresh/re-entry;
5. `buildR3ViewModel(...).playerInnerThought`;
6. rendered `#player-inner-thought` hidden/value state.

Also inspect the earlier final-build campaign fixture `3e5611e5-f09e-450d-9fd3-8aa040f45246` read-only if still available, because Turns 1–2 previously showed empty player thoughts. Do not mutate or retry either fixture.

Classify the first loss exactly:
A. Observer provider omitted/returned empty `player_inner_thought` despite grounded Story;
B. raw value exists but normalizer drops/corrupts it;
C. normalized value exists but persistence/commit/readback drops it;
D. committed value exists but server context omits it;
E. context has it but view model loses it;
F. view model has it but renderer/DOM hides or clears it;
G. another concrete boundary with direct evidence.

Post the evidence in the terminal report. Do not edit source until this classification is established.

## 3. Minimal correction rules

Fix only the proven first-loss boundary.

### If A — Observer raw missing/empty

Do NOT solve by adding another LLM call, retry/regeneration, model change, timeout increase, or stochastic resubmission.

First inspect why the existing single Observer contract still permits an empty/missing product projection. Use the smallest existing-call correction available.

Preferred constraints:
- retain exactly one Observer call;
- retain JSON response path;
- player thought remains presentation/readback side data, not gameplay semantic authority;
- no DB column/migration;
- no deterministic semantic classifier;
- no invented player action/decision/consent/desire/relationship/outcome;
- Opening thought must remain first-person, short/substantive and safely grounded in first-arrival/app-perception context;
- ordinary-turn thought must remain grounded in literal action + completed Story and must not replace player intent.

If strict structured response-shape enforcement is supported by the existing provider boundary without changing provider/model, it may be used only for presence/type of the existing key; do not introduce a semantic validator or second author. If the provider boundary cannot structurally require the key, use the smallest evidence-backed local fail-open completion that is demonstrably agency-safe and grounded; do not create generic mood/action inference.

### If B–F

Correct only that normalizer/persistence/context/view/render defect. Do not touch the Observer prompt/provider unless the trace proves A.

## 4. Deterministic regressions

Add/update only tests required by the proven root. At minimum cover:
1. grounded Opening commits a non-empty `player_inner_thought` through the corrected boundary;
2. ordinary grounded turn also preserves/readbacks the field;
3. player thought survives normalization, persistence/context shape and view-model reconstruction as applicable to the root;
4. refresh/re-entry reconstructs from committed server context, not frontend cache;
5. dedicated `플레이어 속마음` renderer is separate from Story and NPC Mind Monitor;
6. thought cannot invent a different player action/decision in deterministic fixture coverage;
7. missing/invalid NPC MM remains local fail-open and does not erase player thought;
8. current choice-tail plain/bold wrapper tests stay green;
9. first-arrival, elapsed-time, agency/navigation/choice-dispatch/CSA chronology contracts remain green where touched.

Run relevant focused R3 provider/observer/turn/frontend tests, full `npm test`, changed JS/MJS syntax checks and `git diff --check`.

## 5. TEST-only deployment

If source changes, deploy only affected R3 TEST artifact(s) from the exact reviewed source.

Preserve all existing bindings/secrets. Do not print, rotate, request or transfer secrets.
No Production.
No provider/model/temperature/token/timeout tuning.
No migration/schema/RLS/grant/reset work.
No donor-parity CSA UI, image or TTS work.
No owner/preserved-game mutation.

Record exact source SHA and Worker version IDs.

## 6. Mandatory bare-public acceptance after correction

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed or direct-API gameplay substitute. Fresh disposable TEST games only.

### Gate A — player-thought closure + choice regression

Fresh game on exact deployed source:
- Setup -> Opening through visible UI;
- first-arrival/selected role preserved;
- four usable choices render and committed choices match exact literals;
- dedicated player-thought surface is visible, non-empty, natural first-person Korean and does not invent app use or another voluntary player action;
- relevant NPC MM remains natural character-specific first-person;
- click one visible choice -> exactly one POST/SSE/commit with exact literal;
- resulting ordinary turn has a grounded non-empty player thought when the completed Story provides a player perspective;
- readback/refresh preserves the thought;
- no console/network blocker.

If Gate A fails, STOP without retry and capture raw Observer/applied/context/DOM values.

### Gate B — final-build low/high-rank Opening

Two new games using materially different low/junior and high/senior/executive positions:
- both explicitly first arrival/first appointment;
- selected department/rank preserved;
- no prior tenure/relationship invented;
- app optional/private;
- four usable choices;
- visible natural first-person player thought;
- relevant NPC MM natural character-specific first-person prose.

### Gate C — resume original 8–10-turn narrative campaign

Fresh game, at least 8 ordinary turns after Opening, mixing:
- free input + at least three visible choice clicks;
- direct NPC conversation/follow-up;
- movement/location change;
- work-context action;
- non-work/social action;
- refusal/change-of-mind or explicit self-state action.

Inspect complete Story + committed context for:
- exact player literal remains center;
- player thought is first-person, substantive, action-safe, non-duplicative and refresh-safe;
- relevant NPC MM first-person/character-specific/non-label/non-copied;
- no unsupported positive private emotion from CSA compliance;
- four choices exact and meaningfully diverse;
- canonical time advances plausibly over normal actions;
- location/presence coherent;
- streaming visible/non-blocking.

Refresh/re-enter mid-campaign and at end; latest player thought/MM/time/choices must reconstruct from committed server context.

### Gate D — mobile

At ~390x844 verify:
- player-thought and MM readable/reachable;
- four choices + direct input reachable;
- no blocking overlay/horizontal overflow;
- no console/page/network errors.

## 7. GREEN criteria

GREEN only if:
- the exact first-loss boundary is proven and minimally fixed;
- fresh final-build Opening and first ordinary turn both show/read back appropriate non-empty player thought;
- no thought invents a different action/decision or mandatory app use;
- choice-tail fix remains green;
- low/high Opening, 8–10-turn campaign, refresh/re-entry and mobile pass;
- first-arrival/MM/choice diversity/time progression remain qualitatively acceptable;
- frozen agency/navigation/choice-dispatch/CSA chronology remain healthy;
- no forbidden work occurred.

Do NOT claim owner-ready after this task.

## 8. Remaining owner-remediation after this cut

Do not implement here:
1. high-parity Company donor CSA UI + draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.

## 9. Completion report

Post to Issue #68:
- A–G first-loss classification with failed fixture evidence;
- exact changed files/source SHA;
- focused/full tests run;
- TEST Worker versions;
- Gate A fixture + Observer raw/applied/readback/view/DOM proof;
- Gate B low/high fixtures;
- Gate C turn coverage and sampled Story/thought/MM/choice/time findings;
- refresh/re-entry/mobile diagnostics;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.