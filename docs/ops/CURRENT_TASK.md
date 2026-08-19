# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: clean-runtime-rebuild-transition-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## OWNER STOP / SUPERSESSION

The owner has terminated the existing Company fresh-runtime repair loop after the preserved 7-turn manual acceptance failure.

Superseded task:

`live-7turn-runtime-collapse-v1`

Owner abort comment:

Issue #68 comment `5338511826`

Preserved failed game:

`df3045fd-c359-4cdc-8783-357ddfebe398`

The failed game and all previous manual/QA/evidence games are READ-ONLY. Never reset, reseed, revise, replay, or mutate them.

## Decision

Do not continue patching, collapsing, or migrating the current fresh gameplay runtime.

The next implementation will be a clean-room gameplay runtime spine. Existing Company content/catalogs, visual frontend components, deployment infrastructure, static character/location/CSA definitions, and narrowly proven utilities may be reused only through explicit clean interfaces. Existing Story/Extract/Commit orchestration, frontend pending-stage machine, fresh compatibility adapters, old reducer chains, and accumulated runtime tests are reference/donor material only and are not the implementation base.

No new implementation may start until a separate Clean Runtime Canon and explicit READY task are registered after the current watcher lease terminates safely.

## Current stop rules

- no source/runtime/test/config/content edits;
- no PR merge, including old PR #82;
- no deploy;
- no TEST/Production DB write or migration;
- no preserved-game mutation;
- no provider/model change;
- no automatic next task;
- no continuation of `live-7turn-runtime-collapse-v1`.

STOP until the owner/operator registers the clean-runtime rebuild task.