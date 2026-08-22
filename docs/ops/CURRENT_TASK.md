# Company — CURRENT TASK

Status: READY
Task ID: company-r3-image-sidecar-binding-audit-v1
Mode: READ-ONLY CURRENT R3 + ACCEPTED DONOR MEDIA AUDIT -> DEFINE MINIMAL REUSABLE IMAGE BINDING -> STOP
Updated: 2026-08-23 01:21 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, media framework, asset pipeline, or competing execution authority.

## 0. Authority / frozen accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- feedback revision TEST acceptance/freeze through `5381157253`;
- game-capability TEST terminal `5381363356`;
- operator capability freeze/product-priority review `5381387742`;
- accepted secured executable source `b511b35c3e294f77ecdffdcc2ad870c446a10e7b`;
- current TEST API `game-proxy-company-r3` version `52439f14-235f-4c1d-ac24-1ca30abc5e95`;
- current TEST frontend `gamebuilder-company-r3` version `50387103-1a97-4774-ac42-4368844cde58`;
- this exact CURRENT_TASK blob after registration.

Frozen areas:
- per-game capability boundary is GREEN/frozen; do not reopen or expand auth/RLS work absent a new real defect;
- feedback revision is GREEN/frozen;
- CSA rules 7/9 remain frozen provider/model capability exceptions;
- Story/Observer/reducer/provider/model/config/timeouts remain untouched.

## 1. Product purpose

Return to product work after closing the deterministic security blocker.

Current R3 already has:
- committed history/readback;
- MD/TXT history export;
- nonblocking TTS sidecar;
- feedback revision;
- donor-derived image UI slot in `frontend-r3/index.html`:
  - `media-panel`;
  - `character-image`;
  - `image-status`.

But the current R3 image/media binding is intentionally absent: the panel remains hidden and no accepted image selection/media authority was carried into the current R3 runtime.

Historical Company donor/accepted work contained an image-sidecar/current-situation image-family concept. This task must determine whether that can be reused exactly and cheaply, without inventing URLs, assets, a new image-generation service, or gameplay semantics.

This is a source/history/read-only audit only. It does not authorize implementation.

## 2. Preflight

Before inspection:
1. Re-read Issue #68 and this exact CURRENT_TASK; STOP if a newer competing owner/operator directive or active lease exists.
2. Verify `main` is executable-equivalent to accepted secured source `b511b35...` plus docs-only task registrations.
3. Verify the current R3 media slot source as actually present on main.
4. Do not access or mutate TEST/Production data merely for this audit.
5. Do not deploy anything.

If the control plane/source lineage is not clear, STOP `BLOCKED_IMAGE_SIDECAR_AUDIT_PREFLIGHT`.

## 3. Current R3 media inventory

Inspect current R3 source and record the exact present/absent contract for:
- `frontend-r3/index.html` media/image elements;
- media-related CSS;
- `frontend-r3/app.js`, render/view-model modules, and client code;
- canonical context/state/turn shapes for any existing `image_selection`, `image_key`, `image_url`, media family, focal/current actor, scene, clothing, or presentation-only fields;
- Worker/runtime/store/provider code for any existing media endpoint/binding/service call;
- Wrangler/config bindings for any image/media storage/service binding.

Explicitly answer:
- Is there already a current R3 canonical/presentation field that can drive the image slot?
- Is the hidden panel just an unwired donor shell, or is a partial binding already present?
- Would image display require changing durable gameplay state, or can it remain presentation-only?

Do not infer fields that do not exist.

## 4. Accepted donor / repository-history media audit

Search repository history and existing docs/source only. Do not browse or scrape external asset sites.

Identify the exact historical Company implementation(s) behind prior accepted references to:
- current-situation image sidecar;
- image families / character image families;
- `image_selection` or equivalent;
- image slot/media UI;
- any static asset manifest, character-to-family mapping, scene/clothing mapping, storage path convention, or media service binding.

Candidate historical anchors may include prior accepted Company donor/source commits already referenced in Issue #68, including the donor UI lineage and the previously accepted current-situation image-sidecar lineage. Treat a candidate as reusable only after verifying the exact source/files at an exact commit.

For every relevant candidate record:
- exact commit SHA;
- exact file paths;
- what the code actually does;
- where image bytes/URLs come from;
- whether referenced assets still exist in this repository/configuration;
- whether it depends on retired v1/v2 gameplay semantics, old DB fields, external secrets/services, or hardcoded URLs;
- whether it was presentation-only or wrote gameplay state.

Do not treat an Issue comment saying an image sidecar existed as proof that the required assets still exist.

## 5. Asset/binding reality check

Determine which one of these is objectively true:

### A. REUSABLE_ACCEPTED_MEDIA_BINDING
All necessary pieces already exist in accepted repository history/current assets, and a narrow R3 presentation-only binding can be implemented without inventing asset locations or new services.

### B. PARTIAL_BINDING_ASSETS_OR_AUTHORITY_MISSING
Some old UI/selection code exists, but required actual assets, manifest, storage binding, or accepted selection authority is absent/retired.

### C. NO_ACCEPTED_MEDIA_BINDING
Only placeholder UI or stale references remain; there is no grounded asset/binding contract to implement safely.

If B or C, state the exact missing input. Do not fabricate a replacement.

## 6. Minimal R3 design if A is proven

If and only if `REUSABLE_ACCEPTED_MEDIA_BINDING` is proven, define the smallest next implementation boundary.

Preferred architecture:
- presentation sidecar only;
- no second LLM/provider call;
- no Story regeneration/retry;
- no Observer semantic authority expansion;
- no DB/schema/migration;
- no write into canonical gameplay state unless an already-accepted current field is proven necessary;
- no random semantic classifier;
- no fuzzy person/state matching;
- image choice derived only from already-canonical current data plus an existing accepted finite manifest/mapping;
- current focal/present actor and existing canonical scene/state may be read, but player agency/game mechanics must never depend on the selected image;
- failure/missing image must fail open to hidden panel/status text and never block Story/input;
- refresh should deterministically reproduce the same display from committed context where the historical accepted contract supports that behavior.

Specify:
- exact source files to add/change next;
- exact existing manifest/assets/binding to reuse;
- whether API work is required at all;
- exact focused tests needed;
- whether only frontend deploy would be sufficient or API deploy is also required.

Keep it small enough for one source task + one bounded TEST rollout.

## 7. Do not overbuild

Do NOT propose or create:
- new image-generation AI calls;
- image prompt generation;
- generic media orchestration service;
- database media tables;
- broad asset management UI;
- CDN migration;
- account/auth work;
- automatic internet image search/scraping;
- semantic image classifier/router;
- a new durable `image_selection` field merely because an old architecture had one, unless current canon requires and exact reuse proves it necessary;
- compatibility layers for retired v1/v2 media semantics.

The owner lean-development override applies: the goal is one useful character/current-situation image sidecar, not a media platform.

## 8. No mutation in this audit

Do NOT:
- modify runtime/frontend/tests/content/config/migrations;
- create an implementation commit;
- deploy/redeploy API/frontend;
- provision/change secrets/bindings;
- create/reset/play/feedback any game;
- invoke provider/Story/Observer;
- invoke CSA;
- touch Production;
- copy in external images/assets;
- create a new audit document or branch.

Repository/history reads and Issue #68 terminal evidence are sufficient.

## 9. Terminal

Post exactly one terminal comment to Issue #68 and STOP.

If exact reusable binding/assets are proven:
`STATUS: COMPLETE_IMAGE_SIDECAR_BINDING_AUDIT_IMPLEMENTABLE`

If old code exists but a required accepted asset/binding/authority is missing:
`STATUS: BLOCKED_IMAGE_SIDECAR_PARTIAL_BINDING_MISSING_INPUT`

If no accepted grounded media binding exists:
`STATUS: BLOCKED_IMAGE_SIDECAR_NO_ACCEPTED_MEDIA_BINDING`

Preflight failure:
`STATUS: BLOCKED_IMAGE_SIDECAR_AUDIT_PREFLIGHT`

Terminal must include:
- Task ID/current task blob/execution lease;
- start/final main SHA;
- confirmation zero source/deploy/DB/game/provider/Production mutation;
- exact current R3 media slot/current media fields/bindings inventory;
- exact historical donor/image implementation commit(s) + file paths inspected;
- exact asset/manifest/storage/service reality;
- classification A/B/C above;
- if A: one narrow next implementation plan with exact paths/tests/deploy scope;
- if B/C: exact missing input, without inventing a substitute;
- confirmation capability boundary, feedback revision, and CSA7/9 remained frozen.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.