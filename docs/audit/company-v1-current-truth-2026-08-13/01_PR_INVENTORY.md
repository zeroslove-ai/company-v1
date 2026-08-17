# Open PR Inventory

Source: GitHub repository `zeroslove-ai/company-v1`, queried 2026-08-13 with
`gh pr list/view`; ancestry checked against local `origin/main` and
`origin/hotfix/playtest-presentation-monitor-v1`.

Classification is based on Git ancestry plus current source, not PR prose:

- **ACTIVE**: not in current main and still represents the active work line.
- **ABSORBED**: PR head is an ancestor of current main; the PR may remain open,
  but its code is already in the current main lineage.
- **REFERENCE_ONLY**: not current lineage, but its design/history remains useful.
- **ABANDONED**: not current lineage and no current implementation authority was
  found for the branch's unique integration.

## Inventory

| PR | Title | Base → head | Commits / files | Ancestry | Classification | Current meaning |
|---:|---|---|---:|---|---|---|
| #62 | docs: reconstruct Company v1 current truth before further runtime changes | hotfix `5ba68bb` → audit `05692cd` | 1 / 1 | audit is not in main/hotfix | ACTIVE | This audit; docs-only. |
| #61 | fix: stabilize playtest presentation and monitor contracts | first-playtest `4891d46` → hotfix `5ba68bb` | 36 / 74 | head not in main; current hotfix tip | ACTIVE | Q-series playtest/runtime line; includes runtime, frontend, tests, and one CSA migration. |
| #59 | fix: unblock first playtest turn lifecycle | main `1e3a525` → `4891d46` | 74 / 100 | head not in main; ancestor of #61 | ACTIVE | Parent hotfix line; #61 continues it. |
| #53 | refactor: make opening RPCs write canonical scene | reset projection `d619267` → `cd62e29` | 8 / 8 | head ancestor of main | ABSORBED | Opening bootstrap authority is in main ancestry; later migrations supersede intermediate wrappers. |
| #52 | refactor: make UI and media projections read-only | legacy prune → projection boundaries | 4 / 20 | head ancestor of main | ABSORBED | Read-only projection direction is in main ancestry. |
| #51 | refactor: remove deprecated legacy runtime paths | Extract observation → legacy prune | 2 / 23 | head ancestor of main | ABSORBED | Legacy-prune work is in main ancestry, though compatibility code still exists. |
| #50 | refactor: replace Extract save patches with observations | canonical scene → Extract observation | 5 / 22 | head ancestor of main | ABSORBED | Observation/reducer direction is in main ancestry. |
| #49 | refactor: make canonical scene the single presence writer | action authority → canonical scene | 2 / 13 | head ancestor of main | ABSORBED | Canonical scene/presence writer work is in main ancestry. |
| #48 | refactor: make stored actions authoritative for CSA mutations | reset plan → action authority | 2 / 14 | head ancestor of main | ABSORBED | Stored action authority is in main ancestry. |
| #47 | docs: freeze runtime core reset authority plan | raw streaming impl → reset plan | 2 / 5 | head ancestor of main | ABSORBED | Reset authority plan and target docs are in main ancestry. |
| #26 | 회사편 CSA 범위 이탈 방지… | UI polish → CSA preflight | 12 / 9 | head not in main/hotfix | REFERENCE_ONLY | Historical CSA-boundary design; its direct-coverage implementation is not current authority. |
| #25 | 회사편 UI/UX·대사 화자… | open semantic → UI polish | 36 / 55 | head ancestor of main | ABSORBED | Product/UI and dialogue fixes are in main ancestry. |
| #24 | Open Company semantic and opening catalogs | open state UI → semantic contract | 1 / 28 | head ancestor of main | ABSORBED | Catalog/semantic contract work is in main ancestry. |
| #23 | Open narrative physical state projection | runtime UI contract → open state UI | 1 / 9 | head ancestor of main | ABSORBED | Physical state projection work is in main ancestry. |
| #22 | restore Company dialogue, TTS, NPC records, and app flow | mobile refinement → runtime UI contract | 100 / 65 | head ancestor of main | ABSORBED | Early app/content restoration is in main ancestry. |
| #21 | refine compact mobile play UI | hospital UI → mobile refinement | 6 / 5 | head ancestor of main | ABSORBED | Mobile UI refinement is in main ancestry. |
| #20 | transplant hospital frontend shell | full-feature transplant → hospital UI | 15 / 10 | head ancestor of main | ABSORBED | Donor shell transplant is in main ancestry. |
| #19 | transplant final hospital gameplay features | CSA app port → full-feature transplant | 59 / 61 | head ancestor of main | ABSORBED | Donor gameplay/content transplant is in main ancestry. |
| #18 | port hospital donor's CSA-app | player setup/opening → CSA app port | 10 / 30 | head ancestor of main | ABSORBED | CSA app/catalog origin is in main ancestry. |
| #12 | connect renderer to Company view model | main `7640c84` → view-model-renderer `c48ef5f` | 1 / 5 | conflicting head, not in main/hotfix | ABANDONED | Later UI stack replaced this branch; current renderer/view-model files are from later ancestry. |

## Important lineage conclusions

The open status of a PR does not mean its code is absent. PRs #47–#53 and
#18–#25 have heads that are ancestors of current `main`; they are absorbed
code with stale review containers. PR #61 is different: its head is not an
ancestor of main and is the current hotfix lineage above #59. PR #62 is based
on that hotfix tip and adds only the audit directive before this document set.

No PR was closed, merged, rebased, or marked ready during this audit.
