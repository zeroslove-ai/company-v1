# Company Redesign — Golden UI / Content Master

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This document separates **semantic product identity** from **layout implementation**.

The redesign may change layout and runtime wiring. It may not accidentally replace the Company world with demo content or make established product surfaces disappear without an explicit decision.

## G-CONTENT-EDITION — Edition identity

Semantic source: `content/edition.json`

Current canonical values:

- `edition_id = company-v1`
- title = `상식개변: 회사편`
- scope = company

The internal future runtime generation name (`v2`, `v3`, etc.) does not change product edition identity unless owner explicitly decides so.

## G-CONTENT-CHARACTERS — Heroine catalog

Semantic source: `content/characters.json`

Five canonical heroine IDs/names at redesign start:

- `heroine1` — 서원희
- `heroine2` — 윤민아
- `heroine3` — 김제나
- `heroine4` — 한리브
- `heroine5` — 이메이

The source prompt cards define identity/personality/speech/addressing/appearance/distinctive traits and other content facts.

Rule:

- runtime must load/compile from this source through an adapter/build artifact;
- tests compare runtime projection against source IDs/counts/names;
- no hand-coded demo/default character list may become runtime authority.

## G-CONTENT-GENERAL-NPCS — General NPC catalog

Semantic source: `content/general_npcs.json`

Current catalog contains the established registered general NPC profiles. Runtime may filter relevant actors but may not replace the catalog with ad-hoc names.

## G-CONTENT-MAP — Company world map

Semantic source: `content/map.json`

Current map is the full established Company location catalog (24 locations at redesign start).

Runtime projection should preserve source IDs, labels/descriptions and structural navigation data actually used by gameplay.

No two-location demo map or SQL/frontend shadow catalog is allowed.

## G-CONTENT-ORG — Setup/content catalogs

Semantic sources include:

- `content/organization.json`
- `content/positions.json`
- `content/body_types.json`
- `content/speech_styles.json`
- `content/csa_presets.json`

The runtime may validate IDs structurally but should not duplicate semantic labels/meaning in SQL.

## G-SETUP-001 — Established Setup surface

Historical completed UI evidence: `src/frontend/pages/index.html` at commit `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

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

Redesign status:

- surface retained by default;
- exact layout may change;
- each field must receive an explicit KEEP/CHANGE/REMOVE owner decision before implementation if the redesign wants to alter it;
- fields selected from catalogs store stable IDs where appropriate, not copied labels as authority.

## G-UI-BASELINE — Completed Company product-surface evidence

The most complete established Company UI snapshot before the v2 product-identity failure is commit:

`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

Primary evidence tree:

`src/frontend/pages/*`

Important: this SHA is **not a mandatory pixel-perfect layout**. It is a golden inventory proving which product surfaces had already been built/accepted enough to require deliberate treatment.

The prior historical donor `f4b228f14d3a0e4446b0ae62e441ed659d3609ca` is provenance only and must not replace the more complete snapshot.

## G-UI-SURFACES — Required decision inventory

Every redesign UI proposal must classify each surface as:

- `ACTIVE_VISIBLE`
- `VISIBLE_DISABLED_UNTIL_FEATURE`
- `HIDDEN_BY_OWNER_DECISION`
- `REMOVED_BY_OWNER_DECISION`

No generic `DEFER` may silently erase presentation.

### Story / history / stream

Status: ACTIVE_VISIBLE / OWNER_LOCKED

Requirements:

- Story is largest/primary reading surface;
- committed history remains readable in chronology;
- current stream appends visibly without blocking overlay;
- current literal player action can be presented separately from narrative;
- protocol/internal IDs are not shown as prose.

### Free-form action

Status: ACTIVE_VISIBLE / OWNER_LOCKED

- always available during ordinary play;
- desktop/mobile placement may change;
- send state must not obscure streaming Story.

### Choice surface

Status: OPEN_DECISION

- may be absent, optional, or exactly-four suggestions after owner review;
- free input remains authoritative regardless.

### Character/current-scene panel

Status: ACTIVE_VISIBLE / RETAIN_BY_DEFAULT

Should present accepted current-scene information without frontend invention.

Exact fields are governed by the L3 state model, not old UI leftovers.

### Mind Monitor

Status: ACTIVE_VISIBLE / OWNER_LOCKED

- relevant NPC tabs/cards where multiple actors are present;
- real display names, not internal IDs;
- `surface` and `subconscious`;
- explicit empty state rather than fabricated monitor data.

### Player state/profile

Status: ACTIVE_VISIBLE / RETAIN_BY_DEFAULT

Separate immutable/setup profile from mutable gameplay state. Do not expose sensitive fields everywhere merely because they are stored.

### Company map

Status: RETAIN_BY_DEFAULT

Presentation should expose the Company spatial model. Navigation authority and exact click behavior are gameplay decisions.

A map click may prefill an action or perform a structural move only if the accepted interaction contract says so; frontend must not become a second movement writer.

### `상식개변` app entry/overlay

Status: ACTIVE PRODUCT SURFACE / OWNER_LOCKED PREMISE

The private app is central to product identity.

If rule mutation is not yet implemented in an early milestone, the app may be visible but mutation controls must be clearly disabled/locked and must not claim a change occurred.

### Media/current image

Status: RETAIN_BY_DEFAULT

- visible slot/presentation may be redesigned;
- image generation/selection is nonblocking sidecar;
- no image-derived narrative authority.

### TTS controls

Status: RETAIN_BY_DEFAULT

- visible controls may be compact;
- OFF means no TTS calls;
- audio must not block Story.

### History/download

Status: RETAIN_BY_DEFAULT

- supports chronological inspection;
- turn summary is supplementary, not repeated as main Story;
- exact export formats can be redesigned.

### Feedback revision

Status: RETAIN_BY_DEFAULT

Presentation may remain disabled until v2/redesigned revision runtime exists, but the surface cannot silently disappear without owner decision.

### Reset/new game

Status: RETAIN_BY_DEFAULT

Must have an actual safe owner before enabled.

### Standalone NPC find/search

Status: REMOVED_BY_OWNER_DECISION

Do not restore it. The `NPC 정보` tab inside the private app is a different surface.

## G-UI-MOBILE — Mobile information law

Exact historical ordering is evidence, not permanent pixel law. The redesign must preserve these priorities:

1. Story readability first.
2. Player can act without scrolling through all status panels.
3. Streaming Story is never covered by a loading layer.
4. Mind Monitor/current scene/player state remain reachable but secondary to Story/action.
5. Media/TTS/tooling do not dominate the reading flow.

Any new mobile layout should be owner-reviewed with actual screenshots or deployed device view before implementation is considered accepted.

## G-UI-DESKTOP — Desktop information law

Desktop should clearly separate:

- narrative/history;
- player action;
- current scene/character insight;
- secondary tools.

Do not compress the game into a generic chat column with a handful of status cards merely because that is easy to implement.

## G-GOLDEN-REVIEW — Visual acceptance artifact

Before a major frontend rebuild is merged, require:

1. screenshot(s) of current proposed desktop UI;
2. screenshot(s) of mobile UI;
3. surface checklist against this file;
4. explicit differences from historical complete snapshot;
5. owner acceptance.

DOM/unit tests alone are insufficient for UI parity or redesign approval.
