# Company Redesign — Company v1 Salvage Matrix

Status: OWNER-REVIEW DRAFT / SOURCE-AUDITED  
Date: 2026-08-21  
Primary UI evidence SHA: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

## 1. Why this matrix exists

Architecture Candidates A/B/C in `05_ARCHITECTURE_DECISION_FRAMEWORK.md` compare **gameplay runtime kernels**. They do not imply that the Company v1 product/UI/content should be discarded.

The forward product should be assembled on two independent axes:

```text
selected runtime kernel (A/B/C)
+
Company v1 product-asset salvage
```

The completed Company v1 presentation is the primary forward UI donor. The redesign is **not** a greenfield frontend redesign unless the owner later asks for one.

## 2. Primary conclusion

Use `src/frontend/pages/*` at `5ec1a76...` as a **high-parity presentation transplant**.

Keep the visible information architecture, layout, styling and mature interaction components wherever they do not encode old gameplay authority. Replace only the old API/state/turn orchestration seams and deliberately removed product surfaces.

Target composition:

```text
Company v1 presentation shell
+ Company canonical content
+ new thin frontend controller / view-model adapter
+ selected server-owned runtime kernel
+ new minimal state model
```

Do not use the reduced `frontend-v2/` shell as the UI target.

## 3. Classification vocabulary

- `KEEP`: can survive substantially as-is; only import/path/data-shape adjustments allowed.
- `TRANSPLANT`: preserve presentation/high-parity behavior, but place it behind the new controller/view model.
- `REWIRE`: capability/logic is useful but its data/API contract must change.
- `REBUILD`: concept remains but current implementation carries obsolete authority/semantics.
- `DELETE`: must not survive into the new product.
- `DEFER_KEEP`: preserve as a donor for a later phase; do not activate in the first milestone.

## 4. UI shell — high-parity transplant

### `src/frontend/pages/index.html`

Classification: **TRANSPLANT / HIGH PARITY**

The complete snapshot already contains:

- title / day / time / turn / connectivity;
- Story history and current streaming turn;
- four-choice surface;
- free-form action input;
- current scene/media surface;
- TTS controls and audio element;
- Mind Monitor;
- character/current-state panel;
- player panel;
- company map;
- `상식개변` entry panel and full app overlay;
- Setup overlay;
- history/download overlay;
- feedback overlay;
- reset control;
- responsive/mobile shell hooks.

Forward treatment:

- preserve the overall DOM/information architecture;
- preserve Story-first desktop/mobile placement;
- keep four choices + free input;
- remove only the owner-removed dynamic player sexual gauge surface if any dependent rendering remains;
- standalone NPC find/search remains removed;
- update obsolete explanatory copy such as “CSA 적용이 게임 한 턴으로 진행” because redesigned CSA is a non-Story transaction;
- API/controller scripts are replaced/rewired separately.

This file proves the redesign should **not** start from a blank frontend.

## 5. Styling / responsive layout

Primary donor CSS includes the shell/panel/parity/product/recovery/runtime layers referenced by the complete `index.html`, plus component CSS such as the company map and CSA entry.

Classification: **KEEP / TRANSPLANT**

Rules:

- reuse the visual shell and responsive behavior at high parity;
- delete selectors exclusively serving removed mechanics rather than redesigning the whole layout;
- preserve no-blocking-loader Story reading behavior;
- preserve compact mobile Story → choices/action → secondary-state priority;
- visual changes beyond necessary deletions/wiring require owner screenshot review.

## 6. Narrative and choice renderer

### `render.js`

Classification: **TRANSPLANT + REWIRE SMALL CONTRACT EDGES**

Strong salvage value:

- narrative card rendering;
- dialogue presentation;
- full choices shown in narrative;
- compact choice buttons;
- compact label is presentation only while full literal choice is submitted;
- history rendering and collapsible detail presentation;
- Mind Monitor/state presentation helpers.

The existing renderer already separates full literal choice authority from compact button labels. This matches `P-INPUT-001` closely.

Required changes:

- choice input source becomes redesigned Extract/observer `choices[4]` only;
- remove old compatibility `choice_labels` authority/fallback where no longer useful;
- do not parse/require the old semantic Story wire as forward narrative authority;
- replace old posture/player-meter-specific state rendering with `scene_note` + accepted profile/clothing data;
- remove stale relationship/numeric-stat presentation if still reachable.

Do not rewrite the renderer merely because the runtime kernel changes.

## 7. Player Setup

### `setup.js` + Setup DOM

Classification: **KEEP NEAR-VERBATIM / REWIRE SUBMIT API**

The existing validator already matches the accepted setup inventory and ranges:

- name;
- department;
- position;
- age;
- height;
- weight;
- penis length;
- body type;
- speech style.

Keep client-side UX validation and catalog option helpers. The server must still revalidate against canonical content.

Only the creation API/persistence wiring changes to the selected runtime.

## 8. Company map

### `company-map.js` + `company-map.css`

Classification: **KEEP / LIGHT REWIRE**

This module is unusually compatible with the redesign because its existing contract already says:

- it reads already-returned context instead of creating a map endpoint;
- displayed NPC location is not automatic scene-presence authority;
- location/NPC clicks only prefill literal action text;
- clicking does not automatically execute a turn.

Keep the floor/location rendering, prompt-fill UX and styling. Rewire input data to canonical `CompanyContent` + redesigned scene `{location_id,present_actor_ids}`.

Do not turn the frontend map into a second movement writer.

## 9. Mind Monitor presentation

Classification: **TRANSPLANT / REWIRE DATA**

Keep:

- visible panel;
- multi-character tabs/cards where applicable;
- `surface` / `subconscious` presentation;
- explicit empty state;
- character display names.

Rewire source to the new turn observer payload. Remove any historical numeric reaction/relationship/physical-reaction dependencies.

## 10. View-model boundary

### `view-model.js`

Classification: **REBUILD IMPLEMENTATION, KEEP PATTERN**

Keep the architectural principle:

```text
server context -> one pure Company view model -> renderers
```

Do **not** keep the current field readers verbatim. The historical implementation still reads obsolete state such as:

- `npc_scene_state` posture/position structure;
- player progress/capability levels;
- dynamic `erection_state`;
- historical CSA display shapes;
- historical media tag derivation.

Build a much smaller view model around the accepted state:

```text
profile
time
scene.location_id
scene.present_actor_ids
scene.scene_note
active_rules
clothing
latest Story / choices / MM / history
```

The frontend must not read raw DB/save structures outside this adapter.

## 11. Frontend app/controller

### `app.js`

Classification: **REBUILD CONTROLLER; SALVAGE ONLY SMALL UI HELPERS**

Do not transplant this file wholesale.

The old file contains `createTurnCoordinator()` and explicitly owns:

```text
Story -> Extract -> Commit
```

with browser-persisted pending stages/recovery. That stage ownership is one of the old runtime failure classes and directly conflicts with the new server-owned turn architecture.

Potentially salvage isolated, product-neutral UI conveniences after review:

- exact choice-button submission helpers;
- busy-button UX;
- DOM element wiring patterns;
- session history merge helper if still needed.

New controller law:

```text
submit literal action once
-> consume one server-owned turn stream
-> render streamed Story
-> receive terminal committed context
-> rebuild view model
```

No browser Story→Extract→Commit coordinator survives.

## 12. API client / SSE client

### `api.js`

Classification: **REWIRE / LIKELY SMALL REBUILD**

Endpoint names/payloads must match the selected server-owned kernel. Do not preserve legacy `/story`, `/extract`, `/commit` sequencing.

### `sse.js`

Classification: **KEEP PARSER IDEA / REWIRE EVENT CONTRACT**

The generic SSE framing/parser is reusable. The current accepted event allowlist is tied to old semantic Story events (`section_start`, `block_start`, `acting`, etc.). New runtime should use a much smaller stream such as:

```text
meta
story_delta
terminal/error
```

Do not retain old wire events solely to reuse the client.

## 13. `상식개변` app presentation

### `csa-app.js` + modal DOM/CSS

Classification: **TRANSPLANT PRESENTATION / REBUILD STATE+SUBMIT CONTRACT**

High-value UI assets to keep:

- full-screen/modal app shell;
- tabs: home / player info / NPC info / CSA / manual;
- ESC/backdrop/close/focus/body-lock behavior;
- draft UX and unapplied-change warning pattern;
- selector/form/card visual components;
- preview presentation.

Must be replaced:

- old 44-rule category/preset browsing assumptions;
- level/EXP/unlock dependence where no longer in product;
- old `canonical_action -> Story -> Extract -> Commit` apply path;
- old rule execution/category semantics.

New CSA UI reads exactly the 9-rule active catalog and flexible canonical subject/counterparty scope, then calls a dedicated non-Story rule transaction.

The existing selector-component approach is useful; the old semantics are not.

### `csa-app-state.js`

Classification: **REBUILD**

Rewrite around 9 templates + flexible finite scope + active/inactive lifecycle. Do not retain historical 44-rule or level/unlock machinery by inertia.

## 14. History / feedback / image utility UI

### `utility-ui.js` and history/download presentation

Classification:

- History modal/rendering: **KEEP / LIGHT REWIRE**
- Download UX: **KEEP**
- Feedback UI: **DEFER_KEEP / REWIRE API**
- Image UI: **DEFER_KEEP / REWIRE DATA/API**

The existing utility code already treats media as a sidecar and uses stale-request guarding. Preserve those presentation patterns later, but do not let image/feedback availability affect Story Commit.

## 15. TTS

### `tts.js`

Classification: **DEFER_KEEP / LIGHT REWIRE**

Strong reusable pieces:

- ON/OFF UX;
- OFF clears queue and prevents playback;
- mobile audio priming;
- batching by speaker/tone;
- queue/stale-revision handling;
- replay UX.

Rewire dialogue input to the new safe speaker/Extract projection and rewire API endpoint if needed. TTS remains a sidecar and must never block Story.

## 16. Canonical content

### `content/edition.json`, characters, general NPCs, map, organization/setup catalogs

Classification: **KEEP AS SEMANTIC AUTHORITY**

These are not merely donor examples. They remain the canonical Company product data unless changed by explicit owner decision.

Exception: historical CSA catalog breadth is superseded by `07_CSA_MVP_CATALOG.md`; active forward CSA semantics are exactly the approved 9 rules.

## 17. Prompt assets

Classification: **SELECTIVE REWIRE, NOT BLIND COPY**

Keep product language/principles proven in Company v1:

- literal player agency;
- actual character prompt cards;
- company-life texture and NPC autonomy;
- dialogue continuity;
- multi-NPC interaction;
- four natural next choices;
- Mind Monitor `surface/subconscious` character voice;
- no automatic equation of work cooperation/CSA compliance with affection.

Do not keep protocol-heavy Story syntax, generic physical ontology, old Extract patch authority, or obsolete player-meter/relationship/event machinery.

## 18. Company v1 runtime/domain assets

Classification: **SELECTIVE SMALL SALVAGE ONLY**

Potential candidates after source audit:

- canonical content loaders/validators;
- four-slot clothing normalization/reducer helpers if they can be isolated;
- pure catalog/setup validators;
- small formatting/identity helpers.

Do not salvage:

- browser-owned turn stage coordinator;
- old Story semantic-wire authority;
- broad Extract save-patch pipeline;
- old posture/contact ontology;
- relationship/emotion/event ledgers;
- dynamic player sexual gauge/event ledger;
- generic historical CSA execution engine;
- automatic repair/retry machinery that can author a second narrative;
- standalone NPC finder.

## 19. Recommended final composition

The leading design is no longer accurately described as simply “Candidate A”. It is:

```text
PRODUCT / UI
  Company v1 complete UI shell -------------- HIGH-PARITY TRANSPLANT
  Company v1 canonical content -------------- KEEP
  Company v1 renderer/map/setup components -- KEEP / LIGHT REWIRE
  Company v1 CSA modal presentation ---------- TRANSPLANT, semantics REBUILD
  Company v1 TTS/history/media presentation -- DEFER_KEEP

CLIENT AUTHORITY
  New thin controller ------------------------ REBUILD
  New minimal view model --------------------- REBUILD around new state

GAME DOMAIN
  New minimal state/memory/CSA model --------- REBUILD from redesign canon
  New Story/observer contract ---------------- REBUILD

RUNTIME KERNEL
  Choose A / B / C separately ---------------- ARCHITECTURE AUDIT
```

This decomposition prevents the prior mistake of treating “new runtime” as “new product”.

## 20. Gate-1 audit implication

The upcoming architecture audit must therefore produce **two outputs**:

1. Kernel decision: A vs B vs C.
2. Company v1 salvage decision: exact files/modules classified KEEP / TRANSPLANT / REWIRE / REBUILD / DELETE / DEFER_KEEP.

Architecture selection may not replace the accepted Company v1 UI donor with a reduced shell merely because another kernel is chosen.
