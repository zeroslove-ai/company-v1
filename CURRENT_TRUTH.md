# Company v1 Current Truth

**Company v1 runtime/review/deploy questions must not be answered from memory alone. Read the current canon first, then verify Git/DB/deployment facts when the question depends on them.**

Read in this order before any Company v1 runtime implementation, review, rollout decision, or completion approval:

1. [Development Rules](AGENTS.md)
2. [Current Truth](docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md)
3. [Sole-Writer Decision](docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md)

`09_CURRENT_TRUTH.md` may explicitly supersede an older implementation detail in `10_SOLE_WRITER_DECISION.md` while retaining its other architecture decisions. Current source, live DB facts, exact deployed identity, Git ancestry, and immutable evidence outrank historical handoff/completion prose.

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

- **CSA** should be a narrow institutional rule/lifecycle/context system. It may deterministically own rule identity, active state, capability/slots/strength where these are real product mechanics, applicability/scope, and transaction integrity. It must not operate as a second physical-story engine that requires finite `execution_action`, posture, relation-kind, mandatory enactment, or direct-coverage tokens for the Story to be valid.
- **Scene/location/presence** remains a canonical narrow structural projection used by Story/UI/navigation.
- **Compact clothing state** may remain a deterministic UI/continuity projection because the product displays it and long-running LLM narrative can forget it; richer clothing facts must not be erased merely because they do not fit the compact projection.
- **Setup catalogs and stable registered character/location IDs** are intentional finite product/content identity and are not semantic-gate debt merely because they are lists. Duplicate independent copies should still be removed where safe.
- **Choices** are provider-authored exactly four literal strings for UI presentation; clicking a choice sends that literal as the next player input. Server-authored semantic fallback choices are not gameplay authority.
- **Image/media and TTS** are presentation sidecars. Finite image pools/tags, including sexual image families, may exist for asset selection, but image/media classification failure must never erase, reject, or redefine Story/Extract facts or block a turn.
- **Mind Monitor and other UI projections** are presentation/readback features unless a separately proven durable mechanic requires more.

### Acceptance principle

The preserved 7-turn manual game is historical READ-ONLY evidence, not sufficient acceptance depth. Future dedicated TEST playtests should use one safe TEST-only Level 7 acceleration seam when deep CSA/physical/intimate/sexual coverage is needed, without changing Production progression or creating a second gameplay writer. Acceptance is scenario-coverage driven and must verify the full spine, including memory after facts leave the immediate recent-turn window, clothing continuity, choices/free text, and media remaining presentation-only.
