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

Prompt cards define identity/personality/speech/addressing/appearance/distinctive traits and other content facts. Runtime compiles from source; tests compare IDs/counts/names; no demo/default character list is permitted.

## G-CONTENT-GENERAL-NPCS

Semantic source: `content/general_npcs.json`.

Runtime may select relevant actors but may not replace registered profiles with ad-hoc semantic identities.

## G-CONTENT-MAP

Semantic source: `content/map.json`.

Established map has 24 locations at redesign start. Runtime preserves source IDs and structural/location facts actually used by gameplay. No two-location demo or SQL/frontend shadow map.

## G-CONTENT-ORG

Semantic sources include `content/organization.json`, `content/positions.json`, `content/body_types.json`, and `content/speech_styles.json`.

Runtime validates stable IDs without copying semantic labels into SQL.

## G-CONTENT-CSA — Active CSA catalog

Binding product decision: `07_CSA_MVP_CATALOG.md`.

Initial active catalog contains **exactly 9 templates**: 3 weak, 3 medium, 3 strong.

Historical `content/csa_presets.json` currently contains a larger catalog. That larger set is redesign evidence, not forward active product authority.

At implementation time, there must be one active source of CSA semantics. Prefer pruning/rebuilding active content to accepted 9 rather than keeping 44 source rules and distributing allowlists through runtime/UI/tests.

Historical non-MVP rules return only by explicit one-at-a-time owner decision.

The old generic subject/counterparty selector breadth is not automatically Golden Master. Final per-template scope controls remain OPEN until owner review of nine-rule app interaction.

## G-SETUP-001 — Established Setup surface

Historical complete UI evidence: `src/frontend/pages/index.html` at `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

Established inputs:

1. name
2. department
3. position
4. age
5. height
6. weight
7. penis length
8. body type
9. speech style

Surface retained by default; layout may change; catalog selections store stable IDs where appropriate.

## G-UI-BASELINE

Most complete established Company UI evidence before v2 product-identity failure:

`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

Primary tree: `src/frontend/pages/*`.

This is golden inventory, not mandatory pixel-perfect layout. Historical `f4b228f...` is provenance only.

## G-UI-SURFACES

Every redesign UI proposal classifies each surface as `ACTIVE_VISIBLE`, `VISIBLE_DISABLED_UNTIL_FEATURE`, `HIDDEN_BY_OWNER_DECISION`, or `REMOVED_BY_OWNER_DECISION`.

Generic `DEFER` may not silently erase presentation.

### Story/history/stream

ACTIVE_VISIBLE / OWNER_LOCKED.

Largest reading surface; chronological history; visible incremental stream; literal player action may be separate; no internal protocol rendered as prose.

### Free-form action

ACTIVE_VISIBLE / OWNER_LOCKED. Always available during ordinary play.

### Choice surface

OPEN_DECISION. May be absent or optional suggestions. Free input remains authoritative.

### Character/current-scene

ACTIVE_VISIBLE / RETAIN_BY_DEFAULT. Presents accepted scene facts without frontend invention.

### Mind Monitor

ACTIVE_VISIBLE / OWNER_LOCKED. Real names, relevant actor tabs/cards, `surface` + `subconscious`, explicit empty state.

### Player state/profile

ACTIVE_VISIBLE / RETAIN_BY_DEFAULT. Separate setup profile from mutable state; stored sensitive fields are not shown everywhere automatically.

### Company map

RETAIN_BY_DEFAULT. Exposes spatial model; frontend is not second movement writer.

### `상식개변` app

ACTIVE PRODUCT SURFACE / OWNER_LOCKED PREMISE.

First active mechanic UI shows only:

```text
약 3
중 3
강 3
```

For each retained template, show rule wording, strength, accepted scope controls, active state, and transaction result.

Do not prebuild every historical subject × counterparty combination. If scope selection is retained, expose only controls explicitly accepted for these nine templates.

No historical 10th+ rule is hidden in another tab/endpoint.

### Media/current image

RETAIN_BY_DEFAULT. Nonblocking sidecar; no narrative authority.

### TTS

RETAIN_BY_DEFAULT. Compact allowed; OFF means zero calls; never blocks Story.

### History/download

RETAIN_BY_DEFAULT. Chronological inspection; summary supplements rather than replaces/repeats Story.

### Feedback revision

RETAIN_BY_DEFAULT. May remain visibly disabled until real runtime exists.

### Reset/new game

RETAIN_BY_DEFAULT. Enabled only with real safe owner.

### Standalone NPC find/search

REMOVED_BY_OWNER_DECISION. Do not restore. App `NPC 정보` is a different surface.

## G-UI-MOBILE

Priorities:

1. Story readability first.
2. Player acts without crossing all status panels.
3. Streaming Story never covered.
4. MM/current scene/player state reachable but secondary.
5. Media/TTS/tooling do not dominate reading flow.

Owner reviews actual mobile screenshots/device build.

## G-UI-DESKTOP

Clearly separate narrative/history, player action, current scene/character insight, and secondary tools. Do not reduce game to generic chat column for implementation convenience.

## G-GOLDEN-REVIEW

Before major frontend rebuild merges, require:

1. desktop screenshot(s);
2. mobile screenshot(s);
3. surface checklist;
4. explicit differences from historical complete snapshot;
5. exact active CSA catalog check: 9 only;
6. owner acceptance.

DOM/unit tests alone are insufficient.
