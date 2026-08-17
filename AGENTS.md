# Company v1 development rules

These rules are binding for Company v1 implementation, review, and rollout work.

- Before giving or executing any Company v1 runtime instruction, read `CURRENT_TRUTH.md` and the current documents it links. Do not rely on memory when the answer depends on repository, PR, deployment, migration, or live-DB state.
- When reviewing a moving branch, freeze an exact `REVIEW_SHA` first. Do not mix facts from a later HEAD into the review. If HEAD moves, review the new range separately.
- Current checked-out source, live DB catalog/function bodies, Git ancestry, and immutable run evidence outrank historical handoff prose and completion reports. Verify material claims against the relevant source of truth before approval.
- Keep one active implementation cut and one canonical implementation PR by default. Work only inside the authorized authority domain; record unrelated defects instead of fixing them incidentally.
- Prefer root-cause authority consolidation over compatibility patches, retries, semantic gates, or duplicated writers. One durable domain has one canonical writer.
- Test count is not evidence of correctness. Never preserve obsolete runtime behavior merely to keep a legacy test green, and never add compatibility code only to satisfy a stale test.
- When an architecture cut changes a contract, classify affected tests as `KEEP`, `REWRITE`, or `DELETE`. Canonical product invariants stay; duplicate mocks, implementation-detail assertions, source/SQL regex checks, legacy compatibility tests, and fake E2E tests may be rewritten or removed when their authority is superseded.
- Use focused invariant tests during implementation. A full suite may be run as a regression signal, but its raw pass count is not an acceptance gate; failures must be triaged against the current canonical contract.
- Acceptance for runtime authority changes prioritizes: targeted invariant tests, source↔DB contract verification, exact-SHA deployment gates, and a real TEST Golden Path using the existing canary/E2E/reset helpers. Do not create a new harness unless the existing one cannot express a required invariant.
- DB/API staged rollout must be explicit. If an API SHA requires a DB contract that is not live, deployment must be blocked until the required Stage A contract is verified. Stage B enforcement follows only after the new API passes TEST verification and caller inventory.
- Historical applied migrations are immutable. Use additive migrations only.
- Do not reset TEST, deploy, access Production, merge, or move a Draft PR to Ready without explicit owner approval when the current cut has not already authorized that action.
- Do not add semantic gates or provider/model changes as incidental fixes.
- Update `09_CURRENT_TRUTH.md` only with verified current facts and clearly labelled target/planned decisions; never write a plan as if it were already deployed.

## Test-suite consolidation

The current large legacy suite is not a preservation target. After Authority Consolidation Cut 1 is safely rolled out, and before later authority cuts are allowed to inherit the old suite unquestioned, perform an explicit test-suite reset/consolidation: inventory tests, mark each `KEEP` / `REWRITE` / `DELETE`, remove duplicate or superseded tests, and retain a smaller contract-oriented suite plus live Golden Path coverage. No numeric target is binding; semantic coverage and authority alignment are the criteria.
