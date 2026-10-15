# R4 candidate branch-local instruction — 2026-10-15

Applies only to `rebuild/company-core-r4-20261015` and its dedicated worktree.
Read `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/ops/CURRENT_TASK.md`, and `docs/rebuild-r4/IMPLEMENTATION_SPEC_KO.md` before implementation decisions. The owner supplied the execution instruction in `docs/rebuild-r4/CODEX_START_KO.txt`; do not wait for routine phase-by-phase approval.

The R4 task independently rebuilds command/context/memory/observation/persistence/recovery while retaining the Story -> Observer -> atomic Commit spine. It does not redefine the product. `CURRENT_TRUTH.md`, `COMPANY_CANON.md`, and their specialized contracts remain product authority: this is the adult character-first interactive fiction `상식개변: 회사편`, not a generic office-life or productivity simulator. Keep the private-app premise, authored cast, world, source media mappings, and established reader-facing UI connected. Do not expose internal character labels as story prose or force the whole cast into every scene.

Lunch, cafeteria, notices, and on-call assignment examples are technical fixtures only. Keep them in tests or an explicitly selected demo provider. They are not product content, a default live Story provider, or narrative acceptance evidence. Do not strip or rewrite existing content/assets. The original adult edition and its canonical rule catalog must stay connected and unchanged, but this task does not authorize creating or improving explicit content or sexual coercion. Live model rule scenes may use only an already-canonical, non-explicit, non-coercive case; if none is available, record live rule reaction as unverified and use structural tests only. Implement only existing canonical finite presets and semantics; do not invent or broaden rules, add a generic execution engine, or rewrite canonical source. Main, PR #104, R3 deployments, remote databases, and preserved saves remain protected; this candidate is not production or whole-product approval.

Rule-change implementation follows the canonical finite preset source and keeps APPLY/CHANGE/REMOVE, prospective current authority, prior rule history, Story, Observer, and atomic Commit on one server-owned path. Keep original catalog texts, actor scopes, and selector contracts intact. Do not invent a replacement rule or relabel a canonical rule. A synthetic descriptor may appear only inside a clearly named structural test; it proves state/transaction plumbing, never narrative or product acceptance. Preserve the distinction between product content and technical fixtures.

Follow the task's scope, call budget, actual DB/model/browser evidence requirements, and progress checkpoints. Do not copy old runtime logic under new names. Reuse presentation helpers/assets only where their boundaries remain independent from the rebuilt runtime. Older product-quality and mutation-safety principles below still apply.

---

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
- Live QA must include source-character social/non-work play, movement/alone state, MM/player thought, media, mobile, memory, and refresh lanes as required by `LIVE_ACCEPTANCE_MATRIX.md`. Live CSA lifecycle scenes are limited to already-canonical non-explicit, non-coercive cases; if the source catalog has none, record this acceptance as unverified without creating explicit scenes.
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
