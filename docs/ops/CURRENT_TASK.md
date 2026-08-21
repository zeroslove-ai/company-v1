# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-autonomous-live-closure-v1
Mode: IMPLEMENT / DEPLOY / AUTONOMOUS REAL-BROWSER TEST / OWNER-HANDOFF ONLY AFTER PRODUCT-SAFE PASS
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. This task supersedes the previous owner Live Gate L1 handoff. Do not ask the owner to test another build until the autonomous gates below actually pass.

## 0. OWNER OVERRIDE / WHY THIS TASK EXISTS

The previous handoff was invalid. The owner opened the canonical R3 frontend on a real mobile browser and the product never advanced beyond the full-screen boot fallback card:

`상식개변: 회사편 / 게임 화면을 불러오는 중입니다.`

This is a product-blocking failure that static HTTP/root-document checks did not detect.

Source inspection already proves two concrete frontend defects on current main:

1. `frontend-r3/app.js` never hides or dismisses `#boot-fallback` after successful JavaScript/API boot. The fallback can therefore remain above the actual game indefinitely.
2. after Setup, `history.replaceState(null, '', '?game_id=...')` drops the existing `api=` query parameter. A subsequent refresh can therefore fall back to same-origin `/api/r3` on the frontend Worker and lose the accepted R3 API origin.

Treat these as confirmed source defects, not speculative UX observations.

Owner direction now overrides the prior manual-first stopping boundary:

- automation/Codex MUST be able to create disposable fresh R3 TEST games;
- automation/Codex MUST exercise Setup, Opening, ordinary turns, refresh/reload and the actual deployed frontend in a real browser or headless browser;
- a served HTML document / HTTP 200 / static DOM grep is NOT acceptance;
- do not hand the build to the owner until the product has passed autonomous end-to-end play;
- implement as much of the already-approved Company redesign canon as possible before returning to the owner;
- do not invent new product behavior. Follow the binding canon below.

The owner remains the final product-quality judge, but should no longer be used as the first smoke tester for basic boot, routing, Setup, persistence, or turn execution.

## 1. BINDING AUTHORITY

Obey in this order:

1. PR #95 Product-first Company redesign canon, owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine / live-first canon at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. all `docs/redesign/00_*` through `11_*`, especially Product Constitution, Executable Acceptance, Golden UI/Content, State/Memory, CSA MVP, Company v1 Salvage Matrix, A-prime architecture, Live Acceptance Policy, and Target Gap Matrix;
4. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
5. accepted R3 source already merged on main through PR #97, #98, #99 and #100.

Implement only OWNER_LOCKED and RETAIN_BY_DEFAULT product behavior. Do not implement historical UNSELECTED_CANDIDATE semantics merely because old code/tests exist. OPEN_DECISION items may be skipped unless current canon already resolves them.

Core non-negotiables:

- literal player agency;
- Company canon / registered actor identity;
- private `상식개변` app premise;
- natural Story-first play;
- exactly four current Story-authored choices when valid + free input always available;
- one server-owned Story -> one Observer -> minimal reducer -> atomic Commit flow;
- observer fail-open; no second Story generation repair loop;
- bounded `scene_note` physical continuity;
- no dynamic player arousal/erection/ejaculation gameplay meter;
- no generic physical/relationship/action-success ontology reintroduced as a prerequisite;
- Company v1 high-parity presentation rather than `frontend-v2` substitution;
- preserved historical/manual/evidence games remain immutable.

## 2. OPERATING MODEL — STOP MICRO-HANDOFFS

Do not stop after every one-line bug fix for owner review.

Within this task, Codex may iteratively:

1. inspect source;
2. add a narrow regression where useful;
3. fix source;
4. run focused CI;
5. merge reviewed self-contained fixes to the task branch/main according to repository workflow;
6. deploy only R3 TEST API/frontend;
7. create fresh disposable R3 TEST fixtures;
8. run real browser/headless-browser E2E and API/DB evidence checks;
9. inspect failures;
10. fix and repeat;

until the Owner-Ready Gate in section 8 passes or a genuine product/architecture decision is required.

Do not use retries or deterministic narrative rewriting to hide Story/provider defects. Infrastructure retries may be used only where already accepted by A-prime recovery semantics.

## 3. FIRST REQUIRED FIX — REAL FRONTEND BOOT LIFECYCLE

Fix the confirmed boot lifecycle before broader work.

Required behavior:

- before JS initializes, the fallback may be visible as a true no-JS/network fallback;
- after module load + critical catalog/API boot succeeds, `#boot-fallback` MUST be removed/hidden and the real UI MUST become interactable;
- if boot fails, the fallback may remain, but it must show the actual bounded error/recovery message instead of falsely saying only `게임 화면을 불러오는 중입니다.` forever;
- Setup overlay must be visibly reachable on a fresh no-`game_id` URL;
- the game shell must not be permanently obscured by a loading/fallback layer;
- Story streaming loaders must never cover the Story surface.

Add a regression that would fail with the current never-dismissed fallback.

Also fix accepted API-origin persistence:

- preserve the authorized `api=` origin when adding `game_id` to browser history;
- refresh/reload after Setup or committed turns must reconnect to the same R3 API and same game;
- do not hardcode an unrelated v1/v2 origin;
- make malformed/non-JSON request failures surface a readable bounded frontend error rather than an opaque permanent loading card where practical.

## 4. AUTONOMOUS BROWSER HARNESS IS NOW REQUIRED

Create or adopt a repeatable real-browser/headless-browser R3 TEST harness.

Preferred: Playwright with Chromium using the deployed Worker URL. If the repository does not currently include it, adding a small dev-only browser-test dependency/config is authorized. An already-installed Chrome/Chromium automation path is also acceptable.

A jsdom/static HTML grep alone is insufficient for the browser acceptance gate.

The harness must be able to:

- open the exact deployed `gamebuilder-company-r3` URL with the accepted `api=` origin;
- execute real page JavaScript/modules;
- detect uncaught page errors and failed network requests;
- assert `#boot-fallback` no longer blocks the page after successful boot;
- verify Setup controls are visible and usable;
- submit a codepoint-safe Korean profile through the browser UI;
- observe resulting `game_id` and preserved `api=` origin;
- observe Opening through the real Story surface;
- click a current choice by its full literal value;
- submit free-form literal Korean input;
- wait for visible Story streaming/terminal commit;
- refresh the page and prove context/readback recovery;
- run at desktop and at least one mobile-sized viewport comparable to the owner screenshot;
- save screenshots/logs on failure for diagnosis.

Browser E2E may create disposable `company_r3_*` TEST games. Mark/record those game IDs as automation fixtures. Never use preserved evidence/manual games.

## 5. AUTONOMOUS PRODUCT CLOSURE — IMPLEMENT APPROVED CUTS, NOT JUST BOOT

After the boot/router fix, continue through the already-approved redesign rather than immediately handing back to the owner.

### Phase A — Core ordinary play closure

Prove in deployed TEST through real UI:

- fresh Setup;
- Opening;
- at least 10 ordinary committed turns, not merely 1–2 smoke turns;
- both Story-authored choice clicks and free input;
- literal action is preserved into committed turn evidence;
- no fabricated/crossed canonical actor identity;
- multi-NPC scene where naturally reachable;
- move/location change;
- mention an off-scene registered NPC by name without auto-spawning/fuzzy replacement;
- `scene_note` retains immediate pose/contact/object facts across follow-ups where Story supports them;
- Mind Monitor contains only relevant actors and can fail empty without invalidating Story;
- exactly four fresh choices when valid, never stale prior-turn fallback;
- Story visibly streams before commit;
- no blocking loader over Story;
- refresh after at least one committed turn restores canonical context;
- duplicate/double-submit and stale attempt cannot double-commit;
- observer failure path, if cheaply injectable/testable, commits valid Story fail-open.

Fix concrete failures found here using the minimal A-prime model. Do not create speculative semantic machinery.

### Phase B — 9-rule CSA MVP

Once ordinary play is stable, implement the owner-locked nine-rule CSA MVP from `07_CSA_MVP_CATALOG.md` and current state model.

Requirements:

- exactly the 9 accepted template IDs initially;
- finite flexible subject/counterparty scope as canon defines;
- apply/change/remove is a non-Story system transaction;
- CSA transaction updates state revision but does NOT consume a gameplay turn;
- exact four-slot clothing mechanic where relevant;
- active premise and selected scope are projected literally into subsequent Story context;
- no automatic affection/comfort/consent/desire/trust/obedience side effects;
- no old 44-rule unlock/level/EXP system;
- no generic execution DSL.

Autonomously live-test all nine rules with representative coherent scopes on disposable TEST fixtures. Verify apply and remove, zero fake Story turns, and subsequent narrative continuity.

### Phase C — retained donor sidecars that require no new product decision

After core + CSA pass, restore/finish RETAIN_BY_DEFAULT donor functionality where current redesign docs already define the direction and no new product decision is required:

- history/readback/download;
- feedback/revision flow;
- TTS on/off/replay as a non-blocking sidecar;
- image/media presentation if an already-accepted source/binding exists;
- visible CSA modal/tabs/forms around the new 9-rule semantics.

Sidecars must never own gameplay truth and must never block Story commit/streaming. If a sidecar requires a new provider/secret/product decision not already authorized, record it as the only skipped item rather than inventing a design.

## 6. TEST POLICY — SMALL CI + STRONG LIVE E2E

Do not preserve obsolete legacy test count as a goal.

Keep/add automated tests only for high-value invariants and reproduced real defects, including at minimum:

- frontend boot fallback lifecycle;
- API-origin + game_id URL persistence/reload;
- literal action / stale-attempt fencing / atomic commit;
- observer fail-open + evidence-bound structural mutations;
- no stale-choice reuse;
- 9-rule CSA scope/turn-neutral transaction;
- any exact live defect found during the autonomous 10-turn run.

Old tests protecting removed v1/v2 orchestration, 44-rule CSA, removed meters, obsolete parser/wire contracts, or raw test-count parity may be removed or excluded when they obstruct the accepted R3 design.

The primary pre-owner gate is now:

`small structural CI green + deployed real-browser E2E green + disposable live game evidence green`.

## 7. SAFETY / ALLOWED TEST WRITES

Allowed:

- source changes needed to satisfy accepted Company R3 canon;
- focused tests and browser harness;
- R3 TEST Worker deploys;
- additive R3 TEST migrations required by already-approved features such as 9-rule CSA, after source review within this task;
- creation/play/reset/deletion of clearly recorded disposable automation R3 TEST fixtures only;
- read-only inspection of those automation fixtures.

Forbidden:

- Production deployment or Production DB mutation;
- mutation/reset/delete/replay of any historical v1/v2/manual/QA/evidence game;
- mutation of accepted L0 evidence game `10984458-7a23-47ac-9ec0-bb13753ea85a`;
- mutation of failed evidence game `80095cdd-c901-4370-8387-66dcb756b72a`;
- reusing old hospital/v1/v2 save data as writable test fixtures;
- provider/model/temperature/token/secret changes merely to force tests to pass;
- broad semantic validators or second-Story auto-repair loops;
- historical non-MVP CSA rules;
- reintroduction of removed player sexual meters;
- standalone NPC search/find feature previously removed by owner.

## 8. OWNER-READY GATE — DO NOT HAND OFF BEFORE THIS

Do not tell the owner to test again until all applicable items below are green:

1. deployed frontend executes JavaScript in real browser and boot fallback disappears;
2. mobile-sized viewport reaches Setup without manual console intervention;
3. browser Setup succeeds with Korean profile;
4. URL keeps accepted `api=` origin and gains `game_id` safely;
5. refresh restores the same game;
6. Opening is correct Company/private-app canon and preserves pre-input agency;
7. autonomous ordinary-play fixture completes at least 10 committed turns;
8. both free input and current Story choices work literally;
9. Story streaming is visibly incremental and not covered by a blocking loader;
10. four fresh choices / no stale-choice fallback behaves correctly;
11. registered identity/location/scene_note/MM basic continuity survives the run;
12. duplicate/reload/recovery basics do not corrupt or double-commit;
13. the 9 CSA MVP rules are implemented and autonomously live-tested unless a concrete canon-blocking dependency is documented;
14. RETAIN_BY_DEFAULT sidecars that require no unresolved decision are restored/tested;
15. desktop + mobile screenshots of the actual deployed product show the high-parity Company v1 shell rather than a fallback/error page;
16. no preserved/manual evidence game was mutated.

If one item fails, continue fixing and retesting inside this task. Do not convert a known failure into an owner acceptance request.

## 9. TERMINAL REPORT

Only after section 8 passes, post to Issue #68:

`COMPANY_FULL_REDESIGN_AUTONOMOUS_OWNER_READY`

Status: `WAITING_USER_FINAL_PLAYTEST`

Include:

- final main/source SHA(s) and merged PRs;
- API/frontend Worker versions and exact owner URL;
- exact disposable automation game IDs and turn counts;
- real-browser desktop/mobile E2E results;
- boot fallback/router/refresh defect fixes;
- ordinary 10+ turn findings;
- CSA 9-rule live-test matrix;
- retained sidecars implemented vs any explicitly blocked/skipped items;
- focused CI results;
- screenshots/log artifact locations if available;
- confirmation preserved games untouched;
- concise remaining known limitations only.

Then and only then ask the owner for the final manual product-quality playtest.
