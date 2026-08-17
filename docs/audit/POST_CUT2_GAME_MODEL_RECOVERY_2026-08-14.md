# Company v1 Post-Cut2 Game Model Recovery

Date: 2026-08-14
Status: read-only architecture checkpoint

This document records the current Company v1 game model from source, Git
lineage, live TEST catalog/readback, and the preserved manual playtest. It is
not an implementation authorization and does not change runtime truth.

## 1. Current identities and authority precedence

- Repository: `zeroslove-ai/company-v1`
- Current branch: `company/scene-location-presence-v1`
- Current docs-only HEAD: `1171ccad50ed2dc009c1daf61d784f4c3539de2a`
- Reviewed/deployed Cut 2 executable: `a919baf87d92e841e64b731576ccb176d5745570`
- Worker Version: `9a466eaf...` (operator-verified handoff identity)
- Current PR: #67, OPEN / DRAFT / UNMERGED
- `origin/main`: `1e3a5255e51a284e45baf551dcfd415360981927`
- Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, clean at
  `save_revision=881`, `committed_turn=0`, zero actions and turns
- Immutable manual evidence game: `78fb1d94-266f-455a-bda4-7656cc2370c1`

Current source, Git ancestry, live DB catalog/readback, and immutable evidence
outrank historical handoffs. The manual game is evidence, not the dedicated
TEST reset target.

## 2. Current end-to-end flow

| Stage | Current owner and input | Durable output | Replay/recovery and compatibility |
|---|---|---|---|
| Player setup | `turn-routes.js` validates against the local Company catalog and calls `reserve_company_player_setup` | Reserved player setup in save | Existing setup ID prevents duplicate reservation |
| Opening | Opening provider -> fresh narrative parser -> choice projection -> `commit_company_opening` | Opening story, parsed blocks, four choices, opening state | Completed opening replays persisted output |
| Player input | Frontend choice/action state and pending-action local storage | Intent is carried into an action request; it is not durable success | Server context/history remains authoritative after refresh |
| Reservation | `reserve_turn_action` | `game_actions` reservation and expected-turn identity | Same-action replay is returned before stale sweep |
| Story | Owner token claim through `claim_game_action_stage`; local context/scene/CSA projections; provider stream | Fenced `record_story_result_owned` persists story and parsed blocks, then enters `extracting` | Persisted story/parsed blocks replay without provider call; legacy persisted parser is fallback only |
| Stream/parser | Fresh narrative parser and protocol validation | Parsed Story blocks, player-only THOUGHT, dialogue/ACTING/choice structure | `persisted-narrative-parser` can use legacy adapter for old rows |
| Extract | Fresh Extract V2, exact-evidence observation contract | Fenced `record_extract_result_owned`; degraded fail-open observation is possible for malformed Extract | Extract replay returns persisted delta; old rows use legacy extract adapter |
| Commit | `reduceGameplayCommit` consumes typed observation/intent and engine enactments | `commit_company_turn` is the normal durable save/turn writer | Commit replay/idempotency and expected-turn protection are RPC-owned |
| Context/history | `get_company_context`; history reads `game_turns` | Canonical save/context plus committed turns | History prefers persisted parsed blocks and only falls back for old rows |
| Frontend/recovery | `app.js`, `state.js`, server context/history, pending-action local storage | Presentation view model only; no frontend gameplay writer | Action-status recovery and server re-read are authoritative; session history is a cache |

CSA applicability, mandatory enactment, and runtime are projected before Story
and become durable only through Commit. Scene v1 is the canonical scene input;
legacy scene fields are derived compatibility projections. TTS and image
selection are presentation/media outputs and do not own turn durability.

## 3. Authority and debt matrix

| Domain | Current owner/writers | Readers/mirrors | Classification and debt |
|---|---|---|---|
| Action lifecycle | Named lifecycle RPCs; fenced Story/Extract RPCs; `commit_company_turn` | Routes, context/history | `SOLE_CANONICAL`; live Stage A/B contract verified |
| Scene/location/presence | `save.scene` reducer and scene validation; compatibility projection | Story/Extract context, frontend, legacy mirrors | `CANONICAL_PLUS_DERIVED_PROJECTION`; Cut 2 Stage B is live |
| CSA active/rules/runtime | Edition definitions plus runtime projection; Commit CSA reducer | Story projection and save | `CANONICAL_PLUS_DERIVED_PROJECTION`; durable only at Commit |
| Active relations | `reduceRelationUpdates` and `applyEngineRelationEnactments` both write | Story context, Extract, frontend | `DUPLICATE_AUTHORITY_DEFECT`; unify typed relation input and one reducer |
| Relationship summaries/milestones/boundaries | Boundary/closeness observation writes limited fields; no milestone writer observed | Story context and frontend | `MISSING_DURABLE_CONSEQUENCE`; milestone/summary authority is absent |
| Event ledger | `reduceGeneralEventObservations` and sexual event reducer | Context/history/Story context | `CANONICAL_PLUS_DERIVED_PROJECTION`, but evidence shows no durable events in the manual run |
| Physical/contact state | Evidence-gated observation reducers plus CSA engine effects | Story context/frontend | `CANONICAL_PLUS_DERIVED_PROJECTION`; metadata freshness and fidelity remain weak |
| Sexual state/consequences | Evidence-gated player/NPC reducers and sexual event ledger | Context/history/Story context | `MISSING_DURABLE_CONSEQUENCE` in observed play; no sexual ledger change despite relevant inputs |
| Setup/opening/catalog | Local edition catalog plus SQL validation/bootstrap semantics | Setup/opening routes and RPCs | `DUPLICATE_AUTHORITY_DEFECT`; semantic catalog duplication needs later deletion proof |
| Summary/memory | Commit currently sends empty `turn_summary`; overall/recent fields are compatibility state | Story prompt uses overall plus recent raw turns; frontend reads save | `MISSING_DURABLE_CONSEQUENCE`; recent is stuck and overall encoding is corrupted in evidence |
| Parsed blocks/replay | Persisted `game_turns.parsed_blocks` and fresh parser | History, replay, commit | `CANONICAL_PLUS_DERIVED_PROJECTION`; legacy adapter is temporary compatibility |
| Frontend/session recovery | Server context/history; local pending action and session cache | Renderer/view model | `CANONICAL_PLUS_DERIVED_PROJECTION`; cache deletion requires refresh/recovery proof |

Retained compatibility paths have concrete reasons: old persisted rows can
still lack fresh parsed blocks or V2 Extract shape, and scene mirrors are read
by older projection paths. Their deletion criteria are a stored-row reader
inventory, live context/history replay proof, and a clean canary that no longer
requires the fallback. No compatibility path is retained merely because it is
convenient.

## 4. Read-only reconstruction of manual seven-turn evidence

There were 9 submitted actions: 7 committed turns and two Story failures. The
two failures were `STORY_PROTOCOL_INVALID` at expected turns 2 and 3 and did
not produce Story or Extract data. The following table summarizes the
committed rows without copying raw Story text into a new artifact.

| Turn | Action | Status / Extract | Durable consequence observed |
|---:|---|---|---|
| 1 | `9aa70d4f-bcf9-4b87-985f-afc275043464` | committed; Extract degraded (`extract_degraded`) | Scene stayed in the meeting room; no relation/event/sexual consequence |
| 2 | `109a62a1-7e53-488b-90ba-5fe935262314` | committed; Extract success | Scene/focal heroine4 persisted; no relation/event/sexual consequence; stored Story rendered waist intent as table-edge contact |
| 3 | `bddbe174-267c-4e58-9b2d-846883be8667` | committed; Extract success | No relation/event/sexual consequence; scene remained coherent |
| 4 | `88c7448b-5188-44be-930e-09c6d2508c64` | committed; Extract success | NPC mood changed to tense; no relation/event/sexual consequence |
| 5 | `67e99c05-2a41-46df-af10-cd87fb034ae6` | committed; Extract success | No physical, relation, event, or sexual ledger change |
| 6 | `ee92783c-749e-4751-b45c-c8f3b357c1ed` | committed; Extract success | No durable relation/event/sexual change; no NPC observation |
| 7 | `b88f376a-c628-4ec5-8f53-4dae48905b91` | committed; Extract success | Apology/continuation completed, but active relations, events, and sexual state remained unchanged |

Across all seven `game_turns`, `turn_summary` was empty. `story_summary_recent`
remained on Opening/raw content, while `story_summary_overall` was observed as
mojibake in the live readback. `active_relations`, `event_ledger`, and
`sexual_event_ledger` remained empty; relationship state and milestones stayed
at their initial values. This supports a durable-consequence/authority loss,
not merely a narrative-style complaint.

Choices were durable at four items per committed turn, although some stored
provider outputs had zero canonical choices and a deterministic fallback
warning. Later rows contained canonical four-choice blocks. Player THOUGHT was
stored in parsed blocks and NPC mind monitor data was stored in Extract. The
image field remained null and did not affect turn durability.

The final scene was structurally coherent (`brand_strategy_meeting_room`,
heroine4 present/focal), but player and NPC scene metadata retained
`updated_turn=0`, showing a separate freshness debt. The preserved evidence
does not justify claiming that every intended physical or sexual observation
was absent from raw Story; it does show that those observations did not become
durable structured consequences.

## 5. Legacy and deletion inventory

- `legacy-narrative-parser`, `persisted-narrative-parser`, and
  `legacy-extract-adapter`: retain only for rows proven to need the fallback.
  Delete after a stored-row inventory and replay/history canary prove zero
  remaining readers.
- Legacy scene mirrors and `scene_state`: retain as typed projections while
  frontend/history readers remain. Delete after reader inventory and a clean
  canonical-scene refresh/recovery canary.
- SQL setup/opening semantic aliases and catalog duplication: retain until
  RPC/catalog call inventory proves the local edition catalog can replace the
  SQL semantic surface without changing setup/opening behavior.
- Frontend session/pending caches: retain as presentation/recovery state until
  refresh, action recovery, and reset prove the server context always wins.
- Historical applied migrations and preserved evidence: immutable; never delete
  or rewrite as part of cleanup.

## 6. Ranked next architecture cuts

| Rank | Candidate | Reason |
|---:|---|---|
| 1 | Relationship / Event Authority | Seven committed turns contain meaningful boundary, contact, sexual, and apology intent but no durable relation/event/sexual consequence. It has both a duplicate active-relation writer and missing downstream consequence, with high continuity damage. |
| 2 | Bounded Memory / Summary Authority | Empty turn summaries, stuck recent summary, and corrupted overall summary damage continuity, but memory should consume a corrected event/relation authority rather than summarize missing facts. |
| 3 | Setup / Opening / World Definition | SQL/catalog duplication and opening fallback debt remain, but Cut 2 scene acceptance and current setup flow are already operational. |
| 4 | Physical / Sexual State Authority | Important, but should share evidence and event/relation ownership rather than become another independent writer. |
| 5 | Parser / replay cleanup | Valuable deletion work after persisted-reader inventory; not the highest current player-impact root cause. |

### Recommended next cut: Relationship / Event Authority

Establish one typed relation/event observation input and one canonical reducer
for `active_relations`, relationship boundaries/consequences, general events,
and sexual events. The current conflict is that
`reduceRelationUpdates` and `applyEngineRelationEnactments` both mutate
`active_relations`, while the manual evidence shows no durable consequence for
relevant interactions. The likely files are the observation reducers,
`csa-commit-reducer.js`, Extract normalization, commit reducer, Story/Extract
projections, and focused authority tests. Existing
`commit_company_turn` can remain the durable save writer; a DB migration is
needed only if the corrected canonical data shape requires new durable fields.

The cut should explicitly delete the duplicate in-memory relation writer after
Engine-vs-observation precedence, idempotence, end/supersede behavior, and
evidence requirements are proven. It should keep legacy persisted readers only
where a stored-row inventory proves they are still used. It must not add fuzzy
matching, semantic hard gates, provider retries, or a new parser generation.

Acceptance should use an isolated TEST canary with explicit relation/contact,
boundary, and apology actions, then read back active relations, event/sexual
ledgers, relationship fields, and replay/history. The immutable manual game
must not be mutated or reset. Ordinary free player input must remain an intent
and must not be rejected merely because an observation is uncertain.

## 7. Landing and implementation boundary

Adding another stacked PR now would recreate the lineage debt this reset was
intended to remove. The recommended landing decision is for the owner to
consolidate the already accepted #65/#66/#67 ranges into one reviewed landing
range against `main`, preserving commit history and closing/absorbing old
containers only after ancestry and exact diff are verified. No such landing is
performed by this checkpoint.

Alternative: land #65, then #66, then #67 sequentially. This has lower
immediate operational change but preserves a three-container stack and keeps
reviewers exposed to inherited diffs. It is higher long-term lineage risk.

The next `CURRENT_TASK` should authorize only the Relationship/Event Authority
cut: source/caller inventory, one reducer/writer design, focused invariant
tests, isolated TEST acceptance, and explicit stop boundaries before any
migration or deployment. It should not authorize Scene, Memory, Physical/
Sexual, parser cleanup, or Cut 3+ work by implication.

## 8. Evidence and operation ledger

- Source, Git ancestry, PR metadata, and live TEST catalog were read.
- Manual game `78fb...` was read only; no reset or write was issued.
- Dedicated TEST was not mutated or reset.
- Production was not accessed.
- No runtime, frontend, test, content, migration, config, provider, or model
  file was changed.
- No migration, DB write, deploy, branch, PR, merge, rebase, or PR Ready
  operation was performed.

Recommended success phrase for this checkpoint:

`POST-CUT2 GAME MODEL RECOVERED — NEXT ARCHITECTURE CUT RECOMMENDED, AWAITING OPERATOR REVIEW`
