# Runtime 17-Turn Regression Coverage Audit

## Audit boundary

- Audit base: `607d61b2a7a62a2b38ce3317730b486a4ed98d29` (PR #55 merge)
- Branch: `company/runtime-reset-regression-coverage-v1`
- Production/DB data was not read or modified. All fixtures are repository fixtures or in-memory route mocks.
- A test is `covered` only when it exercises the current production reducer/parser/route path. Source-regex or documentation-only assertions are `partial`.

## Coverage matrix

| # | Documented test | Actual test(s) and fixture | Production path | Initial / final | Evidence and reason |
|---:|---|---|---|---|---|
| 1 | `null structured action cannot mutate active rules` | `test/runtime-17-turn-regression-coverage.test.mjs` — `null structured action cannot mutate active rules`; in-memory save | `assertRuleDefinitionAuthority()` | partial / partial | The authoritative function is exercised, but this is not a full `/api/story → /api/commit` route fixture. Existing `runtime-action-authority.test.mjs` supplies the same direct contract. |
| 2 | `partial clothing change cannot satisfy underwear-only rule` | `test/runtime-domain-regressions.test.mjs` — `domain clothing requires exact Story evidence and rejects magical or planned transitions`; `fixtures/phase-0.5/canonical-save-v1.json` | `reduceNpcPhysicalObservation()` and V2 Commit path | partial / partial | Exact clothing evidence, magical transitions, and plans are covered. No test models the aggregate underwear-only rule satisfaction decision. |
| 3 | `missing Story choices remain an explicit format failure` | `test/runtime-17-turn-regression-coverage.test.mjs` — same title; `test/runtime-product-contracts.test.mjs` parser contract | `parseNarrative()` plus `reduceStoryChoiceProjection()` | partial / partial | Parser warning remains explicit while the compatibility projection pads choices. A route-level policy that refuses to call padded choices a format success is not present. |
| 4 | `active rule semantics remain stable across turns` | `test/runtime-17-turn-regression-coverage.test.mjs` — `active rule projection remains stable across expected turns`; no external fixture | `buildStoryPrompt()` `active_world_rules` projection and `assertRuleDefinitionAuthority()` | partial / partial | The saved rule content, authority tier, scope, and mode are stable across expected turns. No LLM-output assertion is used, so semantic reinterpretation in generated prose remains an operational check. |
| 5 | `explicitly present NPCs cannot collapse to empty snapshot` | `test/runtime-scene-reducer.test.mjs` — `empty final presence is an explicit player-only scene`, `final presence replaces rather than unions legacy ids`; `test/turn-pipeline-integration.test.mjs` — `movement Commit recomputes the scene cast...`; canonical save fixture and route mock | `reduceCanonicalScene()` → `reduceGameplayCommit()` → Commit route | covered / covered | Final presence is reduced and committed through the current scene-first production path; legacy arrays are not used to restore a contradictory snapshot. |
| 6 | `NPC instruction cannot deactivate continuous world rule` | `test/runtime-action-authority.test.mjs` — `ordinary turns preserve csa definitions and reject malicious Extract mutations`; `test/csa-app-hardening-v1.test.mjs` runtime tracking tests | `assertRuleDefinitionAuthority()` and CSA runtime reducer | partial / partial | Ordinary Extract cannot mutate the definition map and runtime trigger evaluation cannot downgrade execution. There is no direct fixture containing an NPC instruction attempting to end a continuous rule. |
| 7 | `Story cannot invent legal clause numbering` | `test/runtime-17-turn-regression-coverage.test.mjs` — `Story prompt projects only saved rule content and injects no legal clause numbering`; no external fixture | `buildStoryPrompt()` rule projection | partial / partial | The prompt carries only the saved rule content and does not inject a fabricated clause. There is intentionally no post-LLM legal-clause verifier; generated Story grounding still needs live review. |
| 8 | `completed movement updates canonical scene metadata together` | `test/runtime-scene-reducer.test.mjs` — `location change updates canonical location`, `location change resets beat`; `test/turn-pipeline-integration.test.mjs` — `movement Commit recomputes the scene cast...` | `reduceCanonicalScene()` and full Story → Extract → Commit route | covered / covered | Location, scene cast, legacy projection, and stale NPC removal are asserted after Commit. |
| 9 | `registered remote NPC does not become present without observed entrance` | `test/runtime-scene-reducer.test.mjs` — `turn 16 registered NPC is not added without final evidence`; `test/runtime-commit-reducer.test.mjs` — `scene is reduced before domains so an entered NPC physical observation is retained` | canonical scene reducer and Commit reducer | partial / partial | Registered-vs-present and entered-NPC behavior are covered in reducer tests. A single production route fixture combining a stationary transition and an unobserved registered NPC is not present. |
| 10 | `legacy present flag cannot contradict canonical presence` | `test/runtime-scene-reducer.test.mjs` — `turn 17 stale present flag cannot override participants`, `version one canonical scene ignores legacy presence`; `test/runtime-presentation-authority.test.mjs` — `canonical scene is the sole frontend presence/focal/speaker authority` | `hydrateCanonicalScene()` and frontend canonical projection | covered / covered | Canonical v1 presence wins over `participants`, `last_npcs_present`, and NPC `present` flags in both engine and UI projections. |
| 11 | `single acting current NPC becomes focal` | `test/runtime-scene-reducer.test.mjs` — exact title `single acting current NPC becomes focal` | `reduceCanonicalScene()` | covered / covered | The exact production reducer test calls `reduceCanonicalScene()`, and route integration persists the same canonical scene result. This meets the audit’s production reducer/route covered criterion. |
| 12 | `current explicit speaker replaces stale previous speaker` | `test/runtime-scene-reducer.test.mjs` — `current Story last speaker replaces prior speaker`; `player is a valid last speaker` | `reduceCanonicalScene()` | covered / covered | Current-turn explicit speakers replace prior values, including player and exited historical speakers; no carry-forward is used when a current speaker exists. |
| 13 | `player utterance is never assigned to NPC`; `Story does not invent material player dialogue` | `test/runtime-17-turn-regression-coverage.test.mjs` — `player utterance is never assigned to NPC`; `test/company-heroines-v1.test.mjs` — `the parser resolves each heroine name to its correct stable ID and never partial-matches` | production `parseNarrative()` | partial / partial | Explicit player dialogue is retained as player text and never mapped to a registered NPC. Material expansion by a live Story model cannot be proven without a live LLM call and is intentionally not added. |
| 14 | `notice text is not extracted as spoken dialogue` | `test/company-supabase-evidence-recovery.test.mjs` — `server parser recovers registered quote-only dialogue observed in production rows`; the same test asserts the notice quote is not normalized as the NPC dialogue | production server `parseNarrative()` | covered / covered | The production-style notice fixture distinguishes the one registered spoken quote from the quoted notice/document text. |
| 15 | `fear and compelled compliance do not imply arousal or acceptance` | `test/runtime-17-turn-regression-coverage.test.mjs` — `fear evidence cannot be reused as arousal or acceptance stat evidence`; `test/runtime-domain-regressions.test.mjs` evidence-gated stat tests | `reduceNpcStatObservation()` | partial / partial | Emotion evidence alone cannot authorize sexual-arousal or CSA-acceptance deltas. The reducer intentionally does not perform semantic emotion classification; a model-proposed delta with its own exact stat quote remains a future authority-audit item. |

## Added deterministic coverage

Added `test/runtime-17-turn-regression-coverage.test.mjs` with six tests:

- null structured action authority;
- active rule projection stability across expected turns;
- explicit choice-format warning despite deterministic padding;
- saved-rule-only clause grounding projection;
- player dialogue speaker preservation;
- emotion/fear evidence not being reused as stat evidence.

Final aggregate: **covered 6 / partial 9 / missing 0**.

These tests use production `assertRuleDefinitionAuthority`, `buildStoryPrompt`, `parseNarrative`, `reduceStoryChoiceProjection`, and `reduceNpcStatObservation`. No new matcher, verifier, semantic gate, fallback authority, or save writer was added.

## Audit conclusion

The current tree has direct production coverage for canonical scene, presence, movement, speaker, parser notice handling, V2 evidence, and Commit authority. The remaining partial items are intentional boundaries: aggregate CSA clothing satisfaction, generated Story semantic grounding, route-level missing-choice policy, and semantic separation of fear from a model-proposed stat delta require either live model evaluation or a future product-contract decision. This audit does not change those authorities.
