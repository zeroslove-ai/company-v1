# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-high-parity-csa-app-draft-ui-v1
Mode: PORT DONOR CSA PRESENTATION/DRAFT UX -> PRESERVE R3 SINGLE-OP CHRONOLOGY -> DEPLOY FRONTEND TEST -> LIVE CSA UX ACCEPTANCE
Updated: 2026-08-23 22:39 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386083733`
Operator review: Issue #68 comment `5386104461`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Accepted executable/source baseline after the previous GREEN cut:
- `2a3611f5de3906d7c797259173fa0d5ed19977d0`

Current main before this registration is a source/test/docs descendant with no unreviewed executable drift:
- `ad0ca902c9c7d133e42329d6db2c7db5f56ac9d2`

Current TEST artifacts:
- API `game-proxy-company-r3` version `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`
- Frontend `gamebuilder-company-r3` version `e139f60f-00b6-49ed-891b-070dd2143f57`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN unless direct contradictory product evidence appears:
- first-day / first-arrival Opening for low and high/executive ranks while preserving selected department/rank;
- private `상식개변` app is unfamiliar/private/optional and never forced by Opening;
- committed player-inner-thought pipeline and visible player panel;
- character-specific first-person NPC Mind Monitor direction;
- exact player agency/navigation and choice-button dispatch;
- supported Story choice-tail formats including blank-line-separated terminal 1–4 choices;
- chronological CSA APPLY/CHANGE/REMOVE, each as exactly one normal Story turn;
- ordinary post-CSA continuation with no stale `csa_operation`;
- refresh/re-entry reconstruction and ~390x844 mobile reachability from prior acceptance.

Do not reopen Story/Observer/runtime choice semantics in this task. Do not change provider/model/config, R3 server turn kernel, content catalog semantics, migrations, reset behavior, image/TTS or timeline/history presentation.

## 1. Product gap and donor authority

Current R3 gap:
- `frontend-r3/csa.js` uses the correct R3 chronological operation path, but presents a crude immediate list of active rules and all inactive presets.
- edits are effectively coupled to the immediate APPLY/CHANGE/REMOVE control rather than a high-parity local draft experience;
- most of the existing modal shell in `frontend-r3/index.html` is unused: Home / 플레이어 정보 / NPC 정보 / 상식개변 / 매뉴얼 tabs and `#csa-app-draft-bar` already exist.

Approved presentation/interaction donors are read-only references:
- `src/frontend/pages/csa-app.js`
- `src/frontend/pages/csa-app-state.js`
- `src/frontend/pages/csa-product-ui.js`

The donor demonstrates:
- five-tab app navigation;
- local draft editing;
- dirty-count bar;
- undo/revert;
- unsaved-close protection;
- richer player/NPC/status presentation;
- mobile modal lifecycle and focus/scroll behavior.

The donor is NOT runtime authority. Do not revive any legacy API or mutation semantics from it.

R3 remains authoritative for:
- bounded 9-rule preset catalog only;
- current R3 context/state as server truth;
- one structured `csa_operation` per normal `/turn` request;
- one APPLY, CHANGE or REMOVE = exactly one streamed Story/Observer/commit turn;
- no zero-turn CSA state writer from the visible app.

## 2. Required high-parity R3 app UX

### A. Modal lifecycle

Use the existing R3 modal shell.

Require:
- open from `📱 상식개변 앱`;
- functional Home / 플레이어 정보 / NPC 정보 / 상식개변 / 매뉴얼 tabs;
- close button, Escape and backdrop use the same close guard;
- while open, background/body scrolling is appropriately contained;
- on clean close, focus returns to the opener when practical;
- applying a real operation must close/yield the overlay before the normal Story turn starts so the modal cannot intercept gameplay controls.

Do not create a second modal architecture if the existing shell can be used.

### B. Five tabs, R3 data only

Home:
- show only meaningful values that actually exist in current R3 context/catalog, such as current game/turn/time and active-rule count;
- provide a clear route to the CSA-management tab;
- do not fabricate level/EXP/unlock values if R3 does not expose them.

플레이어 정보:
- show available committed setup/profile/current player values already present in R3 context;
- omit unavailable fields rather than inventing them.

NPC 정보:
- show known/current R3 characters from available committed context/content;
- indicate current-scene presence when known;
- show current committed Mind Monitor only when actually available for that NPC;
- do not infer hidden mind, location or state that server context does not provide.

상식개변:
- show currently active R3 rules clearly;
- show the bounded nine preset rules with human-readable label/content/strength/category information supplied by the existing catalog;
- expose only scopes/counterparty scopes allowed by the chosen preset;
- provide a readable completed-rule preview from catalog data where possible;
- do not expose custom/freeform rule creation.

매뉴얼:
- explain the current R3 product truth, not the donor legacy truth:
  - only the current nine presets are available;
  - editing is local until explicit Apply;
  - each Apply/Change/Remove consumes exactly one Story turn;
  - unrelated later play remains ordinary gameplay;
  - the app is optional and never required by the game.

### C. Single-operation local draft contract

R3 does NOT support the donor's multi-operation batch transaction. Implement a single pending operation draft.

Require:
- at most one distinct staged operation at a time;
- selecting a preset, changing an active rule's allowed scope/counterparty, or marking a rule for removal changes local draft state only;
- while dirty, no `/turn` POST, no state revision change, no committed-turn change and no canonical CSA mutation may occur;
- dirty bar shows `미적용 변경 1건` plus an explicit revert/undo control and an explicit Apply control;
- revert restores the draft from the current committed R3 context and returns to clean state;
- attempting to start a second distinct rule edit while one operation is dirty must show a bounded in-app notice requiring the current change to be applied or reverted first;
- never silently batch, auto-apply or silently discard the first edit.

Removal UX:
- selecting remove/deactivate first marks the rule locally as `해제 예정` or equivalent;
- server state remains active until explicit Apply;
- revert cancels the pending removal with no server mutation.

### D. Unsaved-close protection

When clean:
- close / Escape / backdrop closes without a discard prompt.

When dirty:
- all close paths must ask whether to discard the one unapplied change;
- Cancel keeps the modal open and preserves the exact staged draft;
- Confirm discards the draft and closes;
- no network/gameplay request may be sent by either close outcome.

Use a browser-native confirm only if it remains reliable in the deployed UI; an existing bounded in-app confirmation is also acceptable. Do not add a new global modal framework.

### E. Apply handoff — preserve R3 chronology

Map the one staged draft to exactly one existing R3 operation shape:

Activate:
`{ operation: 'activate', template_id, subject_scope, counterparty_scope }`

Update:
`{ operation: 'update', id, template_id, subject_scope, counterparty_scope }`

Deactivate:
`{ operation: 'deactivate', id, template_id, subject_scope }`

Requirements:
- exactly one `onOperation` handoff per user Apply;
- use the existing `submit()` / `client.turn()` / SSE / reconciliation path as the sole transport;
- no direct legacy `/csa`, `/api/app-state`, `/api/app-validate`, app transaction or second fetch path;
- no sequential multi-turn auto-apply from one click;
- busy state disables Apply/edit controls and fences duplicate submission;
- the overlay must stop intercepting clicks before the Story turn dispatches.

If the CSA UI needs to know whether the existing submit path committed/recovered-committed versus failed/not-sent, `frontend-r3/app.js` may gain the smallest Promise/boolean result plumbing around that SAME existing submit/reconciliation path. Do not duplicate transport logic.

After successful commit:
- local draft clears/rebases from the newly committed context;
- reopening reflects the committed active rule exactly.

After true failure/not-sent:
- do not claim success;
- prior committed server state remains canonical;
- show a useful bounded error;
- keep the staged draft available for user correction/manual retry if that is the smallest safe behavior;
- never automatically resubmit.

### F. Player-visible literal

The current R3 CSA helper may replace the English `Apply/Change/Remove ... for ...` copy with deterministic natural Korean app-action text, provided structured semantics are unchanged.

Requirements:
- use catalog labels instead of raw IDs where possible;
- the literal must clearly represent the exact app action and selected scope;
- exact literal is submitted only when the user presses Apply;
- no hidden extra action or narrative decision is added.

## 3. Hard architecture boundaries

This is a frontend high-parity cut.

Expected changed scope is limited to:
- `frontend-r3/csa.js`;
- optionally one new small pure frontend-r3 draft-state helper if it materially improves deterministic testing;
- `frontend-r3/app.js` only for minimal existing-submit completion plumbing if proven necessary;
- existing `frontend-r3/index.html` / CSS only for small missing hooks or parity styling that cannot be achieved with the current donor-lineage shell;
- R3 frontend/CSA tests.

Do NOT:
- change `runtime-r3/**`;
- change R3 API routes or turn semantics;
- change `content/csa_presets.json` or catalog semantics;
- import/execute legacy `src/frontend/pages/*` code in production R3; use it only as a donor reference;
- call legacy `/api/app-state`, `/api/app-validate` or zero-turn `/csa` mutation paths;
- add multi-operation app transactions;
- add custom/freeform CSA authoring;
- add automatic retry/regeneration;
- change provider/model/temperature/token/timeout/config;
- add DB migration/schema/RLS/grant changes;
- touch reset, timeline/history residue, media/image, TTS, Production, or owner/preserved games.

## 4. Deterministic regressions required

At minimum add/maintain tests proving:
1. five tabs are reachable and render meaningful R3-shaped data without legacy API calls;
2. a local Activate draft produces zero `onOperation` calls before Apply;
3. changing allowed scope/counterparty for an active rule produces zero handoff before Apply;
4. pending Remove produces zero handoff before Apply and renders as pending removal;
5. dirty bar is exactly one pending change and Revert returns clean state;
6. dirty close Cancel preserves the draft and open modal;
7. dirty close Confirm discards and closes with zero operation calls;
8. attempting a second distinct edit while dirty does not batch or replace the first silently;
9. Apply emits exactly one structured Activate operation and one exact Korean literal;
10. Change emits exactly one structured Update operation;
11. Remove emits exactly one structured Deactivate operation;
12. busy/applying state disables/fences duplicate operation submission;
13. successful operation rebase/reopen reflects committed state without stale draft;
14. failure/not-sent does not present the operation as applied and does not auto-resubmit;
15. R3 CSA implementation contains no legacy `/api/app-state`, `/api/app-validate`, batch transaction or custom-rule runtime path;
16. existing chronological CSA contracts remain GREEN: APPLY/CHANGE/REMOVE each one Story/Observer/commit turn, failed CSA atomic, duplicate fenced, post-APPLY ordinary turn contains no stale `csa_operation`;
17. if `app.js` is touched, agency/navigation/choice-tail/turn-transport regressions remain green.

Run:
- focused R3 frontend/CSA/turn-transport tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

## 5. TEST deployment

If boundaries are respected, this should require a frontend-only TEST deployment.

- Keep TEST API at `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff` unless source inspection proves an API artifact was genuinely changed; changing API is not authorized by default.
- Deploy exact reviewed frontend source to `gamebuilder-company-r3` TEST only.
- preserve all bindings/secrets exactly; do not print, request, rotate, copy or recreate secrets.
- no Production, migration or provider/model/config change.

Record exact source SHA and frontend Worker version.

## 6. Mandatory bare-public live acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, storage preseed or direct-API gameplay substitute. Fresh disposable TEST games only.

### Gate 1 — donor-parity app surface

Setup -> Opening, then open the app through the visible button.

Require:
- modal is visually usable on desktop;
- Home / 플레이어 정보 / NPC 정보 / 상식개변 / 매뉴얼 tabs are all reachable;
- each tab shows meaningful R3-backed content rather than blank donor placeholders or fabricated values;
- CSA tab presents active state and the nine-rule preset experience in a materially higher-parity form than the old immediate card dump;
- no legacy API network calls occur;
- no console/page/network blocker.

### Gate 2 — local draft / unsaved protection

On an inactive preset:
1. stage a valid preset/scope selection without Apply;
2. verify dirty bar shows one unapplied change;
3. verify no gameplay POST, no committed turn/revision change and no active-rule mutation;
4. attempt close and choose Cancel: modal stays open and staged values remain;
5. Revert: draft becomes clean and server state remains unchanged;
6. stage again, close and Confirm discard: modal closes and server state remains unchanged.

Also prove a second distinct edit cannot silently batch/replace the first dirty operation.

### Gate 3 — chronological Apply / Change / Remove

On a fresh disposable game:
- stage APPLY locally, then explicit Apply once;
- require exactly one `POST /api/r3/games/:id/turn` with one `csa_operation`, expected normal turn identity and the exact Korean app literal;
- require visible SSE Story and exactly one committed next turn;
- reopen app and verify committed active state.

Then:
- stage one allowed CHANGE locally; verify server unchanged before Apply; Apply once -> exactly one next Story turn and committed updated state;
- stage REMOVE locally; verify rule still active before Apply; Apply once -> exactly one next Story turn and committed inactive state after terminal;
- after busy clears, controls must be usable and no stale-disabled lifecycle regression may return.

Immediately after the CSA sequence submit one unrelated ordinary Korean free-input action:
- payload must contain no stale `csa_operation`;
- exact literal must remain the Story center;
- one ordinary streamed turn commits;
- no duplicate request/job/turn.

Do not induce provider failure merely to prove a failure UI; deterministic regression is sufficient unless a natural live failure occurs.

### Gate 4 — mobile spot-check

At approximately 390x844:
- modal fits and scrolls;
- all five tabs remain reachable, allowing horizontal tab scrolling only if intentional and obvious;
- CSA form controls and sticky/visible draft bar are reachable;
- no horizontal overflow hides Apply/Revert/Close;
- dirty-close protection remains usable;
- after Apply/close, normal gameplay choices/direct input are not blocked by the overlay.

Visually inspect the rendered app; DOM presence alone is insufficient.

## 7. GREEN criteria

GREEN only if:
- high-parity five-tab R3 app is materially restored using the existing donor shell;
- all displayed values come from current R3 context/catalog or are clearly static manual copy;
- draft edits are strictly local until explicit Apply;
- at most one pending operation exists;
- unsaved close/revert behavior is truthful;
- APPLY/CHANGE/REMOVE remain exactly one normal chronological Story turn each;
- no legacy API/batch/custom/zero-turn mutation path is reintroduced;
- an unrelated post-CSA ordinary turn remains clean;
- desktop and ~390x844 app UX are usable;
- deterministic tests/full suite/deployed bare-public acceptance pass;
- no forbidden work occurred.

Do NOT claim owner-ready after this task.

## 8. Remaining owner-remediation after this cut

Do not implement here:
1. approved-media image projection + character-aware server TTS;
2. deployed same-game reset integration failure;
3. timeline/current-scene presentation residue;
4. final holistic owner-style long-play acceptance.

## 9. Completion report

Post to Issue #68:
- source SHA and exact changed files;
- donor elements reused conceptually and donor runtime elements explicitly NOT imported;
- focused/full/syntax/diff results;
- TEST frontend Worker version and confirmation API version stayed frozen;
- fresh fixture IDs;
- five-tab desktop evidence;
- local-draft no-network/no-revision evidence;
- dirty close Cancel/Confirm and Revert evidence;
- exact network/turn counts for APPLY/CHANGE/REMOVE;
- ordinary post-CSA no-stale-operation evidence;
- ~390x844 visual/interaction evidence;
- console/network diagnostics and remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.

## 10. Worker terminal evidence — WAITING_REVIEW

- Final source HEAD and `origin/main`: `fad4d7f5cd637cf77b9613335eeaef2302c03853`.
- Commits: `36635a80168c6c421a40d843a4c294878df9e61a`, `5c90d497214364418b7b98b2e37c26484cf3d783`, `fad4d7f5cd637cf77b9613335eeaef2302c03853`.
- Changed files: `frontend-r3/app.js`, `frontend-r3/csa-draft.js`, `frontend-r3/csa-entry.css`, `frontend-r3/csa.js`, `test/r3-csa-contract.test.mjs`, `test/r3-csa-draft.test.mjs`, `test/r3-frontend-contract.test.mjs`.
- Focused tests: 34/34 pass. Full `npm.cmd test`: 521/521 pass. JS syntax checks and `git diff --check`: pass.
- TEST frontend deployment: `gamebuilder-company-r3` version `74f14b2c-fcb0-47ce-b14d-ecb90ece7ff1`; API remained frozen at `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`.
- Disposable fixtures: `148272f3-1e93-4366-9d99-f83763d021b5` and `2fbc514d-d8d4-4850-b54e-82a6d21cbb7f`; preserved games were not reset or modified.
- Desktop: Opening loaded with four Story-owned choices and free input; all five tabs rendered; player labels, current-scene NPCs, and out-of-scene catalog NPCs were visible from current R3 context/catalog.
- Local draft: one preset staged with Turn 0 unchanged and zero network requests; revert returned to no pending change. Native dirty-close Cancel/Confirm automation was attempted, but the Chrome dialog bridge stalled after opening the confirm prompt; this is recorded as an acceptance-harness limitation, not a product pass claim.
- Chronology on fixture `2fbc514d-d8d4-4850-b54e-82a6d21cbb7f`: Apply Turn 0→1, Change Turn 1→2, Remove Turn 2→3; each emitted exactly one POST `/api/r3/games/:id/turn` (with the expected preflight response also observed).
- Ordinary post-CSA input `회의실로 가서 오늘 업무를 확인한다.` committed Turn 3→4; captured payload contained `action_id`, `expected_turn`, and `literal_action` only, with no stale `csa_operation`.
- Mobile 390×844: free input remained visible and usable; CSA app opened with the five-tab modal and local draft controls; viewport override was reset afterward.
- Remaining objective defect: dirty-close Cancel/Confirm could not be fully evidenced through the current browser native-dialog bridge. No provider/model, API, migration, production, preserved-game reset, or legacy runtime change was made.
