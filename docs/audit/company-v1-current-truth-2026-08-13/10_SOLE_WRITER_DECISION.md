# Sole-Writer Architecture Decision

Status: proposed binding baseline for owner review

This document freezes the target architecture for the next implementation cut.
It does not change runtime code, SQL, migrations, tests, or deployed state.
The current implementation may still violate a target until the named cleanup
cut is approved and implemented.

## Decision 1 — durable turn/save commit

`commit_company_turn` remains the sole normal-turn durable save/turn boundary.

Story and Extract may reserve actions and stage their outputs in the action
lifecycle, but no gameplay state becomes durable before Commit. The Commit
transaction validates the candidate save, inserts the committed `game_turns`
row, updates `game_save`, and marks the action committed. Feedback revision is
a separately named replacement-turn transaction, not an exception that writes
ordinary gameplay state early.

## Decision 2 — game action lifecycle

All application writes to `game_actions.processing_status`, Story/Extract stage
fields, and error fields must use named lifecycle RPCs. Direct REST GET/SELECT
may remain read-only. Direct REST PATCH is not a permitted application writer.

The current `updateActionStatus` and `claimActionStatus` helpers are therefore
cleanup targets. The minimal replacement design is two compare-and-set RPCs:

- `claim_game_action_stage(game_id, action_id, expected_status, next_status)`
  for a guarded stage claim;
- `fail_game_action_stage(game_id, action_id, expected_status, error_code)`
  for a guarded failure transition.

Both must validate game/action identity, expected current status, and allowed
status transitions, and return the updated action. Existing named Story/Extract
record and commit RPCs remain responsible for their stage payloads. This is a
design only; no RPC is added here.

## Decision 3 — CSA definitions and active rules

Signed CSA definitions become durable only inside the normal Commit reducer and
`commit_company_turn` transaction. No pre-Commit save mutation survives.

The live `apply_reserved_csa_transaction` is an obsolete `SECURITY DEFINER`
writer: it directly mutates `csa_active`/`csa_rules` and increments
`save_revision` before Commit. It must be caller-audited, then revoked/dropped
by a new additive cleanup migration. Historical migrations remain immutable.

The Engine may produce typed enactment/runtime events before Commit, but those
events are staged inputs; only the Commit reducer writes durable CSA state.

## Decision 4 — scene, location, and presence

`save.scene` version 1 is the sole canonical representation for scene
membership, location, focal character, and last speaker. `reduceCanonicalScene()`
is the sole reducer writer.

`scene_state`, `last_npcs_present`, and `npc_scene_state.present/location/scene_id`
are compatibility/projection fields only. `npc_scene_state` may remain the
canonical home for NPC physical detail such as posture and clothing, but its
membership/location fields cannot independently decide presence or location.

Transition rule:

1. The Commit reducer computes `save.scene` first.
2. Compatibility projections are generated from that scene after the canonical
   update, in the same candidate save.
3. New readers must consume `save.scene` immediately; compatibility readers are
   allowed only at explicit hydration/render boundaries.
4. Once the reader inventory shows no runtime consumer, the compatibility fields
   may be removed by a later additive migration and projection cleanup.

## Decision 5 — player location

`save.scene.location_id` is the only navigation/location authority.

`player_scene_state.location_id` may remain temporarily as a compatibility
projection for existing consumers, but it must be overwritten from
`save.scene.location_id` after every canonical scene reduction and may never be
an independent navigation writer or trigger authority. A future cleanup may
delete the duplicate field once the reader inventory is zero.

## Decision 6 — active relations

One canonical relation reducer owns `active_relations`. No second function may
write the array directly.

Engine CSA enactments and exact Story/Extract relation observations become typed
input events to that reducer. Events carry canonical actor, target, relation
kind, state, turn, and evidence/source metadata. Ordinary non-CSA relation
changes remain valid only when exact Story evidence supports them.

Deterministic precedence: for the same actor and turn, a valid Engine mandatory
relation event wins over a conflicting observational Extract event. This does
not allow an unresolved Engine target to create a relation. Reducer behavior
must be idempotent and must close/end the prior canonical relation before a
superseding one.

## Decision 7 — player/NPC physical and sexual state

Evidence-gated structured reducers remain the sole durable writers. Player input
is intent/attempt, not successful state. Provider Story, structural ACTING
metadata, and exact Extract evidence are observation inputs. No semantic hard
gate or input-to-state shortcut is introduced.

## Decision 8 — setup/opening content duplication

Repository content/catalog validation owns semantic IDs and world catalog
membership. DB RPCs own transactional persistence, save shape, conflict checks,
and structural integrity—not a second department/position/heroine/body/speech
catalog.

The live `reserve_company_player_setup` hardcoded allowlists and turn-0 world
projection construction are cleanup targets. A future additive migration should
remove semantic world allowlists from SQL only after runtime validation is
proven to supply the same structural guarantees. No weakening of structural
save validation is allowed.

## Decision 9 — choices, THOUGHT, summary, and frontend cache

The committed server turn/context is canonical for choices, THOUGHT, summary,
and gameplay state. Streaming/session state is temporary presentation only and
must be replaceable by committed context after refresh, recovery, or reset.

Frontend caches cannot become a gameplay writer or override the committed
server representation.

## Decision 10 — parser/protocol compatibility

The fresh narrative protocol is the live generation contract. Committed
`parsed_blocks` are replay authority for committed turns. Persisted or legacy
re-parsing is a narrow compatibility window only; it must not create a new
semantic authority.

Deletion criterion for legacy parser paths: all active readers and stored-turn
recovery paths consume committed parsed blocks, no deployed route requires
legacy re-parsing, and the Golden Path harness demonstrates replay parity for
the supported compatibility window. No third parser generation is permitted.

## Decision 11 — migration policy

Historical applied migrations are immutable evidence. Cleanup is performed only
by additive/new migrations. Old files are never edited to pretend that live DB
state changed. Revoke/drop operations must be preceded by caller inventory and
read-only live catalog confirmation.

## First implementation cut after owner approval

### Authority Consolidation Cut 1 — DB mutation boundary

Exactly one implementation cut is authorized for planning:

1. Replace direct action-status REST PATCH writes with named compare-and-set
   lifecycle RPC mutation(s).
2. Verify that no current JS caller uses `apply_reserved_csa_transaction`; keep
   external-client caller audit as a gate before removal.
3. Add a new additive migration to revoke/drop the obsolete CSA preapply writer
   once the caller gate passes.
4. Preserve `commit_company_turn` as the sole normal-turn durable save/turn
   commit.
5. Reuse the existing live canary/E2E/reset helpers only for targeted contract
   verification; do not add a new harness in this cut.

Scene, location, active-relations, parser, frontend cache, and content-catalog
rewrites are explicitly outside this cut. They follow only after this DB
mutation boundary is reviewed and accepted.

## Current blockers before implementation

- Confirm no external caller, scheduled job, or operator script invokes the live
  CSA preapply RPC.
- Confirm exact allowed action status transition graph for the proposed RPCs.
- Inventory all readers of scene/location compatibility fields before deleting
  any field.
- Owner approval of this single-cut boundary.

No blocker permits silently retaining two writers in the target architecture;
it only delays the cleanup until evidence is complete.
