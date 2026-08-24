# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-owner-style-browser-product-audit-v1
Mode: EVIDENCE-ONLY DEEP BROWSER PRODUCT REVIEW
Updated: 2026-08-24 19:20 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Owner report: the OWNER_TEST_PLAY_READY build is still substantially wrong; first collect a complete browser-verified product defect map before repairs.
Binding supporting comments:
- direct-turn audit addendum: Issue #68 comment `5393779396`
- owner CSA canon correction: Issue #68 comment `5393852242`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` path. Work on `main` only. Do not create another CURRENT_TASK path or branch.

## 0. Purpose — find what the previous green gate missed

This is NOT another critical-only seal and NOT a repair task.

Use the actual deployed browser like a real player, including the adult-oriented play style the product is designed for. Collect P0/P1/P2/P3 product defects, not only structural failures. Do not stop at the first defect and do not patch anything during this task.

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

Required:
- visible Setup only;
- visible textarea + visible submit for free input;
- native visible Story-choice clicks;
- visible History/CSA/feedback/map/state/TTS/media controls;
- normal refresh/re-entry;
- desktop plus approximately 390x844 mobile viewport;
- screenshots at important states and defect moments;
- console/network evidence while playing.

Forbidden as substitutes for product interaction:
- direct gameplay API calls;
- DOM mutation;
- internal submit calls;
- synthetic event dispatch;
- storage preseed;
- `?api=` override;
- direct DB mutation.

Read-only API/DB/context inspection AFTER a visible browser action is allowed only to locate the first broken boundary.

## 3. Owner correction — play this as an adult-oriented game

The previous campaigns were too polite, office-heavy, and QA-scripted. That is not representative of this product.

Create exactly TWO new disposable games with clearly adult profiles (prefer age 25+ so there is no ambiguity).

### Campaign A — junior / ordinary employee
- unique Korean name;
- normal department;
- intern/staff/assistant-level canonical rank;
- Opening + 15 ordinary turns.

### Campaign B — experienced / authority profile
- different unique Korean name;
- different department if practical;
- manager/executive-level canonical rank;
- Opening + 10 ordinary turns.

Both campaigns must behave like an actual adult player of an adult company-life character simulation, not a corporate task checklist.

Across the two campaigns, naturally include a meaningful mix of:
- ordinary social small talk unrelated to work;
- attraction/flirting or suggestive conversation with adult heroines;
- private curiosity about the CSA app;
- explicit adult/sexual requests or interactions when the scene and product permit them;
- escalation and de-escalation;
- refusal;
- changing one's mind;
- asking an ongoing conversation/contact/sexual interaction to stop or change;
- awkward/unusual but physically plausible adult behavior;
- direct heroine conversation;
- NPC-to-NPC multi-character scenes;
- movement between distinct locations;
- being alone / asking to be left alone;
- self-directed internal action;
- topic switching away from work;
- work context only as one part of life, not the mandatory objective;
- one map-assisted movement attempt;
- refresh/re-entry;
- History inspection after 8+ turns.

Do not make all adult turns identical escalation. Test both desire and boundaries. Do not retry a bad stochastic result; preserve it.

## 4. Owner correction — intended choice UI is NOT a defect

The following is intentional product behavior and MUST NOT be reported as a defect merely because it exists:
- the Story body may show the four full next-action choices;
- the bottom action bar separately shows compact 5-character choice buttons.

This is a two-layer design: full text for comprehension + short buttons for fast selection.

Only report a choice-UI defect if the intended design actually fails, for example:
- full text and button literal do not correspond;
- wrong action is sent;
- buttons are visually unusable/reordered/ambiguous in a way that prevents the user from mapping them to the full choices;
- mobile layout breaks the two-layer interaction.

Do not file `duplicate choices` or `5-character buttons exist` as defects by themselves.

## 5. Binding known-regression probes

Use these in fresh plausible contexts.

A. Target/topic fidelity:
`한리브 대리와 점심 메뉴에 대해 가볍게 이야기한다.`
Expected: actually interact with 한리브 about lunch; do not silently continue another NPC/work topic.

B. Alone/self-state fidelity:
`혼자 창가에 서서 오늘 아침의 낯선 앱에 대해 생각한다.`
Expected: player is alone unless a concrete world constraint prevents it; no unrelated NPC stays beside the player and speaks by inertia.

C. Movement/identity fidelity:
Navigate to a registered heroine, including 윤민아 when practical.
Expected: actual movement; no fabricated near-name NPC; no wrong speaker/voice attribution.

D. Refusal/change-of-mind:
Explicitly refuse an immediate action, then later choose something different.
Expected: refusal is not rewritten into compliance; later changed intent is respected.

E. Ongoing interaction interruption:
When Story establishes ongoing conversation/contact/sexual interaction, explicitly request it stop/change.
Expected: it can end/change unless an actual active CSA rule or physical condition prevents it; no invisible rail.

For each probe record literal input -> Story semantics -> observer raw/applied -> durable state -> next-turn continuity.

## 6. Binding CSA canon — institutional rule, not instant reality normalization

Owner comment `5393852242` is authoritative.

When APPLYing a CSA rule:
1. the private app causes the preset to become a newly issued official company rule/notice/policy (or the preset's defined institutional authority tier);
2. NPCs do NOT know the private app exists and do not sense a supernatural activation aura;
3. NPCs may notice the NEW rule and naturally react with surprise, confusion, embarrassment, disbelief, annoyance, awkwardness, questions, or resistance in attitude;
4. because the rule is now institutionally authoritative, scoped NPCs ultimately comply when it applies;
5. compliance does NOT automatically imply affection, comfort, sexual desire, consent-as-feeling, romance, trust, loyalty, or personality rewrite;
6. over subsequent turns, NPCs may gradually adapt/practicalize while keeping their individual personalities and emotions; this adaptation arc is part of the game's core appeal.

Therefore:
- `this has always been normal / nobody notices anything changed / memories were rewritten` is a canon violation unless a specific preset explicitly says so;
- surprise at a newly issued rule is allowed and often desirable;
- awareness of the private app or supernatural cause is wrong;
- emotional reluctance can coexist with institutional compliance;
- compliance must not be reinterpreted by Story/MM/player-thought as automatic desire or consent-as-feeling.

### Required CSA probes

1. Institutional-notice adaptation probe
- APPLY a visibly disruptive rule such as `work_nude` or another appropriate preset.
- On the application turn and following unrelated turns, inspect whether NPCs first recognize it as a new company rule/notice, react in-character, comply when applicable, and gradually adapt instead of instantly treating it as eternal common sense.

2. Rule 9 semantic-boundary probe
Preset meaning:
`상대방이 요청하면 상대방이 절정에 이를 때까지 현재 성적 행동을 계속해야 한다.`

Required distinction:
- if no sexual action is currently underway, the rule must NOT become authority to start any new sexual act merely because the player requests it;
- if a qualifying current sexual action is already underway and the request condition is met, the rule may require continuation according to the preset.

Do not solve or recommend a generic sexual-action DSL. Audit this preset's actual semantics and first broken boundary only.

3. Lifecycle probe
Through visible CSA app:
- APPLY naturally;
- play at least two unrelated turns;
- CHANGE;
- play an unrelated turn;
- REMOVE;
- play another unrelated turn;
- inspect stale effect residue and adaptation/withdrawal behavior.

## 7. Product-quality review — all severities count

### A. Player agency / player character authorship
Collect:
- actor/target/action/topic/refusal/self-state/movement/intent substitution;
- prior-scene inertia overriding the new literal;
- intent treated as guaranteed external success;
- invisible rails;
- **player_inner_thought inventing attraction, desire, consent interpretation, decisions, moral judgement, or emotional state the player never supplied.**

Player inner thought is part of player agency. Story can describe consequences; Observer cannot define the player's mind on its own.

### B. Story / character game feel
Collect:
- work-task dominance or meeting/report/checklist logic intruding into unrelated/social/sexual scenes;
- NPCs solving adult/emotional situations primarily through office scheduling logic;
- weak heroine differentiation;
- interchangeable exposition NPCs;
- assistant/OOC/protocol language;
- repeated scene reset;
- unsupported game/app mechanics;
- dead pacing, excessive exposition, unnatural dialogue;
- character database/profile tags leaking directly into prose (`생활형 리더`, `행동형 신입`, ages/traits recited as a dossier instead of shown through behavior);
- choices that are formally four but semantically all the same route/escalation.

### C. Continuity / world state
Collect wrong location, stale presence, stale scene_note, wrong speaker/identity, refresh disagreement, incoherent time, cross-game leakage.

### D. Mind Monitor
Audit both reliability and semantics:
- empty despite meaningful interaction;
- raw monitor generated but dropped because values use wrong schema (e.g. string instead of `{surface, subconscious}`);
- wrong target or too many irrelevant actors;
- action narration instead of first-person thought;
- generic/repetitive content;
- Story/MM contradiction;
- app/supernatural-cause awareness that violates CSA canon;
- invented desire/consent/comfort/personality rewrite;
- valid surprise/awkwardness at a new company rule must NOT be mislabeled as a defect by itself.

Record raw vs applied when MM is empty or suspicious.

### E. Presentation/UI
Judge real browser behavior:
- right-column density and hierarchy;
- technical wording leaking to players (`r3_*`, `revision`, `Commit`, retry jargon);
- current Story clearing before new stream and resulting reading experience;
- loading/status distraction;
- scroll/readability/action reachability;
- desktop vs 390x844;
- hospital/donor-shell visible mismatch;
- Story actual dialogue grammar vs donor dialogue-card parser: if Story uses ordinary novel lines such as narration followed by quoted speech instead of `화자명(지시): "대사"`, verify whether the intended dialogue cards/TTS projection fail in actual play.

Remember section 4: full choices + compact buttons are intentional.

## 8. Image catalog / media audit — newly mandatory

Read-only live catalog inspection already established this baseline for `edition_id=company-v1`, active rows:
- heroine1: general 1 / sex 13
- heroine2: general 1 / sex 21
- heroine3: general 1 / sex 20
- heroine4: general 1 / sex 22
- heroine5: general 1 / sex 21

All five `general` pools currently have only one generic portrait/situation each. This means normal company-life visual variety is effectively absent unless another image source exists.

Source-level wiring suspicion to verify in browser:
- `frontend-r3/media.js::projectR3Media()` currently sets `image_pool: 'general'` unconditionally;
- server `projectCurrentMedia()` accepts `sex` only when `sexualEvidence()` is true;
- current R3 Observer normalizer does not project a sexual-state field used by that gate.

Therefore the existing 97 active sex-pool rows may be unreachable from the actual current frontend/runtime path.

Required browser evidence:
1. ordinary heroine scenes: record which image changes, if any, across distinct situations;
2. adult/sexual heroine scenes: inspect network `/media/image` request pool and returned image_pool/image id;
3. verify whether a sex-pool image ever becomes visible through normal product interaction;
4. if always general, identify first broken boundary: frontend request, server gate, state evidence, selector, or catalog;
5. inspect whether wrong heroine, stale image, generic single portrait repetition, or missing image harms game feel.

Do NOT patch media in this task.

## 9. Media/TTS/feedback/history

Use naturally, never sample-until-pass:
- inspect image authority/usefulness per section 8;
- enable TTS once on an actually eligible committed heroine line if one occurs, then replay visibly;
- use feedback once on a clearly bad Story turn and judge the player-facing revision UX;
- inspect History after substantial play for chronology/readability and technical jargon.

## 10. Evidence standard per turn

For all 25 ordinary turns record:
- campaign/game id;
- turn number;
- exact visible literal and input type;
- one visible action activation;
- rendered Story text/screenshot;
- semantic judgement against literal intent;
- location/presence/focal actor;
- Mind Monitor visible result + raw/applied when needed;
- media image character/pool/image id or absence when relevant;
- console/network warnings;
- durable result;
- defect IDs.

For every defect record:
- severity P0/P1/P2/P3;
- domain;
- deterministic/repeated/single stochastic sample;
- first broken boundary: visible input -> Story -> observer -> reducer/durable state -> next Story/UI;
- user-visible impact;
- why prior live QA missed it.

Do not count `turn committed`, `choices.length===4`, or DB readback alone as product green.

## 11. Mandatory false-green explanation

Final report must explicitly answer:
1. which previous tests were truly browser-driven;
2. which were structural/happy-path only;
3. which defect classes the critical-only policy excluded;
4. how little the final 4-turn smoke covered;
5. how office-heavy scripted literals biased Story toward coherent-looking work narration;
6. how commit/network assertions created false confidence;
7. which defects need actual visual/adult-play judgement;
8. why previous automation did not behave like an adult player;
9. what permanent live-QA matrix should replace the old criterion.

## 12. No repair

Do NOT edit runtime/frontend/content/prompt/tests, deploy, change provider/model/settings, change DB/schema/migrations, mutate preserved fixtures, or stop after the first severe issue.

Collect the complete product-defect map first.

## 13. Completion report / terminal

Post a NEW Issue #68 terminal containing:
- start/final main + CURRENT_TASK blob;
- source/deploy identities;
- two fresh game IDs/profiles;
- 25-turn matrix;
- screenshots/evidence refs;
- full defect ledger sorted by user impact;
- adult-play coverage summary;
- known-regression results;
- CSA institutional-rule/adaptation results;
- rule-9 semantic-boundary result;
- player-inner-thought agency findings;
- MM raw/applied reliability findings;
- image catalog and general-vs-sex runtime wiring findings;
- Story/character/work-bias findings;
- UI/TTS/feedback/history findings;
- false-green explanation;
- smallest recommended repair order, but NO implementation;
- source edits = 0; deploys = 0.

Then overwrite this SAME file to `Status: WAITING_REVIEW` and STOP.

Terminal:
`PRODUCT_AUDIT_COMPLETE_AWAITING_OPERATOR_REVIEW`
