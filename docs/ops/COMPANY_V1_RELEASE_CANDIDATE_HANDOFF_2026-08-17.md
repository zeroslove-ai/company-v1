# Company v1 Release-Candidate Handoff - 2026-08-17

Status: HANDOFF_READY_OWNER_DECISION
Verified at: 2026-08-17 KST
Task: `minimal-story-runtime-final-release-handoff-v1`

## A. Exact release-candidate identity

- Repository: `zeroslove-ai/company-v1`
- Branch: `company/scene-location-presence-v1`
- Handoff START head: `1bb73802dfa0e0dc577af2cb168ed803d013df6a`
- Accepted executable/source-test SHA: `f03e32c4194c114d702c43df1f6122c17c4ca7c1`
- Current docs handoff commit is a documentation descendant of the accepted executable SHA.
- Accepted source CI: GitHub Actions run `31986414926`, SUCCESS.
- v10 final-docs CI: run `31989482449`, SUCCESS.
- Current handoff START CI: run `31989752453`, SUCCESS.

The accepted executable is the source/test identity. The current branch head is orchestration/documentation state, not a new runtime review identity.

## B. TEST Worker and database contract

- Worker: `game-proxy-company-v1`
- Read-only Wrangler verification: `npx.cmd --yes wrangler deployments list --name game-proxy-company-v1`
- Accepted Worker version at 100%: `761a01bb-8cca-47ad-afde-87c0ba85c01d`
- Supabase project metadata was read-only checked for project `fmcrspgxstsmxxsmkeee`.
- Expected migration `20260816050000 / company_v1_minimal_story_runtime_contract`: present.
- Expected migration `20260817000100 / company_v1_final_residue_closure`: present.
- No SQL was executed and no migration or DDL was applied.

## C. Accepted release evidence

Deterministic/source evidence and live product-play evidence remain separate.

- v9 terminal evidence: Issue #68 comment `5311089704`.
- v10 terminal evidence: Issue #68 comment `5311255370`.
- v10 operator review: Issue #68 comment `5311279275`.
- Accepted contracts include the minimal Story/Extract/Commit spine, exact-four literal choice/history parity, replay/idempotence, six-raw plus older-summary memory projection, supported CSA activation-time/non-retroactivity/isolation, and clean final reset/isolation.
- The evidence is release-candidate evidence; it is not an unqualified `PRODUCT_PLAY_PASS`.

## D. Explicit unresolved/non-blocking risk

Exactly one supported compact-clothing transition was attempted. Story/Extract did not establish completion evidence, Extract clothing evidence was empty, and Commit correctly preserved `worn -> worn`. Therefore there is no demonstrated persistence failure, but there is also no positive clothing-transition PASS. Retry-until-lucky gameplay is not authorized, and this gap must not be silently rewritten as PASS.

## E. Landing audit

PR #67 was freshly verified as OPEN / DRAFT / UNMERGED with base `main` at `1e3a5255e51a284e45baf551dcfd415360981927`, head `1bb73802dfa0e0dc577af2cb168ed803d013df6a`, merge state `CLEAN`, 100 commits, 242 changed files, 18,765 additions, and 13,047 deletions.

Against the accepted executable SHA, the six descendants are:

1. `99f6ac749538a151a20b151d7721aa3faedb64b1` - `ops: mark choice projection task waiting review`
2. `31efac5f222890817044a8d35a50f5622743444e` - `docs: register minimal Story runtime product acceptance v9`
3. `7be7d860534a096e8a0cd5d4e703c161ea9942d2` - `ops: mark product acceptance awaiting review`
4. `5bac8732d2eea994cbeb6a8f0ec856db00fec37d` - `docs: register remaining release acceptance coverage v10`
5. `6f9e38b0e178ff747134c89459609e1dde7207db` - `docs: close remaining coverage v10`
6. `1bb73802dfa0e0dc577af2cb168ed803d013df6a` - `docs: register minimal Story runtime final release handoff`

The complete accepted-source-to-START path changes only `docs/ops/CURRENT_TASK.md`; there is no `src/**`, `test/**`, migration, config, worker, frontend, content, or script executable drift after `f03e32c4...`. The broad PR diff against `main` is the intentionally owned historical implementation lineage: 69 `src` paths, 87 `test` paths, 18 `supabase` paths, 7 `scripts` paths, 2 `config` paths, 2 `content` paths, 14 `fixtures` paths, 41 `docs` paths, plus `AGENTS.md` and `CURRENT_TRUTH.md`. The current executable portions are covered by the accepted source/test review and v9/v10 evidence; no separate dependency or duplicated landing container was proven by this audit.

The large historical diff is not treated as a blocker by itself. Landing classification: **`HANDOFF_READY_OWNER_DECISION`**.

## F. Owner-only next decisions

- Choose the PR #67 landing/merge strategy.
- Decide whether and when to move PR #67 from Draft to Ready.
- Decide main-branch landing and any release/deployment sequencing.
- Separately authorize any TEST-to-Production rollout; this handoff does not establish Production readiness.
- Decide whether future product work should address the explicit compact-clothing coverage gap; no additional gameplay loop is authorized by this handoff.

No merge, Ready transition, deploy, gameplay run, game-row access, DB write, migration application, or source/runtime change was performed.
