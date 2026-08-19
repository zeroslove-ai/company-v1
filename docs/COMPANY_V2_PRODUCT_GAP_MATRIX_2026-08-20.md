# Company v2 Product Gap Matrix (2026-08-20)

Status: docs-only audit output for `company-v2-product-canon-and-gap-matrix-v1`.
The matrix is a controlled integration plan, not implementation authority until
the candidate canon is reviewed by the owner.

Classification meanings are exact: `KEEP` = current v2 is a valid invariant;
`REWIRE` = preserve the capability but connect it to canonical product/state;
`REBUILD` = replace the current implementation or missing contract;
`DELETE` = remove a superseded behavior; `DEFER` = keep out of the active cut.

| Domain | Authoritative requirement | Current v2 implementation | Evidence paths | Classification | Exact next change | DB impact | UI impact | Test/acceptance proof |
|---|---|---|---|---|---|---|---|---|
| Runtime turn spine | One server-owned literal-action turn, Story SSE, typed observation, reducer, atomic commit | `runtime-v2/server/worker.js` has this spine | `CURRENT_TRUTH.md`; `runtime-v2/server/worker.js` | KEEP | Preserve fencing and single commit while integrating product context | None to boundary | Keep stream/status surfaces | Same-job reconnect, one commit, literal action readback |
| v2 persistence tables/RPCs | Isolated `company_v2_games/state/turn_jobs/turns` with durable ownership | `_00200` creates tables/RPCs; later closures add fencing/ACL/choice rule | `supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql`; `_00300`–`_00600` | KEEP | Retain isolation; extend only through reviewed additive profile contract | Future additive profile/state migration | Read real state, no fake defaults | Catalog of fields plus DB/SSE readback |
| Setup/profile | Name, department, position, age, height, weight, body type, speech style | `createGame`/`createInitialState` effectively carry player name | `runtime-v2/server/store.js`; `runtime-v2/server/supabase-store.js`; `content/*` | REBUILD | Design validated creation profile payload and durable owner | Add profile fields/RPC contract | Restore full setup UI | Fresh setup persists and reloads every approved field |
| Edition identity | `company-v1`, `상식개변: 회사편`, company scope/version | v2 uses `company-v2-phase1` and demo framing | `content/edition.json`; `runtime-v2/server/supabase-store.js` | REWIRE | Resolve edition through catalog adapter and version it in v2 game | Store canonical content version | Correct title/premise | Exact ID/title/version parity |
| Heroine canon | Exactly five registered IDs/names and prompt cards | Demo/static runtime content is incomplete or shadowed | `content/characters.json`; `runtime-v2/domain/content.js`; donor commit `f4b228f...` | REBUILD | Adapter reads canonical five actors; remove shadow list | Catalog lookup only | Correct actor names/cards/images slots | Five-ID parity and no unknown actor |
| General NPC canon | Exactly eight registered profiles with role/dept | No complete v2 NPC catalog projection | `content/general_npcs.json`; `runtime-v2/domain/content.js` | REBUILD | Add relevant-NPC catalog projection to context | Static lookup only | Current scene/search uses IDs | Eight-profile parity and scene ID proof |
| Map/location canon | Exact 24-location graph and source descriptions | v2 demo opening defaults to `lobby` only | `content/map.json`; `runtime-v2/domain/contracts.js` | REBUILD | Adapter supplies location ID/name/adjacency and later navigation | State stores canonical location ID | Donor map surface restored/locked | 24-location parity and opening location proof |
| Organization/position/body/speech catalogs | Source IDs are sole lookup authority | v2 does not carry setup catalog fields | `content/organization.json`; `positions.json`; `body_types.json`; `speech_styles.json` | REBUILD | Add catalog adapter and setup selectors | IDs persisted in profile | Full selectors/profile display | Exact finite counts and ID round trip |
| Opening | Company day/location, registered actors, private app premise, free handoff | `openingStory` is generic demo prose | `runtime-v2/domain/story.js`; `docs/COMPANY_PROMPT_V2_DESIGN.md` | REBUILD | Replace opening context/provider inputs with canon | Opening commit stores real profile/state | High-parity opening screen | Fresh opening inspected by owner |
| Story context | Literal action, location, actors, compact canon, profile, time, continuity | Provider receives mostly literal action/player name and generic prompt | `runtime-v2/server/provider.js`; `runtime-v2/server/worker.js`; prompt design doc | REWIRE | Build bounded canonical context projection | Persist only authoritative state | Story stays primary | Prompt/context fixture and literal fidelity |
| Typed observation | Small post-Story projection, no invented narrative/state | `worker.js` reduces provider output into minimal state | `runtime-v2/server/worker.js`; `runtime-v2/domain/contracts.js` | REWIRE | Add evidence-bound actor/location/time fields, keep deterministic reducer | Add fields only with owner | Render observation with evidence | Negative tests for invented actor/action/state |
| Mind Monitor | Surface/subconscious evidence, empty state, no physical reaction | v2 has a minimal `mindMonitor` object | `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`; `runtime-v2/server/store.js` | REWIRE | Map typed evidence to donor tabs/cards and empty state | Persist observation projection | Restore tabs/cards/empty UI | Exact evidence and empty-state proof |
| Story/history/summary | Live Story, immutable history, distinct summary | v2 stores text/summary but current shell is reduced | `runtime-v2/server/store.js`; donor `index.html`/`render.js` | REWIRE | Preserve separate view models and stream history | Existing turn history plus profile | Restore donor hierarchy | Stream/readback/history inspection |
| Character/current-scene state | Registered focal actor, location, posture/position/clothing evidence | State is minimal and demo-oriented | `runtime-v2/domain/contracts.js`; donor `index.html` | REBUILD | Define canonical observation/state fields and reducer ownership | Add approved mutable fields later | Restore scene/current-character panel | Exact scene-state readback |
| Player state/profile panel | Setup profile and mutable player state are separate | Minimal player name/level/exp object | `runtime-v2/domain/contracts.js`; donor `index.html` | REBUILD | Split profile from mutable state and render both | Profile + state contract | Restore player situation panel | Setup reload and state distinction |
| Image/media presentation | Donor has a media surface; later sidecar must be nonblocking | Current v2 shell lacks product media parity | donor commit `f4b228f...`; `frontend-v2/index.html` | DEFER | Keep reserved surface; activate only later | None now | Visible-disabled/hidden slot | No fake media claim |
| Company map UI | Preserve donor information architecture; Phase 1 navigation locked | Current v2 shell has no map | donor `src/frontend/pages/*`; `content/map.json` | REBUILD | Transplant map presentation with a disabled Phase 1 controller | No mutation until Phase 2 | Restore discoverable locked map | Desktop/mobile parity checklist |
| `상식개변` app UI | Private app premise and entry are product surfaces; CSA transaction later | Current v2 has no equivalent product entry | donor files; runtime UI contract | DEFER | Restore entry shell without fake active mutation | None now | Visible-disabled/locked entry | No false state change |
| CSA mutation runtime | Definitions remain canon; mutation is Phase 2 non-gameplay transaction | Not in v2 Phase 1 | `content/csa_presets.json`; clean runtime canon | DEFER | Future isolated CSA transaction and readback | Additive CSA state only later | Locked control | No Phase 1 mutation |
| Choices | Latest owner decision: free-form only, no active choices | Legacy v2 contracts/tests enforce choices in places | `runtime-v2/domain/contracts.js`; `_00600`; narrative/game contracts | DELETE | Remove active choice requirement and renderer; preserve old docs as historical | Choices array empty in Phase 1 | Remove active choice controls | Empty-choice contract and free-input proof |
| Clothing/physical/sexual state | Later exact state contracts; no invented reaction | Not a Phase 1 v2 feature | clean runtime canon; `content/csa_presets.json` | DEFER | Phase 2/3 additive state with evidence-bound reducers | Later additive fields | Locked/deferred controls | Phase-gated owner play |
| Relationship/event memory | Explicit v2 owner required; company-life autonomy is not a chat shortcut | Not represented in initial v2 state | prompt design; clean runtime canon | DEFER | Design later event/relation state | Later additive state | No fake relation panel | Owner-approved scenario evidence |
| Feedback/reset | Reset must have real game-local authority; feedback later | Minimal utility/reset behavior only | donor; runtime UI contract | DEFER | Keep safe reset path; define feedback later | Reset transaction only | Preserve utility parity with disabled feedback | Reset/readback; no feedback claim |
| NPC search | Catalog-backed search only | Absent from v2 | donor inventory; `content/general_npcs.json` | DEFER | Later read-only catalog search | None or read-only | Hidden/deferred | No fabricated search results |
| TTS/image sidecars | Later nonblocking sidecars, `speaker_id` authority | Not in active v2 spine | runtime UI contract; donor files | DEFER | Add after phase acceptance with explicit service contract | Sidecar metadata later | Preserve slots without blocking Story | Toggle/service/readback later |
| Frontend controller/API ownership | Browser does not own stages; thin controller calls one v2 turn | `frontend-v2/app.js` calls `/api/v2/turn`, but shell is reduced | `frontend-v2/app.js`; clean runtime canon | REWIRE | Replace controller through donor presentation, keep server ownership | None to table boundary | Restore donor render/state wiring | No client stage progression |
| Responsive/mobile UI | Desktop/mobile donor order and hierarchy are product requirements | `frontend-v2/styles.css` is a reduced shell | donor `styles.css`; `frontend-v2/styles.css` | REBUILD | Transplant responsive presentation and audit order | None | High-parity responsive layout | Desktop/mobile screenshots/checklist |
| Tests | Contract tests protect product parity and authority, not raw count | Existing structural/runtime tests prove implementation slices | `runtime-v2`; v2 migrations; current test inventory | REBUILD | Add catalog/setup/UI parity and negative authority tests; retire stale choice/demo assertions | None directly | Test rendered surfaces | Focused contract suite + live evidence |
| Source-review gates | Exact source, donor, no shadow list, no old coordinator | No complete product parity gate | `AGENTS.md`; Issue #68 `5348837128`; task | REBUILD | Make parity matrix mandatory before source merge | None | Review all visible donor components | Reviewer checks exact paths/SHAs |
| TEST rollout/manual acceptance gates | Exact reviewed deployment, fresh setup/opening, bounded smoke, owner play | Current task is docs-only; no rollout authorized | `CURRENT_TRUTH.md`; clean runtime canon | DEFER | Future task must authorize exact TEST operations explicitly | Future migration only | Fresh deployed UI inspection | DB/SSE readback and manual Story inspection |

## Classification totals

`KEEP=2`, `REWIRE=6`, `REBUILD=12`, `DELETE=1`, `DEFER=9` (30 domains).

## Historical failure analysis and permanent guards

1. The original v2 task required static Company content reuse, but PR #87
   introduced demo semantic content. Guard: every source review must compare
   exact finite catalogs and reject any shadow list.
2. Tests lacked product-canon parity assertions. Guard: focused tests must
   assert IDs, names, counts, setup fields, prompt context, and no fabricated
   actors; raw passing count is not acceptance.
3. A later product-baseline task translated “bring existing UI” into a
   reduced-shell checklist. Guard: the donor inventory in the canon is a
   required path-by-path parity review, including disabled/deferred surfaces.
4. PR #90 therefore recreated a partial shell instead of transplanting the
   established presentation. Guard: no source merge may delete donor surfaces
   merely because a replacement controller is being built; Story streaming,
   Mind Monitor, state panels, utility surfaces, and mobile order must be
   explicitly accounted for.
5. Structural/runtime test success was treated as product readiness. Guard:
   exact reviewed deploy, catalog/setup/opening checks, DB/SSE readback, and
   owner Story inspection are independent gates.

## Ordered integrated implementation cut proposal

Do not perform this proposal in the current docs-only task. The smallest
controlled sequence is:

1. integrate canonical content, full player setup, and the additive
   persistence contract;
2. transplant the donor presentation at high parity with a thin v2 controller;
3. integrate Opening and the bounded Story/Observation context;
4. add product-parity tests and perform source review against this matrix;
5. perform an exact TEST migration/deploy only when a later task authorizes it;
6. run one bounded automated smoke with DB/SSE readback; and
7. hand the exact result to the owner for manual play.

This order keeps one end-to-end cut and avoids another chain of symptom
patches. It does not authorize source, SQL, DB, deploy, TEST, or Production
changes now.
