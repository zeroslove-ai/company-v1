# Company — CURRENT TASK

Status: READY
Task ID: company-r3-media-catalog-authority-reconciliation-v1
Mode: NARROW P1 REPAIR — REPOSITORY MEDIA MANIFEST SOLE SEMANTIC AUTHORITY / READ-ONLY ASSET CURATION / DB INDEX ONLY
Updated: 2026-08-25 06:28 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `7a79e97bcd0d71241b5ba86b2a4f44b8298cf004`
Previous task: `company-r3-media-tts-live-acceptance-v1`
Previous terminal: Issue #68 `5401516101`
Operator review: Issue #68 `5401581083`
Accepted executable implementation before this repair: `bcc06683c084537e67a013fbddb577964a372d77`
Accepted TEST API before this repair: `game-proxy-company-r3` / `fc98e0c3-db75-4088-bc0c-eddf129af4b6`
Accepted TEST frontend: `gamebuilder-company-r3` / `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Preserved evidence games — READ ONLY, no reset/reuse/mutation:
- `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
- `36ef2c76-e592-4a09-ab7e-2d89aab4394c`
- `ab44e91c-5eaa-4fb1-9396-138073ec5257`
- `1ef46111-5a09-43cd-b61e-c0d36df04d12`
- `c04e91e5-e18f-492f-8b85-32104bb5c3b1`
- `babfa5a6-719b-4dbe-a392-cb2c62cc1faa`
- `bbd1431a-f09f-40f4-82fa-c8827de84693`
- `b91607f4-6945-44eb-87a3-6f2b2d6e1834`
- `9a5c3943-2e9e-4254-b6de-7638bdd88a76`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, `docs/redesign/MEDIA_CATALOG_CONTRACT.md`, terminal `5401516101`, operator review `5401581083`, then this task.
- Preserve A′/R3 architecture and the accepted three-tier CSA foundation.
- This task owns only media catalog semantic authority/reconciliation. Freeze Story, Observer semantics except existing media-hint behavior, CSA, TTS, player agency, MM, scene, memory, and frontend presentation behavior unless a deterministic test proves they are directly required for this catalog authority repair.
- No Production access. No OWNER_READY claim.

Success terminal:
`MEDIA_CATALOG_AUTHORITY_RECONCILED_AWAITING_OPERATOR_REVIEW`

Curation/evidence blocked terminal:
`MEDIA_CATALOG_CURATION_EVIDENCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Product blocked terminal:
`MEDIA_CATALOG_AUTHORITY_REPAIR_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted/frozen evidence

Freeze as GREEN and do not rerun for pass-seeking:

- CSA 21-slot 7/7/7 presentation and mandatory representative semantic acceptance;
- Weak APPLY/CHANGE/REMOVE, W5 direction, M1/M3, M5 world-norm, S1 supported/unsupported finite boundary, named S2/S3/S5, S7 multi-NPC, multi-rule durability/residue;
- accepted selector implementation `79fbfd6013c2db54d4e6a68af6dc92123e292abb`;
- accepted S1 binding lineage `f607e4e868e18bde61ba8c46d508d3a502551c6f`;
- accepted heroine catalog projection `bcc06683c084537e67a013fbddb577964a372d77`;
- existing History/mobile/MM/private-app/compliance-vs-feeling evidence.

The previous Media/TTS browser run is NOT GREEN. It is preserved only as browser-control evidence:
- game `9a5c3943-...` reached ordinary Turns 0-4;
- no visible ordinary image was proven;
- TTS OFF network-zero proof was not observable;
- TTS ON timed out before result reconciliation;
- adult/refusal/de-escalation/refresh/replay lanes were not reached.

Do not access that game in this task.

---

# 1. Binding P1 / exact owning boundary

`MEDIA_CATALOG_CONTRACT.md` M-CATALOG-001 is binding:

- repository `content/media_catalog.json` is the semantic/curation source;
- manifest owns stable `image_id`, `character_id`, `pool`, `situation`, `tags`, `active`, `curation_rank`, and stable `asset_locator`;
- Supabase `image_library` is only deployed/query/serving index and must not silently become a second semantic catalog.

Current deterministic source contradiction:

1. repository manifest currently contains five active `general` entries, one per heroine, and zero `sex` entries;
2. `loadCanonicalCompanyR3Content()` correctly loads `media_catalog.json` into canonical content;
3. `catalogResponse()` exposes that canonical media catalog;
4. but `runtime-r3/server/supabase-store.js::listImageCandidates(characterId,pool)` queries `image_library` directly by `edition_id`, `character_id`, `image_pool`, DB `active`, and DB `curation_rank`;
5. `imageMediaResponse()` passes those DB rows directly to image selection;
6. therefore a DB-only row absent from the repository manifest can currently participate in selection and its DB semantic labels/rank can affect presentation.

That violates M-CATALOG-001 even before live sex-pool acceptance.

Do not fix this by deleting DB rows, changing DB schema, or treating all existing DB rows as canonical.

---

# 2. Phase A — read-only deployed media inventory and stable identity

Before source changes, inventory the deployed media system read-only.

Required:

1. inspect current `content/media_catalog.json` exactly;
2. inspect `image_library` for `edition_id=company-v1` read-only, including every actually available column relevant to identity/serving/metadata;
3. determine whether `image_id` is stable and unique for Company rows;
4. determine whether serving URLs are public stable URLs, signed/expiring URLs, or another form;
5. inspect Supabase Storage/object metadata read-only where accessible to establish bucket + object path or another stable identity;
6. map the existing five manifest general `asset_locator` values to the actual deployed objects/rows;
7. inventory candidate sex rows/assets without mutating them.

Asset curation law:

- Do not infer an adult act, pose, situation, character, or pool merely from a filename/path, folder name, numeric ID, old loose tag, or model guess.
- Trusted existing metadata may be used only when its provenance/meaning is sufficiently clear and it agrees with the actual asset.
- When visual inspection is available, inspect the actual asset and use only what is visibly supportable.
- Do not commit binary images into this repository.
- Do not canonize temporary/signed URLs as `asset_locator`.
- Prefer durable `storage://<bucket>/<object-path>` or another genuinely stable locator.
- A smaller truthful catalog is better than fabricated coverage.
- If candidate sex assets exist but no trustworthy stable identity and semantic meaning can be established, STOP with `MEDIA_CATALOG_CURATION_EVIDENCE_BLOCKED_AWAITING_OPERATOR_REVIEW`; report exactly what evidence is missing. Do not invent curation.

No DB/storage writes in this phase.

---

# 3. Phase B — reconcile repository manifest truthfully

Only after Phase A evidence is sufficient.

Update `content/media_catalog.json` as the sole semantic catalog.

Requirements for every active entry:

- unique stable `image_id` matching a deployed query-index identity;
- registered heroine `character_id`;
- `pool` exactly `general` or `sex`;
- truthful natural-language `situation` grounded in the asset/trusted evidence;
- small useful `tags` grounded in the asset/trusted evidence;
- `active` boolean owned by manifest;
- `curation_rank` owned by manifest;
- stable non-temporary `asset_locator`.

General entries:
- preserve the existing five only if their stable locator and character mapping are verified;
- correct or deactivate any entry whose actual object cannot be verified; explain evidence.

Sex entries:
- curate all high-confidence candidate assets reasonably inspectable in this task; do not stop at an arbitrary one-row sample if multiple assets are clearly classifiable;
- success may not claim adult media readiness with zero approved sex entries when verified suitable sex assets are actually available;
- there is no numeric quota and no requirement to force every existing DB sex row into the manifest;
- do not create a taxonomy deeper than useful natural situation/tags.

Do not modify `characters.json` or CSA content for media curation.

---

# 4. Phase C — make runtime manifest-authoritative

Repair the smallest runtime boundary so DB is a serving index only.

Required behavior:

1. derive approved candidates from `content.mediaCatalog.entries` first;
2. filter by manifest `active`, exact `character_id`, and exact `pool`;
3. only manifest-approved `image_id`s may be queried from `image_library`;
4. DB supplies only deployed identity/serving information required at request time, principally `image_id` + `image_url` (and only unavoidable operational fields);
5. semantic fields used by selection — `character_id`, `pool`, `situation`, `tags`, `active`, `curation_rank`, stable locator — come from the repository manifest, not DB copies;
6. join DB serving rows to manifest by exact stable `image_id`;
7. a DB-only rogue row must never be selectable;
8. a DB row whose semantic labels disagree with the manifest must not override manifest semantics;
9. an approved manifest entry missing from the DB serving index fails open to no image; Story/Commit remain unaffected;
10. duplicate/ambiguous DB identity must fail local/fail-open, not select arbitrarily;
11. existing `projectCurrentMedia()`, grounded observer `media_hint`, and frontend projection remain presentation-only and must not become gameplay authority.

Preferred code shape:
- keep manifest filtering/join semantics in the R3 media domain/worker boundary;
- make store candidate lookup accept exact approved image IDs rather than semantic `character_id/pool` authority;
- do not add a media LLM, physical/sexual ledger, new relation state, or generic ontology.

---

# 5. Allowed source scope

Expected changed files are limited to the owning boundary, for example:

- `content/media_catalog.json`
- `runtime-r3/domain/media.js`
- `runtime-r3/server/worker.js`
- `runtime-r3/server/supabase-store.js`
- `runtime-r3/server/store.js` only if the in-memory/store interface needs the same exact-ID contract
- one existing media/catalog contract test file, preferably `test/content-media-contract.test.mjs` or a focused R3 media contract test

`runtime-r3/domain/content-loader.js` should not need semantic redesign because it already loads `media_catalog.json`.

If another file is truly required, document the deterministic reason in the terminal report.

Forbidden unless a new deterministic owning-boundary proof requires operator review first:
- Story/provider prompt changes;
- Observer semantic expansion beyond existing media_hint contract;
- frontend changes or frontend redeploy;
- TTS code changes;
- CSA/catalog semantics;
- scene/MM/memory/player-thought changes;
- DB schema/RPC/migration;
- provider/model/config/secret/timeout changes.

---

# 6. Deterministic regression contract

Add/extend tests using real canonical content, not only synthetic media fixtures.

At minimum prove:

## Manifest shape and source authority
- actual loaded canonical `mediaCatalog` equals repository manifest;
- active image IDs are unique;
- active entries use registered heroines and valid pools;
- every active entry has non-empty situation, bounded truthful tags, finite rank, and stable locator;
- active locators do not use signed/temporary HTTP URLs as canon;
- no duplicate semantic source is introduced.

## DB rogue-row exclusion
Given an approved manifest general or sex set plus DB rows containing:
- approved rows;
- a high-ranked DB-only rogue row for the same heroine/pool;
- a DB row with conflicting situation/tags/rank;
prove only exact manifest-approved IDs are eligible and selection semantics come from manifest.

## Missing index fail-open
- manifest-approved ID absent from DB => no crash, no Story/Commit impact, no unrelated fallback heroine/act.

## Exact pool authority
- general request cannot select manifest sex entry;
- sex request cannot select manifest general entry;
- if manifest has zero approved entries for a requested pool, DB-only rows in that pool remain unreachable.

## Existing presentation invariants
Keep green:
- committed adult evidence can still project `sex` when existing grounded media_hint permits it;
- refusal/stop evidence cannot validate a false sex media_hint;
- focal/current heroine authority remains exact;
- image failure remains local;
- TTS tests remain green without TTS code changes.

Run:
- focused media/catalog tests;
- full `npm test`;
- `node --check` for changed JS/MJS;
- parse/validate final media manifest;
- `git diff --check`.

No gameplay/browser acceptance is required in this task.

---

# 7. TEST deployment

Only after deterministic GREEN and only if executable/content Worker source changed:

- deploy `game-proxy-company-r3` to TEST exactly once through the existing contract-gated path;
- record old API Worker `fc98e0c3-db75-4088-bc0c-eddf129af4b6` and exact new Worker version;
- verify `/api/r3/catalogs` exposes the reconciled manifest source-equivalently;
- do not create a game for this task;
- do not call media endpoints using preserved games;
- do not redeploy frontend; it must remain `gamebuilder-company-r3 / af6c13bf-ef57-40cb-a4f0-e3569b301bc5` or proven exact source-equivalent;
- DB/storage remains read-only;
- no Production.

If deployment drift is detected, STOP and report; do not normalize unrelated components.

---

# 8. Stop law

Immediate STOP conditions:

- unable to establish stable identity for the existing canonical general entries;
- unable to establish trustworthy semantics/stable identity for any available sex candidate while such coverage is required for later M-ACCEPT-001;
- asset evidence conflicts materially with existing metadata and cannot be resolved safely;
- deterministic tests show the proposed exact-ID join still permits DB semantic authority;
- required repair expands into Story/Observer/TTS/frontend/gameplay architecture rather than catalog authority;
- unexpected executable/deployment drift.

Do not solve evidence gaps by guessing.
Do not write DB/storage to make tests pass.
Do not run browser gameplay to hunt for a passing asset.

---

# 9. Forbidden

- Production access/deploy = 0;
- DB writes, schema/RPC/migration/ledger/history repair/backfill = 0;
- Supabase Storage object mutation/upload/delete = 0;
- `supabase db push` forbidden;
- frontend source changes/deploy = 0;
- provider/model/config/secret/timeout changes = 0;
- previous evidence-game access/mutation/reset = 0;
- new gameplay game creation = 0;
- retry/regeneration/sample-until-pass = 0;
- new branch/PR/CURRENT_TASK file = 0;
- OWNER_READY claim forbidden.

---

# 10. Terminal report contract

Report exactly:

- start/final main SHA;
- implementation SHA;
- final CURRENT_TASK blob;
- exact changed files;
- read-only `image_library` inventory counts by heroine/pool and relevant actual columns;
- stable identity/storage evidence and whether URLs are stable or temporary;
- mapping status for the original five general manifest entries;
- number of candidate assets inspected and final approved/deactivated/unclassified counts by heroine/pool, without claiming semantic meaning for unverified assets;
- final manifest summary and evidence basis for new/changed entries;
- proof no binary assets committed;
- proof runtime queries only manifest-approved exact IDs;
- proof DB semantic labels/rank cannot override manifest;
- rogue-row, conflicting-metadata, missing-index, pool-separation tests;
- focused/full/syntax/manifest/diff results;
- TEST API old/new Worker versions and deploy count;
- frontend version unchanged and deploy count 0;
- game creation/access count 0;
- DB/storage writes 0;
- Production 0;
- preserved evidence access/mutation 0;
- P0/P1/P2/P3 findings and any remaining curation gap.

Success:
`MEDIA_CATALOG_AUTHORITY_RECONCILED_AWAITING_OPERATOR_REVIEW`

If asset identity/semantic evidence is insufficient:
`MEDIA_CATALOG_CURATION_EVIDENCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

If implementation/deterministic product repair is blocked:
`MEDIA_CATALOG_AUTHORITY_REPAIR_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.
