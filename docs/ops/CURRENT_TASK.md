# Company — CURRENT TASK

Status: READY
Task ID: company-r3-first-arrival-thought-mm-progression-v1
Mode: OWNER NARRATIVE SURFACE -> FIRST-ARRIVAL OPENING -> PLAYER INNER THOUGHT -> CHARACTER-SPECIFIC MIND MONITOR -> CHOICE/TIME QUALITY -> BARE-PUBLIC ACCEPTANCE
Updated: 2026-08-23 19:22 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385490403`
Operator review: Issue #68 comment `5385514066`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — freeze unless contradictory live evidence appears

Accepted executable/source baseline:
- `cbb4f3581e692e67e7849591bee280e967e99b7f`

Current TEST artifacts:
- API Worker `game-proxy-company-r3` version `c8c0b390-db3e-45cf-900d-70a91cbab231`
- Frontend Worker `gamebuilder-company-r3` version `28ff4453-962a-4d2e-bb95-611c76329b1b`
- public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Frozen GREEN behavior:
- bare-public cold start;
- exact player actor/target/action/request/refusal/self-state/topic/intent preservation;
- exact canonical navigation and refresh persistence;
- visible choice dispatch on desktop/mobile;
- CSA APPLY / CHANGE / REMOVE are each one chronological streamed Story/Observer/commit turn;
- CSA state transition is atomic with the successful turn;
- ordinary post-CSA turns do not inherit stale `csa_operation`;
- CSA modal closes before the next interaction and operation controls recover after busy clears;
- compliance alone does not justify unsupported positive private emotion;
- current 10-turn CSA acceptance sequence and refresh/re-entry are accepted for that bounded cut.

Do not reopen or redesign these surfaces without direct contradictory evidence.

## 1. Binding owner product requirements for this cut

Issue #68 owner override `5384780073`, already synchronized into the canon documents, requires:

1. Every new game begins on the player's first day / first arrival at the company, regardless of selected rank or position.
2. The private `상식개변` app may be discovered and may provoke curiosity, but using it is never a mandatory quest, implied action, or pre-completed choice.
3. Player inner thought is a first-class visible product surface, separate from NPC Mind Monitor.
4. NPC Mind Monitor surface/subconscious text must be natural, character-specific, first-person Korean rather than third-person analyst prose, labels, or copied dialogue.
5. Four Story-authored choices remain exact literal actions but must also be meaningfully different next actions in actual play.
6. Canonical game time should progress believably as scenes/actions consume time rather than remaining effectively frozen across normal play.

This task implements only those narrative-surface requirements. It does not authorize the later donor-parity CSA UI, image/TTS, reset, timeline residue, or final owner-ready work.

## 2. Proven current gaps before implementation

Current source at the accepted baseline shows:

- `OPENING_STORY_SYSTEM_PROMPT` requires private-app discovery/recognition and player-agency preservation, but does not bind the Opening to first day / first arrival for every selected rank.
- `buildStoryContext(... opening=true ...)` has no first-arrival/first-day contract field.
- R3 has no dedicated player-inner-thought value in the committed view model or DOM. `frontend-r3/index.html` contains NPC Mind Monitor and player state, but no player-thought card.
- Observer output currently has `mind_monitor` but no `player_inner_thought` key.
- Observer receives canonical actor IDs/names but no bounded character personality/speech context specifically for Mind Monitor quality.
- `normalizeObserver()` accepts `surface/subconscious` text but does not enforce or guide first-person character voice.
- The prior live CSA acceptance produced Mind Monitor strings such as `차분함` and `실용적`; those are acceptable as evidence that the field exists, but not as owner-level natural first-person character writing.
- Story requires four distinct choices, but the runtime has no product-facing semantic diversity instruction beyond distinct strings.
- Observer allows `elapsed_minutes = 0`; this is valid for truly instantaneous beats, but ordinary multi-action play must not remain at the same clock because the model habitually emits zero.

Audit these exact paths before editing:
- `runtime-r3/server/provider.js`
- `runtime-r3/domain/memory.js`
- `runtime-r3/domain/observer-normalizer.js`
- `runtime-r3/domain/reducer.js`
- `runtime-r3/domain/contracts.js`
- `runtime-r3/server/store.js` and `supabase-store.js` only to confirm persistence shape
- `frontend-r3/r3-view-model.js`
- `frontend-r3/render.js`
- `frontend-r3/app.js`
- `frontend-r3/index.html` and relevant CSS
- focused R3 provider/observer/frontend/turn tests.

## 3. Required implementation shape

### A. First-arrival Opening

Strengthen the existing Story/context contract, without a new pre-Story router:

- every fresh Setup -> Opening explicitly establishes that today is the player's first day / first arrival / first appointment at this company in the selected department and position;
- selected rank remains true. A senior/executive profile is a newly arrived/appointed senior/executive, not silently rewritten as a junior new hire;
- do not invent prior tenure, prior company relationships, completed onboarding, or old office memories that contradict first arrival;
- provide a plausible immediate reason/context for being there: arrival, reception/onboarding, first introduction, first assignment context, etc., appropriate to the selected role;
- the private `상식개변` app may appear/be noticed as unfamiliar and private;
- Opening must not click/open/use/hide the app, speak, nod, move, decide, accept/refuse, or complete another voluntary player action before the first player input;
- end with four genuinely different available actions plus free-input freedom.

Do not add deterministic prose that replaces Story. Keep Story as the writer.

### B. Player inner thought — one committed presentation projection, no new LLM call

Add a bounded `player_inner_thought` projection to the existing single Observer response.

Required semantics:
- natural first-person Korean from the player's immediate perspective;
- short but substantive, normally one to three natural sentences rather than a one-word mood label;
- grounded in the submitted literal action, completed Story, current situation and profile;
- may express uncertainty, curiosity, reluctance, resolve, embarrassment, irritation, etc. when supported;
- must not invent an unchosen player action, decision, consent, desire, relationship, or external outcome;
- during Opening it may register perception/uncertainty/curiosity about the first arrival or unfamiliar app, but must not state that the player decided to use it;
- it is a side/readback projection, not a new semantic authority or Story gate.

Persistence/presentation boundary:
- do not add a DB column or migration for this task;
- retain it inside an already persisted per-turn JSON projection, preferably `observer_applied.player_inner_thought`, or an equally existing committed JSON surface if source audit proves a cleaner equivalent;
- refresh/re-entry must reconstruct the latest committed player thought from server context, not frontend-only cache;
- render it in a dedicated visible `플레이어 속마음` card/surface separate from NPC Mind Monitor and separate from the basic player state list;
- do not duplicate the same thought inside main Story text.

### C. Character-specific first-person NPC Mind Monitor

Keep the existing one Observer; do not add another model call or sentiment engine.

Strengthen Observer context/prompt so relevant current/post-Story NPCs can be written from their actual character canon:
- provide only the bounded registered character information needed for Mind Monitor quality (identity/role/personality/speech/distinctive traits as already available in canonical content); do not expose unrelated semantic state;
- `surface` = what that NPC is consciously thinking now, in natural first-person Korean;
- `subconscious` = deeper/private first-person thought that remains plausible for that character and scene;
- avoid third-person analyst prose such as `윤민아는 긴장하고 있다`;
- avoid one-word labels such as `차분함`, `실용적`, `긴장` as the complete product output;
- avoid copying the NPC's spoken line verbatim into both fields;
- do not homogenize all NPCs into the same voice;
- compliance with a CSA rule remains separate from affection/comfort/desire/arousal/attraction/trust/liking;
- missing/invalid entry degrades only that NPC locally and must not fail the Story turn.

Do not make Mind Monitor a durable gameplay-state writer. It remains committed side/readback data.

### D. Four-choice semantic diversity without a runtime classifier

Strengthen the existing Story choice instruction only as needed:
- exactly four full literal player actions remain Story-authored and are copied verbatim by Observer;
- the four must differ in meaningful intent, not just wording;
- when scene context supports it, prefer a spread across e.g. conversation/social follow-up, movement/scene change, work/context action, self-directed/non-work/refusal/change-of-mind/exploration rather than four near-paraphrases of the same beat;
- do not force all categories every turn when nonsensical;
- active CSA must not collapse choices into four CSA/sexual escalation variants;
- no deterministic semantic classifier, rewrite layer, label generator, or second author is allowed at runtime.

Product-play qualitative inspection, not a hard semantic gate, decides diversity.

### E. Believable elapsed-time progression

Keep the existing numeric clock/reducer authority.

Strengthen Observer instructions so `elapsed_minutes` reflects the completed scene/action:
- 0 is allowed only when essentially no meaningful time elapsed;
- conversation, walking between locations, checking/working on something, eating/drinking, meetings and comparable actions should usually consume plausible positive minutes;
- do not use a fixed per-turn constant;
- do not use deterministic action taxonomies or a new time classifier;
- reducer continues to own arithmetic and day rollover.

Acceptance should prove that a normal multi-turn play sequence advances the displayed clock in a believable direction and does not remain frozen at 09:00.

## 4. Focused deterministic regressions

Add/update only tests needed for this bounded cut. At minimum prove:

1. Opening Story/context contract explicitly binds every profile to first day/first arrival while preserving selected rank/department.
2. Opening still forbids voluntary pre-first-input player action and app use.
3. Observer contract contains `player_inner_thought` and its agency boundary.
4. `player_inner_thought` survives normalization and is persisted/read back through an existing per-turn JSON projection without migration.
5. frontend view/render exposes a dedicated player-thought surface and refresh can reconstruct it from committed context.
6. Observer receives bounded relevant character canon needed for character-specific MM.
7. MM prompt contract requires natural first-person surface/subconscious and preserves the compliance-vs-private-emotion boundary.
8. invalid/missing one NPC MM entry remains local fail-open.
9. Story prompt requires meaningfully different four actions while retaining exact literal/Observer parity.
10. Observer elapsed-time contract distinguishes instantaneous zero from normal positive elapsed time; reducer arithmetic/day rollover remains unchanged.
11. frozen agency/navigation/choice/CSA chronology contracts remain green where touched.

Run relevant focused R3 provider/observer/frontend/turn suites, full `npm test`, changed JS/MJS syntax checks and `git diff --check`.

Do not create a migration merely for player thought. If the implementation appears to require schema change, STOP and report why rather than adding one silently.

## 5. TEST-only deployment

Deploy only affected R3 TEST artifacts from the exact reviewed source.

Likely affected artifacts may include API and frontend; determine from actual diff.

Hard boundaries:
- preserve all current bindings/secrets including `R3_GAME_ACCESS_SECRET`;
- no Production;
- no provider/model/temperature/token/timeout tuning;
- no migration/schema/RLS/grant change;
- no reset work;
- no donor-parity CSA UI redesign;
- no image/TTS implementation;
- no owner/preserved-game mutation.

Record exact executable SHA and Worker version IDs.

## 6. Mandatory bare-public live acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, no preseeded storage, no direct-API gameplay substitute for acceptance.
Use fresh disposable TEST games only.

### Fixture A — first-arrival Opening across rank extremes

Create at least two independent fresh games using materially different positions, including a low/junior position and a high/senior position available in the current catalog.

For each:
- Setup -> Opening through visible UI;
- Story visibly establishes first day/first arrival/first appointment at this company while preserving the selected rank and department;
- no invented old tenure or prior company relationship;
- private app is unfamiliar/private and optional;
- no voluntary player action is completed before first input;
- four choices are visibly different in intent;
- dedicated player inner-thought surface is visible and natural first-person Korean;
- any visible NPC MM is natural first-person and character-specific rather than a mood label/analyst sentence.

Qualitatively inspect screenshots for both openings.

### Fixture B — 8–10-turn ordinary narrative-quality campaign

Use a fresh game and commit at least 8 ordinary turns after Opening, mixing:
- free input and at least three visible choice clicks;
- direct NPC conversation and follow-up;
- movement/location change;
- work-context action;
- non-work/social action;
- one refusal/change-of-mind or explicit self-state action.

For every sampled committed turn inspect:
- exact player literal remains the narrative center;
- player inner thought is present when appropriate, first-person, non-duplicative, and does not invent a different action/decision;
- relevant NPC MM surface/subconscious is first-person, character-specific and not copied dialogue or one-word labels;
- no unsupported positive private emotion from CSA compliance;
- four choices remain exact literals and are meaningfully different, not near-paraphrases or all work/CSA escalation;
- elapsed time is plausible for the described action and displayed game time advances over the campaign;
- location/presence/scene remain coherent;
- Story streaming remains visible and non-blocking.

Refresh/re-enter mid-campaign and again at the end:
- chronology remains intact;
- latest player thought and NPC MM reconstruct from committed server context;
- displayed time matches committed state;
- choices remain usable.

### Fixture C — mobile presentation

At approximately 390x844 on a fresh or continued disposable game verify:
- player-thought card is readable and does not cover Story/actions;
- NPC MM remains reachable/readable;
- four choice controls and direct input remain reachable;
- no horizontal overflow or blocking overlay regression;
- no console/page/network errors.

## 7. GREEN criteria

GREEN only if:
- fresh low-rank and high-rank games both visibly begin as first arrival/first day while preserving selected role;
- Opening leaves the player's first action unchosen and app use optional;
- dedicated player inner thought is visible, committed, refresh-safe and agency-safe;
- relevant NPC MM is natural first-person, character-specific, non-label prose and locally fail-open;
- four choices are exact Story literals and qualitatively meaningfully diverse across sampled turns;
- normal multi-turn play advances canonical time plausibly rather than remaining frozen;
- agency/navigation/choice dispatch/CSA chronology remain healthy;
- desktop/mobile rendering is usable;
- no blocking loader, fallback, uncaught console error or required network failure;
- no forbidden Production/provider-model/migration/schema/reset/CSA-UI/image/TTS work occurred.

Do NOT claim owner-ready after this task.

## 8. Remaining owner-remediation phases after this cut

Do not implement these here:
1. high-parity Company donor CSA UI and draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.

## 9. Completion report

Post to Issue #68:
- exact audited gaps and changed files;
- executable source SHA;
- focused/full tests actually run;
- TEST API/frontend version IDs;
- Fixture A game IDs/selected rank evidence and Opening qualitative findings;
- Fixture B game ID and turn-by-turn sampled literals/Story/player-thought/MM/choices/time findings;
- refresh/re-entry evidence;
- mobile screenshot/controls findings;
- console/network findings;
- any remaining objective defect.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.