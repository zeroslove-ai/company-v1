# Company v1 Git Lineage

Verified with `git log --first-parent`, remote refs, and
`git merge-base --is-ancestor` on 2026-08-13.

## Current graph

```text
main 1e3a525
  ├─ absorbed runtime-core-reset stack (#47 → #53)
  ├─ absorbed early Company stack (#18 → #25)
  └─ hotfix/first-playtest-blockers-v1 4891d46 (#59)
       └─ hotfix/playtest-presentation-monitor-v1 5ba68bb (#61, current runtime baseline)
            └─ audit/company-v1-authority-baseline-2026-08-13
                 05692cd (#62, audit directive only)
```

The runtime baseline requested for this audit is `5ba68bb204767756b9c8a4b5a72ea4003f2075b6`.
The audit branch currently has the directive commit
`05692cd68a3d9f57f6aa1c083408f0d7779e948e` on top of that baseline.

## Reset/authority stack

The following is a real stacked chain, not a remembered session sequence:

```text
#47 runtime-core-reset-v1-plan
  → #48 action-authority
  → #49 canonical-scene
  → #50 extract-observation
  → #51 legacy-prune
  → #52 projection-boundaries
  → #53 bootstrap-authority
```

Each later head is an ancestor of current `main` and of the current hotfix
tip. The stack therefore establishes the architectural direction in source,
but the fact that compatibility modules still exist means the intended
deletion boundary is not identical to the current module boundary.

## Current hotfix sequence

The first-parent log of #61 contains the Q-series progression, including the
reviewed deployment baseline and the opening recovery work. The important
reviewed points are:

| SHA | Meaning from Git subject | Lineage status |
|---|---|---|
| `4891d46` | first-playtest-blockers base | parent hotfix |
| `4447b17` | pre-deploy CSA architecture closure | in #61 lineage |
| `1db5804` | approved deployment point in the prior playtest sequence | in #61 lineage |
| `b2c2310` | explicit interaction switch closure | in #61 lineage |
| `e3ad2f6` | interaction pair authority closure | in #61 lineage |
| `ffd423f` | relational authority closure | in #61 lineage |
| `5ba68bb` | Q.2 opening protocol/recovery blocker closure; audit baseline | current hotfix tip |

The exact commit subjects are evidence of branch history only; this audit does
not treat prior completion reports as proof that a runtime behavior is correct.

## Authority implication

`main` is the current merged product lineage. #61 is an unmerged, deployed
hotfix lineage with unique runtime behavior relative to main. #62 is a
documentation branch based on #61 and must not be treated as a deployable
runtime revision.
