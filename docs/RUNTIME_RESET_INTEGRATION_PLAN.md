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

| Old PR | Unique product behavior | Present in Phase 6 tree | Disposition |
| --- | --- | --- | --- |
| #22–#26 | To be checked with `git log --cherry`, `git diff --stat`, and `git range-diff` | Pending inventory | Do not merge until proven unique |

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
