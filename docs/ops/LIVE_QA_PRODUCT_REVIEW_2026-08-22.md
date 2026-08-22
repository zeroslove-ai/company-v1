# Company R3 — Live QA / Play-Data Product Review

Date: 2026-08-22
Status: BINDING DEFECT REVIEW FOR `company-r3-continuous-autonomous-live-qa-v1`

## Executive conclusion

The previous `OWNER_READY` decision was false-green.

The prior autonomous campaign proved important infrastructure properties (commits, literal persistence, refresh, RPC mechanics), but did **not** prove that the product behaved correctly from a real player's point of view.

Direct review of disposable TEST game `eb1bafe2-36bc-47b8-aec8-267b31633193` shows multiple objective product defects that should have been caught autonomously before owner handoff.

The key process mistake was treating these as equivalent:

- `15 turns committed`
- `15 turns played correctly`

They are not equivalent.

From now on each live campaign must inspect the full chain:

`literal input -> Story semantics -> observer raw -> observer applied -> durable state -> next Story/UI`

and actual screenshots/browser usability.

## Data reviewed

TEST project only: `fmcrspgxstsmxxsmkeee`

Primary reviewed automation game:

- `eb1bafe2-36bc-47b8-aec8-267b31633193`
- Opening + 15 ordinary turns = 16 stored turn rows

System/CSA event history and turn jobs were also read directly.

## Aggregate findings

For the 16 stored rows including Opening:

- exactly four persisted choices: 15/16
- zero persisted choices: 1/16
- persisted Mind Monitor empty: **16/16**
- `mind_monitor_projection_dropped`: **16/16**
- distinct committed locations: **1** (`brand_strategy_office`)
- Story visibly moved through meeting room and pantry, so this is a real state mismatch
- present-actor projection drops: 2 turns
- entered-actor projection drop: 1 turn
- choice projection drop: 1 turn

Narrative distribution in this campaign:

- average Story length: ~1183 characters
- meeting-related text: 15/16 turns
- campaign-related text: 8/16
- document/material-related text: 11/16
- `상식개변` mentioned: 10/16
- average choice length: ~81 characters
- maximum choice length: 240 characters

Turn jobs:

- ordinary jobs: 15
- committed: 15
- failed: 0
- average job wall time (`updated_at-created_at`): ~15.5s
- min ~11.86s / max ~20.19s

Current schema does not separately persist first-token, Story-complete, observer-complete and commit timings, so the user-visible latency tail cannot yet be diagnosed precisely.

---

# P0 / P1 product defects

## P1 — Literal agency is semantically violated even though stored input is byte-correct

The previous QA checked that stored `player_action` matched submitted Korean by codepoint. That is necessary but insufficient.

### Concrete failure: Turn 13

Literal input:

`한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.`

Actual Story:

- does not talk with 한리브;
- does not talk about lunch menu;
- continues the prior 김제나 conversation about brand `태도`;
- choices also remain centered on 김제나/work discussion.

This silently replaces actor + topic + requested action.

### Concrete failure: Turn 9

Literal input:

`혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`

Actual Story leaves 윤민아 beside the player and has her actively speak to the player.

This violates the requested self-state `혼자`.

### Required correction

Do not add a generic semantic classifier/gate.

Strengthen Story prompt/context and live QA. The QA agent must semantically compare the literal against the resulting Story for:

- actor
- target/counterparty
- action
- direction/movement
- request/refusal
- self-state (`혼자`, 기다린다, 떠난다, etc.)
- intent/topic

A byte-perfect DB row is not sufficient acceptance evidence.

---

## P1 — Mind Monitor is effectively 100% broken

Actual result:

- persisted MM empty 16/16;
- `mind_monitor_projection_dropped` 16/16.

Root contract mismatch is visible in source/data:

Observer frequently emits:

```json
{
  "mind_monitor": {
    "surface": "...",
    "subconscious": "..."
  }
}
```

Normalizer expects actor-keyed data:

```json
{
  "mind_monitor": {
    "heroine2": {
      "surface": "...",
      "subconscious": "..."
    }
  }
}
```

The raw MM also frequently describes the **player's** internal state, while the product surface is intended for relevant NPCs.

### Required correction

- Observer prompt must explicitly request actor-keyed MM for relevant current NPCs only.
- Observer must receive canonical actor ID/name directory.
- MM should use current/post-Story relevant actors, not only pre-turn `currentState.present_actor_ids`.
- Validation remains fail-open.
- Empty MM is acceptable on individual failure, but 100% drop is a hard product defect.

---

## P1 — Actor identity / presence projection is structurally unreliable

Observed examples include:

- 윤민아 emitted as `general_yoon_mina` instead of canonical `heroine2`;
- 김제나 emitted as `general_kim_jena` instead of `heroine3`;
- 서원희 emitted as `general_seo_wonhee` instead of `heroine1`;
- a quote about the **player moving** was paired with `heroine1` and could pass because the quote exists and `heroine1` is a valid ID;
- a quote about 서원희 was paired with `heroine2` in one raw observer result.

Current validator proves only:

1. actor ID is registered; and
2. exact quote exists in Story.

It does **not** prove the quote refers to that actor.

### Required correction

Keep this narrow; do not build a generic NER system.

- Give observer canonical actor `{id,name}` directory.
- Require actor evidence quote to contain that actor's canonical name or a deterministically accepted exact alias when the movement is actor-specific.
- Deterministic exact canonical-name -> ID correction is acceptable.
- Do not fuzzy-map unknown names to nearest actor.
- Player movement must never be interpreted as an NPC enter/exit.
- Replay multi-NPC, entry/exit and off-scene named-reference campaigns after correction.

---

## P1 — Location continuity failed throughout the main 15-turn campaign

The stored campaign had only one committed location: `brand_strategy_office`.

But Story/literals explicitly moved to:

- `brand_strategy_meeting_room`
- `pantry`
- meeting room again later

Concrete examples:

- Turn 2: literal and Story enter `브랜드전략팀 회의실`; committed state remains office.
- Turn 7: literal and Story enter `탕비실`; committed state remains office.
- Turn 15: Story enters meeting room; committed state remains office.

A location correction commit (`e1000c624...`) landed **after** this main 15-turn campaign completed. The broad campaign was not replayed after that fix.

### Required correction

- Replay full movement campaign after the location fix; do not accept a focused reproducer alone.
- Observer must receive canonical location IDs/names/aliases.
- Prefer exact canonical-name/alias evidence from current Story.
- State, map and next Story context must all agree.
- At least 4 distinct canonical locations must be exercised in a long campaign.

---

## P1 — `scene_note` becomes stale and contradicts current Story

Example Turn 14:

Story says the player has returned to their own desk and is writing meeting questions.

Persisted `scene_note` remains:

`주인공이 복사기 옆에서 자료를 정리하고, 김제나 사원과 대화를 시작한다.`

That is no longer the current scene snapshot.

### Required correction

The intended model is still one bounded `scene_note`, not a physical ontology.

Observer instruction must say:

- rewrite the **current** scene snapshot every turn when current material facts changed;
- use prior note only as continuity input;
- remove facts contradicted/ended by current Story;
- retain supported continuing pose/contact/object facts;
- omit uncertain facts.

Live QA must compare Story vs note, especially after:

- movement;
- conversation partner change;
- object placement/pickup;
- sitting/standing/contact changes;
- leaving and returning.

---

## P1 — Story choice contract failed in live play

Turn 11 ended without the required four next actions.

Persisted choices = `[]` and warning included `choices_projection_dropped`.

Fail-open behavior was correct: Story committed and no stale choice fallback was used.

But 1 failure in 16 rows is too frequent for a normal UI contract.

### Required correction

- Investigate provider completion/truncation/compliance cause.
- Keep no-second-Story rule.
- Keep free input available on extraction failure.
- Do not invent deterministic replacement choices for ordinary live product.
- Measure exact-four compliance over 30 + 15 + 50 turn campaigns.

---

## P1 — Active CSA rules are currently not projected into Story context

Current `runtime-r3/domain/memory.js` returns:

```js
active_rules: []
```

unconditionally.

Therefore the previous result “all nine CSA templates applied and removed successfully” proved only transaction mechanics. It did **not** prove that an active rule changed subsequent Story behavior.

### Required correction

Story context should receive only currently active canonical rules, with bounded exact fields such as:

- template_id
- premise/content
- subject_scope
- optional counterparty_scope
- trigger/mode if needed by canon

Do not reintroduce a generic execution/consent DSL.

Then live-test each of the nine rules as:

`apply -> verify revision/no fake turn -> play relevant action/scene -> inspect Story + observer/state -> remove -> verify readback`

Use representative valid scopes, not only `female_employee` default.

---

## P1 — The prior CSA test contaminated the general narrative fixture

In `eb1bafe2...`, all nine CSA rules were rapidly activated/deactivated before ordinary play.

Later `state_after.clothing` contains many female actors with structured slots showing outer clothing removed / underwear worn even though `csa_active=[]`.

This makes the same game a poor fixture for general narrative/continuity QA.

### Required process correction

Use separate disposable fixtures:

1. clean normal-play game — never CSA-mutated;
2. clothing CSA game;
3. request/interaction CSA game;
4. long-memory game.

Do not use a heavily mutated CSA fixture to certify ordinary Story continuity.

Whether rule removal should automatically redress actors is a separate product/state question. Do not make clothing disappear magically; preserve actual material continuity unless canon explicitly defines deterministic restoration.

---

## P1 — System-event history is not usable as chronological Story context yet

`company_r3_system_events` currently stores event_id/game_id/event_type/payload/created_at.

The 20 CSA transactions are present, but current Story memory ignores them and active rule projection is empty.

The original A-prime design wanted an ordering anchor such as state revision / after-turn / sequence.

### Required correction

At minimum:

- current Story always gets authoritative current active rules;
- recent relevant non-Story rule transactions may be included only when useful for chronology;
- avoid bloating Story context with inactive historical rule records.

Do not keep every inactive CSA rule object in active gameplay context just because it remains in state history.

---

# P2 quality / UX defects

## P2 — Narrative is too work-task dominated

In the reviewed 16-row campaign:

- meeting appears in 15/16 Story rows;
- campaign in 8/16;
- work documents/materials in 11/16.

The game quickly becomes a diligent intern / brand-campaign workflow simulator.

The locked product is Company-life character simulation with work as texture, not a productivity/mandatory quest simulator.

### Required correction

Do not remove workplace context. Broaden Story affordances and choices:

- social/personal conversations;
- idle/awkward moments;
- private app curiosity;
- spontaneous coworker behavior;
- meals/breaks/elevator/lounge/corridor encounters;
- player refusing/postponing/ignoring work requests;
- NPCs having their own goals rather than every scene funneling back to the campaign.

Live QA should measure scene/topic diversity rather than only turn count.

---

## P2 — Choices are frequently too long and overcommitted

Reviewed choices:

- average length ~81 characters;
- max 240 characters.

Many are complete multi-sentence speeches with several intentions bundled together.

This is functional but poor mobile/game feel and narrows player agency before the click.

### Required correction

- Story source action can remain natural/full literal.
- Prefer one clear action/intention per choice.
- UI may show a compact label while click submits the full literal source action.
- Avoid four near-identical diligent-work responses.
- Live QA should inspect choice diversity and mobile readability.

---

## P2 — Story invents a second fictional app mechanic

Examples from live Story:

- app asks `당신이 가장 의식하는 사람을 선택하세요`;
- heroine names appear with glowing dots;
- app says `당신의 말이 누군가에게 닿고 있다. 그 효과를 확인할 시간.`;
- later it auto-opens and shows silhouettes.

These mechanics are not the accepted 9-rule system transaction UI and create a competing fictional app system.

### Required correction

The Story may acknowledge the private app, but must not invent unsupported menus, powers, targets, unlocks or progress mechanics.

If the player wants to use the app, the product UI/system transaction is authority.

---

## P2 — Observer timeout is far too generous for a fail-open sidecar

Current provider timeout:

- Story first content 30s
- Story total 120s
- Observer 75s

Observer is optional projection/fail-open. A 75-second observer tail can make a completed Story feel hung.

Current job-level DB timing averages ~15.5s, but schema cannot distinguish Story vs observer tail.

### Required correction

1. add diagnostics/timestamps for:
   - submit
   - first Story token
   - Story complete
   - observer complete/fail
   - commit terminal
2. measure real deployed p50/p95 over campaigns;
3. reduce observer timeout to a short fail-open budget based on evidence;
4. do not increase retries or add a second observer/Story to hide slow projection.

---

# False-green QA postmortem

The previous owner-ready report correctly observed:

- 15 commits;
- stored literal strings matched;
- refresh worked;
- four buttons were visible in final state;
- 9 CSA RPCs could apply/remove;
- screenshots could be captured.

But it failed to ask:

- Did Story actually execute each literal?
- Did a different character/action/topic get substituted?
- Was MM ever non-empty?
- Did committed location follow Story movement?
- Did scene_note become stale?
- Did CSA affect Story at all?
- Did all fixes get followed by a **full campaign replay**?
- Were screenshots visually inspected as a user would see them?
- Was the game becoming a work-task simulator?

These checks are now mandatory in `AUTONOMOUS_LIVE_QA_LOOP.md`.

---

# Fix priority order

## Priority 1 — correctness before more features

1. Story active CSA projection (`active_rules` not empty when rules active).
2. Observer canonical actor directory + exact actor/name evidence.
3. Mind Monitor actor-keyed contract and relevant-NPC targeting.
4. Location full replay after current canonical-location fix.
5. `scene_note` current-snapshot rewrite contract.
6. Semantic literal-agency review and prompt correction for actor/target/action/self-state/topic.
7. Four-choice compliance investigation.

## Priority 2 — long-play / performance

8. Separate clean normal-play and CSA fixtures.
9. 30-turn + independent 15-turn campaign.
10. 50-turn memory campaign and summary grounding review.
11. latency instrumentation and observer fail-open timeout reduction.
12. refresh-during-stream/reconnect/stale-attempt campaign.

## Priority 3 — product feel / retained surfaces

13. reduce work-task funneling; broaden social/company-life scene mix.
14. shorter/more diverse choices.
15. eliminate invented fictional app mechanics outside canonical CSA UI.
16. make retained History/TTS/download fully live-tested.
17. implement/rebind Feedback/revision if retained by current product canon; do not leave a visible retained control disabled and call it owner-ready unless explicitly deferred by owner.

---

# Owner-ready definition after this review

Do not hand the product back merely because all technical tests are green.

Before owner handoff, automation must demonstrate:

- clean browser/UI;
- semantic literal agency in reviewed Story samples;
- stable actor/location/presence/scene_note;
- working, relevant MM;
- 4-choice contract at high reliability with fail-open free input;
- actual narrative behavior for all nine active CSA rules;
- clean general-play fixture separate from CSA stress fixture;
- 30 + 15 + 50 turn campaigns;
- long-memory grounding;
- acceptable measured latency and no long observer tail;
- retained sidecars actually usable;
- visually inspected desktop/mobile screenshots;
- no known objective P0/P1/P2 defect.

Only subjective questions should remain for the owner.
