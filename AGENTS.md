# Company v1 development rules

These rules are binding for Company implementation, review, QA, and rollout.

## Mandatory authority read

Before giving or executing any Company runtime/content/UI instruction, read in order:

1. `CURRENT_TRUTH.md`
2. `docs/redesign/COMPANY_CANON.md`
3. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
4. `docs/redesign/MEDIA_CATALOG_CONTRACT.md` for image/media work
5. `docs/ops/CURRENT_TASK.md`

Do not rely on memory, old Issue comments, draft PR text, current tests, or current code when they conflict with the main canon.

`CURRENT_TASK.md` is execution authority only. It cannot reinterpret or weaken product canon.

## Product-first law

- Test count is not evidence of correctness.
- Turn Commit, DB readback, exact four choices, and network health are structural evidence only.
- Actual deployed browser play is required for product acceptance.
- Live QA must include real adult-oriented player behavior, social/non-work play, refusal/change-of-mind, movement/alone state, CSA lifecycle, MM/player thought, media, mobile, memory, and refresh lanes as required by `LIVE_ACCEPTANCE_MATRIX.md`.
- Do not claim owner-ready from a narrow 4-turn critical smoke.

## Architecture law

- Preserve A′ unless an explicit owner decision changes it.
- One ordinary turn remains server-owned Story -> one post-Story observer -> atomic Commit.
- Prefer root-cause fixes at the owning boundary.
- Do not add generic relation/consent/emotion engines, generic physical ontology, generic CSA execution DSL, separate choice/MM/media LLMs, automatic retry-until-lucky, or provider/model correctness swaps as incidental fixes.
- One durable domain has one canonical writer.
- `scene_note` remains the first immediate continuity mechanism; add structure only after a concrete accepted failure proves need.

## Content law

- Canonical finite semantic content belongs in repository content, not SQL/frontend shadow catalogs.
- Character cards must be written for dramatizable behavior and may not leak internal labels directly into Story.
- Media semantic/curation catalog follows `MEDIA_CATALOG_CONTRACT.md`; DB `image_library` is a deployed/query index, not a second independent semantic truth once the repository manifest is introduced.

## Review / mutation safety

- Freeze exact review SHA before reviewing moving source.
- Current source, live DB, Git ancestry, and immutable run evidence are verification sources for implementation facts, but they do not override product canon.
- Historical applied migrations are immutable; use additive migrations only.
- Do not access/change Production, mutate preserved evidence games, force-push/rewrite history, or change provider/model for correctness without explicit authorization.
- When live play finds a defect, preserve the exact game/turn, identify the first broken boundary, fix narrowly, and rerun a fresh relevant acceptance path. Do not sample until lucky.

## Change control

Any new product-law change requires explicit owner decision -> canon update on main -> acceptance update -> implementation task. Code-first product decisions are prohibited.