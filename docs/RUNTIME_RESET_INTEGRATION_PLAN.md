# Runtime Core Reset Integration Plan

## Approved stacked chain

The reset work is developed as stacked Draft PRs. Each phase keeps the previous
phase tree as its base; no phase is merged directly into `main` during the
stacked implementation.

| Phase | PR | Head / baseline |
| --- | --- | --- |
| Raw Story streaming | #46 | `9953a8a90b2dd9e5630fe169bd4d1bac2ae8e99f` |
| Phase 0 plan | #47 | `7f0dbf71ebc093395fbeffdcd46cd05b4bc8f58a` |
| Stored action authority | #48 | `d98c8c7e15045e169fafb00a5e88c463c73df2f6` |
| Canonical scene | #49 | `86fc1f54412c69a7d104464b48a639c3288ec902` |
| Extract Observation V2 | #50 | `96dcef68de9734ee45e72b1a1ac0f6cc38038b63` |
| Legacy runtime prune | #51 | `dc5acb62fb3c4228602a47b243cf946a6bfba45a` |
| Presentation/media projection | #52 | `d61926771d8e1a172516ad91298ceb7963f3061c` |
| Turn-0 bootstrap authority | #53 | this branch's final SHA |

Every phase head must be an ancestor of the next phase head. The check is:

```bash
git merge-base --is-ancestor <phase-head> <next-phase-head>
```

## Final authority split

Turn 0 has two authorized bootstrap writers only:

- `reserve_company_player_setup`: validates and reserves player/setup/opening plan, then projects the deterministic canonical opening scene.
- `commit_company_opening`: stores opening background, raw Story, and choices, while reapplying the saved plan's canonical scene projection.

Turn 1 and later use `reduceGameplayCommit` as the single gameplay writer.
Setup/opening do not create gameplay actions or turns, call Extract, or invoke
`reduceGameplayCommit`.

## Integration branch procedure

After Phase 6 review, create a byte-for-byte integration branch from the final
Phase 6 head:

```bash
git branch company/runtime-core-reset-v1-integration <PHASE6_FINAL_SHA>
```

The integration PR targets `main`, starts as Draft, and contains no additional
implementation changes. Its purpose is to validate the final tree, run the
complete test suite and Worker dry-runs, and inspect the aggregate diff against
`main`. The stacked PRs remain Open/Draft until that review is complete.

## Legacy PR inventory policy

PRs #22–#26 and other pre-reset PRs are not cherry-picked into the integration
branch. For each old PR, record:

| Old PR | Unique commits / behavior | Current Phase 6 correspondence | Disposition / evidence |
| --- | --- | --- | --- |
| #22 | Dialogue parser/TTS, Mind Monitor two-field surface, NPC records, player app handoff. | `src/engine/narrative-parser.js`, `src/frontend/pages/tts.js`, `src/frontend/pages/view-model.js`, `test/runtime-presentation-authority.test.mjs`, `test/runtime-media-projection.test.mjs`. | **Included/superseded where authority changed**. The product surfaces remain; speaker-tagging and Extract-driven rendering were retired by Phases 3–5. `git diff` against the Phase 6 base shows no unique PR-22 delta. |
| #23 | Evidence-backed posture/position/clothing projection and safe human-readable location display. | `src/frontend/pages/view-model.js`, `src/frontend/pages/utility-ui.js`, runtime physical reducers, and existing physical/view-model tests. | **Included**. Current view-model and V2 physical reducers provide the same product behavior with canonical scene/evidence authority; PR head is an ancestor of the reset base. |
| #24 | Company catalogs, map-driven opening plan, NPC finder removal, Company CSA aliases and bounded selection. | `content/`, `src/engine/player-setup.js`, `src/api/turn-routes.js`, catalog and opening tests. | **Included/superseded by later catalog/runtime phases**. Catalog and opening behavior remain; the old semantic/action gate and NPC Finder implementation are intentionally absent. PR head is an ancestor of the reset base. |
| #25 | Speaker-tagging pipeline, roster construction, quote-card/TTS polish, and recovery fixes. | Parser-owned `dialogue_lines`, `src/frontend/pages/tts.js`, recovery coordinator, and corresponding presentation/recovery tests. | **Partially included, authority intentionally replaced**. Raw Story/parser projection and single TTS remain; the extra speaker-tagging LLM and normalized-raw authority were removed in PR #46/Phase 5. No cherry-pick. |
| #26 | ActionExecutionContract routes, pre-Story CSA matcher/firewall, boundary follow-up, and related sexual completion filtering; its final unique commits also tightened Extract sexual-ledger identity wording and prompt-budget tests. | No retained production caller for the contract; the former symbols are absent from `src/**`. Extract’s current V2 skeleton and `test/phase-2-api.test.mjs` cover the surviving token/identity contract. | **Discarded as legacy authority; surviving prompt behavior superseded**. The three final PR-26-only commits (`dd83f43`, `166fba9`, `fe5f4ec`) are not cherry-picked because Phase 3 owns the V2 Extract contract. |

Legacy authority, guarded merge, and SceneCast writer code are excluded by
default. A genuinely unique product behavior must be documented and proposed
as a separate follow-up rather than copied into the integration branch.

## Operational sequence (planning only)

No operational step is executed by this phase. The approved future order is:

1. Complete integration PR CI and code review.
2. Apply the migration package to a test Supabase project only.
3. Run verification SQL and reset/setup/opening/turn-1 E2E checks.
4. Decide separately whether production migration is authorized.
5. Deploy API and Frontend Workers only after migration and integration approval.
6. Run browser setup, opening, and first-turn smoke checks.

The Phase 6 migration and verification SQL are package artifacts only:

- `supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql`
- `supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql`

They are not applied in this PR. No production save, Supabase row, Worker,
live LLM, or existing PR is modified by the integration plan.
