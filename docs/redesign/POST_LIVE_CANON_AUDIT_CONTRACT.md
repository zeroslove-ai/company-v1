# Company Post-Live Canon Divergence Audit Contract

Status: **OWNER_ACCEPTED / BINDING QA CONTRACT**  
Accepted: 2026-08-25 KST  
Product: `company-v1 / 상식개변: 회사편`

This contract defines the mandatory review that follows **every actual deployed live/browser test**, whether the live task passes, blocks, or stops early. A narrow live task may prove its own lane, but its terminal is not sufficient by itself to authorize the next product-development lane.

## Q-POSTLIVE-001 — Every live test is followed by a whole-canon audit

After every live/browser campaign, the operator/review session must compare the observed product against the **entire current binding product design**, not only the CURRENT_TASK acceptance bullets that produced the campaign.

Read current authority again at review time:

1. `CURRENT_TRUTH.md`
2. `docs/redesign/COMPANY_CANON.md`
3. all specialized binding contracts referenced by CURRENT_TRUTH
4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
5. media or other specialized contracts when relevant
6. current `docs/ops/CURRENT_TASK.md`

Do not assume the authority set is unchanged from task registration.

## Q-POSTLIVE-002 — Reconstruct cross-boundary reality

For representative and suspicious turns from the fresh live game, inspect the full chain where available:

`literal / structured operation -> Story -> observer raw -> observer applied -> reducer/durable state -> next Story/context -> rendered UI`

The review must explicitly look for both directions of inconsistency:

- Story is correct but durable state/reducer is wrong;
- durable state is correct but Story/MM/UI is wrong.

A structurally green Commit, selector, catalog response, state mutation, or test assertion does not close this review.

## Q-POSTLIVE-003 — Review outside the tested happy path

The post-live audit must actively look for interactions the narrow task may not have sampled, including as applicable:

- another NPC's action being attributed to the player;
- actor/target/direction/topic substitution;
- unsupported action handling rather than only supported-action success;
- refusal, stop, change-of-mind and de-escalation;
- APPLY/CHANGE/REMOVE residue and removed-rule ghosts;
- compatible vs physically contradictory simultaneous CSA rules;
- named-role scope/designation propagation;
- official institutional announcement vs private-app/supernatural leakage;
- Story/MM/current durable authority disagreement;
- player-facing leakage of internal implementation/design terminology;
- refresh/re-entry reconstruction;
- downstream effect on History, memory and later Story.

This is not permission to create an unrestricted combinatorial test matrix. Use current canon, fresh evidence, and owning-boundary risk to choose high-value cross-boundary probes.

## Q-POSTLIVE-004 — Inspect current main source at the owning boundaries

When live evidence suggests a mismatch, review current `main` source at the earliest plausible resolver/reducer/prompt/projection/catalog boundary instead of assuming the live defect is stochastic model quality.

In particular, deterministic source defects that can be established from current main must be recorded even if the narrow browser campaign did not happen to hit them.

Do not respond to these findings with provider/model changes, hidden retry, sample-until-pass, fuzzy repair, or a new generic engine unless separately authorized by canon.

## Q-POSTLIVE-005 — Measure silent fail-open surfaces

A fail-open feature is not automatically product-green merely because Story survives.

Where the feature is expected to be materially present, review practical live reliability. Examples include:

- Mind Monitor raw -> applied retention/drop rate;
- player-thought projection drop/rejection rate;
- dialogue/TTS projection availability;
- choices projection/fallback frequency;
- media selection availability;
- summary/memory persistence.

Use a bounded recent sample when statistics materially clarify whether an apparently safe local drop is actually a systematic product defect.

## Q-POSTLIVE-006 — Canon divergence report is mandatory before next task registration

Every live terminal review must produce a separate **WHOLE-CANON DIVERGENCE** result before registering the next CURRENT_TASK.

Minimum report:

- live game(s) inspected and preserved status;
- current canon/contracts re-read at review time;
- tested lane result;
- cross-boundary chains inspected;
- new P0/P1/P2/P3 findings outside the narrow lane;
- current-main source defects confirmed or ruled out for those findings;
- whole-canon areas not exercised and therefore still unproven;
- whether the next planned task remains valid or must be reordered.

Required conclusion is one of:

- `WHOLE_CANON_AUDIT_CLEAR_FOR_NEXT_LANE`
- `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE`
- `WHOLE_CANON_AUDIT_BLOCKED_NEEDS_OPERATOR_REVIEW`

A live task marked PASS/GREEN may still end with `WHOLE_CANON_AUDIT_REORDERS_NEXT_LANE` if the broader review finds a more important product defect.

## Q-POSTLIVE-007 — Next-task sequencing law

The next CURRENT_TASK must be chosen **after** the whole-canon audit, not mechanically from the previous roadmap.

- New reproducible P0/P1 that invalidates underlying scene truth takes priority over downstream presentation work.
- Systematic P2 integrity defects may be scheduled before later owner-readiness acceptance when they would otherwise contaminate that acceptance.
- Previously accepted implementation is not reopened without new evidence, but new cross-boundary evidence is valid cause to reopen the smallest owning boundary.
- Media/TTS/UI polish cannot establish owner readiness while core narrative/state/agency authority is known to be wrong.

## Q-POSTLIVE-008 — Preserve audit independence

The reviewer must distinguish two jobs:

1. **task compliance review** — did Codex execute the declared CURRENT_TASK correctly?;
2. **independent product audit** — how far did the resulting live product diverge from the full current canon?

Do not let a narrow task's PASS criteria define the boundaries of the independent product audit.

This contract exists specifically to prevent local greens such as `role direction PASS`, `state persisted PASS`, `multi-rule active PASS`, or `fail-open PASS` from masking cross-boundary product failures.