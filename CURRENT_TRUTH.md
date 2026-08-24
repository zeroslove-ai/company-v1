# Company Current Truth

**Current owner decision: the Company redesign canon is accepted and binding on `main`. Implementation must follow it; historical Company v1/v2/Hospital/draft redesign documents are reference evidence only.**

Updated: 2026-08-24 KST

## Mandatory read order

Before any Company implementation/review/deploy decision, read:

1. `AGENTS.md`
2. this `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md` when media/image work is involved
6. `docs/ops/CURRENT_TASK.md`

Do not rely on memory or a historical Issue/PR when current repository authority is available.

## Binding product/architecture state

- Product: `상식개변: 회사편`, adult company-life interactive fiction / character simulation.
- Product authority: `docs/redesign/COMPANY_CANON.md`.
- Live acceptance authority: `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`.
- Media catalog authority: `docs/redesign/MEDIA_CATALOG_CONTRACT.md`.
- Runtime architecture remains A′: high-parity Company presentation/content + thin client + server-owned turn kernel + Story LLM + one post-Story observer + isolated R3 persistence + optional sidecars.
- Current implementation may be defective or obsolete; implementation/tests/live DB do not redefine the product.

## Important owner corrections promoted into canon

### CSA redesign — current binding direction

- The old R3 **exact-nine** active catalog is superseded.
- Current product target is **three visible tiers `약함 / 중간 / 강함`, seven curated finite presets per tier, 21 product slots total**.
- Primary CSA UI has no extra category navigation. A selected tier shows its rule cards directly.
- Each preset owns a **bounded subject/counterparty/designation selector contract**. The player does not compose a generic actor+target+trigger+duration DSL.
- Weak tier is company-practice/etiquette oriented; Medium is company-wide mandatory employment-rule behavior; Strong is primarily **bounded player-delegated authority** rather than a list of increasingly explicit standalone sex acts.
- W1/W2 preserve the old no-bra/no-panties concepts; M1/M2 preserve underwear-only/nude work. The other old exact-nine slots are retired/replaced as defined in canon.
- Generic `player_request_executes_immediately` and standalone `continue_until_recipient_orgasm` are no longer active primary product slots. Do not rebuild a generic sexual execution DSL to preserve them.
- Multiple compatible active presets may combine. Product complexity should emerge from finite rule combinations, not a free-form DSL or 60+ rule catalog.

### CSA rule-change turn semantics

- The old **zero-turn APPLY/CHANGE/REMOVE** contract is superseded.
- APPLY/CHANGE/REMOVE are structured **rule-change Story turns** and consume exactly one gameplay turn on successful commit.
- They are server-owned structured operations, not free-text actions that Story may reinterpret.
- Rule state and the rule-change Story commit atomically; a failed rule-change Story must not leave half-applied authority.
- Story visibly dramatizes the institutional announcement through grounded channels such as phone notice, company monitor, intranet/company messenger, HR/employment notice or regulator notice.
- Relevant NPC reaction and Mind Monitor may occur in that same Story turn.
- Active rules continue affecting later ordinary Story until changed/removed; the announcement turn does not finish the rule.
- NPCs can recognize that the rule is new and react, but do not know the private app or a supernatural cause.
- Compliance remains separate from desire, affection, romance, arousal, loyalty, private consent-as-feeling or personality rewrite.
- Do not add `타락도`, corruption, sexual-adaptation, obedience, generic relation or consent meters.

### Other binding corrections

- Character source must be dramatizable; internal profile labels must not leak as dossier prose.
- Prior refusal/conflict/pressure/help/intimacy/CSA-adaptation context must survive through grounded Story/memory without restoring generic relationship/consent/emotion state engines.
- MM deepens the same committed Story reality; player-inner-thought may not invent the player’s mind.
- Full four choices in Story + four compact roughly-5-character buttons is intentional two-layer UI.
- Image catalog requires a repository semantic manifest and scene-grounded general/sex selection; media remains non-authoritative.
- Live QA must behave like an adult player and cannot equate structural/Commit green with product green.
- Stage-A narrative/MM/recovery closure from Issue #68 terminal `5396213794` is accepted and should not be reopened without new evidence.

## Historical provenance

- Draft PR #95: product-first redesign provenance, superseded as authority by main consolidated canon.
- Draft PR #96: A′ architecture provenance, consolidated into main canon.
- Draft PR #103: Owner-reviewed CSA redesign provenance. Its promoted decisions are now binding in `COMPANY_CANON.md`; the draft PR itself remains non-binding and must not be merged as though it were the canon.
- Issue #102 Crack review: reference benchmark only.
- Issue #68 terminal `5394232327`: browser-audit defect evidence, not product law.
- Issue #68 terminal `5396213794` / review `5396294637`: accepted Stage-A implementation evidence.

## Execution law

`docs/ops/CURRENT_TASK.md` is execution authority only. It MUST cite and preserve the current canon. It may not change product meaning to make implementation/tests easier.

Product-law change protocol:

1. explicit owner decision;
2. update canon on `main` first;
3. update acceptance if affected;
4. only then register implementation task.

That protocol has now been followed for the 2026-08-24 CSA redesign: canon and live acceptance were updated before the next CSA implementation task.

Production access/change remains prohibited unless explicitly authorized.