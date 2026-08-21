# Company Redesign — CSA MVP Catalog

Status: OWNER-LOCKED DIRECTION / CATALOG DRAFT  
Date: 2026-08-21

## 1. Owner decision

The redesign will **not** carry the historical 44-rule `상식개변` catalog into the first playable product.

Initial active product catalog is exactly **9 rule templates**:

- weak: 3
- medium: 3
- strong: 3

Selection is based on measurable historical Company TEST play exposure, using committed `game_turns.post_save.csa_rules` and counting the number of committed turn rows in which each template remained active.

This is product-scope reduction, not history deletion. The old catalog remains recoverable from Git history and may be reconsidered one rule at a time after the 9-rule MVP is accepted in real play.

## 2. Evidence basis

Read-only audit of TEST project `fmcrspgxstsmxxsmkeee` on 2026-08-21:

- `game_turns` active committed-history rows inspected: 153
- ranking measure: `active_turn_rows`
- tie-break context: distinct games carrying the active rule
- only active rules counted; inactive residue did not count as play exposure

This measure favors rules actually carried through gameplay for multiple turns rather than merely selected once.

### Weak ranking

| rank | template_id | active turn rows | games | MVP |
|---|---|---:|---:|---|
| 1 | `no_panties_under_work_clothes` | 18 | 3 | KEEP |
| 2 | `no_bra_under_work_clothes` | 7 | 1 | KEEP |
| 3 | `target_places_requester_hand_on_waist_or_thigh` | 7 | 1 | KEEP |

### Medium ranking

| rank | template_id | active turn rows | games | MVP |
|---|---|---:|---:|---|
| 1 | `work_nude` | 65 | 3 | KEEP |
| 2 | `masturbate_for_recipient` | 32 | 1 | KEEP |
| 3 | `work_in_underwear_only` | 13 | 1 | KEEP |

Historical next candidates, not active MVP: `deep_kiss_on_request` (8), `allow_breast_touch_on_request` (7).

### Strong ranking

| rank | template_id | active turn rows | games | MVP |
|---|---|---:|---:|---|
| 1 | `vaginal_sex_with_recipient` | 27 | 1 | KEEP |
| 2 | `player_request_executes_immediately` | 23 | 1 | KEEP |
| 3 | `continue_until_recipient_orgasm` | 13 | 1 | KEEP |

Historical next candidates, not active MVP: `requester_controls_ejaculation_location` (7), `player_sexual_relief_is_top_priority_duty` (3), `target_removes_requested_clothing_on_actor_request` (3).

The strong sample is narrower than weak/medium because preserved TEST evidence contains fewer distinct games using strong templates. The top-three selection is still the best measurable current evidence and may change later only by explicit owner product decision.

## 3. MVP rule identities

### Weak

1. `no_panties_under_work_clothes`
2. `no_bra_under_work_clothes`
3. `target_places_requester_hand_on_waist_or_thigh`

### Medium

1. `work_nude`
2. `masturbate_for_recipient`
3. `work_in_underwear_only`

### Strong

1. `vaginal_sex_with_recipient`
2. `player_request_executes_immediately`
3. `continue_until_recipient_orgasm`

Source wording and finite metadata continue to come from the accepted active content source.

## 4. Scope simplification finding — not yet owner-locked

Historical TEST exposure for these nine templates is much narrower than the old generic selector model suggests:

- retained rules overwhelmingly use `female_employee` as the affected/subject group;
- clothing rules require no counterparty;
- request-triggered rules in preserved evidence primarily use either `male_employee` or `player` as counterparty;
- no preserved evidence justifies building arbitrary every-group × every-group combinations for the MVP.

Therefore the old fully generic subject/counterparty selector system should **not** be assumed as a requirement.

Recommended option for later owner decision:

- fix the affected group per retained template to its actual product definition;
- expose only counterparty choices a retained template genuinely needs;
- do not build a generic scope-combination engine merely because historical JSON listed broad allowed scopes.

This is currently `OPEN_DECISION`; implementation may not invent either a fully generic selector or an over-restricted fixed scope until owner accepts final nine-rule UI/scope behavior.

## 5. Active-source law

When implementation begins, there must be **one active semantic CSA catalog**, not a 44-item catalog plus runtime/UI allowlists that can drift.

Preferred implementation:

- prune/rebuild active `content/csa_presets.json` to these 9 templates plus only selector/strength metadata actually accepted for them; or
- replace it once with another clearly named active CSA content file and update all readers atomically.

Do not maintain:

- 44 semantic rules in source + 9-rule runtime allowlist;
- separate frontend labels;
- SQL rule semantics;
- tests with copied semantic rule text.

Historical removed templates remain in Git history, which is sufficient for later reintroduction.

## 6. Runtime law

The first CSA runtime supports only behavior required by these 9 templates.

Do **not** design a generic execution DSL for all historical categories in anticipation of future rules.

For MVP:

- app apply/change/remove is a non-Story transaction;
- active rule premise is durable and supplied to next Story;
- exact finite clothing requirements may synchronize four clothing slots deterministically;
- request-triggered/open-ended behavior is Story-authored from active wording/scope;
- activation never implies affection, comfort, romance, arousal, trust, generic consent, or unrelated obedience;
- no fake player turn is created by applying a rule.

Only add a deterministic mechanic when a newly approved rule proves it necessary.

## 7. UI law

The app presents a deliberately small catalog:

```text
약 3
중 3
강 3
```

No hidden “coming soon 35 rules” requirement exists in the first product.

The player should understand:

- rule wording;
- strength;
- accepted subject/counterparty scope behavior;
- active/inactive state;
- apply/change/remove result.

Historical rules are not exposed merely because Git remembers them.

## 8. Expansion law — one rule at a time

After the 9-rule MVP passes real owner play, future rules are added **one at a time**.

Every new rule requires:

1. explicit owner selection;
2. exact wording/scope review;
3. classification as Story-only or requiring a narrow finite mechanic;
4. at least one acceptance scenario;
5. no regression to player agency, Story continuity, or existing nine rules;
6. real manual play before another rule is added.

Do not batch-import the historical catalog.

## 9. Acceptance gate

Before CSA Phase is accepted:

- runtime exposes exactly these 9 active templates;
- UI exposes exactly these 9 templates;
- no non-MVP template can activate through API/stale client state;
- each strength has exactly 3 templates;
- apply/change/remove consumes zero ordinary gameplay turns;
- clothing rules persist exactly where required;
- request-triggered rules affect only accepted explicit scope;
- removing a rule stops future premise enforcement without rewriting committed Story history.
