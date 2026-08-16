# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-csa-agency-continuity-product-play-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309305845` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-csa-agency-continuity-product-play-v1`.
Previous blocked terminal: `5309288437` / final docs SHA `604fde2900ed766a5c0a1f3940c9044119ddf993`.
Accepted Minimal Story Runtime executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.

The V1 product attempt is not product-pass/fail evidence for free-text agency or long-horizon memory because its temporary PowerShell inline runner corrupted Korean player inputs to literal `?` before transport. V1 did prove partial transport facts: Opening passed, weak non-clothing CSA `interlace_fingers_with_recipient` activated through the canonical app transaction path as `csa_3`, canonical time advanced coherently, replay was idempotent, and final reset was clean. Do not rerun merely to reproduce those already-proved transport facts; V2 exists to obtain valid semantic evidence using uncorrupted Korean inputs.

Independent operator verification before this registration:
- PR #67 was OPEN / DRAFT / UNMERGED / mergeable at head `604fde2900ed766a5c0a1f3940c9044119ddf993`.
- The previous final commit was docs-only.
- Disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` is clean now: committed_turn=0, save_revision=1107, setup/opening not_started, canonical scene=setup with empty presence, Level 1/exp 0, csa_active=[], game_turns=0, game_actions=0.
- TEST migration `20260816050000_company_v1_minimal_story_runtime_contract` is already applied. DO NOT REAPPLY, EDIT, OR REAUTHOR IT.
- Previous TEST Worker was `game-proxy-company-v1` version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`; reverify at execution time and deploy only if exact accepted lineage drift is proven.

Forbidden game IDs:
- Production/sentinel: `11111111-1111-4111-8111-111111111111`
- preserved manual: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`

## Objective

Run one coherent disposable-TEST product-play attempt with **byte-for-byte intact Korean player inputs** and validate together:

1. CSA activation-time premise coherence and non-retroactivity;
2. active/applicable CSA compliance separated from unrelated consent/comfort/affection/trust/romance/arousal;
3. explicit player-action fidelity;
4. canonical game-time coherence;
5. exact provider literal choice transport and useful choice differentiation;
6. one important early work promise/detail surviving beyond the latest-six raw window through chronological `turn_summary` and influencing later Story;
7. committed refresh/history/replay agreement and idempotence;
8. final canonical reset.

This is an acceptance task, not a source-fixing task. No runtime/source/test/content/config behavior edits are authorized.

## Mandatory local UTF-8 preflight — before any network/API/DB/reset

The previous blocker must be eliminated before the product attempt begins.

1. Do **not** put Korean scenario literals inside an inline PowerShell `-Command`, `-EncodedCommand`, shell interpolation, or any path that previously produced `?` replacement.
2. Use a UTF-8-safe temporary execution/input path outside the repository, preferably a temporary `.mjs`/`.json` file consumed directly by Node or another existing repository primitive. Do not add or commit a new repository harness.
3. Define the exact Korean free-text strings planned for the scenario, including the early work promise and later memory follow-up.
4. Before any network request, locally prove each string survives the chosen boundary exactly:
   - original JS/string value equals the value received by the runner;
   - `Buffer.from(value, 'utf8').toString('utf8') === value`;
   - JSON serialize/parse round-trip is exact;
   - no planned input contains replacement `?` in place of Hangul;
   - record Unicode code points or UTF-8 byte hex for at least the decisive promise string and its later follow-up so the evidence is unambiguous.
5. If this preflight fails, make **zero network calls**, post BLOCKED for the evidence-tool failure, and stop. Do not improvise another shell encoding path inside the same task.
6. Passing local encoding preflight does not count as a product attempt. After it passes, exactly one product attempt is authorized.

## Product preflight

1. Freeze START HEAD; verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Fail closed unless the game ID is exactly `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Do not access any forbidden game ID.
4. Verify TEST API Worker identity. If it already contains accepted executable `beae855ebc5a9706bae234af80b2569d73566f0a`, deploy 0. If exact lineage drift is proven, deploy only that accepted runtime lineage. Frontend deploy is forbidden.
5. No migration/DDL operation.
6. Re-read the current canonical app transaction contract (`/api/app-state` -> `/api/app-validate` -> unchanged signed `structured_action` through Story/Extract/Commit). Do not hand-invent proof fields.
7. Start from the actual clean disposable TEST state. One canonical reset before Setup is allowed only if unexpectedly dirty; record why.

## One product attempt only

No provider retry/regeneration, second Opening, alternate scenario rerun, or choice reroll.

### A. Setup / Opening

- Use the existing reviewed Setup/Opening primitive, preferably `scripts/live-playtest-canary.mjs --opening-only`.
- Verify HTTP/SSE/parsing and exactly four provider-authored literal choices.
- Continue the same game without reset.
- Record canonical scene, registered presence, and `world_state.game_time`.

### B. Early work-memory fact

Within ordinary turns 1–2, use an exact Korean free-text action that establishes a concrete work promise/detail with a decisive value, e.g. `오늘 오후 4시에 최종 시안을 다시 검토하기로 약속한다.` or an equally concrete natural scenario fact.

Requirements:
- outbound player input must equal the locally preflighted UTF-8 string exactly;
- committed `player_action`/history must echo it exactly;
- Story must not silently replace the harmless material intent with another action;
- capture the committed `turn_summary` for the establishing turn;
- do not repeat the decisive value in every later input.

### C. Activate one weak non-clothing CSA through the real app path

- Read current `/api/app-state` and current content/capability.
- Prefer `interlace_fingers_with_recipient` only if currently exposed and applicable; otherwise choose a current weak non-clothing rule with clear applicability and record why.
- Validate through `/api/app-validate` and carry the returned canonical/signed structured action unchanged through Story/Extract/Commit.
- Record canonical time and relevant narrow state immediately before and after activation.
- The rule may begin as a current company notice/rule/regulation at activation time; Story must not invent retroactive history that it always existed.
- Once active and applicable, the valid company rule is an in-force workplace premise. Personality may shape reaction, but applicability itself must not become an optional personal vote.

### D. CSA applicability versus unrelated personal request

- Naturally satisfy the active rule's applicability in a later ordinary interaction.
- Verify Story treats the active applicable rule as current workplace reality.
- Then use one exact UTF-8 free-text request outside the CSA scope, such as asking for a kiss.
- Acceptance does not require accept/refuse. It requires that the CSA not be claimed to mandate the unrelated request and not automatically create consent/comfort/affection/trust/romance/arousal.
- Compare committed state and exact Story evidence.

### E. Agency / time / choices

Continue to **9–12 committed ordinary turns** unless a decisive product defect stops the run earlier.

- Use several preflighted Korean free-text inputs.
- Use at least two actual provider-returned choices unchanged if available.
- Verify outbound choice literal equals committed player_action/history exactly.
- Include at least one harmless concrete free-text action whose material intent can be compared with Story.
- Capture canonical time each turn; a clear contradiction is a product defect, but prose need not mention time every turn.
- Qualitatively inspect each four-choice set; exact duplicates or effectively identical no-op restatements are product-quality defects. Do not add server repair choices.

### F. Long-horizon `turn_summary` continuity

After the early promise/detail leaves the latest-six raw window:

1. Fetch canonical context/history.
2. Verify the latest raw projection is six turns and older chronological summaries contain the decisive early detail with enough fidelity for continuation.
3. Use the exact preflighted Korean follow-up that refers to the promise without restating its decisive value, e.g. `아까 약속한 최종 시안 검토 시간에 맞춰 자료를 챙긴다.`
4. PASS requires later Story to preserve/use the earlier decisive value naturally from committed continuity. If summary omitted/corrupted it and later Story loses it, record a real product-memory defect and stop; do not synthesize memory.

### G. Refresh / history / replay

Before final reset:
- fresh `/api/context` and `/api/history` must agree with committed scene, CSA, player inputs, choices, summaries and state;
- replay one committed ordinary action through Story/Extract/Commit;
- verify replay flags and no extra turn, duplicate activation/state mutation, or save-revision mutation from replay.

## Stop-on-defect policy

On the first decisive product defect after the canonical request reaches the server:
- capture turn number, exact UTF-8 player input, canonical pre-state/time, raw Story, parsed blocks, Extract result, committed post-state/history as available;
- final canonical cleanup reset if safe;
- mark BLOCKED/FAILED;
- no retry/regeneration/source patch/alternate scenario.

Do not classify an auxiliary evidence-reader inconvenience as a product defect when preserved raw evidence already proves the invariant.

## Final cleanup

Finish with one canonical reset and independently verify:
- committed_turn=0;
- game_turns=0;
- game_actions=0;
- processing idle/not active;
- setup/opening not_started;
- canonical scene=setup, empty presence;
- Level 1 / exp 0;
- csa_active=[];
- retired Minimal Story Runtime semantic roots remain absent.

## Architecture constraints

- Story LLM remains narrative authority.
- CSA is current workplace premise from activation time, not retroactive memory.
- CSA compliance is separate from unrelated consent/comfort/affection/trust/romance/arousal.
- No finite physical execution grammar.
- No generic relationship/event/emotion/open-fact memory ledger.
- Long continuity = recent six raw turns + older natural-language `turn_summary`.
- Registered identity/navigation and canonical scene remain narrow deterministic mechanics.
- Player input is intent/attempt, but its material meaning must not be silently replaced.
- Choices remain provider-authored literals; no semantic fallback/repair choice author.
- Image/media/TTS remain presentation sidecars.
- No new parser generation, semantic router/gateway, fuzzy matcher, compatibility layer, retry system, or third Summary/Memory LLM.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- local UTF-8 preflight outside repository;
- exact reviewed TEST API deployment only if lineage drift is proven;
- disposable TEST reset/setup/opening and one product scenario through existing canonical endpoints;
- read-only TEST DB verification for the disposable game only;
- external evidence artifacts outside repository;
- docs-only completion commit and immutable Issue #68 terminal report.

Not authorized:
- any forbidden game access;
- direct DB writes;
- migration/DDL author/edit/apply/reapply;
- frontend deploy;
- source/runtime/test/content/config behavior edits;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility layer, new repository harness;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the single UTF-8-valid product attempt proves:
- canonical Setup/Opening and exact literal transport;
- exact Korean free-text transport into committed history;
- one real CSA activation through the canonical app path;
- activation-time/non-retroactive premise coherence;
- applicable CSA separated from unrelated personal consent/emotion;
- player agency and canonical time coherence;
- provider choices exact and meaningfully useful;
- one early decisive work detail survives beyond six raw turns through chronological `turn_summary` and influences later Story;
- refresh/history/replay preserve the same committed reality;
- final TEST reset is clean.

On PASS, first real product defect, or local encoding preflight failure:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post exactly one immutable terminal report to Issue #68 with START SHA, UTF-8 preflight evidence, Worker identity/deploy decision, exact CSA rule/time, turn-by-turn decisive semantic evidence, summary boundary, choice/agency/time observations, replay, final reset, forbidden-operation confirmation and FINAL docs SHA;
- STOP. Do not generate the next task.