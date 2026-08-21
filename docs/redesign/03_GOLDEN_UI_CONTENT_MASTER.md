# Company Redesign — Golden UI / Content Master

Status: OWNER-REVIEW DRAFT / FOUR OPEN DECISIONS RESOLVED  
Date: 2026-08-21

This document separates semantic product identity from layout implementation. Layout may change; product surfaces and canonical content require explicit treatment.

## G-CONTENT-EDITION — Edition identity

Semantic source: `content/edition.json`.

- `edition_id = company-v1`
- title = `상식개변: 회사편`
- scope = company

Runtime generation names such as v2/v3 do not alter product identity.

## G-CONTENT-CHARACTERS — Heroine catalog

Semantic source: `content/characters.json`.

- `heroine1` — 서원희
- `heroine2` — 윤민아
- `heroine3` — 김제나
- `heroine4` — 한리브
- `heroine5` — 이메이

Prompt cards define identity/personality/speech/addressing/appearance/distinctive traits and other content facts. Runtime compiles from source; tests compare IDs/counts/names; no demo/default character list is permitted.

## G-CONTENT-GENERAL-NPCS

Semantic source: `content/general_npcs.json`. Runtime may select relevant actors but may not replace registered profiles with ad-hoc semantic identities.

## G-CONTENT-MAP

Semantic source: `content/map.json`. Established map has 24 locations at redesign start. Runtime preserves source IDs and structural/location facts actually used by gameplay. No two-location demo or SQL/frontend shadow map.

## G-CONTENT-ORG

Semantic sources include `content/organization.json`, `content/positions.json`, `content/body_types.json`, and `content/speech_styles.json`. Runtime validates stable IDs without copying semantic labels into SQL.

## G-CONTENT-CSA — Active CSA catalog

Binding product decision: `07_CSA_MVP_CATALOG.md`.

Initial active catalog contains exactly 9 templates: 3 weak, 3 medium, 3 strong. Historical larger CSA catalog is redesign evidence only.

At implementation time there is one active source of CSA semantics. Do not keep a 44-rule active source and scatter 9-rule allowlists through runtime/UI/tests.

Scope behavior is flexible by owner decision: UI/API should share one small canonical scope vocabulary and allow supported subject/counterparty selection without per-template historical hard-fixing. This scope flexibility must stay separate from rule execution semantics.

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

### Story/history/stream

ACTIVE_VISIBLE / OWNER_LOCKED.

Largest reading surface; chronological history; visible incremental stream; literal player action may be shown separately; no internal protocol rendered as prose.

### Four Story-authored choices

ACTIVE_VISIBLE / OWNER_LOCKED.

Every ordinary turn normally exposes four current-turn choices authored by the Story LLM and projected by Extract/observer.

UI law:

- choices appear as four actionable suggestions beneath/after the completed turn;
- full literal extracted choice text is the action authority;
- a shortened button label is allowed only as presentation and must map to the full literal choice;
- no previous-turn choices appear as fallback;
- if current choice extraction fails, the choice surface may show an explicit unavailable state for that turn rather than fabricating options.

### Free-form action

ACTIVE_VISIBLE / OWNER_LOCKED.

Always available during ordinary play, including when four-choice extraction fails.

### Character/current scene

ACTIVE_VISIBLE / RETAIN_BY_DEFAULT.

Presents accepted scene facts without frontend invention. Immediate physical continuity is represented initially through the current `scene_note` plus structured location/present actors, not a revived generic physical ontology.

### Mind Monitor

ACTIVE_VISIBLE / OWNER_LOCKED.

Real names, relevant actor tabs/cards, `surface` + `subconscious`, explicit empty state.

### Player profile/state

ACTIVE_VISIBLE / RETAIN_BY_DEFAULT with explicit removal.

Show accepted setup/profile and any genuine mutable player state separately. The historical dynamic sexual/arousal/erection/ejaculation gauge is **REMOVED_BY_OWNER_DECISION** and must not retain empty cards/placeholders solely for parity.

### Company map

RETAIN_BY_DEFAULT. Exposes spatial model; frontend is not a second movement writer.

### `상식개변` app

ACTIVE PRODUCT SURFACE / OWNER_LOCKED PREMISE.

First active mechanic UI shows only:

```text
약 3
중 3
강 3
```

For each retained template show rule wording, strength, flexible supported subject scope, counterparty scope where meaningful, active state, and transaction result.

Do not hard-code each rule to one historical subject/counterparty pairing merely because older saves used it. Do not expose meaningless counterparty controls for unary rules. Do not prebuild historical rule execution categories/DSLs.

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
2. Four current-turn choices and free input are reachable without crossing all status panels.
3. Streaming Story is never covered.
4. Mind Monitor/current scene/player profile remain reachable but secondary.
5. Media/TTS/tooling do not dominate reading flow.
6. Removed sexual gauge does not consume layout space.

Owner reviews actual mobile screenshots/device build.

## G-UI-DESKTOP

Clearly separate narrative/history, current-turn choices + player action, current scene/character insight, and secondary tools. Do not reduce game to a generic chat column for implementation convenience.

## G-GOLDEN-REVIEW

Before major frontend rebuild merges, require:

1. desktop screenshot(s);
2. mobile screenshot(s);
3. surface checklist;
4. explicit differences from historical complete snapshot;
5. exact active CSA catalog check: 9 only;
6. four Story-authored choices + free input behavior;
7. no dynamic player sexual gauge;
8. owner acceptance.

DOM/unit tests alone are insufficient.
