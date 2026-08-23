# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-approved-media-image-character-tts-v1
Mode: REUSE APPROVED MEDIA CONTRACTS -> R3 PRESENTATION-ONLY IMAGE PROJECTION + CHARACTER-AWARE SERVER TTS -> TEST DEPLOY -> BARE-PUBLIC ACCEPTANCE
Updated: 2026-08-23 23:48 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386591995`
Operator review: Issue #68 comment `5386633620`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted baseline — preserve

Accepted executable/source before this cut:
- `fad4d7f5cd637cf77b9613335eeaef2302c03853`

Current main before this registration:
- `ec36fc0820c613872bf433beb6b5a1e34dfd1dff`
- docs-only descendant recording reset runtime acceptance; no executable drift from the accepted source.

Current TEST artifacts remain:
- API `game-proxy-company-r3` version `c7b0f0fe-9c20-4cec-8af0-8e27508b44ff`
- Frontend `gamebuilder-company-r3` version `74f14b2c-fcb0-47ce-b14d-ecb90ece7ff1`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze the already accepted product/runtime behavior:
- first-day/first-arrival Opening and selected department/rank preservation;
- exact player agency/navigation/action literal authority;
- committed player inner thought and character-specific first-person Mind Monitor;
- Story-owned four choices and accepted terminal choice formatting variants;
- chronological CSA APPLY/CHANGE/REMOVE, one operation = one normal Story turn;
- high-parity five-tab CSA draft UI and one-pending-operation behavior;
- ordinary post-CSA turns free of stale `csa_operation`;
- same-game reset runtime: same game Turn3 -> fresh Turn0 -> refresh/re-entry -> clean Turn1 GREEN;
- mobile core controls and refresh/re-entry outside deferred native-confirm automation.

Reset native-confirm browser automation remains `DEFERRED_ENVIRONMENT`; do not reopen reset runtime in this task.

Do not change provider/model/temperature/token/timeout, Story/Observer semantics, CSA semantics, gameplay persistence/schema, reset, navigation, choice parsing, or unrelated timeline/history UI.

## 1. Owner media requirement

Issue #68 owner authority `5384780073` superseded earlier owner-ready assumptions and requires real image/TTS sidecars before owner readiness.

Current R3 is incomplete:
- `frontend-r3/index.html` already contains `#media-panel`, `#character-image`, `#audio-player`, `#tts-toggle`, `#tts-replay`, and status shells;
- `frontend-r3/app.js` still uses generic browser `speechSynthesis` / whole-Story `SpeechSynthesisUtterance`, which is NOT the accepted product TTS path;
- R3 currently has no dedicated approved-media server plumbing.

Existing Company assets/contracts already present on main and must be treated as donor/reference, not blindly copied gameplay authority:
- `src/engine/media/image-selector.js` — deterministic zero-LLM curated image selector;
- `src/engine/media/tts-contract.js` — server eligibility gate resolving `character_id -> voice_id`, rejecting narrator/unknown/no-voice;
- `src/api/media-routes.js` — existing Service Binding TTS transport pattern;
- `src/frontend/pages/tts.js` — character-dialogue batching/dedup/cancel/replay behavior;
- `src/frontend/pages/utility-ui.js` — stale-safe image request/render behavior;
- `content/characters.json` — canonical heroine voice IDs and image storage metadata;
- `test/content-media-contract.test.mjs` — established media behavior tests.

Existing non-R3 API config already proves the intended TTS service identity:
- binding `TTS_WORKER`
- service `fancy-dust-7f8c`
- current legacy URL var `https://fancy-dust-7f8c.zeroslove.workers.dev/`

R3 `wrangler.r3.api.jsonc` does not yet bind that service.

Goal: connect the smallest presentation-only R3 media path using the approved Company metadata/contracts. Do not create another media provider, another LLM call, or a second gameplay authority.

## 2. Mandatory pre-edit inventory

Before source changes, read and record the exact current boundaries.

### A. Image data/source inventory

Read-only only:
1. inspect current TEST `image_library` availability/schema/access through the existing service-role/server path where available;
2. inspect active curated rows for registered Company heroines (`heroine1` ... `heroine5`) by character and pool, without dumping secrets or bulk catalog contents;
3. verify whether stored `image_url` values are directly renderable and/or whether canonical `storage_bucket`, `storage_prefix`, `primary_image_path`, `adult_image_prefix` in `content/characters.json` already provide the established general-image fallback;
4. identify which source is the current approved source of truth for general and sex images.

No DB writes, no migration, no new media table in this cut.

If `image_library` is absent but canonical primary image metadata points to an already-existing readable object, a bounded general-image fallback to that canonical primary image is allowed. Do not manufacture new media records.

If neither curated rows nor canonical readable image objects exist, STOP `BLOCKED_MEDIA_DATA` with evidence. Do not create fake placeholders or a new media persistence system.

### B. R3 committed projection inventory

Determine exactly which already-committed facts can drive presentation without new inference/model calls:
- current canonical scene location;
- present NPC IDs;
- focal actor / relevant current character;
- latest committed Story text and current turn/revision identity;
- any already-committed physical/clothing/sexual evidence available in the R3 context;
- deterministic speaker/dialogue segmentation already available from R3 presentation parsing.

Do not add a Story/Observer field solely to serve media unless the existing committed projection genuinely lacks a structurally necessary value and the change is demonstrably presentation-only. Prefer deriving media from current committed context plus deterministic parser output.

### C. TTS transport inventory

Verify before edit/deploy:
- canonical `voice_id` exists for each registered heroine used in acceptance;
- `fancy-dust-7f8c` service is still an existing TEST-accessible Worker/service binding target;
- the existing TTS Worker request/response contract is still `{ voice_id, text, direction } -> { url }` or document the exact current compatible shape;
- no additional secret is required beyond the Service Binding.

Do not print, rotate, recreate, or migrate secrets.

## 3. Image projection contract

Image is presentation only. It must never become gameplay authority.

### Character selection

For each committed current turn/opening:
1. only registered Company heroine IDs are eligible;
2. eligible character must be present in the committed current scene;
3. prefer the committed focal heroine when eligible;
4. otherwise use a deterministic present registered heroine only if the selection is unambiguous/relevant under existing committed projection;
5. never show a remote/not-present character merely because that character has an image.

### Pool/tags

- Default to `general` unless existing committed evidence explicitly supports another approved pool.
- Do NOT treat raw player intent/attempt alone as proof that a sexual act occurred.
- A `sex` pool request is permitted only when already-committed scene/physical/sexual evidence supports a sexual scene under the existing product contract.
- Reuse the existing image tag allowlist/selector semantics where compatible; do not add an LLM image classifier.
- Unknown/unproven tags are discarded, not guessed.

### Server selection

Use a bounded deterministic server path:
- query only the requested eligible character + pool;
- active curated candidates only;
- bounded candidate count (existing donor uses at most 8 ordered by curation rank);
- deterministic `selectImage`-equivalent scoring;
- return one approved image or `null`;
- no Story prompt contamination and zero additional model calls.

Prefer transplanting the small pure media contract into the R3 namespace or otherwise isolating it from legacy gameplay runtime. Do not make R3 depend on the old v1 turn engine as an active gameplay authority merely to reuse media helpers.

### Frontend behavior

Use the existing R3 shells:
- `#media-panel`
- `#character-image`
- `#image-status`

Require:
- successful current request renders one approved URL with appropriate alt/status;
- no eligible image => panel is hidden/empty without erroring the game;
- stale prior-turn/revision success or failure cannot overwrite the latest committed turn image;
- same committed identity is deduplicated;
- image failure is fail-open and does not block input/choices/Story/commit;
- refresh/re-entry reconstructs media from committed server context, not client gameplay state.

No autoplay slideshow, no image generation, no LLM ranking.

## 4. Character-aware server TTS contract

The generic whole-Story browser TTS in `frontend-r3/app.js` must be removed from the product path.

### Eligibility

Only character dialogue is eligible:
- registered known Company heroine speaker;
- current speaker must be present in committed scene;
- exact non-empty dialogue text;
- canonical character must have a non-empty `voice_id`.

Always reject/skip:
- narrator;
- player narration/dialogue as a character voice;
- player inner thought;
- Mind Monitor/private thought;
- unknown/general generated speaker without a canonical voice ID;
- remote/not-present character.

Server remains the final voice eligibility authority even if the client sends a character ID.

### Dialogue extraction

Reuse/transplant existing deterministic speaker parsing/presentation structures. No LLM call is allowed for TTS segmentation.

Preserve exact spoken dialogue text except bounded TTS pronunciation normalization already established by the donor contract. Do not rewrite meaning or merge different speakers.

If several present NPCs speak:
- prefer focal/current selected relevant canonical character when that character has dialogue;
- otherwise deterministically choose the primary present speaker using established donor behavior;
- never synthesize all Story narration as one voice.

### Transport

Add the R3 server TTS route under the existing R3 API namespace and use Service Binding:
- `TTS_WORKER` -> existing service `fancy-dust-7f8c`;
- add only the R3 Worker service binding/config required to match the already-established Company contract;
- no browser direct call to the external TTS Worker;
- no new API secret;
- upstream returns a direct audio URL consumed by persistent `#audio-player`.

If the Service Binding cannot be configured or the existing service contract is unavailable, STOP `BLOCKED_TTS_ENVIRONMENT`; do NOT fall back to browser `speechSynthesis`.

### Toggle/replay lifecycle

R3 TTS is default OFF for a fresh browser/session unless the existing R3 product preference explicitly says otherwise. Preserve the critical rule:
- TTS OFF => zero server TTS API calls.

Also require:
- never call TTS during Story streaming before commit;
- only committed turn/revision dialogue can enqueue;
- dedupe same committed identity + speaker + exact text;
- new turn cancels/drops stale prior-turn queued/active playback as donor contract does;
- same-turn feedback revision supersedes old queued revision audio;
- replay may reuse cached returned audio URL without another synthesis request;
- TTS failure is presentation-only: status error + controls recover, gameplay remains usable;
- turning TTS off stops playback and prevents late responses from starting audio.

No `speechSynthesis` or `SpeechSynthesisUtterance` product fallback may remain after this cut.

## 5. R3 API/security boundary

Add only read-only/presentation media endpoints required by the R3 frontend, following the existing R3 route/capability conventions.

Requirements:
- media endpoints do not create turns/jobs/actions/revisions;
- no game state mutation;
- validate the requested game through the existing R3 game/capability boundary rather than exposing an unauthenticated arbitrary voice/image proxy;
- character requests must be grounded in registered canonical content and current committed presence where the endpoint has enough context to enforce it;
- errors are bounded JSON errors and never corrupt SSE/gameplay state.

Do not add DB schema or RPCs for media in this cut.

## 6. Deterministic regressions

Add focused R3 media tests before live deployment. At minimum prove:

### Image
1. only registered present heroine can be selected;
2. focal present heroine wins deterministic selection;
3. remote/not-present heroine cannot be rendered;
4. general image selection uses approved active/canonical media only;
5. sexual pool is not selected from player intent alone;
6. stale older image success/failure cannot overwrite current turn/revision;
7. no candidate/image error returns fail-open presentation state and does not alter gameplay context;
8. media request does not call Story/Observer/provider or reserve a turn.

### TTS
9. narrator/player/inner-thought/Mind-Monitor are ineligible;
10. unknown or no-voice speaker is rejected;
11. registered present heroine maps to exact canonical `voice_id`;
12. server route calls Service Binding with exact character voice + dialogue text + bounded direction;
13. TTS OFF makes zero API calls;
14. streaming delta alone makes zero TTS calls;
15. committed dialogue generates at most one synthesis for the dedup key;
16. replay reuses cached URL where available;
17. new turn and feedback revision fence stale audio;
18. TTS failure/late response cannot block gameplay or start after OFF;
19. source scan confirms no R3 product use of `speechSynthesis` / `SpeechSynthesisUtterance` remains.

### Frozen regressions
20. existing agency/navigation/choice-tail/CSA/draft/reset contracts remain green.

Run:
- focused R3 media/frontend/server tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

## 7. TEST deployment

Deploy exact changed source to TEST only.

Expected affected artifacts if implementation follows the proven boundaries:
- API `game-proxy-company-r3` — media endpoints + TTS Service Binding + deterministic image/TTS presentation plumbing;
- Frontend `gamebuilder-company-r3` — image request/render + character dialogue TTS controller replacing browser TTS.

If only one artifact actually changes, deploy only that one.

For R3 API config, preserve all existing vars/bindings/secrets and add only the already-established TTS Service Binding/URL configuration required by the current service contract.

No Production.
No secret printing/rotation.
No migration.

Record exact source SHA and exact Worker version IDs.

## 8. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override, no storage preseed, no direct-API gameplay substitute.
Fresh disposable TEST games only.

### Gate A — image projection

Create visible Setup -> Opening and reach a scene containing at least one registered heroine with approved media.

Require:
- current/present/focal heroine identity is visible/readable from committed context;
- image request uses that exact eligible character;
- returned image is demonstrably from approved canonical/active media for that character;
- image panel renders without blocking Story/choices/input;
- a subsequent committed turn/location/focal change cannot be overwritten by a late stale previous image request;
- if the next scene has no eligible image character, stale old image does not remain authoritative.

If no approved image can be obtained despite verified data/config, stop with exact first boundary. Do not use a web placeholder or generated image.

### Gate B — TTS OFF

Before enabling TTS:
- commit at least one ordinary turn containing registered NPC dialogue;
- prove zero R3 TTS synthesis request occurs while toggle is OFF;
- narrator/player/inner-thought are never sent.

### Gate C — character-aware server TTS

Enable TTS through the visible R3 control, then commit or replay a committed turn with registered present NPC dialogue.

Require:
- frontend sends only eligible character dialogue with canonical `character_id`;
- server resolves that character to the canonical voice ID under deterministic tests/diagnostics;
- request goes through R3 API -> `TTS_WORKER` Service Binding, not browser speech synthesis and not direct browser-to-TTS-worker;
- successful upstream result provides a playable audio URL to `#audio-player`;
- UI remains responsive while audio is synthesized/played;
- no duplicate Story/turn/TTS synthesis for the same committed batch.

Live automation does not need to judge subjective voice acting quality by microphone. It must prove the character-specific server routing/mapping and playable returned audio transport. If audio is actually audible/verifiable through the browser harness, record it as additional evidence only.

### Gate D — replay / transition / refresh

Require:
- replay of already cached latest batch does not create another synthesis request when donor cache contract applies;
- next committed turn does not allow stale previous audio/image to become current authority;
- refresh/re-entry reconstructs current image eligibility from server context;
- TTS remains a UI preference/presentation sidecar and does not replay old speech automatically unless current product preference explicitly calls for it.

### Gate E — failure-safe spot check

Do not sabotage the live provider. Use deterministic tests plus normal UI inspection to prove:
- image/TTS status areas can show bounded failure;
- input, four choices, CSA app, reset, history remain usable after media failure paths;
- no turn/job/state mutation is caused by media calls.

### Gate F — mobile

At approximately 390x844:
- image panel does not cover Story/actions;
- image uses contained responsive sizing;
- TTS toggle/replay/audio controls remain reachable;
- four choices and direct input remain reachable;
- no blocking overlay/overflow regression.

## 9. GREEN criteria

GREEN only if:
- approved image source/data boundary is evidenced;
- R3 renders the correct eligible current character image and safely clears/fences stale media;
- generic browser whole-Story TTS is removed from the R3 product path;
- TTS OFF produces zero synthesis calls;
- eligible character dialogue uses canonical character voice through R3 server + `TTS_WORKER` Service Binding;
- narrator/player/private thought are not synthesized as character dialogue;
- media is presentation-only/fail-open and cannot mutate/block gameplay;
- focused/full tests pass;
- exact changed TEST artifacts are deployed and live accepted;
- no Production/schema/provider/model/owner-game/forbidden work occurs.

Do NOT claim owner-ready after this cut.

## 10. After this cut

Only after media/TTS is GREEN, resume owner-remediation order:
1. timeline/current-scene presentation residue;
2. deferred native-confirm live automation limitation if still materially relevant;
3. final holistic owner-style long-play acceptance across all repaired surfaces.

## 12. Terminal evidence (2026-08-24 KST)

TERMINAL_OUTCOME: FAILED_PRODUCT
SOURCE_IMPLEMENTATION_SHA: 25688dd4c478b72ace1ad514e99498fc3469cfc0
TERMINAL_CONTROL_COMMIT: bb40371

### Implementation and verification

Implemented and pushed the presentation-only R3 media path in source commit `25688dd4c478b72ace1ad514e99498fc3469cfc0`:

- `frontend-r3/app.js`
- `frontend-r3/media.js`
- `frontend-r3/r3-client.js`
- `frontend-r3/r3-view-model.js`
- `frontend-r3/tts.js`
- `runtime-r3/domain/media.js`
- `runtime-r3/server/store.js`
- `runtime-r3/server/supabase-store.js`
- `runtime-r3/server/worker.js`
- `test/r3-approved-media.test.mjs`
- `test/r3-frontend-contract.test.mjs`
- `wrangler.r3.api.jsonc`

The implementation is deterministic and presentation-only: approved active image rows are selected through the R3 server path; sexual-pool selection requires committed sexual evidence; TTS accepts only registered present heroine dialogue and resolves the canonical voice through the existing `TTS_WORKER` Service Binding; media failures fail open; browser `speechSynthesis` and `SpeechSynthesisUtterance` are absent from the R3 product path. No gameplay state, schema, migration, provider/model, Production, preserved game, or existing data was changed.

Focused tests passed: `node --test test/r3-approved-media.test.mjs` (5/5) and `node --test test/r3-frontend-contract.test.mjs` (14/14). Full `npm.cmd test` passed (526/526). Changed JS/MJS `node --check` passed and `git diff --check` passed. Wrangler dry-runs passed.

### TEST inventory, deploy, and live evidence

Read-only TEST inventory found `public.image_library` and `storage.objects`; active `company-v1` image rows for heroine1..5 were present (14, 22, 21, 23, 22), with one general row per heroine and populated sex rows. General primary URLs were readable. Corrected heroine3 storage HEAD was HTTP 200, `image/jpeg`, 275914 bytes at `https://fmcrspgxstsmxxsmkeee.supabase.co/storage/v1/object/public/Image/Heroine3/jena_main.jpg`.

Exact TEST deployments:

- API `game-proxy-company-r3`, version `e1135324-20ba-4410-91bf-c3c31b59a10f`.
- Frontend `gamebuilder-company-r3`, version `1efd7d4a-b9b6-48af-9b07-baab0f2f6000`.
- API binding `TTS_WORKER` -> `fancy-dust-7f8c`, with the established `{voice_id,text,direction}` transport.

Fresh disposable visible TEST fixture: `e0238ff2-9cfb-4c60-a74c-ab03a0c732d1`. Opening plus three ordinary visible Korean-input turns were committed through the bare public frontend. Desktop high-parity layout and mobile `390x844` controls were inspected; four choices, direct input, image/TTS shells, and TTS controls remained reachable. TTS OFF produced zero `/media/tts` calls, including after explicit visible toggle true/false interaction.

### Gate result and first boundary

- Gate A: NOT MET. The fresh committed context contained five present heroines but no focal/relevant heroine field, and stored Story dialogue used natural quoted text rather than the deterministic canonical speaker form. The implementation correctly refused to guess an image character, so no live image request/render was claimed.
- Gate B: MET for OFF behavior: zero TTS synthesis calls while OFF; no narrator/player/private thought was sent.
- Gate C: NOT MET. No eligible canonical present-character dialogue existed in the fresh committed context, so no live server synthesis/audio URL could be honestly claimed.
- Gate D: NOT MET as a full live gate; no eligible media batch existed to exercise replay/transition media behavior. Deterministic stale fencing/cache tests passed.
- Gate E: MET by deterministic fail-open implementation/tests and normal UI inspection; media calls are read-only and cannot block gameplay.
- Gate F: MET by `390x844` inspection; no blocking overlay/overflow evidence, and choices/direct input/TTS controls remained reachable.

This is an objective product/Story-Observer contract boundary, not a harness retry condition. Stop as `FAILED_PRODUCT`; do not claim owner-ready, do not mutate the fresh or preserved games, and do not create or start a next task. Owner/product authority must decide whether the committed projection should expose a focal/relevant heroine and canonical speaker identity before a truthful A/C retest.

## 11. Terminal report

Post one terminal report to Issue #68 with:
- status `WAITING_REVIEW`, `FAILED_PRODUCT`, `BLOCKED_MEDIA_DATA`, or `BLOCKED_TTS_ENVIRONMENT`;
- source/final main SHA and CURRENT_TASK blob;
- pre-edit image-library/storage inventory result;
- exact image selection/projection implementation and approved source proof;
- exact TTS eligibility/route/Service Binding implementation;
- proof generic browser speech synthesis is removed/not used;
- focused/full tests;
- TEST API/frontend version IDs and binding verification;
- fresh fixture IDs;
- Gate A-F evidence;
- media failure/fail-open evidence;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not generate the next task.
