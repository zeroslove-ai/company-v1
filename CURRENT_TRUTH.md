# Company Current Truth

**Current owner architecture decision: rebuild the gameplay runtime as Company v2 clean-room runtime.**

Before any Company gameplay-runtime implementation/review/deploy decision, read in this order:

1. [Development Rules](AGENTS.md)
2. [Company v2 Clean Runtime Canon — 2026-08-19](docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md)
3. [Current Task](docs/ops/CURRENT_TASK.md)
4. Historical architecture/evidence only as needed:
   - `docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
   - `docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
   - `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
   - `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`
   - `docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

The 2026-08-19 Clean Runtime Canon supersedes older fresh gameplay-runtime implementation assumptions wherever they conflict. Older documents remain useful evidence for product requirements and failure history, not implementation authority for Company v2.

## Owner decision — 2026-08-19

The preserved manual acceptance game `df3045fd-c359-4cdc-8783-357ddfebe398` failed after 7 committed turns with simultaneous defects in turn concurrency/client stage ownership, CSA synthetic-turn semantics, player-vs-NPC identity, summary/Mind Monitor reliability, physical observation, and committed protocol hygiene.

The owner therefore ended the existing runtime repair loop.

### Frozen old runtime

The current Company v1 gameplay runtime is historical/reference code during v2 work.

Do not:

- continue symptom repair on the old fresh runtime;
- merge old PR #82 or equivalent old-runtime repair PRs;
- use old runtime-core/Extract/client pending-stage code as the implementation base;
- preserve old tests/compatibility merely to make v2 resemble v1;
- migrate old saves/games into v2 during initial development.

All preserved manual/QA/evidence games are read-only.

### What remains product canon

Keep the Company product:

- company setting, departments, roles and character personalities;
- registered character and location identities;
- player literal action/choice fidelity;
- CSA rule/preset product definitions;
- streaming narrative UX;
- relevant Mind Monitor presentation;
- later image/TTS sidecars;
- player freedom and natural Story-first play.

These product requirements do not require the old runtime implementation.

## Company v2 canonical spine

```text
literal player action
→ one server-owned turn request
→ Story LLM streams narrative
→ one small typed post-Story observation
→ small deterministic reducer
→ one atomic v2 durable commit
→ next turn/readback
```

The browser never owns Story→Extract→Commit stage progression or automatic LLM retries.

The new runtime uses physically separate v2 code and new mutable v2 persistence. Existing static content/catalogs and narrowly proven infrastructure utilities may be reused through explicit clean interfaces. `runtime-v2` must not import old gameplay-engine modules.

## Initial persistence authority

V2 durable truth is isolated from old mutable runtime tables:

- `company_v2_games`
- `company_v2_state`
- `company_v2_turn_jobs`
- `company_v2_turns`

Exact table names may change once during Phase 1 review, but the isolation rule is binding. V2 gameplay must not be forced through old `game_actions/game_save/game_turns` compatibility contracts.

## Phase order

### Phase 1

Build only a 5-turn playable vertical slice:

- v2 game fixture/opening;
- server-owned streaming `/api/v2/turn`;
- literal action;
- Story;
- exactly four choices;
- minimal scene/time;
- one typed observation;
- summary + relevant Mind Monitor;
- durable v2 state/history;
- reconnect to the same in-flight job;
- no automatic retries.

Then deploy TEST and stop for owner 5-turn manual play.

### Phase 2

Only after Phase 1 manual acceptance:

- exact navigation;
- CSA as a non-gameplay transaction;
- four-slot clothing.

Then owner 10-turn manual play.

### Phase 3

Only after Phase 2 acceptance:

- player sexual meter if still desired;
- v2-native feedback revision;
- image/TTS sidecars;
- longer manual play.

Do not front-load legacy compatibility or hundreds of old tests before the first playable slice.

## Stop / execution authority

`docs/ops/CURRENT_TASK.md` is the sole execution authority.

`WAITING_OWNER_DECISION` and `WAITING_REVIEW` are stop states. A new v2 task may start only from an explicit READY registration after any previous watcher lease is safely terminal.
