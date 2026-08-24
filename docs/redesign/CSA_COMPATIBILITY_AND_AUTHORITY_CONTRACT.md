# Company CSA Compatibility / Authority Contract

Status: **OWNER_ACCEPTED / BINDING SPECIALIZED CONTRACT**  
Accepted: 2026-08-25 KST  
Product: `company-v1 / 상식개변: 회사편`

This contract records the owner-reviewed corrections discovered by cross-boundary DB/live-play review after the 21-slot CSA redesign. It specializes `COMPANY_CANON.md` without changing the A′/R3 architecture. When implementation, tests, or historical evidence conflict with this contract, the lower layer is wrong.

## C-CSA-COMPAT-001 — Compatible combinations only

Multiple CSA presets may be active together only when their concrete requirements can coherently hold for the same overlapping scope.

- Compatibility is **finite and catalog-owned**. Do not create a generic physical-state, clothing, posture, consent, or sexual constraint solver.
- A new APPLY that conflicts with an already-active preset on an overlapping scope must not silently commit both contradictory rules.
- The product may either reject the new APPLY with clear player-facing conflict information or require an explicit CHANGE/replacement. Silent contradictory coexistence is forbidden.
- Compatible multi-rule combinations remain a core product feature.

Minimum binding conflict set from owner review:

- W3 `가슴골 노출 근무` conflicts with M1 `속옷 근무` on overlapping female scope.
- W3 conflicts with M2 `나체 근무` on overlapping female scope.
- W1 `노브라 근무` conflicts with M1 on overlapping female scope because M1 explicitly requires underwear top worn.
- W2 `노팬티 근무` conflicts with M1 on overlapping female scope because M1 explicitly requires underwear bottom worn.

The canonical catalog may add other finite conflict pairs only when direct current preset semantics prove the contradiction. Do not generalize beyond the curated preset set.

## C-CSA-AUTH-001 — Current active-rule set is present authority

After successful APPLY/CHANGE/REMOVE, the canonical active-rule set is the only current CSA authority for later Story/MM.

- A removed or replaced rule may remain in committed history/memory only as a past fact.
- Story or MM must not describe a removed/replaced rule as still active authority.
- CHANGE must not leave the prior rule simultaneously active unless the operation explicitly creates two independent compatible rules.
- REMOVE must not leave stale enforcement, clothing requirement, designation, or current-policy language.
- Historical memory is not permission to resurrect retired or removed authority.

## C-CSA-ANNOUNCE-001 — Institutional issuance is observable and authoritative

A successful rule-change Story turn is not product-complete merely because the structured state mutation committed.

- The visible committed turn must contain a grounded official company/public-authority announcement channel appropriate to the preset.
- Material configured scope/designation information must be knowable through that institutional channel. For named roles such as S7, trainer/trainee identities must not exist only on the private app screen.
- The private `상식개변` app is the player's private tool, not the institutional source of NPC knowledge.
- Do not narrate supernatural activation flashes, NPCs sensing activation, or the app as an official authority source.
- The implementation must not rely only on an LLM prompt instruction when live evidence shows that omission can still commit. The smallest owning boundary must make the official issuance observably present while keeping exactly one Story call and one observer pass.
- No semantic retry loop, second reaction Story, or provider/model workaround.

## C-CSA-AGENCY-001 — Active CSA cannot erase literal action

Active CSA changes institutional authority and outcome constraints; it does not erase or substitute the player's ordinary literal action.

- S7 trainer/trainee state does not authorize redirecting a player request addressed to the trainer into a request that the player explain the rule instead.
- For S1, actions inside the finite supported families may receive institutional mandatory force when scope matches.
- A free-form action outside S1's supported families remains an ordinary request/instruction. `Unsupported by S1` means `not institutionally mandatory`, not `ignore the action`.
- Story may refuse, question, misunderstand in-character, or decline an unsupported request, but must preserve the requested actor/target/topic/action under `P-AGENCY-001`.
- Do not create a generic action executor/DSL to enforce this rule.

## C-CSA-NAV-001 — NPC movement is not player movement

Navigation postconditions may override Story/observer location only when the literal action actually expresses player/self movement.

- A movement verb and location appearing in a sentence about another NPC are insufficient to create `player_navigation`.
- NPC-only movement must not move the player's canonical location or replace player scene presence.
- True explicit player movement remains deterministic and may use the existing navigation postcondition.
- Fix actor binding at the earliest existing navigation boundary. Do not add fuzzy NER, nearest-name repair, or a new semantic parser generation.

## C-CSA-TEXT-001 — Player-facing institutional text vs developer semantics

The canonical CSA catalog must separate player/world-visible institutional wording from internal implementation/design notes.

Player-facing `rule_text`/notice/Story context must not contain phrases such as:

- `숨은 트리거 엔진`
- `장면을 만들 수 있다`
- generic DSL/runtime/parser/design terminology
- test/implementation rationale

Internal notes may exist in clearly non-player-facing metadata if needed. Player-facing text must read as an actual institutional rule/authority statement inside the fiction.

## C-MM-RELIABILITY-001 — Fail-open is not product-green

Mind Monitor remains `{surface, subconscious}`. Local drop is safer than corrupting Story, but frequent drops are a product-quality defect, not a green acceptance result.

- Raw observer MM shape and applied MM must be measured during live QA.
- A legacy single-string MM entry must not be silently assigned to the wrong actor or treated as a fully valid two-field projection.
- Repair should prefer the observer output contract / structured response boundary over adding a second MM LLM or generic inference engine.
- This is a follow-up P2 integrity lane after the core P1 correction lane.

## Acceptance order

Before resuming Image/TTS owner-readiness work, close in this order:

1. player-navigation false positive;
2. rule-change announcement/institutional-source guarantee;
3. active-CSA ordinary literal agency, including S7 and S1 unsupported path;
4. finite contradictory-rule compatibility;
5. removed-rule current-authority residue;
6. MM projection reliability;
7. player-facing/internal CSA text separation.

Media/TTS acceptance performed before items 1-4 are closed cannot establish owner readiness because those P1s can invalidate the underlying committed scene semantics.
