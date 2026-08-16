# Company v1 Current Truth

**Company v1 runtime/review/deploy questions must not be answered from memory alone. Read the current canon first, then verify Git/DB/deployment facts when the question depends on them.**

Read in this order before any Company v1 runtime implementation, review, rollout decision, or completion approval:

1. [Development Rules](AGENTS.md)
2. [Current Truth](docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md)
3. [Sole-Writer Decision](docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md)
4. [Minimal Story Runtime Reset Canon — 2026-08-16](docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md)

`09_CURRENT_TRUTH.md` may explicitly supersede an older implementation detail in `10_SOLE_WRITER_DECISION.md` while retaining its other architecture decisions. The 2026-08-16 Minimal Story Runtime Reset Canon further refines semantic-runtime direction after user live QA. Where an older semantic implementation assumption conflicts with that owner decision, the newer canon controls. Current source, live DB facts, exact deployed identity, Git ancestry, and immutable evidence outrank historical handoff/completion prose.

## Canonical gameplay spine

The Company v1 runtime should remain explainable as one simple loop:

`player input / literal choice`
→ `Story LLM authors the player-visible narrative`
→ `Extract LLM observes what the Story actually established`
→ `Commit structurally validates and persists through the single durable transaction boundary`
→ `game_save + game_turns become the committed authority`
→ `context/history/UI and the next Story read that committed authority`
→ repeat.

The frontend coordinates the stages and renders committed state; it is not a gameplay semantic writer. `game_actions` is in-flight turn/workflow state, `game_turns` is committed turn history, and `game_save` is the current durable world/game state.

Architecture review must ask of every additional module, enum, gate, projection, compatibility adapter, or side system: **where does it attach to this spine, and why is it allowed to block or rewrite the spine?** If it is not required for structural integrity or an intentional product mechanic, it should not become a second semantic authority.

### Core authority boundaries

- **Story** owns narrative presentation and natural NPC/world response to the current committed context and player intent.
- **Extract** observes arbitrary meaningful facts from the exact Story evidence. Open narrative meaning must not require a finite event/relation/emotion/posture/sexual taxonomy.
- **Commit** owns structural validation, identity/evidence provenance, action/turn ownership, transactionality, idempotence/dedupe/replay, and the single durable save transition. Commit must not become another narrative interpreter.
- **DB** owns durable state/history and structural integrity, not a duplicate semantic world definition.
- **Context/history** are readback of committed authority and must make important durable facts available to later turns.

### Side-system rule

Side systems may attach to the spine but must not redefine whether a narrative fact occurred:

- **CSA** is a narrow institutional rule/lifecycle/context system. In Company v1 a newly activated common-sense alteration may validly appear as a company notice/rule/regulation beginning at its activation time. Once active and applicable, following that valid company rule is itself the altered natural/common-sense workplace premise; an NPC's dislike or embarrassment may shape reaction but must not make the rule optional or not-in-force. CSA compliance remains separate from unrelated consent, comfort, affection, trust, romance, and arousal. CSA must not become a second physical-story engine that requires finite `execution_action`, posture, relation-kind, mandatory enactment, or direct-coverage tokens for Story to be valid.
- **Scene/location/presence** remains a canonical narrow structural projection used by Story/UI/navigation. A convenience heuristic such as `spoke somewhere in this turn => present at the final destination` is not valid across movement and must not override actual destination-phase evidence.
- **Compact clothing state** may remain a deterministic UI/continuity projection because the product displays it and long-running LLM narrative can forget it; richer clothing facts must not be erased merely because they do not fit the compact projection.
- **Setup catalogs and stable registered character/location IDs** are intentional finite product/content identity and are not semantic-gate debt merely because they are lists. Duplicate independent copies should still be removed where safe.
- **Choices** are provider-authored exactly four literal strings for UI presentation; clicking a choice sends that literal as the next player input. Server-authored semantic fallback choices are not gameplay authority.
- **Image/media and TTS** are presentation sidecars. Finite image pools/tags, including sexual image families, may exist for asset selection, but image/media classification failure must never erase, reject, or redefine Story/Extract facts or block a turn.
- **Mind Monitor and other UI projections** are presentation/readback features unless a separately proven durable mechanic requires more.

### Semantic-runtime reset direction

Before further piecemeal cleanup, audit every field actually projected into fresh Opening/Story, every DB/save residue that can influence narrative meaning, every pre-Story classifier/router/gate, every Extract/Commit semantic drop path, every scene/presence heuristic, and every stale test protecting old implementation shape.

The audit default is deletion from **Story projection** unless a concrete current product requirement proves why Story needs the field. Fields such as `csa_acceptance`, generic `resistance`, generic relationship state, execution-state taxonomies, or old semantic mirrors may remain as narrow mechanics/historical storage only if proven, but persistence alone does not justify Story visibility.

After operator review of that audit, prefer one coherent semantic simplification cut over another chain of P0/P1 compatibility patches.

### Character speech clarification

Do not create a global regression rule that Seo Won-hee must always use honorific speech to the player. A team manager speaking informally to an intern/junior can be natural. Speech should follow role, hierarchy, personality, scene and established relationship rather than a false universal honorific verifier.

### Acceptance principle

The preserved historical manual game is READ-ONLY evidence, not sufficient acceptance depth. The 2026-08-16 user QA game is also current read-only regression evidence while its turn-level failure classes are being audited. Future dedicated TEST playtests should use one safe TEST-only Level 7 acceleration seam when deep CSA/physical/intimate/sexual coverage is needed, without changing Production progression or creating a second gameplay writer. Acceptance is scenario-coverage driven and must verify the full spine, including memory after facts leave the immediate recent-turn window, clothing continuity, choices/free text, common-sense premise coherence, movement/presence, player agency, and media remaining presentation-only.

Passing transport/transaction/unit tests or an `ACCEPTED` evidence report must not be described as product-play success unless the actual semantic play scenarios passed.
