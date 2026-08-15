# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v8-simplified-memory
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Reviewed gameplay executable:
`5dc5ee740fad5ce395c59dcd03a263df28e526dc`.

Operator review:
Issue #68 comment `5302110951`.

The active narrative-memory model is now intentionally simple:

**latest 6 committed raw turns + chronological older natural-language `turn_summary` entries**.

There is no active general narrative `open_facts` / `open_observations` / `block_observations` memory authority. Do not recreate or test for that superseded subsystem.

TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` must not be accessed or mutated.

## Purpose

Run one deep TEST Level-7 gameplay acceptance against the simplified memory executable and prove that normal narrative continuity works without the removed fact ledger.

This is live acceptance, not another architecture task. Do not patch source during this lease. On the first deterministic product defect, collect evidence and stop.

Do not retry/regenerate merely to obtain a favorable semantic result.

## Preflight

- Fresh-fetch Issue #68 and stop only if this exact task already has a terminal/review or another execution already owns it.
- Verify PR #67 is still on `company/scene-location-presence-v1`, base `main`, OPEN / DRAFT / UNMERGED.
- Verify the executable under test descends from and contains exact reviewed source `5dc5ee740fad5ce395c59dcd03a263df28e526dc`.
- Verify the dedicated TEST game identity exactly.
- Verify the existing TEST-only Level-7 acceleration seam. Do not alter Production progression.
- Use OS TEMP / repo-external paths for any new evidence output.

## Authorized TEST operations

- deploy the exact reviewed gameplay executable to the TEST API Worker if the current TEST deployment does not already contain it;
- reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` as needed for this bounded acceptance;
- invoke the existing reviewed TEST-only Level-7 acceleration seam;
- run the existing canonical API/harness path for Story -> Extract -> Commit -> context/readback/replay;
- query TEST DB/readback evidence needed to verify committed turns and summaries;
- use an already-existing diagnostic switch only if genuinely needed, then disable it before terminal.

No Production access. No manual-game access. No migration/DDL in this task.

## Required scenario coverage

The run is scenario-driven, but it must commit enough turns to cross the six-raw-turn memory boundary.

### A. Core gameplay spine

- Setup/Opening succeeds.
- Ordinary free-text actions work.
- Provider-authored four literal choices are displayed/read back; select at least one literal choice as the next player action and prove exact round-trip.
- Story -> Extract -> Commit -> context/readback identities agree.
- No ordinary turn requires a general fact ledger.

### B. Narrative continuity inside the raw-six window

During early committed turns, establish at least one clear, naturally important continuity item in Story, for example a promise, refusal, work commitment, relationship reaction, boundary, or other specific remembered circumstance.

Verify subsequent turns within the latest-six raw window preserve that continuity naturally from raw Story context.

Do not manufacture a structured fact record for it.

### C. Cross the raw-memory boundary

Commit at least 7 ordinary turns after setup/opening so that an early committed turn leaves the latest-six raw window.

Before it leaves the raw window:
- verify its committed `turn_summary` is present and meaningfully represents the important event that actually happened;
- do not regenerate merely because wording is imperfect.

After it leaves the raw window:
- verify the older turn is no longer part of the latest-six raw Story window according to committed order/source behavior;
- verify its chronological `turn_summary` remains available as older memory;
- exercise a later Story where that older continuity is relevant and observe whether Story carries it forward naturally from summary context.

A deterministic loss caused by missing/empty/incorrectly ordered summary memory is a real product defect. Stop with evidence rather than introducing another memory layer.

### D. Absence of the superseded fact subsystem

Prove the active new-turn path does not depend on the deleted general fact ledger:
- fresh Extract payload/committed current-format observation must not require `block_observations` or `open_facts`;
- new Commit must not append new general narrative entries to `save.open_observations`;
- Story input must not depend on `open_observations` for narrative continuity;
- old historical fields, if physically present in stored JSON, remain inert and must not block replay/readback.

Do not fail merely because a historical inert field still physically exists in old JSON.

### E. Strong CSA and natural narrative behavior

Use the existing Level-7 seam to exercise at least one strong institutional CSA situation.

Verify:
- CSA provides institutional rule/context, not a second physical Story engine;
- compliance/resistance is separate from consent, comfort, affection, trust, relationship, and emotion;
- Story remains free to narrate natural reactions without a closed semantic event/fact taxonomy.

### F. Physical/clothing continuity

Exercise ordinary posture/contact/physical continuity naturally where the scenario allows it.

If clothing actually changes, verify the existing compact clothing projection remains continuous because it has a real UI/gameplay consumer.

Do not require a separate general physical fact ledger. Image/media classification remains presentation-only and may not decide whether a Story event occurred.

### G. Replay / recovery

- Refresh/context recovery must reconstruct the committed latest-six raw turns and older summaries consistently.
- Re-reading/replaying current-format committed turns must not create new memory entries or duplicate state.
- No old `open_fact` validation should be required for a current-format turn.

## Failure discipline

At the first deterministic failure:
- preserve exact turn/action identity;
- preserve HTTP status / SSE terminal event if applicable;
- preserve Story text, Extract output/error, Commit/readback state, relevant turn summaries, Worker identity, and TEMP evidence path;
- classify the failing stage: Story / Extract / Commit / context-memory / replay-recovery / CSA / narrow UI state / transport;
- stop.

Do not patch source, change provider/model/temperature/tokens, add retries, add a new gate, add repair logic, or recreate a fact-memory subsystem under this acceptance lease.

## PASS criteria

PASS requires real committed evidence that:

1. the normal gameplay spine completes across enough turns to cross the six-turn boundary;
2. latest six raw turns remain the recent narrative context;
3. an older meaningful turn survives through its natural-language `turn_summary` and can inform later Story continuity;
4. current-format Story/Extract/Commit/replay works without general `open_facts` / `open_observations` / `block_observations` memory;
5. narrow machine/UI state such as scene, time, progression, institutional CSA state, and compact clothing remains functional where exercised;
6. final dedicated TEST cleanup succeeds.

Test counts alone are not acceptance evidence.

## Completion

- Reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` back to clean documented baseline after PASS or decisive failure.
- Disable any temporary diagnostic toggle used.
- Set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit.
- Post one immutable terminal report to Issue #68 with PASS/BLOCKED/FAILED, exact executable/deployed identity, exact scenario turns, summaries/raw-window evidence, any defect evidence, and final TEST cleanup.
- Stop. Do not create the next task yourself.

## Forbidden

- Production access;
- any access/mutation/reset of historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- source/runtime patch during acceptance;
- migration/DDL;
- provider/model/temperature/token changes;
- retry/regeneration to obtain a lucky pass;
- new fact ledger, graph, vector/embedding memory, semantic enum/gateway, repair/fuzzy matcher, extra Summary/Memory LLM, or parser generation;
- treating media/image taxonomy as narrative truth;
- merge / PR Ready / rebase / squash / force-push / new PR or branch.

## Acceptance result

The bounded TEST Level-7 acceptance completed with PASS on the deployed
Worker source `44bd231ae2ec43b5d6d8b7fb0b9a02c280273abe`, whose reviewed
gameplay executable is `5dc5ee740fad5ce395c59dcd03a263df28e526dc`.

- Worker Version: `8dbe290d-ed25-4710-8cab-a8e997ced69b`
- Opening: HTTP 200, provider-authored four-choice readback PASS
- Turns: 1 through 7 Story -> Extract -> Commit PASS
- Literal choice round-trip: Turn 3 exact player-action match PASS
- Strong institutional CSA validation: PASS
- Memory boundary: six recent raw turns, Turn 1 absent from raw window,
  chronological Turn 1 `turn_summary` present
- Later Story continuity probe: PASS; the earlier report promise was
  naturally recalled from summary memory
- Replay: Story meta/complete, Extract, and Commit replay PASS; committed
  turn and save revision invariant PASS
- Final TEST reset: PASS; committed_turn 0, idle, setup/opening not_started,
  no active CSA, no recent turns
- Evidence: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v8-final.json`
- No Production or historical manual game access; no migration/DDL or source
  patch during acceptance
