# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-test-rollout-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308377329` — ACCEPTED `minimal-story-runtime-navigation-phase-closure-v1`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
Reviewed final/docs SHA: `e6cf25225f9e7f1d9bbccc06c206ca4a43b89ff3`.

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- root `CURRENT_TRUTH.md`
- accepted Minimal Story Runtime audit review `5308024297` / audit SHA `7418750a84b0b2925330330469c5a519d0dd11a2`.

Required additive migration source:
- `supabase/migrations/20260816050000_company_v1_minimal_story_runtime_contract.sql`
- reviewed source blob at final head: `26b1a1b43b4d6a6b6d7c766ba516f16b88c453e9`
- operator read-only TEST check immediately before registration found no applied migration row for version/name `20260816050000 / company_v1_minimal_story_runtime_contract`.

Disposable TEST game:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- operator preflight readback: committed_turn 0, Level 1, setup/opening not_started, canonical scene `setup`, actions 0, turns 0.
- because the migration is not live yet, its current save still contains pre-migration roots such as `npc_stats`, `npc_relationship_state`, and `csa_attitudes`; this is expected pre-rollout evidence, not a reason to preserve those roots.

Forbidden evidence games:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: DO NOT ACCESS.
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: DO NOT ACCESS in this rollout. Existing recorded evidence is enough.
- Production: forbidden.

## Objective

Perform one controlled TEST-only rollout and scenario-driven product acceptance of the reviewed Minimal Story Runtime plus the accepted navigation/scene-phase correction.

This is the first live boundary for the reviewed semantic reset. Do not split it into more evidence-only probes unless the first deterministic product defect requires source review.

The runtime should remain explainable as:

`player input / exact provider literal`
→ `minimal committed context`
→ `Story LLM authors narrative`
→ `fresh parser structures presentation/wire`
→ `Extract observes narrow Story-grounded machine/UI facts + natural-language turn_summary`
→ `Commit structural transaction boundary`
→ `game_save + game_turns committed authority`
→ `latest six raw committed turns + chronological older turn_summary memory`
→ next turn.

## Required execution

### A. Freeze and preflight

1. Freeze START HEAD and verify it is the current docs-only descendant of reviewed source `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`. Verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Re-read the exact migration source and verify its blob/content is unchanged from the reviewed candidate. Do not edit historical migrations or author another migration.
3. Read-only verify TEST live state before mutation:
   - migration `20260816050000 / company_v1_minimal_story_runtime_contract` is absent;
   - disposable game is at clean turn-0 baseline;
   - current DB validator/reset still represents the pre-migration contract;
   - existing TEST-only Level-7 fixture migration/function may remain installed, but do not invoke it until after the Minimal Story Runtime migration/reset contract is verified.
4. Verify current TEST API and Frontend deployed identities/source lineage. Determine deployment need from actual changed source surfaces, not from commit age.

### B. Apply exactly one reviewed migration to TEST

5. Apply **only** `20260816050000_company_v1_minimal_story_runtime_contract.sql` to TEST using the established single-migration dry-run/apply path. Apply exactly once. Do not modify the migration to make live state pass.
6. After application, independently verify:
   - migration ledger row exists exactly once;
   - `company_minimalize_save_v1`, current `validate_company_save_v1`, reset/opening/commit writers match the reviewed migration body and required ACL/search_path properties;
   - no unexpected function/grant/schema mutation accompanied it.
7. Canonically reset only the disposable TEST game using the named reset boundary. Verify the resulting current save:
   - committed_turn 0, actions 0, turns/history 0, Level 1;
   - canonical `scene` v1 setup bootstrap;
   - required narrow roots remain valid;
   - retired fresh semantic roots stripped by `company_minimalize_save_v1` are absent, including `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`, `sexual_event_ledger`, `story_summary_overall`, `story_summary_recent`, `npc_emotion`, `npc_work_state`, and general `event_ledger`;
   - no hydration/default path immediately resurrects them.

### C. Deploy exact reviewed lineage

8. Deploy the TEST API from the exact reviewed source lineage containing `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d` plus only docs-only descendants if the currently deployed API source differs. Use the existing Stage-B/contract-gated deployment path. Record Worker Version ID and health.
9. Deploy the TEST Frontend only if actual frontend runtime/assets in the reviewed lineage differ from the deployed frontend. If source-equivalent, prove equivalence and skip redeployment. Do not deploy merely because branch HEAD changed.
10. No source/runtime/test/config/content patch is authorized in this rollout. A deterministic defect means capture evidence, cleanup if safe, and STOP for operator review.

### D. One coherent product scenario

11. Run Setup + Opening on the disposable game. Verify Opening returns exactly four provider-authored literal choices and committed `parsed_blocks` carries the same four literals/order.
12. Turn 1 must send one actual Opening provider literal **unchanged** as player input and complete Story → Extract → Commit once.
13. Use several subsequent free-text actions in one coherent workplace scenario. Target 8–10 committed ordinary turns unless a decisive defect occurs earlier; the goal is scenario coverage, not a numeric pass count.
14. Explicitly exercise registered-NPC destination navigation with the reviewed structural form using the actual registered Mina identity, e.g. `윤민아 보러간다`. Verify:
   - typed navigation has target `heroine2` and canonical destination `brand_strategy_office`;
   - stale/mutable NPC scene mirrors do not select the destination;
   - Story actually proceeds at the destination rather than generating a duplicate/fake Mina or keeping the player at the source location.
15. Exercise at least one authoritative A → B movement after a source NPC has spoken/been present. Verify final committed scene after movement:
   - location is B;
   - source-phase speaker/presence/entrance evidence from A does not teleport that NPC into B;
   - a source NPC may accompany/appear in B only when exact destination-phase evidence establishes entry/accompaniment/presence there;
   - remote speakers never become local presence.
16. Verify scene/time chronology remains sane across movement: no backwards/duplicate scene authority, no stale source location overriding canonical destination, and current time advances only through the accepted narrow time path.

### E. Minimal Story Runtime invariants

17. For every fresh turn sampled, inspect the actual Story input/context projection and post-Commit save/readback. Confirm retired semantic roots are not reintroduced as fresh Story authority or durable current-save authority. In particular, do not accept silent resurrection of:
   - `npc_stats` / generic affinity-resistance-csa-acceptance state;
   - generic `npc_relationship_state` narrative authority;
   - `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`;
   - fresh general relation/event/emotion/work/fact memory bags;
   - fresh `sexual_event_ledger` taxonomy;
   - image/media state as narrative truth.
18. Preserve and verify narrow current mechanics that the owner canon keeps:
   - canonical scene/location/presence/focal/last speaker;
   - current time;
   - player progression and CSA rule lifecycle/capability;
   - compact physical/clothing continuity only where actually observed;
   - direct-evidence `player_sexual_state` if naturally reached;
   - exact literal choices;
   - Mind Monitor, TTS/image/media as presentation sidecars;
   - committed parsed blocks, history, transaction/idempotence/replay identity.
19. If using the already-installed TEST-only Level-7 seam, invoke it at most once after the migration/reset contract is proven. It may grant progression/capability only. It must not seed narrative facts, compliance, relationship, physical, clothing or sexual outcomes.
20. Exercise one valid CSA activation/context if practical in the coherent scenario. Verify owner semantics:
   - activation-time company notice/rule is sufficient; no retroactive memory is required;
   - once valid and applicable, the rule is in force as the altered workplace premise;
   - personal dislike/embarrassment may affect reaction, but cannot make the active applicable rule optional/not-in-force;
   - CSA compliance must not automatically become consent, comfort, affection, trust, romance, or arousal;
   - do not require or restore finite physical execution grammar.
21. Do not force a sexual outcome merely for coverage. If a direct-evidence player sexual mechanical update occurs naturally, verify it remains narrow and does not reconstruct the removed generic relationship/event memory. If not reached, report not reached rather than retrying.

### F. Memory/readback/recovery

22. Continue enough turns that at least one meaningful early work detail/promise/request leaves the latest-six raw window. Verify the next Story context contains exactly the latest six raw committed turns plus older chronological natural-language `turn_summary` entries, and that continuity can proceed without the retired general semantic ledgers.
23. Verify committed refresh/context/frontend readback after the rollout uses committed authority:
   - choices from committed parsed blocks / Opening projection;
   - scene/display from canonical committed projection;
   - no stale client/save mirror regains semantic authority.
24. Perform same-action replay/recovery on one committed ordinary turn. Verify Story/Extract/Commit replay flags/identity and no committed-turn/save duplication. Do not regenerate provider output for replay.
25. Verify history uses committed parsed blocks and turn summaries; the single persisted legacy Extract adapter remains historical read-only and is not entered by fresh provider output.

### G. Stop/cleanup

26. One scenario attempt only. No provider retry/regeneration to obtain a prettier result. No parser relaxation, fuzzy repair, semantic gate, compatibility bag, generic memory system, or model/provider/config change.
27. On the first deterministic product defect:
   - capture turn/action/stage plus the smallest decisive raw Story/parsed/Extract/Commit/readback evidence;
   - perform canonical cleanup reset if safe;
   - report BLOCKED/FAILED and STOP. Do not patch source inside this rollout.
28. On PASS, finish with one canonical reset of the disposable game. Verify:
   - committed_turn 0;
   - actions 0 / turns-history 0;
   - processing idle;
   - player setup/opening not_started;
   - Level 1 / exp 0;
   - canonical scene `setup`;
   - retired semantic roots remain absent after reset;
   - no Level-7 acceleration state remains.
29. Record exact applied migration identity, API/Frontend deployed identity or source-equivalence proof, scenario turn/action evidence, navigation and A→B scene evidence, memory boundary, replay result, final reset and forbidden-operation confirmation.

## Architecture constraints

- Story LLM authors narrative; server must not become a second narrative author.
- Extract is one observer LLM for narrow grounded projections + `turn_summary`, not a general fact/relationship/emotion/event memory engine.
- Commit is structural transaction authority, not semantic interpreter.
- No `open_facts`, `open_observations`, generic relationship/event/emotion/work ledger, entity graph/vector DB, importance score, semantic gateway, finite physical execution authority, fuzzy inference, or third summary/memory LLM.
- No semantic/evidence hard gate added to ordinary turns.
- Registered character/location/catalog IDs are allowed finite content identity; do not broaden the exact NPC navigation helper into a generic intent ontology.
- CSA is institutional lifecycle/context/capability. Compliance remains distinct from unrelated consent/comfort/affection/trust/romance/arousal.
- Media/image/TTS are presentation sidecars and may never block or redefine narrative truth.
- Historical `game_turns.pre_save/post_save`, committed `parsed_blocks`, and the single persisted legacy Extract read boundary remain historical/replay evidence; do not rewrite historical rows to make the new current save look cleaner.
- Historical applied migrations are immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployment inspection;
- read-only TEST DB preflight;
- apply exactly the reviewed migration `20260816050000_company_v1_minimal_story_runtime_contract.sql` to TEST once if still absent;
- deploy exact reviewed API lineage to TEST if required;
- deploy exact reviewed Frontend lineage to TEST only if actual frontend source differs;
- disposable TEST game reset/setup/opening/gameplay/CSA/history/replay;
- existing TEST-only Level-7 seam at most once if needed for CSA coverage;
- read-only TEST DB verification and bounded temporary evidence artifact;
- docs-only completion record and immutable Issue #68 terminal report.

Not authorized:
- any Production access/deploy;
- any access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- any access to QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- source/runtime/test/config/content/migration editing;
- another migration/DDL outside the one reviewed migration application;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic hard gate, compatibility runtime/bag;
- new branch/PR, rebase, squash, force-push, merge or Ready transition.

## Acceptance

PASS only if the reviewed Minimal Story Runtime contract is live on TEST, current saves no longer resurrect retired semantic roots, ordinary gameplay continues through the canonical Story → Extract → Commit spine, exact provider choices/free text work, registered-NPC navigation and A→B scene chronology behave correctly, older continuity survives through turn summaries after leaving the six-raw window, committed readback/replay remain correct, and the disposable TEST game returns to a clean minimal turn-0 baseline.

Transport success or test count alone is not PRODUCT_PLAY_PASS. Story/premise coherence, player navigation/agency, scene chronology, memory continuity and absence of duplicate semantic authority are part of acceptance.

On PASS or first decisive blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact reviewed source, migration/deploy identities, scenario evidence, any unexercised optional surface, final reset state, forbidden-operation confirmation and final docs SHA;
- STOP for operator review. Do not generate the next task yourself.