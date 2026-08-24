# Company v1 CSA Owner Design Draft — 2026-08-24

Status: **OWNER_DIRECTION_DRAFT / NON-BINDING UNTIL CANON UPDATE**

Purpose: capture the owner-reviewed redesign direction for the Company v1 `상식개변` app so a development session can update binding canon, content, UI, runtime, persistence, prompts, tests, and live acceptance without reconstructing product intent from chat.

This document does **not** supersede `docs/redesign/COMPANY_CANON.md` yet. The implementation session must first reconcile this owner direction into binding canon and then update lower layers. Do not silently implement around conflicts.

---

## 1. Product direction

The current R3 nine-item CSA catalog is too flat and too small. Restore the useful interaction grammar from the structured V1/V2-era app, but do **not** restore the old generic DSL or large 60+ rule engine.

Target product shape:

- three visible strength tabs only: `약함 / 중간 / 강함`
- no separate category navigation in the MVP
- approximately seven curated rules per tier
- each rule is a finite preset with explicit physical/narrative meaning
- each preset exposes only the subject/counterparty combinations that make sense for that rule
- do not expose generic trigger/action/duration DSL fields to the player
- APPLY / CHANGE / REMOVE are major in-world events and may consume one Story turn
- the rule announcement itself must be visibly dramatized in Story
- active rules must continue to affect later Story; one announcement scene must never consume/finish the rule
- rule compliance never implies affection, romantic consent, desire, arousal, loyalty, personality rewrite, or memory rewrite
- do not add a generic `타락도`, corruption meter, sexual-adaptation meter, relation engine, or similar new system
- character adaptation remains narrative, character-specific, gradual, and memory-grounded

The design goal is: **simple rules individually, interesting complexity through combinations of multiple active rules.**

---

## 2. Strength meaning

### 약함
Company-level operating guidance / HR practice. Weird, embarrassing, or sexually suggestive norms, but still framed as ordinary internal custom or workplace etiquette.

Suggested authority presentation: `사내 운영지침`, `인사팀 운영지침`.

### 중간
Employment rules / company-wide mandatory rules. Physical or explicitly sexual workplace behavior is treated as normal formal procedure.

Suggested authority presentation: `전사 취업규칙`, `전사 준수규정`.

### 강함
External law / regulator-level mandatory authority, or company authority delegated directly to the player by such a rule. Strong tier should be differentiated primarily by **player authority over the sexual-work system**, not merely by making the physical act more explicit.

Suggested authority presentation: `관계당국 의무지침`, `법령에 따른 특별업무 권한`.

---

## 3. Curated catalog draft

All characters affected by sexual rules are adults. Exact wording may be polished during canonization, but do not weaken explicit physical meaning into vague intent language that the Story model has to infer.

### 약함 — 7 presets

**W1. 노브라 근무**

> 회사 여성 직원은 근무 중 브래지어 없이 평소 근무복을 입는 것이 정상적인 복장 규정이다.

**W2. 노팬티 근무**

> 회사 여성 직원은 근무 중 팬티 없이 평소 근무복을 입는 것이 정상적인 복장 규정이다.

**W3. 가슴골 노출 근무**

> 회사 여성 직원은 셔츠·블라우스 상단을 깊게 풀어 가슴골이 드러난 상태로 근무하는 것이 정상이다.

**W4. 무릎 위에서 얼굴을 마주 보고 대화**

> 회사 여성 직원은 1:1 대화나 업무보고를 할 때 상대 직원의 무릎 위에 올라앉아 얼굴을 마주 보고 대화하는 것이 자연스러운 사내 소통 방식이다.

**W5. 가슴을 만진 상태로 대화**

> 회사 여성 직원과 대화할 때 상대가 여성 직원의 가슴을 만진 상태로 대화를 이어가는 것이 자연스러운 사내 소통 방식이다.

**W6. 엉덩이를 만지며 대화**

> 회사 여성 직원과 대화할 때 상대가 여성 직원의 엉덩이를 만지면서 이야기하는 것이 자연스러운 사내 소통 방식이다.

**W7. 말끝마다 가볍게 입맞춤**

> 회사 직원끼리 대화할 때 말끝마다 상대에게 가볍게 입맞춤하거나 뽀뽀하는 것이 자연스러운 사내 소통 방식이다.

Runtime note for W7: do **not** implement literal time-counting. Treat it as a recurring conversational norm while the conversation continues. The previous "10초마다" idea was explicitly rejected as unnecessarily mechanical.

### 중간 — 7 presets

**M1. 속옷 근무**

> 회사 여성 직원은 근무 중 속옷만 착용한 상태를 정상적인 근무복으로 간주한다.

**M2. 나체 근무**

> 회사 여성 직원은 근무 중 완전히 나체인 상태를 정상적인 근무복으로 간주한다.

**M3. 가슴으로 사정 지원**

> 업무 중 남성 직원이 발기하면 여성 직원이 자신의 가슴 사이에 남성 직원의 성기를 끼워 자극해 사정시키는 것이 정상적인 업무 지원이다.

**M4. 손으로 사정 지원**

> 업무 중 남성 직원이 발기하면 여성 직원이 남성 직원의 성기를 손으로 자극해 사정시키고 업무에 복귀시키는 것이 정상적인 업무 지원이다.

**M5. 정액은 피로회복 방법**

> 남성 직원의 정액을 먹는 것은 업무 피로와 스트레스를 줄이는 효과가 매우 뛰어난 피로회복 방법이라는 것이 회사의 상식이다.

This is intentionally a world-norm rule that can combine with other presets rather than a vague conditional Story instruction.

**M6. 성기 직접 검사**

> 업무 중 직원의 성기를 손으로 직접 만져 상태와 반응을 확인하는 것은 정상적인 사내 신체검사이며 대상 직원은 검사를 받아야 한다.

**M7. 가슴·유두 직접 검사**

> 업무 중 여성 직원의 가슴과 유두를 손으로 직접 만지고 자극해 반응을 확인하는 것은 정상적인 사내 신체검사이다.

Medium-tier wording rule: avoid vague prerequisite language such as "집중력이 저하되면", "업무 스트레스가 높으면", "업무 상태 확인이 필요한 경우" when a simpler direct workplace rule communicates the intended behavior. The owner explicitly noted that vague semantic conditions are frequently missed by the Story LLM.

### 강함 — 7 authority presets

Strong tier is intentionally redesigned around **player authority** rather than seven increasingly explicit sexual acts.

**S1. 성적 업무지시권**

> 플레이어가 성인 직원에게 성적 행동을 직접 지시하면 해당 지시는 회사의 정식 업무지시로 취급되며 지정된 직원은 그 행동을 수행해야 한다.

Implementation must define the exact supported action scope in canon/runtime; do not recreate an unrestricted generic CSA execution DSL merely from this sentence.

**S2. 플레이어 전담 성적 업무지원 직원 지정권**

> 플레이어는 원하는 성인 직원을 자신의 성적 업무지원 전담직원으로 지정하거나 해제할 수 있다. 지정된 직원은 일반 업무보다 플레이어의 성적 업무지원을 우선한다.

The app should expose an explicit adult employee selector for designation/de-designation.

**S3. 회사 공용 성적 업무지원 담당 지정권**

> 플레이어는 특정 성인 직원을 회사의 성적 업무지원 담당자로 지정할 수 있으며, 지정된 직원은 다른 성인 직원에게 필요한 성적 업무지원을 정식 업무로 수행해야 한다.

This is distinct from S2: S2 is player-dedicated; S3 is company-wide support role.

**S4. 공동 참여 승인권**

> 플레이어가 현재 성적 업무에 공동 참여를 승인한 경우 주변의 다른 성인 직원도 성별에 관계없이 해당 업무에 함께 참여할 수 있으며 이를 정상적인 공동 업무로 취급한다.

Do not auto-inject bystanders. Participation is enabled when the player actually approves/directs additional adult participants.

**S5. 성적 업무 대상자 지정권**

> 플레이어는 회사의 성인 직원 중 원하는 사람을 특정 성적 업무의 대상자로 직접 지정할 수 있으며, 해당 지정은 정식 인사·업무 배정으로 취급된다.

Designation itself should become an observable institutional event, not hidden metadata.

**S6. 성적 업무 공식 평가권**

> 플레이어는 직원의 성적 업무 수행 결과를 직접 평가할 권한이 있으며, 해당 평가는 회사의 공식 업무평가로 취급된다.

Do not turn this into a generic affinity/obedience stat engine. The value is in institutional/narrative consequences.

**S7. 성적 업무 교육·훈련 지정권**

> 플레이어는 성적 업무에 숙련된 성인 직원을 교육담당자로 지정해 다른 성인 직원에게 성적 업무 수행 방법을 직접 교육·훈련하도록 지시할 수 있다.

This should enable NPC-to-NPC character scenes rather than making every CSA interaction player-only.

---

## 4. Current R3 nine-item disposition

Current runtime hard-filters exactly these nine template IDs; this must be updated only after canon is changed.

| Current R3 item | Draft decision |
| --- | --- |
| `no_panties_under_work_clothes` | keep -> W2 |
| `no_bra_under_work_clothes` | keep -> W1 |
| `target_places_requester_hand_on_waist_or_thigh` | remove/replace; too weak/awkward |
| `work_nude` | keep -> M2 |
| `masturbate_for_recipient` | remove; generic request/self-masturbation pattern not desired |
| `work_in_underwear_only` | keep -> M1 |
| `vaginal_sex_with_recipient` | do not keep as a standalone primary strong concept; strong tier should be authority-oriented |
| `player_request_executes_immediately` | replace with bounded authority design; current generic form is too broad |
| `continue_until_recipient_orgasm` | no longer a required standalone strong slot in this draft; persistence/termination behavior must be defined narrowly where needed rather than filling a catalog slot just because it exists today |

Historical Company/Hospital presets may be used as wording/design references, especially rules that bind an explicit physical action to a concrete institutional context. Do not blindly restore the old 60+ preset catalog.

---

## 5. App UI direction

The MVP should be simpler than the old V1/V2 app while preserving the feeling of structured rule control.

Primary CSA screen:

1. tabs: `약함 | 중간 | 강함`
2. selected tier shows its ~7 rule cards directly
3. each card shows human-readable rule text + authority label + `설정`
4. selecting a rule opens only the selectors that make sense for that preset
5. player can usually configure subject and/or counterparty from a bounded allowlist
6. trigger/action/duration/internal IDs remain hidden and preset-owned
7. active rules are separately visible with `변경` / `해제`

Do not add category navigation merely because the underlying content has categories. With ~7 items per tier it adds unnecessary navigation.

Do not expose raw technical fields (`template_id`, trigger enum, execution kind, revision, R3 identifiers, JSON).

---

## 6. Semi-free combination model

The owner wants some of the old app's freedom, but not a generic DSL.

Use a **per-preset bounded selector model**:

- each preset declares valid subject scopes
- each preset declares valid counterparty scopes
- the UI renders only valid combinations
- some presets may expose a specific named adult employee selector
- direction-sensitive rules must not permit nonsensical reversal just because a generic actor/target selector exists

Examples:

- M4 `손으로 사정 지원`: supporter choices can be female employees / named adult female employee; recipient can be male employees / named adult male employee / player if canon permits.
- W5/W6: female employee is the touched party; the counterparty selector identifies who is allowed to touch.
- S2/S3/S5/S7: named-role designation is part of the product surface and must be explicitly represented.

This gives the player structured control without reintroducing `actor + target + trigger + duration + modifier` free-composition.

---

## 7. APPLY / CHANGE / REMOVE are Story events

This draft intentionally changes the previous zero-ordinary-turn direction.

Owner direction now: changing common sense is a **major world event** and it is acceptable/desirable for APPLY / CHANGE / REMOVE to consume one Story turn, because the announcement and NPC reactions are part of the game.

However, do not simply serialize the UI command as an ordinary free-text player action and let Story reinterpret it. Preserve a structured `rule_change_turn` or equivalent server-owned event type.

Suggested flow:

1. validate and persist the rule transaction authoritatively
2. consume one game turn
3. call Story with the committed rule-change event + current scene + current relevant characters
4. Story visibly dramatizes the institutional announcement and immediate reactions
5. Observer extracts Mind Monitor and only grounded post-Story structures
6. later ordinary turns continue to receive the active rule as persistent world authority

### Announcement presentation

No supernatural aura, invisible force, memory rewrite, or "everyone instantly feels this was always normal".

Use grounded institutional channels such as:

- employee phones vibrating at once
- company messenger push
- intranet notice
- company-wide monitor takeover
- email
- PA announcement

Suggested authority-specific framing:

- weak: `[인사팀 운영지침 신규 등록]`
- medium: `[전사 취업규칙 개정 공고]`
- strong: `[관계당국 의무지침 시행 통보]`

Characters may be shocked, embarrassed, skeptical, angry, confused, reluctant, operationally analytical, etc. They do not know the private app exists.

### CHANGE
Show explicit institutional revision. NPCs may react to the fact that the rule changed again.

### REMOVE
Show explicit repeal. Do not erase history. Characters remember what happened under the old rule and can re-evaluate it afterward.

---

## 8. Mind Monitor on rule-change turns

Rule-change turns are high-value Mind Monitor turns.

- update relevant current adult characters' `{surface, subconscious}` after the announcement Story
- maintain character-specific first-person Korean
- no private-app awareness unless canonically established (normally no)
- no invented player mind/desire
- compliance with a new rule does not mean liking it
- initial surprise may coexist with institutional compliance
- later adaptation must arise from repeated actual experience and memory, not from a new corruption/adaptation stat

---

## 9. LLM reliability rules for CSA wording

The owner explicitly reports that the Story LLM often misses vague semantic conditions.

Therefore:

- prefer `업무 중 남성 직원이 발기하면 ... 손으로 자극해 사정시킨다`
- avoid `성적 긴장이 높을 때 적절히 완화한다`
- prefer direct body/action nouns and verbs
- avoid metaphorical or policy-purpose-only wording when actual physical execution matters
- if a rule is recurrent, explicitly state recurrence/persistence in the Story instruction rather than expecting the model to infer it from the authority label
- do not create real-time countdown/timer logic for prose norms like W7

The model should not need to infer the physical action from the business rationale.

---

## 10. Explicit non-goals

Do **not** add:

- `타락도`
- corruption meter
- generic sexual adaptation meter
- generic consent/relationship/emotion engine
- generic posture/contact ontology merely to support the UI
- generic free-form CSA execution DSL
- automatic bystander sexual participation
- supernatural announcement effects
- memory rewrite into "this was always normal"

Do not make strong-tier authority erase character personality or private emotional reaction.

---

## 11. Required development-session workflow

The next implementation session should **not** treat this draft as a license to patch only `content/csa_presets.json` or frontend UI.

Required order:

1. read current `COMPANY_CANON.md`, `LIVE_ACCEPTANCE_MATRIX.md`, current main source, and this draft
2. reconcile owner decisions into binding canon first
3. identify every conflicting existing canon clause, especially current `P-CSA-001` exact-nine and zero-turn apply/change/remove behavior
4. define the new finite catalog contract and bounded subject/counterparty model
5. update content and R3 catalog filtering
6. update structured rule-change persistence/event flow
7. implement the simplified tier UI + active-rule management
8. update Story prompt/context so announcements and persistent rule execution are both reliable
9. update Observer/Mind Monitor handling for rule-change turns
10. update tests and live acceptance
11. run real browser play across APPLY / later trigger / CHANGE / REMOVE, not only schema/unit tests

Acceptance must prove at least:

- a rule announcement is visible and grounded in company systems
- current characters react individually on the rule-change turn
- Mind Monitor updates on the same committed reality
- a later unrelated turn does not erase the rule
- the rule executes when its concrete trigger occurs
- multiple active rules can compose without the Story forgetting one
- CHANGE affects future authority without rewriting committed history
- REMOVE causes repeal/re-evaluation rather than memory loss
- player can still refuse, change topic, move, stop an interaction, or act freely except where the exact active rule materially applies

---

## 12. Handoff summary

The intended Company CSA product is no longer "nine flat sexual presets." It is a small curated **three-tier institutional common-sense app**:

- weak = weird workplace customs
- medium = explicit sexual workplace procedures
- strong = player authority to operate/designate/evaluate parts of the sexual-work system

The old structured-app feeling should return through bounded per-preset selectors and active-rule management, while the old generic DSL and over-engineered runtime should remain removed.
