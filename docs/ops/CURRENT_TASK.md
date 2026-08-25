# Company — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: company-r3-manual-playtest-hold-v1
Mode: MANUAL PLAYTEST HOLD — NO AUTOMATIC DEVELOPMENT
Updated: 2026-08-25 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## 0. Owner decision / lock

The owner explicitly ordered: **lock the current build and stop automatic development.**

Hermes/Codex/WATCHER MUST NOT start implementation from this file because Status is not `READY`.
Do not create a next task, branch, PR, migration, deploy, retry campaign, or follow-on fix automatically.

Resume development only after a new explicit owner instruction following manual playtest, especially for a blocking P0/P1 or a specifically selected issue.

## 1. Frozen manual-playtest baseline

Repository:
- `zeroslove-ai/company-v1`
- branch: `main`
- accepted pre-lock main HEAD: `660cda7a1a9cd413f9463160c1876b3b14b2cdef`

Accepted latest frontend implementation:
- Company Map presence truth implementation: `9b3f4f26c97828ec18e05f29f8df7f18df4bbe81`
- terminal: Issue #68 comment `5408956549`
- focused: 17/17 PASS
- broader: 239/239 PASS
- full npm test: 597/597 PASS

Current TEST frontend baseline:
- Worker: `gamebuilder-company-r3`
- URL: `https://gamebuilder-company-r3.zeroslove.workers.dev/`
- version: `94bdf291-739a-4452-bcb4-e35ec6b96f5d`
- executable source SHA: `9b3f4f26c97828ec18e05f29f8df7f18df4bbe81`

Current TEST API baseline remains the previously accepted runtime deployment:
- Worker: `game-proxy-company-r3`
- version: `26fc1dd2-9354-4b99-b6ee-b4c53306c607`
- executable source SHA: `fab6f43f937dde317fbdf152a41a7942e24d3669`

Latest preserved live evidence game:
- `8a61332b-8365-4655-97c4-754332407948` — READ ONLY

No Production authorization is implied.

## 2. Accepted core boundaries to preserve

The manual-playtest baseline includes and must preserve:
- A′/R3: server-owned turn kernel -> one Story -> one post-Story Observer -> atomic Commit;
- current free-form literal precedence over prior unchosen Story choices;
- PLAYER movement authority and NPC-only movement separation;
- final Story-grounded NPC presence;
- registered NPC identity authority;
- completed-Story Observer evidence law;
- Company Map current presence truth vs default/reference location distinction;
- Opening stationary-start/private-app provenance;
- exactly four Story choices plus unrestricted free input;
- selected-choice submission and reload/re-entry behavior.

## 3. Known deferred issues — NOT automatic blockers during this hold

These remain known/unproven and are intentionally **not** registered as automatic development tasks while the owner is playtesting:
- CSA CHANGE/REMOVE prospective-state / stale previous-rule Story-context risk, including clothing provenance cleanup;
- remote supported-S1 live acceptance;
- setup/world-definition catalog closure;
- broader long-memory / summary continuity;
- Mind Monitor reliability;
- Media/TTS acceptance;
- other adult/CSA breadth lanes not yet exercised.

Do not work these merely because they are listed here.

If manual playtest reveals a game-breaking or severe reproducible defect, operator must first classify the evidence and then explicitly overwrite this same file with one narrow `READY` task.

## 4. Manual playtest purpose

The next phase is human product testing, not automatic defect hunting.

Use the deployed TEST frontend normally and evaluate whether the game is actually fun, coherent, free, and stable over longer play:
- ordinary conversation and non-work social play;
- heroine interaction;
- movement and changing scene;
- refusal/change-of-mind/stop/change-topic;
- adult interaction where relevant;
- CSA apply/change/remove in natural use;
- choices and free input;
- long-session continuity;
- reload/re-entry;
- mobile presentation when useful.

Do not interpret every cosmetic or low-severity imperfection as permission to resume the automatic loop.

## 5. Unlock law

Current state is intentionally locked.

Only an explicit owner instruction may unlock development, for example:
- a reproducible blocking P0/P1 found during manual playtest;
- owner explicitly chooses one known deferred issue;
- owner explicitly asks to resume the automatic development loop.

Until then:
`MANUAL_PLAYTEST_HOLD_LOCKED`
