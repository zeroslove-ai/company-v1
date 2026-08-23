# Company v1 — Minimal Story Runtime Reset Canon

**Owner decision date:** 2026-08-16  
**Status:** CANONICAL DESIGN DIRECTION  
**Applies to:** Company v1 Story / Extract / Commit semantic-runtime work on canonical PR #67  
**Goal:** Stop incremental semantic patching. Audit all authority and prompt contamination first, then perform one evidence-driven semantic simplification cut.

---

## 1. Why this canon exists

Company v1 has spent repeated stabilization/re-design cycles fixing the same classes of live-play defects: active common-sense rules being treated as negotiable policy, scene/presence drift after movement, player-intent or explicit state loss, repeated reaction loops, prompt/state contamination, and tests that prove transport/transaction contracts without proving that the game itself makes sense.

The game premise is not intrinsically complex enough to justify a large semantic rules engine. The runtime became more complex than the product need.

The target is therefore **not another P0/P1 patch series**. The target is:

1. audit every semantic input and authority touching Story;
2. identify DB/save residue that is still projected into Story or otherwise influences narrative meaning;
3. remove unnecessary semantic authority and prompt contamination;
4. keep only narrow deterministic mechanics/structural integrity that code is better at than an LLM;
5. after review of the audit, perform one large semantic simplification cut rather than many compatibility patches.

---

## 2. Canonical gameplay spine

The intended runtime remains:

`player input / literal choice`
→ `minimal committed context`
→ `Story LLM authors the player-visible narrative`
→ `raw Story streams immediately`
→ `Extract LLM observes narrow durable facts actually established by Story`
→ `Commit structurally validates and persists`
→ `game_save + game_turns become committed authority`
→ repeat.

The runtime must be explainable in those terms without hidden semantic routers deciding the narrative first.

---

## 3. What Worker / DB should own

Code should own things computers are reliably better at:

- game/action/turn IDs;
- registered stable identity and catalog membership;
- expected turn and save revision;
- transactionality and atomic commit;
- idempotence / dedupe / replay identity;
- canonical current location and narrow presence state;
- exact choice literal round-trip;
- deterministic navigation destination resolution where the player explicitly names a registered location/NPC destination;
- game time arithmetic;
- compact physical/clothing continuity only when backed by Story evidence;
- reset/setup lifecycle;
- narrow progression/CSA capability/slot mechanics if they are real product mechanics;
- presentation-only image/TTS/media mapping.

These responsibilities must not be expanded into a second narrative model.

---

## 4. What Worker / DB must not decide for Story

The following are presumptively **not Story-authority inputs** and must be removed from Story projection unless the audit proves a concrete, current, necessary product requirement:

- `csa_acceptance`;
- generic `resistance` values used as narrative permission/obedience hints;
- affinity/affection numbers as Story permission gates;
- generic relationship stage/boundary as a precondition for natural Story behavior;
- `npc_relationship_state` as general narrative memory;
- `csa_runtime_state` execution semantics;
- `csa_aftereffect_state` as Story-direction authority;
- precomputed action route / success / failure;
- precomputed consent / comfort / trust conclusions;
- finite posture/contact/sexual-action/event/relation taxonomies used to decide whether narrative meaning may occur;
- image/media taxonomy influencing Story possibility;
- semantic execution contracts that tell Story which exact posture/sexual action must occur;
- pre-Story actor/target selection beyond narrow deterministic navigation/identity needs;
- compatibility mirrors whose only purpose is stale tests or old implementation shape.

**Audit default:** if a Story prompt field cannot justify why Story needs it, remove it from Story projection.

Persistence for narrow UI/mechanical/historical compatibility is a separate question from Story visibility. A field may remain stored yet still be forbidden from Story prompt projection.

---

## 5. Common-sense alteration (CSA) — corrected canonical meaning

### 5.1 It is valid for CSA to be expressed as a company notice/rule/regulation

Company v1 is a workplace setting. A newly activated alteration may appear in-world as a company notice, internal rule, employment rule, policy, or other company-level normative instruction.

**Activation is not retroactive.** It becomes effective from its activation time. NPCs do not need false memories that it existed before activation.

### 5.2 But following the active rule is the altered common sense

Once a rule is active and applies to a person/situation, its validity is not an optional personal interpretation.

Correct model:

- the new company rule exists from the activation time;
- employees naturally understand following valid company rules as ordinary/common-sense workplace behavior;
- an applicable active rule must not be reframed as `still deciding whether to follow it`, `waiting to see whether it really applies`, or `personally choosing whether the rule is in force` merely because the NPC dislikes it;
- implementation/procedure may be clarified when the rule genuinely leaves a method unspecified, but that must not become denial of the rule itself;
- a character may dislike, feel awkward about, resent, enjoy, joke about, or emotionally react to the situation according to personality;
- personal emotion does not cancel the world premise.

### 5.3 CSA compliance is separate from unrelated consent/emotion

The active common-sense rule changing one premise does **not** rewrite unrelated facts.

`active CSA premise`
≠ `affection`
≠ `trust`
≠ `comfort`
≠ `sexual arousal`
≠ `consent to unrelated acts`
≠ `romantic relationship`.

Example: if a company rule makes a form of workplace exposure normal, the character should not dispute that exposure rule itself, but may still reject a separate sexual request that the rule does not require.

### 5.4 CSA should be premise-first, not pose/action-first

The long-term content direction is to prefer altered **social/workplace premises** over a catalog of exact poses or body-action primitives.

Story should derive varied natural consequences from the premise. A posture or specific physical action is an outcome that may arise in Story, not the definition of common-sense alteration itself unless the product explicitly chooses such a rule.

### 5.5 Strength is not merely a harsher pose or higher legal rank

The future CSA redesign should evaluate strength as the **depth/range of world normalization** rather than only `internal guidance / employment rule / national law` or more explicit body positions.

A future content cut may distinguish, for example:

- local/situational workplace custom;
- organization-wide everyday norm affecting routine language/procedure/behavior;
- deeply normalized social premise whose surrounding procedures, facilities, explanations and expectations naturally align from activation onward.

This content redesign is **not** part of the first authority audit unless needed to map current dependencies.

---

## 6. Character speech correction

Do **not** hardcode a rule that Seo Won-hee (`heroine1`) must always use honorific speech to the player.

The owner has clarified that a team manager speaking informally to an intern/junior employee can be natural in this setting. Character speech should follow role, hierarchy, personality, scene and established relationship—not a false global `always honorific` verifier.

Therefore the recent QA case of Won-hee using informal speech to an intern is **not a canonical bug by itself** and must not become a regression assertion.

Existing character canon may guide voice/style, but no new hard semantic gate should enforce one honorific level across all player roles.

---

## 7. Minimal Story context target

The semantic reset should aim for Story to receive only information it genuinely needs:

### Keep by default

- current player input / exact clicked literal;
- current canonical time;
- current canonical location;
- current present NPC identities;
- relevant NPC character/personality/role/speech canon;
- current confirmed physical/clothing state needed for continuity;
- current active CSA premises, scope, activation phase/time and only genuinely necessary trigger/applicability facts;
- recent committed raw Story;
- older chronological natural-language `turn_summary` continuity.

### Remove by default unless audit proves necessity

- numeric CSA acceptance/resistance;
- generic relationship/emotion permission state;
- generic relationship map;
- execution-state taxonomies;
- precomputed semantic route/permission/success;
- closed action/relation/event vocabularies as Story constraints;
- media/image classification;
- duplicate scene/presence mirrors;
- any DB field whose only reason is historical implementation or stale tests.

---

## 8. Extract target

Extract is a post-Story observer, not a second author or judge.

The audit should test whether the active durable Extract surface can be reduced toward:

- final scene/location/presence transition;
- narrow physical/clothing state changes needed for continuity/UI;
- narrow player physical/sexual mechanical state only where the product currently uses it;
- elapsed time;
- one high-quality natural-language `turn_summary`;
- Mind Monitor as a side/readback projection;
- exact Story evidence/provenance required by Commit.

Do not automatically build a new generic relationship/event/emotion/open-fact ledger to replace deleted state. Narrative continuity remains recent raw Story + older natural-language summaries unless a later product test proves a specific gap.

---

## 9. Scene/location/presence principle

`save.scene` remains canonical narrow scene state.

However, convenience heuristics must not invent cross-location presence.

In particular, `speaker in this turn => present at final location` is not generally valid when one Story spans movement from location A to B. The audit must trace temporal/location ordering and identify any heuristic that merges source-location speakers into destination presence.

The target is simple:

- canonical explicit player navigation can establish destination;
- leaving a location clears old local presence unless Story/Extract establishes that someone accompanied/followed;
- final destination presence must come from destination-phase Story evidence, not merely `spoke somewhere in the turn`.

Do not solve this with fuzzy NPC search or another semantic cast gateway.

---

## 10. Player agency and Story fidelity

Player input is intent/attempt, not guaranteed success, but Story must not silently replace a material explicit player intent or current self-state with a different action/fact.

The audit must identify all places where projection, parser, route, gate or prompt wording can cause:

- explicit player movement to be ignored/redirected;
- named NPC destination to create/substitute another NPC;
- explicit current body/physical fact to disappear without narrative resolution;
- the player to perform an action they did not choose;
- harmless actions to be overclassified/penalized by old `bold`/semantic machinery;
- a side-system failure to erase the Story.

The fix direction is simplification, not adding another semantic verifier in the runtime.

---

## 11. Testing canon — product play outranks test count

A passing unit suite proves only the contracts it actually tests. `N/N tests pass` is not product acceptance.

Operational review status must distinguish at least conceptually:

- evidence/report accepted;
- source contract accepted;
- structural live pass;
- **product-play pass**.

A failed live report may be accepted as accurate evidence without implying the game behavior passed.

### Golden Play regression requirements

The current user QA game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f` is to be preserved as **read-only regression evidence** until the audit extracts the relevant turn inputs/Story/Extract/post-save facts. Do not reset or rewrite it while evidence is needed.

The audit must turn the discovered classes into scenario-level regression cases, including:

1. CSA activated from a specific time as a company rule;
2. applicable employees naturally treat following it as normal workplace behavior;
3. different personalities can react differently without disputing the active premise;
4. unrelated request can still be refused if CSA does not require it;
5. location A NPC speaks, player moves to B, destination NPC appears, source NPC does not teleport into B;
6. canonical time is not contradicted by Story;
7. duplicate/misplaced player THOUGHT is not silently normalized into misleading narrative;
8. explicit player physical/self-state is not dropped or replaced;
9. choices remain provider-authored exact literals but must also provide meaningfully different next actions in product-play evaluation;
10. important continuity survives after source turns leave the recent raw window;
11. refresh/readback/replay preserves the same committed reality.

Do **not** add `Won-hee must always speak honorifically to the player` as a regression requirement.

### LLM judge may be used only in testing

A separate test/evaluation LLM may judge semantic regressions such as premise contradiction, wrong location/presence, player-agency loss, character inconsistency, or repetitive non-progressing choices.

Such a judge must never become runtime authority or a Story hard gate.

---

## 12. Audit-before-cut rule

The next implementation must not begin as a list of isolated hotfixes.

First perform one dedicated **Minimal Story Runtime Authority Audit** that inventories:

1. every field actually sent to fresh Opening and ordinary Story prompts;
2. every source of each field (repo content, `game_master`, `game_save`, derived helper, legacy mirror, runtime projection);
3. every pre-Story classifier/router/gate/semantic helper;
4. every DB/save root that can influence Story;
5. every Extract output field and how Commit consumes it;
6. every Commit semantic rejection/drop path beyond structural integrity;
7. every scene/location/presence heuristic;
8. every CSA field including `csa_acceptance`, `resistance`, `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`, execution metadata, strength/authority fields and current Story visibility;
9. every relationship/emotion/event/physical taxonomy that still constrains Story or durable meaning;
10. every compatibility path/legacy mirror still reachable by fresh gameplay;
11. every test that protects old implementation shape instead of product behavior;
12. current TEST DB/schema/default/reset/migration residue relevant to those fields;
13. exact evidence from the preserved QA game showing the live symptoms.

For each item classify:

- `KEEP_STORY_INPUT`;
- `KEEP_NARROW_MECHANIC_NOT_STORY`;
- `KEEP_HISTORICAL_READ_ONLY`;
- `DERIVE_AT_PRESENTATION`;
- `REMOVE`.

Every KEEP must cite a concrete current caller/product reason. Historical presence alone is not enough to make something Story authority.

---

## 13. Target implementation after audit

After operator review of the audit, create **one coherent semantic cut** whose goal is to make the runtime materially smaller and easier to reason about.

That cut should prefer:

- deletion over adapters;
- prompt input removal over counter-prompts telling the model to ignore polluted fields;
- one canonical state over mirrors;
- Story premise injection over finite execution grammar;
- post-Story observation over pre-Story semantic adjudication;
- scenario-level product regressions over implementation-detail test preservation.

Do not split the same root cause into an overnight chain of tiny P0/P1 compatibility patches unless the audit proves independently separable structural blockers.

---

## 14. Current operations / safety

- Canonical repository: `zeroslove-ai/company-v1`.
- Canonical branch: `company/scene-location-presence-v1`.
- Canonical PR: #67; keep OPEN / DRAFT / UNMERGED.
- Production remains forbidden unless a later owner-authorized task explicitly changes that.
- Preserved historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` remains forbidden to access/mutate.
- User QA game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f` is current read-only regression evidence; do not reset/mutate during audit.
- Dedicated disposable TEST game may be used only when a task explicitly authorizes live TEST writes.
- No provider/model/retry/regeneration change may be used to hide architecture defects.

---

## Owner override 2026-08-23 — product authority supersession

The owner manual-play override recorded in Issue #68 comment `5384780073` is
the current product authority where it conflicts with this historical canon.
It adds these non-optional product invariants:

- Every new game begins on the player's first day / first arrival at the
  company, regardless of selected rank or position.
- The player discovers the private `상식개변` app and may be curious or tempted
  to use it, but app use is never a mandatory quest or an implied action.
- Player inner thought is a first-class visible surface. NPC Mind Monitor
  surface/subconscious text is natural, character-specific, and first-person;
  compliance with a CSA rule never implies affection, comfort, trust, desire,
  romance, or unrelated obedience.
- CSA APPLY/CHANGE/REMOVE is a chronological, visibly streamed enactment turn
  with an in-world institutional mechanism. It is not an invisible zero-turn
  mutation; implementation remains a later explicitly scoped cut.
- The mature Company-v1 donor UI, approved-media image sidecar, and
  character-aware server TTS are owner-required acceptance surfaces, not
  deferred owner-ready exceptions.
- Explicit player actor/target/action/request/refusal/self-state/topic/intent
  must survive Story projection. Exact canonical navigation must survive
  Story, Observer, Commit, and refresh without source-location presence leak.

This section supersedes only conflicting product assumptions; it does not
authorize implementation outside the active `CURRENT_TASK`.

## 15. Supersession

This canon refines the existing Story-first authority reset. It does **not** discard proven transaction/replay/readback/identity work.

For semantic-runtime decisions after 2026-08-16, this document supersedes older implementation assumptions when they conflict with the following owner decisions:

1. Company notice/regulation is a valid in-world form of CSA and begins at activation time.
2. Following an applicable active company rule is the altered natural/common-sense workplace premise; personal dislike does not make the rule optional.
3. CSA compliance must stay separate from unrelated consent/comfort/affection/trust/arousal.
4. A team manager using informal speech toward an intern is not inherently a character violation.
5. The next step is authority/prompt/DB-residue audit first, followed by one large semantic simplification cut—not continued narrow relationship-mirror cleanup or isolated symptom patching.
