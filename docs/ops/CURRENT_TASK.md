# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-choice-dialogue-presentation-correction-v1
Mode: SOURCE CORRECTION — DONOR CHOICE + DIALOGUE PRESENTATION PARITY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Review result

Prior task:

`company-full-redesign-milestone0-ui-parity-first-content-correction-v1`

Prior terminal / reviewed source:

- Issue #68 terminal: `5367420547`
- exact reviewed source SHA: `a838b8a6f2ca52ba056f9722be7ac0b24ea69e77`
- Draft PR: #97
- branch: `company-redesign/milestone0-v1`

Operator review:

- Issue #68 comment: `5367526714`
- decision: `CHANGES_REQUIRED`

Do not merge, deploy, or apply the R3 migration at `a838b8a6...`.

Continue the SAME `company-redesign/milestone0-v1` branch and SAME Draft PR #97. Do not create a parallel implementation branch or PR.

Before editing, re-read latest Issue #68 comments and verify PR #97 head is exactly `a838b8a6f2ca52ba056f9722be7ac0b24ea69e77` or a descendant containing only this authorized correction. If unrelated source appears, STOP.

## 1. Binding authority

- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- Engine/acceptance authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- exact complete Company v1 UI donor snapshot: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- owner redesign decisions: Issue #68, especially `5364770509`
- operator review finding: `5367526714`

This task does NOT reopen product design or runtime architecture.

## 2. Preserve accepted work from a838b8a6...

Do not regress:

- canonical Company `content/*.json` binding and real character/location catalogs;
- full accepted Setup fields and server-side profile validation;
- Company map donor presentation and literal-prefill-only interaction;
- Mind Monitor relevant actor tabs/cards/empty state;
- thin `frontend-r3/app.js` one-turn controller with no browser Story→Observer→Commit coordinator;
- A′ server-owned Story once → Observer once → reducer → atomic commit;
- isolated `company_r3_*` namespace source;
- literal action identity, one job per turn, attempt fencing, bounded progress writes;
- atomic Opening/ordinary Commit and non-next reservation rejection;
- terminal-required SSE success contract;
- first-content deadline beginning at Story invocation/request start;
- total Story timeout through streamed body;
- Observer fail-open and no provider retry/regeneration;
- no active CSA/TTS/Image/Feedback runtime, no dynamic sexual gauge, no generic physical ontology, no relationship/event engine in Milestone 0;
- unapplied R3 migration remains unapplied.

## 3. Correction A — restore BOTH donor choice surfaces

### Proven defect

Binding Milestone 0 UI law requires both:

1. the donor-style full literal current-turn choice presentation after completed Story; and
2. the separate compact four-button launcher.

At `a838b8a6...`, `parsePlainStoryForPresentation()` removes the terminal four-choice tail and `renderNarrative()` does not render a full-literal choice section. `renderChoices()` then renders only shortened launcher buttons. Therefore the established full literal choice surface was lost.

### Required behavior

- After a completed turn, render exactly four **full literal Story-authored current-turn choices** in the donor-style narrative choice surface.
- Also render exactly four compact launcher buttons below/in the action surface.
- Both surfaces derive from the SAME canonical current-turn choice array projected by Observer; no stale/prior-turn fallback.
- Compact labels are presentation only. Clicking a compact button submits the exact full literal string unchanged.
- Do not render the raw numbered choice tail a third time. The presentation adapter may strip the raw terminal tail only if it replaces it with the full-literal donor choice surface.
- If canonical current-turn choices are unavailable/incomplete, do not fabricate/fill/pad. Free input remains available and the choice surface may be absent/unavailable for that turn.
- No separate choice LLM, no retry/regeneration, no provider/model change.

## 4. Correction B — donor dialogue card must support direction-bearing Story lines

### Proven defect

The binding A′ visible dialogue convention includes lines such as:

`서원희(조금 고개를 기울이며): "대사"`

At `a838b8a6...`, the presentation-only regex does not reliably parse text between `(` and `):`, so direction-bearing dialogue can fall back into ordinary narration instead of the donor dialogue card.

### Required behavior

Presentation-only parsing must safely recognize at minimum:

- `서원희: "대사"`
- `서원희(조금 고개를 기울이며): "대사"`

and project them for display as:

- speaker name;
- optional direction text;
- dialogue text.

The donor card should render speaker + direction + dialogue in their donor-style presentation roles.

Rules:

- this parser is display-only; it never becomes durable semantic authority;
- registered actor names may be used as a conservative recognition aid;
- ambiguous/unknown text remains readable raw/narration fallback;
- parser imperfection never invalidates Story and never triggers retry/regeneration;
- do not invent speaker IDs, action outcomes, state, Mind Monitor, or choices from display parsing.

## 5. Focused acceptance proof

Add/adjust only narrow R3 presentation regressions proving:

1. a committed Story fixture with narration + `speaker(direction): "text"` + four terminal literal choices produces:
   - narration block;
   - dialogue block with exact speaker, exact direction, exact text;
   - four full literal narrative-choice items;
   - four compact launcher buttons/models referencing the same exact literal strings;
   - no duplicated raw numbered choice tail.
2. simple `speaker: "text"` still works.
3. ambiguous/plain Story falls back readably and never becomes a validity failure.
4. compact choice click continues to submit the exact full literal action unchanged.
5. free-form literal input path remains unchanged.

Do not create a large DOM snapshot suite. Protect only these concrete product regressions.

## 6. Allowed source scope

Expected edits are narrow:

- `frontend-r3/render.js`;
- optionally the smallest directly related `frontend-r3/styles.css`/donor-derived CSS only if needed to restore the existing narrative-choice/direction presentation;
- `test/r3-frontend-contract.test.mjs` and/or one narrow existing `test/r3-*.test.mjs` fixture;
- branch copy of `docs/ops/CURRENT_TASK.md` only if the runner lifecycle requires it.

Do not edit runtime/provider/persistence/migration for this correction unless a direct regression proves the reviewed finding cannot be fixed in the presentation boundary. If that occurs, STOP and report evidence rather than widening scope.

Do not edit:

- `runtime-r3/**` by default;
- R3 migration SQL;
- `runtime-v2/` / `frontend-v2/`;
- old `src/engine/` or historical donor source in place;
- PR #95/#96 authority docs;
- historical applied migrations;
- preserved/manual/evidence games or data.

## 7. Operational prohibitions

SOURCE ONLY:

- no merge / auto-merge;
- no migration apply;
- no Supabase DB write;
- no Worker/frontend deploy;
- no TEST/Production game creation or gameplay;
- no reset/delete/repair;
- no provider/model/temperature/token/secret/config change;
- no Milestone 1;
- no active CSA/TTS/Image/Feedback implementation.

All historical/manual/evidence games remain read-only.

## 8. Validation

Before terminal:

- run the focused R3 presentation tests;
- run the selected forward CI suite required by PR #96 policy;
- changed JS/MJS syntax PASS;
- `git diff --check` PASS;
- exact PR #97 head CI SUCCESS;
- prove changed paths remain inside this narrow source scope;
- explicitly report that first-content/runtime/persistence accepted work was not changed.

Automated test count is not the product acceptance metric.

## 9. Completion boundary

Update the SAME Draft PR #97 and post exactly one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_CHOICE_DIALOGUE_PARITY_READY_FOR_SOURCE_REVIEW`

Include:

- Task ID;
- starting reviewed SHA `a838b8a6f2ca52ba056f9722be7ac0b24ea69e77`;
- final exact PR #97 head;
- exact changed paths;
- full-literal narrative choice surface proof;
- compact launcher exact-literal identity proof;
- direction-bearing dialogue parser/card proof;
- raw fallback proof;
- focused validation and exact-head CI;
- migration applies 0;
- DB writes 0;
- deploys 0;
- gameplay 0;
- preserved-game mutations 0.

Then STOP `WAITING_REVIEW`.

Do not merge, deploy, apply migration, or register TEST rollout/Milestone 1 automatically.
