# Company Redesign — Golden UI / Content Master

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This document separates semantic product identity from layout implementation. Layout may change; product surfaces and canonical content require explicit treatment.

## G-CONTENT-EDITION — Edition identity

Semantic source: `content/edition.json`

- `edition_id = company-v1`
- title = `상식개변: 회사편`
- scope = company

Runtime generation names such as v2/v3 do not alter product identity.

## G-CONTENT-CHARACTERS — Heroine catalog

Semantic source: `content/characters.json`

- `heroine1` — 서원희
- `heroine2` — 윤민아
- `heroine3` — 김제나
- `heroine4` — 한리브
- `heroine5` — 이메이

Prompt cards define identity/personality/speech/addressing/appearance/distinctive traits and other content facts.

Runtime compiles from source; tests compare IDs/counts/names; no demo/default character list is permitted.

## G-CONTENT-GENERAL-NPCS — General NPC catalog

Semantic source: `content/general_npcs.json`.

Runtime may select relevant actors but may not replace registered profiles with ad-hoc semantic identities.

## G-CONTENT-MAP — Company world map

Semantic source: `content/map.json`.

The established map has 24 locations at redesign start. Runtime preserves source IDs and the structural/location facts actually used by gameplay. No two-location demo or SQL/frontend shadow map.

## G-CONTENT-ORG — Setup/content catalogs

Semantic sources include:

- `content/organization.json`
- `content/positions.json`
- `content/body_types.json`
- `content/speech_styles.json`

Runtime validates stable IDs without copying semantic labels into SQL.

## G-CONTENT-CSA — Active CSA catalog

Binding product decision: `07_CSA_MVP_CATALOG.md`.

The initial active catalog contains **exactly 9 templates**: 3 weak, 3 medium, 3 strong.

Historical `content/csa_presets.json` currently contains a larger catalog. That larger set is redesign evidence, not forward active product authority.

At implementation time, there must be one active source of CSA semantics. Prefer pruning/rebuilding the active content file to the accepted 9 rather than keeping 44 source rules and distributing allowlists through runtime/UI/tests.

No historical non-MVP rule appears in the product until explicitly re-added one at a time.

The old generic subject/counterparty selector breadth is not automatically part of the Golden Master. Final per-template scope controls remain OPEN until owner review of the nine-rule app interaction.

## G-SETUP-001 — Established Setup surface

Historical complete UI evidence: `src/frontend/pages/index.html` at `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

Established input inventory:

1. name
2. department
3. position
4. age
5. height
6. weight
7. penis length
8. body type
9. speech style

Surface is retained by default; layout may change; catalog selections store stable IDs where appropriate.

## G-UI-BASELINE — Completed Company product-surface evidence

Most complete established Company UI evidence before v2 product-identity failure:

`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

Primary tree: `src/frontend/pages/*`.

This is a golden **inventory**, not mandatory pixel-perfect layout. Historical `f4b228f...` is provenance only.

## G-UI-SURFACES — Required decision inventory

Every redesign UI proposal classifies each surface as:

- `ACTIVE_VISIBLE`
- `VISIBLE_DISABLED_UNTIL_FEATURE`
- `HIDDEN_BY_OWNER_DECISION`
- `REMOVED_BY_OWNER_DECISION`

Generic `DEFER` may not silently erase presentation.

### Story / history / stream

Status: ACTIVE_VISIBLE / OWNER_LOCKED

- largest/primary reading surface;
- committed chronology remains readable;
- current stream appends visibly without blocking overlay;
- literal player action may be shown separately;
- protocol/internal IDs never render as prose.

### Free-form action

Status: ACTIVE_VISIBLE / OWNER_LOCKED

Always available during ordinary play.

### Choice surface

Status: OPEN_DECISION

May be absent or optional suggestions. Free input remains authoritative.

### Character/current-scene panel

Status: ACTIVE_VISIBLE / RETAIN_BY_DEFAULT

Presents accepted current-scene facts without frontend invention.

### Mind Monitor

Status: ACTIVE_VISIBLE / OWNER_LOCKED

- real character names;
- relevant actor tabs/cards;
- `surface` + `subconscious`;
- explicit empty state instead of fabrication.

### Player state/profile

Status: ACTIVE_VISIBLE / RETAIN_BY_DEFAULT

Separate setup profile from mutable gameplay state. Stored sensitive fields are not automatically shown everywhere.

### Company map

Status: RETAIN_BY_DEFAULT

Exposes Company spatial model. Frontend is not a second movement writer.

### `상식개변` app entry/overlay

Status: ACTIVE PRODUCT SURFACE / OWNER_LOCKED PREMISE

The first active mechanic UI shows only:

```text
약 3
중 3
강 3
```

For each of the 9 templates, UI presents rule wording, strength, accepted scope controls, active state, and transaction result.

Do not prebuild every historical subject × counterparty combination. If scope selection is retained, expose only the controls explicitly accepted for these nine templates.

No historical 10th+ rule is hidden in another tab or endpoint.

If mutation is not implemented in an earlier milestone, presentation may be visible disabled/locked but cannot fake success.

### Media/current image

Status: RETAIN_BY_DEFAULT

Nonblocking presentation sidecar; no narrative authority.

### TTS controls

Status: RETAIN_BY_DEFAULT

Compact allowed; OFF means zero calls; audio never blocks Story.

### History/download

Status: RETAIN_BY_DEFAULT

Chronological inspection; summaries supplement rather than replace/repeat Story.

### Feedback revision

Status: RETAIN_BY_DEFAULT

May remain visibly disabled until actual revision runtime exists.

### Reset/new game

Status: RETAIN_BY_DEFAULT

Enabled only with a real safe owner.

### Standalone NPC find/search

Status: REMOVED_BY_OWNER_DECISION

Do not restore. App `NPC 정보` is a different surface.

## G-UI-MOBILE — Mobile information law

Priorities:

1. Story readability first.
2. Player can act without crossing all status panels.
3. Streaming Story is never covered.
4. Mind Monitor/current scene/player state remain reachable but secondary.
5. Media/TTS/tooling do not dominate reading flow.

Owner reviews actual mobile screenshots/device build before acceptance.

## G-UI-DESKTOP — Desktop information law

Clearly separate narrative/history, player action, current scene/character insight, and secondary tools. Do not reduce the game to a generic chat column because it is easier to implement.

## G-GOLDEN-REVIEW — Visual/content acceptance artifact

Before a major frontend rebuild merges, require:

1. proposed desktop screenshot(s);
2. proposed mobile screenshot(s);
3. surface checklist;
4. explicit differences from historical complete snapshot;
5. exact active CSA catalog check: 9 only;
6. owner acceptance.

DOM/unit tests alone are insufficient.
