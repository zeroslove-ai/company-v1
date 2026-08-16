# Company v1 — CURRENT TASK

Status: READY
Task ID: setup-opening-world-definition-authority-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5305470277` ACCEPTED Scene mirror TEST rollout.
Accepted gameplay/source lineage includes reviewed Scene cleanup SHA:
`cd615b4926a5a7092247459d44d25f886b8ac92b`.
Terminal docs SHA before this registration:
`eb9428c57f5eb2e789fe779d104e26d6c9bbc406`.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is historical READ-ONLY evidence and must not be read, mutated, reset, or bulk-migrated in this task.
Production access is forbidden.

## Accepted architecture

- Repository content/catalog owns semantic setup/world membership and display names.
- DB owns transactional persistence, structural save integrity, conflict/idempotence, not a second semantic catalog.
- `src/engine/player-setup.js` already validates submitted `department_id`, `position_id`, `body_type_id`, and `speech_style_id` against repository-supplied catalogs and builds opening plans from repository location/registered-character content.
- Stable registered character IDs remain a real identity-integrity boundary. Do not replace them with fuzzy aliases or open-ended IDs.
- Canonical `save.scene` remains the sole scene/location/presence authority. Do not reintroduce removed Scene mirrors.
- Provider-authored exactly-four literal choices remain presentation shape; no server semantic choice authoring.
- TEST-only Level-7 acceleration and media/image catalogs are protected separate consumers; do not change them here.

## Objective

Eliminate duplicate Setup / Opening / turn-0 world-definition semantic authority from SQL and runtime boundaries where repository validation already owns the meaning. Keep one transactional DB writer, but remove DB hardcoded copies of departments, positions, body types, speech styles, heroine/world membership, opening semantic routing, or equivalent finite semantic allowlists unless a current non-semantic structural/integrity consumer proves each one is required.

This is deletion/authority consolidation, not a compatibility expansion.

## Required work

1. Freeze exact START HEAD. Verify #67 remains base `main`, OPEN / DRAFT / UNMERGED and that executable changes after accepted `cd615b4...` are understood before editing.
2. Inventory the complete current Setup -> reserve -> Opening path in source, tests, migrations, and live TEST function definitions read-only. At minimum trace:
   - client/server setup validation;
   - repository catalogs and registered character/location content;
   - `reserve_company_player_setup` current caller and SQL body;
   - `commit_company_opening` and any turn-0/opening helpers;
   - `game_master` / initial-save inputs and structural validators;
   - any SQL hardcoded `department_id`, `position_id`, `body_type_id`, `speech_style_id`, heroine IDs, location/world membership, weekday/work-hook/scene-goal semantic rules.
3. Classify every finite setup/world rule with REMOVE-OR-PROVE:
   - KEEP only if an actual product/UI or narrow structural-integrity consumer requires it at that exact layer;
   - MOVE/DELETE if repository content already validates/defines it;
   - stable registered IDs may remain for identity integrity, but SQL must not independently define who the registered heroines/world members are if repository content already does.
4. Redesign the authority boundary so semantic validation happens once in repository/application code, while the canonical DB RPC persists already-validated structured input transactionally and validates only structural shape/identity/transaction invariants that belong in DB.
5. Do not make the API a second durable writer. The DB RPC remains the sole transactional persistence boundary for setup reservation/opening state. Application code may validate/construct canonical structured input before the RPC, but must not directly PATCH/INSERT gameplay save state.
6. Remove superseded SQL/source/test semantic allowlists and duplicate turn-0 projection writers in the same cut when caller proof is complete. Do not preserve stale tests by adding compatibility branches.
7. Preserve current real consumer behavior:
   - player setup fields and UI catalog choices;
   - stable character IDs/names;
   - repository-driven opening location/character selection;
   - canonical `save.scene`;
   - physical/clothing/posture state;
   - `npc_stats`, CSA, progression, literal choices, Mind Monitor/TTS;
   - sexual/media/image selection presentation adapters.
8. Historical applied migrations are immutable. If DB contract changes are needed, author exactly one new additive migration source for this authority cut. Do not edit applied migrations.
9. If the clean design requires a canonical RPC signature change, remove the superseded active signature in that additive migration once source/caller proof shows zero active caller. Do not add an overload merely for compatibility.
10. Tests must prove authority, not just count:
    - invalid semantic IDs are rejected by repository/server validation before DB mutation;
    - DB contract does not carry a second hardcoded semantic catalog;
    - valid repository-catalog values pass through canonical Setup -> Opening;
    - arbitrary future valid catalog entries can pass without editing SQL, subject only to structural/registered identity invariants;
    - one transactional DB writer persists setup/opening reservation state;
    - reset/recovery/opening structured persistence remain valid;
    - removed Scene mirrors remain absent.
11. Run focused tests, full suite, syntax/static checks, and `git diff --check`.
12. Produce a concise audit note listing each removed/retained finite rule and its proven consumer.

## Architecture constraints

- One durable domain -> one canonical writer.
- Semantic catalog/world definition belongs to repository content, not duplicated SQL.
- Structural DB validation must remain strict; do not weaken save schema, transaction identity, registered-ID integrity, ACL/security/search_path, or idempotence.
- No generic state bag, semantic `other` enum, regex existence gate, fuzzy ID repair, new parser, retry/regeneration, provider/model/config change, or server-authored fallback choices.
- Institutional CSA rules are separate from NPC consent/comfort/affection/emotion.
- Image/media taxonomy is presentation-only and must never gate whether narrative facts occurred.

## Authorized operations

Authorized:
- source/test/docs edits within this single cut;
- read-only Git/PR and TEST DB/catalog/function inspection;
- exactly one additive migration SOURCE if required by the clean DB contract;
- local/focused/full tests and static checks.

Not authorized in this task:
- applying any new migration to TEST;
- TEST gameplay/reset/setup writes or live acceptance;
- API/frontend deployment;
- Production access;
- any read/mutation/reset of preserved manual game;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- direct DB gameplay mutation;
- provider/model/temperature/token changes, retries/regeneration, parser relaxation/new parser, fuzzy repair, compatibility overloads/aliases.

## Acceptance

PASS only if source/test/migration candidate establishes one semantic authority and one transactional writer:
- repository/application validation owns setup/world semantic membership;
- DB owns structural/transactional persistence only;
- duplicate SQL semantic catalogs and duplicate turn-0 writers are deleted wherever consumer proof permits;
- stable identity and all protected actual product consumers remain intact;
- tests demonstrate future repository catalog entries do not require SQL semantic-list edits;
- no live TEST/Production/manual-game mutation occurred.

If current live/source coupling prevents a clean one-writer design without a broader dependency change, record the exact blocker and STOP as BLOCKED rather than adding compatibility.

## Completion

On PASS or deterministic BLOCKED evidence:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit after source/test/migration candidate commit(s);
- report exact START SHA, source/test/migration candidate SHA, changed authority boundaries, REMOVE-OR-PROVE inventory, tests/static checks, live read-only facts used, and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.
