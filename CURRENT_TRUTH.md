# Company v1 Current Truth

**Company v1 runtime/review/deploy questions must not be answered from memory alone. Read the current canon first, then verify Git/DB/deployment facts when the question depends on them.**

Read in this order before any Company v1 runtime implementation, review, rollout decision, or completion approval:

1. [Development Rules](AGENTS.md)
2. [Current Truth](docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md)
3. [Sole-Writer Decision](docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md)
4. [Minimal Story Runtime Reset Canon — 2026-08-16](docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md)
5. [Post-Merge Gameplay Simplification Canon — 2026-08-17](docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md)
6. [Current Task](docs/ops/CURRENT_TASK.md)

`09_CURRENT_TRUTH.md` may explicitly supersede an older implementation detail in `10_SOLE_WRITER_DECISION.md` while retaining its other architecture decisions. The 2026-08-16 Minimal Story Runtime Reset Canon further simplified semantic-runtime direction after live QA. The 2026-08-17 Post-Merge Gameplay Simplification Canon is the newest owner architecture decision and controls wherever older semantic/workflow implementation assumptions conflict with it. Current source, live DB facts, exact deployed identity, Git ancestry, and immutable evidence outrank historical handoff/completion prose.

## Canonical gameplay spine

The Company v1 runtime should remain explainable as one simple loop:

`literal player input / current literal choice`
→ `Story LLM authors the player-visible narrative from minimal committed context`
→ `Extract LLM observes only narrow machine/UI facts the Story actually established`
→ `Commit structurally validates/provenances and persists through the single durable transaction boundary`
→ `game_save + game_turns become the committed authority`
→ `context/history/UI and the next Story read that committed authority`
→ repeat.

The frontend coordinates stages and renders committed state; it is not a gameplay semantic writer. `game_actions` is in-flight turn/workflow state, `game_turns` is committed turn history, and `game_save` is current durable world/game state.

Architecture review must ask of every module, enum, gate, projection, compatibility adapter, or side system: **where does it attach to this spine, and why does it exist?** If it is not required for structural integrity or a concrete current product mechanic, delete it rather than preserving it as compatibility architecture.

### Core authority boundaries

- **Story** owns narrative presentation and natural NPC/world response to committed facts and the literal player action.
- **Extract** is a narrow post-Story observer. Open narrative meaning must not require finite event/relation/emotion/posture/sexual taxonomies.
- **Commit** owns structural validation, identity/evidence provenance, action/turn ownership, transactionality, idempotence/dedupe/replay, and one durable save transition. Commit must not become another narrative interpreter.
- **DB** owns durable state/history and structural integrity, not a duplicate semantic world definition.
- **Context/history** are readback of committed authority. Narrative memory remains latest six raw committed turns plus older chronological natural-language summaries.

### Deletion-first rule

When fixing gameplay, do not add a new gateway/verifier/router merely because an older path is broken. First remove duplicated or obsolete authority, then reconnect the smallest required path.

Do not reintroduce generic relationship/event/open-fact/work/sexual ledgers, finite physical-action grammar, general CSA execution DSL, consent matrices, retry-until-lucky behavior, or semantic server fallback choices.

A historical migration, test, comment, or UI reader is not by itself proof that a fresh runtime subsystem must survive.

### Side-system rule

Side systems may attach to the spine but must not redefine whether a narrative fact occurred:

- **CSA** is a narrow institutional rule/lifecycle/context system. Once active and applicable, the exact rule is an ordinary in-force premise from its effective time. Personal dislike/embarrassment may shape reaction but cannot make the valid rule optional. The rule changes only what it actually states and does not imply unrelated consent, obedience, comfort, affection, trust, romance, arousal, or permission. An exact finite supported preset mechanic such as four-slot `clothing_state.required_state` may synchronize that exact UI/mechanical state directly; this is not permission to rebuild a generic physical execution engine.
- **Scene/location/presence** is structural. Fresh scene should be reduced to fields with independent product need; `scene_id`, semantic `goal`, `focus_thread`, and unneeded `beat` are deletion targets rather than duplicate narrative authority.
- **Compact clothing** remains a deterministic four-slot product/continuity projection. Do not expand it into a general physical ontology.
- **Physical continuity** should use one actor-scoped evidence path. Prefer a free natural-language `position_label` only if a real consumer requires it; do not preserve a closed posture taxonomy for its own sake.
- **Player sexual state** may remain only as a narrow displayed gameplay mechanic with one writer. It must not require a generic sexual-event ledger.
- **Setup catalogs and stable registered character/location IDs** are intentional finite product/content identity.
- **Choices** are provider-authored exactly four literal strings. Opening choices are valid only before later committed choices exist; after turn 1 the newest committed `game_turns.choices` is the only choice source. Clicking a choice must preserve its literal through `game_actions.player_action` and Story input.
- **Image/media, TTS, reaction meters, and Mind Monitor** are presentation sidecars. Their failure must never erase/reject/redefine Story or block a turn.

### Company setting vs work authority

Company v1 remains a company setting. Keep departments, roles, offices, hierarchy, coworkers, maps, and company identity.

Do **not** force every scene to pursue work. Fresh runtime is to remove `work_hook`, default first-work goals/focus, universal `workplace fiction` style mandates, and equivalent onboarding/work agenda from Story/Opening/save/RPC writers. Work may occur naturally because the setting is a company; it is context, not a mandatory narrative quest.

### Character canon

Department/position/role remain identity. Heroine prompt cards should primarily define the person: personality, voice, pride/insecurity, humor, habits, emotional expression, social/intimacy style. Do not duplicate every role as a permanent professional-behavior directive.

Active Story canon should receive compact body identity needed for consistent description. Intimate appearance facts may be projected only when confirmed four-slot clothing state makes the relevant area exposed; do not create another semantic visibility classifier.

### Player agency and progression

Story must preserve the material actor, target, action/request, directionality, and explicit player self-state in the literal input. It may determine response/outcome but must not substitute a different actor/target/action.

When a direct requested action is currently executable, Story should advance it to a meaningful result in the same turn rather than defaulting to repeated preparation/wait/continue loops. Enforce this through a compact Story contract and provider/manual scenarios, not a new semantic verifier.

### Opening simplification

Fresh Opening needs only player identity, time/day, location, primary actor, optional supporting actor, company/world identity, and the private app premise. Durable `work_hook` and semantic work goal/focus are not required.

### Acceptance principle

The preserved historical manual game and the latest direct manual QA game are READ-ONLY regression evidence. Future TEST playtests use a new disposable TEST game after separate deploy/migration authorization.

Passing transport/transaction/unit tests or an `ACCEPTED` code report must not be described as product-play success unless actual player scenarios pass. Optional observation failure should lose only that optional projection, never a correct Story turn.

## Post-merge owner architecture state — 2026-08-17

PR #67 has landed on `main` by normal merge commit `9d1a80137980baa67ccfba60bae2173ca17cf8d8`. The accepted executable/source-test ancestor remains `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.

The prior release-handoff language that described PR #67 as OPEN/DRAFT/UNMERGED is historical and superseded.

PR #69 is a separate infrastructure-only follow-up for main-branch CI trigger coverage and is not gameplay architecture authority. Its merge is not implicitly authorized by the gameplay redesign.

The current gameplay architecture direction is the owner-approved [Post-Merge Gameplay Simplification Canon](docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md). Implementation is deliberately split:

1. `gameplay-core-simplification-v1`: deletion/authority correction and core writer repair.
2. `presentation-sidecars-cleanup-v1`: only after Cut 1 review, minimal stats/media/readers and final residue deletion.

No task may auto-start Cut 2, merge a PR, deploy Workers, apply TEST/Production DB changes, or access Production solely because this architecture canon exists.
