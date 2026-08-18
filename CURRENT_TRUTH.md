# Company v1 Current Truth

**Company v1 runtime/review/deploy questions must not be answered from memory alone. Read the current canon first, then verify Git/DB/deployment facts when the question depends on them.**

Read in this order before any Company v1 runtime implementation, review, rollout decision, or completion approval:

1. [Development Rules](AGENTS.md)
2. [Current Truth](docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md)
3. [Sole-Writer Decision](docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md)
4. [Minimal Story Runtime Reset Canon — 2026-08-16](docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md)
5. [Post-Merge Gameplay Simplification Canon — 2026-08-17](docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md)
6. [Hospital Reference Spine Alignment Canon — 2026-08-18](docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md)
7. [Current Task](docs/ops/CURRENT_TASK.md)

`09_CURRENT_TRUTH.md` may explicitly supersede an older implementation detail in `10_SOLE_WRITER_DECISION.md` while retaining its other architecture decisions. The 2026-08-16 Minimal Story Runtime Reset Canon simplified semantic-runtime direction after live QA. The 2026-08-17 Post-Merge Gameplay Simplification Canon refined it after direct manual QA. The **2026-08-18 Hospital Reference Spine Alignment Canon is the newest owner architecture decision and controls wherever older fresh Story/Extract/reducer/continuity assumptions conflict with it.** Current source, live DB facts, exact deployed identity, Git ancestry, and immutable evidence outrank historical handoff/completion prose.

## Canonical gameplay spine

The Company v1 runtime must remain explainable as one simple loop:

`literal player input / current literal choice`
→ `Story LLM authors the player-visible narrative from minimal committed context`
→ `one lightweight Extract call observes only narrow current-product facts plus summary and Mind Monitor`
→ `small deterministic reducers own the few retained machine states`
→ `Commit structurally validates/provenances and persists through the single durable transaction boundary`
→ `game_save + game_turns become the committed authority`
→ `context/history/UI and the next Story read that committed authority`
→ repeat.

The frontend coordinates stages and renders committed state; it is not a gameplay semantic writer. `game_actions` is in-flight turn/workflow state, `game_turns` is committed turn history, and `game_save` is current durable world/game state.

Architecture review must ask of every module, enum, gate, projection, compatibility adapter, or side system: **where does it attach to this spine, and why does it exist?** If it is not required for structural integrity or a concrete current product mechanic, delete it rather than preserving it as compatibility architecture.

### Core authority boundaries

- **Story** owns narrative presentation and natural NPC/world response to committed facts and the literal player action.
- **Extract** is one narrow post-Story observer call. Open narrative meaning must not require finite event/relation/emotion/posture/sexual taxonomies. The same call may also produce natural-language `turn_summary` and `mind_monitor`, but those do not gain durable semantic authority merely because they share the response.
- **Deterministic reducers** own only retained current-product machine mechanics. Fresh observation evidence should use one actor-scoped vocabulary consumed directly rather than multiple translating evidence shapes.
- **Commit** owns structural validation, identity/evidence provenance, action/turn ownership, transactionality, idempotence/dedupe/replay, and one durable save transition. Commit must not become another narrative interpreter.
- **DB** owns durable state/history and structural integrity, not a duplicate semantic world definition.
- **Context/history** are readback of committed authority. Narrative memory remains latest six raw committed turns plus older chronological natural-language summaries; an older committed turn with an empty summary must remain represented through a deterministic bounded projection of its already committed raw Story rather than disappearing from memory.

### Deletion-first rule

When fixing gameplay, do not add a new gateway/verifier/router merely because an older path is broken. First remove duplicated or obsolete authority, then reconnect the smallest required path.

Do not reintroduce generic relationship/event/open-fact/work/sexual ledgers, finite physical-action grammar, general CSA execution DSL, consent matrices, retry-until-lucky behavior, or semantic server fallback choices.

A historical migration, test, comment, or UI reader is not by itself proof that a fresh runtime subsystem must survive.

The 2026-08-18 manual 33-turn evidence is interpreted as one structural class: **the fresh observation boundary remains over-fragmented**. Physical evidence vocabulary mismatch, half-alive player sexual state, blank summaries, blank Mind Monitor, stale focal state, and overly narrow exact-NPC navigation are not authorization to build six new subsystems.

### Side-system rule

Side systems may attach to the spine but must not redefine whether a narrative fact occurred:

- **CSA** is a narrow institutional rule/lifecycle/context system. Once active and applicable, the exact rule is an ordinary in-force premise from its effective time. Personal dislike/embarrassment may shape reaction but cannot make the valid rule optional. The rule changes only what it actually states and does not imply unrelated consent, obedience, comfort, affection, trust, romance, arousal, or permission. An exact finite supported preset mechanic such as four-slot `clothing_state.required_state` may synchronize that exact UI/mechanical state directly; this is not permission to rebuild a generic physical execution engine.
- **Scene/location/presence** is structural. Durable scene must stay minimal. `focal_character_id` and `last_speaker_id` must justify an independent current consumer; if they are presentation convenience, derive them from committed current dialogue/scene instead of treating them as narrative truth. Do not add a new focus classifier.
- **Exact navigation** may resolve one or multiple exact registered NPC mentions when all mentioned NPCs structurally resolve to the same single registered destination. Ambiguous or conflicting destinations fall back to Story; this must not expand into a generic intent parser.
- **Compact clothing** remains a deterministic four-slot product/continuity projection. Do not expand it into a general physical ontology. Exact structured CSA clothing state may synchronize directly; ordinary Story-established clothing changes use the one fresh actor-scoped evidence path.
- **Physical continuity** beyond compact clothing survives only when a concrete current consumer is proven. Free `position_label` is not automatically durable. Do not preserve a posture taxonomy for its own sake.
- **Player sexual state** may remain only as a narrow displayed gameplay mechanic with one coherent fresh writer and deterministic reducer. It must not require a generic sexual-event ledger. If current product ownership cannot justify it, remove writer/state/UI/tests together rather than keeping zombie fields.
- **Setup catalogs and stable registered character/location IDs** are intentional finite product/content identity.
- **Choices** are provider-authored exactly four literal strings. Opening choices are valid only before later committed choices exist; after turn 1 the newest committed `game_turns.choices` is the only choice source. Clicking a choice must preserve its literal through `game_actions.player_action` and Story input.
- **Mind Monitor** is generated in the **same Extract call**, Hospital-style, but is presentation-only. It does not require exact quote provenance, may be missing/partial, gets no retry solely for completion, cannot fail Commit, and cannot become hard next-Story truth by itself.
- **Image/media and TTS** remain presentation sidecars and may not block or redefine the narrative turn.

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

Passing transport/transaction/unit tests or an `ACCEPTED` code report must not be described as product-play success unless actual player scenarios pass. Optional observation failure should lose only that optional projection, never a correct Story turn.

For the Hospital Reference Spine Alignment work, **automated Codex/Hermes long live gameplay is not product acceptance.** After exact merged-main TEST deploy and structural/API smoke, prepare a fresh manual TEST game/URL and stop at `WAITING_USER_LIVE_ACCEPTANCE`. The user performs the long 30–50+ turn acceptance play. Live testing is deliberately a late final stage.

## Owner architecture state — 2026-08-18

Current accepted `main` at the time of this owner design decision includes PR #78 merge commit `196e4ef632017c88c27f76c2d00a77f8ce194f7c`, which repairs the proven absent-NPC clothing CSA bootstrap seam. Do not reopen that exact defect without new evidence against the merged/deployed repair.

The previous `user-live-turn33-continuity-contract-repair-v1` queue is superseded as an implementation direction by the broader [Hospital Reference Spine Alignment Canon](docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md). Its individual observations remain evidence, but they are to be solved as one fresh-observation-boundary simplification rather than independent hotfixes.

Proposed next implementation identity: `hospital-reference-spine-alignment-v1`.

No architecture canon by itself authorizes Codex/Hermes execution, merge, Worker deploy, DB write, TEST gameplay, Production access, or migration. Execution requires an explicit `Status: READY` task. `WAITING_OWNER_DECISION` / `WAITING_REVIEW` remain stop states.
