# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-phase1-product-identity-shell-restoration-v1
Mode: SOURCE CORRECTION — OWNER-REPORTED PRODUCT IDENTITY FAILURE
Updated: 2026-08-20
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Why the prior owner-acceptance checkpoint is rejected

The owner inspected the Phase 1 TEST product and rejected it before gameplay because it does not read as the actual `상식개변: 회사편` game. The current v2 behaves/presents like a generic office chat/work-assistant demo.

This is a source/product defect, not a manual-acceptance delay. The prior `WAITING_USER_ACCEPTANCE` gate is closed as REJECTED.

Do not ask the owner to accept or continue playing Handoff H until this source correction is reviewed, merged, rolled out to TEST, and a fresh manual handoff is prepared.

Preserve Handoff H as evidence; do not reset/delete/repair it:

`161dda85-5cb4-4598-8331-1b9adc0d64f4`

## 1. Verified root causes

### A. v2 content adapter is not the Company product canon

Authoritative repository content already exists:

- `content/edition.json` — title `상식개변: 회사편`
- `content/characters.json` — canonical heroines and prompt cards
- `content/general_npcs.json` — canonical general NPCs
- `content/map.json` — canonical company locations/map
- `content/organization.json`, `positions.json`, `speech_styles.json`, `body_types.json` — product catalogs

Current bad v2 source:

`runtime-v2/domain/content.js`

It hardcodes a tiny fake/demo catalog:

- `heroine1 = 서원`
- `heroine2 = 다현`
- `heroine5 = 민지`
- only `lobby` and `brand_strategy_office`

This is invalid. Canonical examples include:

- `heroine1 = 서원희`
- `heroine2 = 윤민아`
- `heroine3 = 김제나`
- `heroine4 = 한리브`
- `heroine5 = 이메이`

and eight registered general NPCs plus the full repository map.

No character/location/product name may be invented or duplicated in v2 when an authoritative repository catalog already exists.

### B. v2 Opening erased the actual game premise

Current bad source:

`runtime-v2/domain/story.js::openingStory()`

It is a generic first-day office greeting ending in work-assistant language such as asking whether to check the first task together.

The Company product's existing opening canon/reference is in `src/engine/opening-prompt.js` and must be used as PRODUCT REFERENCE ONLY, not imported as old runtime implementation.

Core product premise that must survive the clean-room rewrite:

- the player accepted/joined the company;
- the player notices an unfamiliar phone app named `상식개변` that they do not remember installing;
- the app claims it can change rules that people around the player accept as ordinary/natural;
- the player has not used it yet at Opening;
- NPCs do not know the app exists;
- reality has not changed merely because the app exists;
- origin/mechanism are unknown;
- the first company day unfolds as interactive fiction and the player freely decides what to do next.

Do not copy the old runtime stage machine, parser, reducers, or choice protocol. Preserve only this product premise/canon.

### C. Story LLM receives almost no Company canon

Current bad source:

`runtime-v2/server/provider.js::buildStoryMessages()`

It sends time, scene IDs and recent turns, but no actual active character prompt cards, names, roles, company-world/location descriptions, or product premise.

Therefore the Story model cannot reliably know who `heroine1` is, who 윤민아 is, what the company setting is, or what kind of game it is.

### D. v2 frontend is a stripped demo shell, not the Company game shell

Current:

- `frontend-v2/index.html`
- `frontend-v2/app.js`
- `frontend-v2/styles.css`

Presentation donor/reference already exists in:

- `src/frontend/pages/index.html`
- its presentation-only CSS/components

The old product shell visibly includes game-oriented presentation such as:

- story as the dominant center panel;
- character/current-scene presentation;
- Mind Monitor;
- character state;
- player state;
- company map;
- `상식개변` app/tool entry;
- bottom action input;
- history / feedback / reset / media affordances where enabled by phase.

The v2 canon explicitly allows reuse of existing visual design/components where presentation-only while forbidding the old frontend turn state machine.

## 2. Required correction

Create one source branch from the exact current `main` at task lease time. Do not create any ops branch.

Recommended branch:

`company/v2-phase1-product-identity-shell-restoration-v1`

Open one Draft PR and stop at source review boundary. Do not merge or deploy.

### 2.1 Replace demo content with a canonical static-content adapter

`runtime-v2/domain/content.js` must derive Company identities and locations from the authoritative `content/*.json` files through a clean v2 static adapter.

Requirements:

- all five canonical heroine IDs/names available;
- all canonical general NPC IDs/names available;
- full canonical location catalog available;
- aliases come only from authoritative catalog data or unambiguous full-name-safe derivation;
- no `다현`, `민지`, or other demo/fabricated replacement names;
- identity map remains finite and exact;
- do not import `src/engine`.

If direct JSON module loading is inconvenient in the Worker build, create a small v2 static-content loading layer from repository content, but do not copy the catalogs into another hand-maintained semantic list.

### 2.2 Restore the Company opening premise in clean-room form

Replace the generic deterministic Opening with a Company-specific Phase 1 opening contract.

The Opening must:

- feel like interactive fiction, not an assistant greeting;
- establish the company day/location and actual canonical active NPC(s);
- establish the player-private mysterious `상식개변` app premise described above;
- make clear by narrative implication that NPCs do not know the app and no rule has changed yet;
- leave the next action entirely to the player;
- emit no choices in Phase 1;
- never say or imply that the game is a productivity assistant or that an NPC is there to "help with your work" as an assistant service role;
- use registered character identity and canon.

Do not import old opening engine code. It is reference only.

### 2.3 Give Story the actual Company context

Extend the clean `buildStoryMessages()` payload/system contract so Story receives only the relevant Company canon needed for the current turn:

- edition title/identity;
- current canonical location name/description;
- current/present relevant registered actors with exact IDs and canonical names;
- relevant heroine prompt-card fields when a heroine is present/targeted;
- general NPC role/department facts when relevant;
- player name and the minimal existing Phase 1 player context;
- the player-private `상식개변` premise as background truth, while active CSA remains empty in Phase 1;
- recent raw turns + summaries as already designed.

Do not dump all private character data every turn. Use the public/behavioral character canon relevant to Story. Do not expose database/control metadata as world knowledge.

Literal player action remains authority. No action replacement, no invented player decisions, no hidden semantic retry.

### 2.4 Restore the game-shaped frontend shell without old coordinator authority

Rebuild `frontend-v2` presentation so it unmistakably presents `상식개변: 회사편`, using `src/frontend/pages/index.html` and presentation CSS as donor/reference where useful.

Binding rules:

- Story remains visually dominant.
- Real-time Story streaming must remain visible; no blocking loading overlay.
- Keep free-form input only; no choice generation/rendering in Phase 1.
- Restore game-oriented panels/labels/layout rather than generic chat/productivity UX.
- Show canonical character names instead of raw IDs where context provides them.
- Show canonical location names instead of raw location IDs where possible.
- Mind Monitor remains a game panel.
- Player state must read as character/game state, not chatbot account/profile state.
- A Company map presentation may be included from static canonical content, but it must not become a new client-owned navigation authority. Clicking may at most compose literal player input; sending remains explicit.
- A visible `상식개변` app/tool affordance may be present as PRODUCT IDENTITY, but Phase 1 must not fake functional CSA. If not yet enabled, keep it clearly non-mutating/locked for the current phase rather than silently implementing Phase 2.
- Deferred Image/TTS/feedback mechanics must not be reimplemented in this task. Presentation placeholders/disabled affordances are acceptable only if they improve product identity without making false functionality claims.
- Do not import or reuse old `src/frontend/pages/app.js` turn coordinator, pending-step state machine, Story→Extract→Commit progression, or recovery authority.
- `frontend-v2/app.js` stays a thin client for server-owned v2 context/turn/SSE.

### 2.5 Remove assistant/demo wording

Sweep the new v2 surface and prompts for generic assistant/demo phrasing that makes the product read like a work chatbot.

Examples to remove/rewrite include the current generic `첫 업무를 함께 확인`, `상황부터 함께 정리`, or any `무슨 업무를 도와드릴까요`-style assistant framing.

Do not overcorrect by turning every scene into exposition about the app. It is a company-life interactive-fiction game with the `상식개변` mechanic, not a tutorial chatbot.

## 3. Phase 1 boundaries that remain binding

Do NOT add in this source correction:

- active choices/provider choices/frontend choice list;
- CSA mutation endpoint or active CSA reducer;
- clothing mechanics;
- sexual gauges;
- relationship/event ledger;
- feedback revision;
- Image/TTS runtime;
- old v1 save compatibility;
- old frontend coordinator authority;
- hidden LLM retries/regeneration;
- model/provider changes;
- DB schema/RPC/migration changes.

This task restores PRODUCT IDENTITY + CANON + PRESENTATION while keeping the already accepted clean-room server-owned turn spine.

## 4. Tests / proof required

Add or update focused tests that prove at minimum:

1. v2 content adapter contains the authoritative five heroine IDs/names and eight general NPC IDs/names;
2. demo aliases/names `다현` and `민지` are absent from v2 product canon unless they actually appear in authoritative content (currently they do not);
3. v2 location adapter is sourced from canonical map and contains more than the two demo locations;
4. Opening contains the Company/`상식개변` product premise, uses a registered actor, produces `choices=[]`, and does not contain generic assistant-help framing;
5. Story message builder includes relevant canonical actor and location context while preserving literal action;
6. frontend product shell includes game title/story/MM/player/character/company-map or equivalent game presentation contracts;
7. frontend has no active Phase 1 choice list generation;
8. import-boundary test still proves `runtime-v2` does not import `src/engine` and `frontend-v2` does not import the old frontend coordinator;
9. existing focused v2 turn/SSE/reconnect/subrequest-budget tests still pass.

Run focused tests and full repository test suite if practical. No live LLM/manual multi-turn test in this source task.

## 5. Forbidden operations

- no DB writes;
- no migration edit/apply;
- no Worker deploy;
- no TEST game creation;
- no automated gameplay;
- no mutation/reset/delete/repair of any existing evidence game;
- no Production/hospital-v2 access;
- no provider/model/config/secret change;
- no auto-merge.

## 6. Completion report / stop boundary

Post one terminal report to Issue #68 with:

- `TASK_ID: company-v2-phase1-product-identity-shell-restoration-v1`
- `FINAL_SHA`
- Draft PR number
- changed files
- exact canonical content source used
- canonical heroine/general-NPC/location counts
- Opening premise summary
- Story-context fields added
- frontend shell elements restored
- proof old coordinator imports remain zero
- focused/full test results
- confirmation: DB writes 0, migrations 0, deploys 0, live gameplay 0

Then STOP for operator source review. Do not merge, deploy, or prepare another owner handoff automatically.
