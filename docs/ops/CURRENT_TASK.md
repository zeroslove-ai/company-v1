# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-player-facing-presentation-sanitization-v1
Mode: NARROW P1 REPAIR — CSA PLAYER-FACING PRESENTATION SANITATION / STALE EXACT-NINE COPY REMOVAL / RESUME REMAINING LIVE ACCEPTANCE
Updated: 2026-08-25 02:02 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main: `58862dec04e0ce6a6203197a10b5ade9fa623040`
Reviewed actor-grounding executable source: `60fe42f0b015dc0579888e96b98715b1ab5b5b7f`
Accepted W5 transport test SHA: `262571e1de377126751e176806ae59489f036379`
Binding CSA canon commit: `8db9cc0cccde68fc66f973de19c28c13154d9960`
Binding live acceptance commit: `81c8d7beca6bb29dd1c13ffa672e085616e8aed8`
Previous task: `company-r3-csa-three-tier-remaining-live-acceptance-v1`
Previous terminal: Issue #68 `5398583519`
Operator review: Issue #68 `5398619147`
Preserved failed game: `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`
TEST R3 API baseline: `game-proxy-company-r3` / `cbfb8900-1ba9-4886-9405-452e7ae760db`
TEST R3 frontend baseline: `gamebuilder-company-r3` / `7e3ae305-bec1-4fb9-9c4e-6e9d86448a9e`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

## Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, ops branch, feature branch, or implementation PR.
- Read before execution: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, current `frontend-r3/csa.js`, current CSA tests, terminal `5398583519`, review `5398619147`, then this task.
- Freeze the accepted 21-slot catalog, bounded selectors, structured +1-turn rule-change architecture, W5 transport, actor-direction binding, provider/model behavior, runtime API semantics, and TEST schema.
- This task repairs **player-facing CSA presentation only** plus regression coverage, then resumes live acceptance.
- Do not redesign CSA meaning or remove the finite S1 action-family authority.
- No Production access.
- No preserved-game reset/reuse/mutation.
- Never claim OWNER_READY.

Success terminal:
`CSA_PLAYER_FACING_PRESENTATION_FIXED_AND_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_PLAYER_FACING_PRESENTATION_OR_REMAINING_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

---

# 0. Accepted facts — do not reopen

The previous live campaign proved:

- visible primary tabs are `약함 | 중간 | 강함`;
- visible catalog count is exactly 7 / 7 / 7 = 21;
- no source/runtime/frontend deployment drift existed before the campaign;
- Setup + Opening succeeded once in fresh game `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93`;
- execution stopped before any gameplay rule-change turn because the first desktop catalog gate exposed raw Strong action-family IDs to the player:
  `지원 행동군: kiss, sexual_touch, genital_exposure, genital_touch, oral, penetration`.

This is a **frontend player-facing projection P1**, not evidence against the catalog/runtime semantics.

Source inspection also shows same-layer stale/internal copy that must be closed in this repair rather than waiting for repeated live failures:

- raw tier/metadata projection such as `strong`;
- raw category fallback such as `world_behavior` on pending update cards;
- technical heading `21-slot canonical catalog`;
- stale Manual copy `현재 제공되는 것은 9개 프리셋 규칙뿐입니다.`;
- raw action-family enum list.

Do not reopen 7/7/7 catalog count or W5 transport/actor grounding from these findings.

---

# 1. Narrow presentation inventory

Inventory **only player-facing CSA text/projection paths** reachable from `frontend-r3/csa.js` and directly associated tests.

Classify each field:

- `KEEP_PRODUCT_COPY`
- `LOCALIZE_PRODUCT_LABEL`
- `HIDE_INTERNAL_METADATA`
- `REMOVE_STALE_EXACT_NINE_COPY`
- `AUDIT_LITERAL_NOT_PLAYER_STORY`
- `UNRELATED_DO_NOT_TOUCH`

At minimum inspect:

- preset card title/tier label;
- supported S1 action-family presentation;
- pending CHANGE metadata line;
- active-card fallback labels;
- catalog section heading;
- Manual text;
- scope selector labels;
- actor selector fallback labels;
- operation/audit literal only to ensure no raw internal ID is unnecessarily displayed through History/UI fallback.

Do not inventory unrelated app/player/NPC panels unless the CSA change directly touches them.

---

# 2. Product-facing presentation contract

## 2.1 Tier labels

Visible tier labels must be Korean product labels:

- `weak` -> `약함`
- `medium` -> `중간`
- `strong` -> `강함`

Internal `weak|medium|strong` may remain as data values / catalog fields / DOM dataset attributes where not visible text.

Do not expose raw internal tier enum as player text.

## 2.2 S1 finite action families

Keep the canonical runtime IDs and supported finite set exactly unchanged:

- `kiss`
- `sexual_touch`
- `genital_exposure`
- `genital_touch`
- `oral`
- `penetration`

They remain internal authority identifiers. The player-facing Strong S1 card must project them through a deterministic finite Korean label map, for example equivalent meanings:

- kiss -> `입맞춤`
- sexual_touch -> `성적 접촉`
- genital_exposure -> `성기 노출`
- genital_touch -> `성기 접촉`
- oral -> `구강 성행위`
- penetration -> `삽입 성행위`

Use concise natural Korean product copy such as `지원 범위: ...`.

Requirements:

- no raw enum token appears visibly;
- no family is added, removed, merged into generic unlimited authority, or converted into a free-form DSL;
- runtime payload/catalog IDs remain exact and unchanged;
- this projection is presentation-only and not a second semantic writer.

Unknown future action-family IDs must fail closed in presentation: do not show the raw ID. Use a neutral non-technical fallback or omit the unknown label while leaving runtime validation authoritative.

## 2.3 Internal category / technical metadata

Do not visibly render internal metadata such as:

- `world_behavior`;
- raw `weak|medium|strong`;
- raw template IDs;
- selector schema IDs;
- trigger/mode/action-family enum IDs;
- revision/R3/internal JSON jargon.

Pending CHANGE UI should use product labels/rule descriptions only. Internal category/tier values can remain in JS state/data attributes but not visible prose.

## 2.4 Catalog / Manual copy

Replace technical/stale presentation:

- `21-slot canonical catalog` -> natural product heading such as `규칙 선택` or `상식개변 규칙`;
- stale `9개 프리셋` Manual statement -> current product truth: three tiers and 21 curated rules, e.g. `약함·중간·강함 세 단계에 각 7개씩, 총 21개의 규칙이 제공됩니다.`

Do not expose implementation words such as canonical, slot, template, schema, enum, R3 in normal player copy.

## 2.5 Fallback safety

Where a catalog item/name unexpectedly fails resolution, player UI must not fall back to raw `template_id`, actor ID, or category ID if that would expose internals. Prefer a neutral readable fallback such as `규칙` / `직원` while preserving runtime truth internally.

Do not add fuzzy actor resolution or alter selector validation.

---

# 3. Allowed source scope

Expected source/test paths:

- `frontend-r3/csa.js`
- `test/r3-csa-contract.test.mjs`

Only expand to another frontend/test file if deterministic evidence proves it owns the same player-facing CSA projection defect.

Do NOT edit:

- `content/csa_catalog.json` semantics or IDs;
- runtime CSA reducer/binding;
- worker/store/provider;
- DB schema/migrations;
- provider/model/config/timeout/secrets;
- Stage-A agency/MM semantics.

If fixing the visible leak appears to require changing the canonical catalog/runtime meaning, STOP BLOCKED before doing so.

---

# 4. Deterministic regression requirements

Add/update focused tests so the previous QA gap cannot recur.

Required minimum:

1. visible three-tier labels remain `약함 | 중간 | 강함` and 7/7/7 catalog semantics stay intact;
2. player-facing S1 supported-family projection contains Korean product labels for all six exact supported families;
3. rendered/player-facing projection does **not** expose literal strings:
   - `sexual_touch`
   - `genital_exposure`
   - `genital_touch`
   - raw `oral` / `penetration` as enum labels
   - `world_behavior`
   - `21-slot canonical catalog`
   - `9개 프리셋`
4. no player-facing raw template ID fallback for canonical active/pending cards;
5. Manual copy states current three-tier / 21-rule truth;
6. W5 frontend selector handoff test remains green;
7. exact W5 `/turn -> reserve -> Story binding -> Observer -> commit` regression remains green;
8. S1 runtime `supported_action_families` remains exactly `["kiss","sexual_touch","genital_exposure","genital_touch","oral","penetration"]` — presentation repair must not mutate authority;
9. existing Stage-A/CSA tests touched by changed files remain green.

Prefer a render/output-level test where practical instead of only checking that forbidden source text disappeared. Source-string assertions may supplement but not replace the presentation proof if a lightweight DOM harness already exists.

Then run:

- focused CSA suite;
- full `npm test`;
- JS syntax checks for changed JS;
- `git diff --check`.

No DB write is needed.

---

# 5. TEST deployment

Expected deploy change: **frontend only**.

After tests pass:

- deploy exact changed `gamebuilder-company-r3` frontend to TEST;
- record exact new frontend Worker version;
- do **not** redeploy unchanged `game-proxy-company-r3` API;
- verify API remains `cbfb8900-1ba9-4886-9405-452e7ae760db` unless unexpected drift is found;
- no Production deployment/access;
- no DB migration/schema/ledger write.

If API/runtime source unexpectedly changed, STOP and report instead of silently redeploying it.

---

# 6. Fresh browser presentation re-check

Never reuse/reset failed game `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93` or any earlier evidence game.

Create exactly one fresh disposable adult TEST game through visible Setup after the frontend deployment.

Before any CSA mutation, re-run the desktop catalog gate.

PASS requires:

- tabs `약함 | 중간 | 강함`;
- exactly 7 cards per tier;
- owner-canon rule meanings remain direct and unsanitized;
- S1 support families are visible only as natural Korean product labels, with all six finite meanings represented;
- no raw action-family enum token;
- no `world_behavior`, raw tier enum, raw template ID, JSON/revision/R3 jargon;
- no stale exact-nine/9-preset text in Manual;
- no technical `21-slot canonical catalog` heading;
- bounded selectors remain usable.

If the presentation gate still fails, STOP immediately. No second game or hotfix-in-place during the live attempt.

---

# 7. Resume remaining CSA live acceptance only after presentation PASS

Use the same fresh game and continue one coherent browser campaign. Do not re-prove accepted W5 unless naturally encountered.

Cover the remaining lanes from the previous task:

## Weak chronology

1. W1 or W2 APPLY through visible controls: exactly +1 Story turn, grounded institutional announcement, atomic rule state.
2. unrelated social/non-work ordinary turn: player intent remains primary while active rule stays background authority.
3. CHANGE to another compatible Weak rule, preferably W4/W6/W7 when scene reality permits: exactly +1, exact actors/direction.
4. relevant ordinary turn proving changed rule persists beyond announcement.
5. REMOVE: exactly +1, history remains, future authority residue absent.

## Medium

- M1 or M2 clothing rule;
- one direct actor-pair from M3/M4/M6/M7 with exact direction;
- M5 combined with another compatible rule when scene reality permits;
- later relevant ordinary turn proves active authority without affection/desire/personality rewrite.

## Strong

- S1 finite authority: one supported family works only within exact selected scope;
- one unsupported free-form action must not become mandatory merely because S1 exists;
- one named designation S2/S3/S5;
- S4 or S7 multi-NPC capability with exact identities and no bystander injection;
- S6 if naturally practical, otherwise bounded COVERAGE_NOT_REACHED for S6 only.

## Multi-rule / residue

- one compatible two-rule combination;
- one compatible three-rule combination;
- remove/change one rule without corrupting unrelated active rules;
- later unrelated ordinary social/non-work turn;
- removed rule leaves no stale authority.

## Refresh / History / mobile

- one refresh/re-entry: no duplicate Commit/Story, active/removed rules exact;
- visible History chronology understandable and no raw technical jargon;
- approximately 390x844 mobile: Story-first, tabs/selectors/change/remove/choices/free input reachable, no blocking loader, no raw internals.

## MM/private app/agency

Across reached rule-change turns:

- MM, when present, matches same affected actor/rule reality;
- no stale/invalid actor survives;
- NPCs do not know private app/supernatural cause;
- compliance != affection/desire/romance/arousal/private consent-as-feeling;
- player thought does not invent mind/consent;
- unrelated ordinary action is not replaced by active CSA.

Stop at first deterministic P0/P1. No retry, regeneration, second game, or sample-until-pass.

---

# 8. Safety / data boundary

- Preserve failed game `ccd2ff92-1ca4-44cb-9155-6f05f8d2ef93` read-only forever in this task.
- Previous evidence/manual/QA/sentinel games: no access/mutation/reset.
- Production access = 0 required.
- DB schema/migration/ledger/history repair = 0.
- `supabase db push` forbidden.
- provider/model/config/secret/timeout changes forbidden.
- no new branch/PR/CURRENT_TASK file.
- no bearer capability/secrets in Issue #68.
- no OWNER_READY claim.

---

# 9. Terminal report

Report:

- start/final main SHA;
- implementation SHA before lifecycle;
- exact changed files;
- presentation inventory findings;
- exact Korean S1 family label mapping;
- proof runtime family enum stayed unchanged;
- proof stale 9-preset / technical catalog heading / raw category/tier/action identifiers are not player-facing;
- focused/full test counts;
- DB/migration writes = 0;
- exact TEST API version unchanged;
- exact new TEST frontend version;
- fresh game ID;
- desktop presentation gate result;
- all Weak APPLY/ordinary/CHANGE/ordinary/REMOVE turns actually reached and +1 evidence;
- Medium lanes reached;
- S1 supported + unsupported result;
- named Strong and S4/S7 result;
- S6 result or bounded non-reach;
- two-rule/three-rule combination and residue result;
- refresh/History/mobile result;
- MM/private-app/agency results;
- Production access = 0;
- preserved evidence mutation = 0;
- P0/P1/P2/P3 findings.

Success terminal:
`CSA_PLAYER_FACING_PRESENTATION_FIXED_AND_REMAINING_LIVE_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Blocked terminal:
`CSA_PLAYER_FACING_PRESENTATION_OR_REMAINING_LIVE_ACCEPTANCE_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, post exactly one terminal report to Issue #68, then STOP. Do not self-register another task.