# Company — CURRENT TASK

Status: READY
Task ID: company-r3-owner-style-browser-product-audit-v1
Mode: EVIDENCE-ONLY DEEP BROWSER PRODUCT REVIEW
Updated: 2026-08-24 18:54 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Owner request: user reported the OWNER_TEST_PLAY_READY build is still substantially wrong and requested an independent product review before supplying their own defect list.
Previous accepted terminal: Issue #68 comment `5393222222`
Previous owner-manual gate commit: `c37e5021fe9364cc2913e85676f89f23c94d3d97`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` path. Work on `main` only. Do not create another CURRENT_TASK path or branch.

## 0. Purpose — find what the previous green gate missed

This is NOT another critical-only seal and NOT a repair task.

The previous final smoke proved only that the build was playable at a narrow P0/P1 level. The owner has now reported that the actual product is still substantially wrong. The purpose of this task is to use the real deployed browser UI like a player, collect a broad product-defect corpus, and explain why the prior live QA did not expose it.

Do not stop at the first defect. Do not patch anything. Complete the full review matrix first.

Target terminal:
`PRODUCT_AUDIT_COMPLETE_AWAITING_OPERATOR_REVIEW`

## 1. Frozen build — no changes

Accepted executable/source remains READ ONLY:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

TEST deployments:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- legacy worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`
- public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Rules:
- source edits = 0
- deploys = 0
- DB writes outside normal visible gameplay = 0
- no migration/RPC/schema/RLS/grant changes
- no provider/model/prompt/token/timeout changes
- no retry/regeneration/sample-until-pass
- no Production

## 2. Browser requirement — actual product interaction only

The review MUST be driven through an actual browser against the bare public frontend.

Required interaction rules:
- create games through visible Setup;
- type free input into the visible textarea and submit through the visible control;
- activate Story choices through native visible clicks;
- open/close History, CSA app, feedback, map, state panels, TTS/media controls through visible UI only;
- refresh/re-enter through the browser normally;
- use desktop plus approximately 390x844 mobile viewport;
- capture screenshots at important states and defect moments;
- collect console/network evidence while playing.

Forbidden as a substitute for product interaction:
- direct gameplay API calls;
- DOM mutation to force state;
- internal submit calls;
- synthetic event dispatch;
- storage preseed;
- `?api=` override;
- direct DB mutation.

Read-only API/DB/context inspection AFTER a visible browser action is allowed only to locate the first broken boundary.

## 3. Two independent owner-style campaigns

Create exactly TWO new disposable games. Do not reuse V5 or the previous 4-turn smoke as the active play surface.

### Campaign A — junior / ordinary employee
- unique Korean name
- normal department
- intern/staff/assistant-level canonical rank
- Opening + 15 ordinary turns

### Campaign B — experienced / authority profile
- different unique Korean name
- different department if practical
- manager/executive-level canonical rank
- Opening + 10 ordinary turns

The two campaigns must not be scripted as office-task checklists. Play them as an adult company-life character simulation.

Across the two campaigns cover:
- social small talk unrelated to work;
- direct heroine conversation;
- NPC-to-NPC multi-character scene;
- work context without making work the mandatory objective;
- movement between distinct locations;
- being alone / asking to be left alone;
- refusal;
- changing one's mind;
- self-directed internal action;
- topic switch away from the prior subject;
- asking for an ongoing interaction to stop/change;
- one awkward/unusual but physically plausible action;
- one map-assisted movement attempt through visible UI;
- refresh/re-entry after several turns;
- History inspection after 8+ turns.

Do not retry a bad stochastic result. Preserve it.

## 4. Binding known-regression probes

Use these semantics in fresh context where they make sense. Do not merely paste them mechanically if an actor is absent; first navigate naturally to a plausible context.

A. Target/topic fidelity:
`한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.`
Expected: interaction is actually with 한리브 and about lunch; Story must not silently continue a different NPC/work topic.

B. Alone/self-state fidelity:
`혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`
Expected: player is alone unless a concrete world constraint prevents it; no unrelated NPC should remain beside the player and continue speaking by inertia.

C. Movement/identity fidelity:
Choose a registered heroine destination through natural play, including 윤민아 when practical.
Expected: movement actually occurs; no fabricated near-name NPC; no wrong speaker name/voice attribution.

D. Refusal/change-of-mind:
Explicitly refuse a proposed immediate action, then later choose a different action.
Expected: refusal is not rewritten into compliance and the new action is respected.

E. Ongoing interaction interruption:
If the Story establishes an ongoing posture/contact/conversation, explicitly ask to stop/change it.
Expected: it can end/change unless an actual active rule or physical condition prevents it; Story must not impose invisible rails.

For every probe record literal input, full Story semantic outcome, structured observer outcome, durable next-state effect, and next-turn continuity.

## 5. Product-quality review — P0/P1/P2/P3 ALL count

Unlike the previous critical-only task, do NOT defer product-quality defects merely because the game still commits turns.

Classify and collect ALL of the following:

### A. Player agency / semantic fidelity
- actor/target/action/topic/refusal/self-state/movement/intent substitution;
- intent treated as already-successful external fact;
- prior scene inertia overriding the new literal;
- invisible rails on ongoing interactions.

### B. Story quality / game feel
- work-task dominance;
- assistant/OOC/protocol language;
- repetitive office briefing/report/checklist loops;
- NPCs with no initiative/personality;
- NPCs behaving as interchangeable exposition devices;
- weak heroine differentiation;
- repeated scene reset;
- invented unsupported app/game mechanics;
- unnatural dialogue, excessive exposition, or dead pacing;
- choices that are dull, redundant, overcommitted, or unrelated to the Story.

### C. Continuity / world state
- wrong location;
- stale presence;
- stale scene_note;
- wrong speaker/identity;
- current Story vs History disagreement;
- refresh changing the perceived scene;
- time progression that feels incoherent;
- cross-game leakage.

### D. Mind Monitor / character presentation
- empty despite meaningful heroine interaction;
- stale from a previous scene;
- wrong target;
- generic/unhelpful content;
- visible panel occupying prime space while repeatedly empty;
- mismatch with Story dialogue/behavior.

### E. UI/UX / immersion
Judge actual visual behavior, not only reachability.
Specifically inspect:
- whether full choices are visibly duplicated in narrative and action controls;
- whether 5-character choice buttons are understandable in real play;
- whether the right column is overloaded by media + Mind Monitor + character state + player state + map + CSA tools;
- whether technical implementation wording leaks to players (`r3_*`, `revision`, `Commit`, retry/error jargon, etc.);
- whether Story disappears/clears in a jarring way while the next Story begins streaming;
- whether loading/status UI distracts from streamed narrative;
- readability, spacing, hierarchy, scroll behavior, and action reachability;
- desktop and 390x844 separately;
- whether donor-shell/hospital-derived presentation leaves visible mismatched UX conventions.

Do not assume any of these are defects from source alone. Prove or reject each in the browser and attach evidence.

### F. CSA product behavior
Through visible CSA app:
- inspect discoverability and comprehension;
- APPLY one rule naturally;
- play at least two unrelated turns and judge whether Story actually reflects the active rule when relevant without making every turn about it;
- CHANGE it;
- play an unrelated turn;
- REMOVE it;
- play another unrelated turn;
- check for stale effect residue;
- judge whether the actual experience feels like a private reality-altering app rather than a debug form/quest mechanic.

### G. Media/TTS/feedback/history
Use naturally rather than sampling until favorable:
- if a registered heroine is grounded, inspect image authority and usefulness;
- enable TTS once on an actually eligible committed heroine line if one occurs, then replay visibly;
- use feedback once on a clearly bad Story turn and inspect whether the revision UX is understandable to a player;
- inspect History with a substantial session and judge chronology/readability, not merely correctness.

## 6. Evidence standard per turn

For all 25 ordinary turns record at minimum:
- campaign/game id;
- turn number;
- exact visible literal and whether free/native/CSA/map/etc.;
- one visible action activation;
- Story screenshot or captured rendered text;
- short semantic judgement against literal intent;
- selected location/presence/focal actor/Mind Monitor outcome;
- relevant console/network warnings;
- durable turn result;
- defect IDs triggered on that turn.

For every actual defect assign:
- severity: P0/P1/P2/P3;
- domain: agency/story/continuity/UI/MM/CSA/media/TTS/history/feedback/performance;
- reproducibility: deterministic / repeated / single stochastic sample;
- first broken boundary: visible input -> Story -> observer -> reducer/durable state -> next Story/UI;
- user-visible impact;
- whether it was detectable by the previous V5/critical-smoke matrix and WHY it was missed.

## 7. Mandatory explanation of the previous false-green

The final report must explicitly answer:
1. Which previous live tests were genuinely browser-driven?
2. Which were merely structural/happy-path checks?
3. Which defect classes were excluded by the critical-only P0/P1 severity policy?
4. How much did the 4-turn junior smoke actually cover?
5. Did scripted literals and office-heavy scenarios bias the campaign toward apparently coherent work narration?
6. Did exact commit/network assertions create a false sense of product quality?
7. Which defects require visual/browser judgement and cannot be validated from DB/tests alone?
8. What permanent live-QA matrix should replace the prior green criterion?

Do not call the build owner-ready merely because turns commit.

## 8. No repair in this task

This task is evidence collection and product review only.

Do NOT:
- edit runtime/frontend/content/prompt/tests;
- deploy;
- change provider/model/settings;
- change DB/schema/migrations;
- reset/mutate preserved fixtures;
- fix defects during the campaign;
- stop after finding the first severe defect.

The point is to obtain the complete defect picture before deciding repair order with the owner.

## 9. Completion report / terminal

Post a NEW Issue #68 terminal containing:
- start/final main and CURRENT_TASK blob;
- source/deploy identities;
- two fresh game IDs and profiles;
- 25-turn campaign matrix;
- screenshots/evidence references;
- full defect ledger sorted by severity and user impact;
- explicit browser-verified results for all source-suspicion checks in section 5E;
- known-regression probe results;
- Story/game-feel findings;
- CSA/media/TTS/feedback/history findings;
- explanation of why previous live QA reached false-green;
- recommended repair order, but NO implementation;
- source edits = 0; deploys = 0.

Then overwrite this SAME file to:
- `Status: WAITING_REVIEW`

Terminal:
`PRODUCT_AUDIT_COMPLETE_AWAITING_OPERATOR_REVIEW`

STOP. Do not create a repair task yourself. The operator will review the evidence and compare it with the owner's own feedback before registering repairs.