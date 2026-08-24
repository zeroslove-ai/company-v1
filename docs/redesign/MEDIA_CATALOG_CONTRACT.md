# Company Media Catalog Contract

Status: **OWNER_ACCEPTED / L2 SPECIALIZED CANON**  
Accepted: 2026-08-24 KST

This contract defines image catalog semantics. It does not make media narrative authority.

## M-CATALOG-001 — One semantic catalog

Forward semantic/curation source shall be a repository manifest:

`content/media_catalog.json`

The manifest stores metadata and asset locators, not binary image files.

Required fields per active image entry:

- stable `image_id`;
- `character_id` (registered heroine);
- `pool`: `general` or `sex`;
- `situation` natural-language scene fit;
- finite/freeform `tags` used only for presentation selection;
- `active`;
- `curation_rank`;
- `asset_locator` / deployed URL mapping information.

Supabase `image_library` is the deployed/query index. Once the manifest is introduced and reconciled, the DB must not become a separate semantic catalog whose labels/tags silently diverge from repository canon.

## M-CATALOG-002 — Catalog coverage quality

No arbitrary numeric quota is canonized, but media is not accepted when a heroine has only one generic portrait for all ordinary Company life and no meaningful scene variation despite the UI presenting images as current-scene media.

Each heroine’s catalog should cover enough distinct real gameplay situations to avoid systematic wrong/repetitive presentation. Adult pools should cover the actually supported adult/intimate scene families represented by available approved assets.

Catalog quality is judged in real play, not by row count alone.

## M-SELECT-001 — Grounded selection

Image selection is presentation-only and must use current committed evidence.

- Choose only the current registered heroine who is actually grounded/present/focal as appropriate.
- `general` for ordinary/general scene presentation.
- `sex` only when the committed scene actually establishes an adult/intimate/sexual act/state appropriate to that pool.
- A player request that was refused or did not occur is not sufficient to select a sex image.
- Ending/leaving an intimate scene must not leave stale sex media visible.
- Refresh/replay of the same committed scene should preserve equivalent media meaning.
- If no appropriate image exists, fail open to no image or a safe same-character general fallback where semantically appropriate; never show another heroine or an unrelated sexual act.

## M-ARCH-001 — Minimal implementation

Do not add a media LLM, sexual-event ledger, generic physical ontology, or gameplay state solely for image selection.

Preferred implementation uses the existing single post-Story observer or a deterministic post-commit presentation projection to provide a **non-authoritative media hint**, e.g. current heroine + pool + small tags. Validation may drop bad hints locally.

Media hint is not Story success/failure, consent, relationship, or durable world truth.

## Known 2026-08-24 deployed baseline — evidence, not target

Read-only `image_library` inventory for `edition_id=company-v1` showed:

- heroine1: general 1 / sex 13
- heroine2: general 1 / sex 21
- heroine3: general 1 / sex 20
- heroine4: general 1 / sex 22
- heroine5: general 1 / sex 21

Thus ordinary general-scene coverage is effectively one portrait per heroine while 97 adult-pool rows exist.

Current R3 evidence also shows a reachability defect candidate: frontend projection requests `general` unconditionally and the server’s sex-pool gate depends on sexual evidence not projected by the current minimal observer. Implementation must reconcile catalog **and** reachability; adding rows alone is insufficient.

## M-ACCEPT-001

Before media is accepted, deployed browser play must demonstrate:

1. correct heroine image authority;
2. at least several meaningfully different ordinary situations without systematic single-portrait repetition where catalog assets exist;
3. a genuinely committed adult/intimate scene reaching an appropriate sex-pool image;
4. requested-but-refused adult action not switching to a false sex image;
5. scene end/de-escalation removing stale adult media;
6. refresh/replay coherence;
7. image failure never blocking Story/Commit.