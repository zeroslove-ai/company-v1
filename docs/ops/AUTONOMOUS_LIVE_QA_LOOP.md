# Company R3 — Autonomous Live QA Loop

Updated: 2026-08-22
Status: ACTIVE OPERATING POLICY

## Purpose

The owner should not be used as basic QA.

Automation must repeatedly exercise the deployed TEST product, inspect visible/browser/data evidence, fix objective defects, redeploy, and replay until only genuinely subjective product judgments remain.

A single green run is not sufficient. HTTP 200, unit tests, DOM existence, short scripted turns, or captured-but-uninspected screenshots are not owner-ready evidence.

## Core loop

`DEPLOYED TEST -> HUMAN-LIKE BROWSER PLAY -> DATA/SCREENSHOT REVIEW -> DEFECT CLASSIFICATION -> SOURCE FIX -> FOCUSED TEST -> TEST DEPLOY -> REPLAY -> EXPANDED PLAY -> REPEAT`

Continue while any objective defect or canon-defined unfinished retained feature remains.

## What automation owns

Automation owns detection and correction of:

- boot/load/fallback failures;
- JS/runtime/network errors;
- Setup and navigation failures;
- mobile viewport unusability;
- streaming visibility and blocking loaders;
- enabled-but-dead controls;
- choice stale/disabled/wrong literal submission;
- free-input fidelity;
- refresh/API/game-id persistence;
- duplicate submit/fencing/commit issues;
- registered identity crossing/fabrication;
- location/presence mismatch;
- scene_note continuity defects detectable from Story/state evidence;
- observer/minimal reducer invalid projection;
- Mind Monitor relevance/fail-open problems;
- memory/summary loss detectable over long play;
- CSA apply/scope/effect/remove/zero-turn/clothing issues;
- history/TTS/feedback/download functional failures when retained by canon;
- obvious latency/stall regressions;
- DB/state/visible UI disagreement;
- OOC/protocol/assistant leakage;
- repeated scene reset or objective Story-contract violations;
- obsolete tests/compatibility constraints that force the product backward.

## What remains for the owner

Owner final play should focus on questions automation cannot decide reliably, for example:

- Is the Story actually fun?
- Does a heroine feel attractive/interesting/consistent enough?
- Does dialogue feel too stiff, too verbose, too safe, too aggressive, etc.?
- Is pacing emotionally satisfying?
- Are choices creatively compelling rather than merely valid?
- Does the UI feel aesthetically right despite being functionally correct?

If a defect can be stated as “button does not work”, “loader covers Story”, “location is wrong”, “NPC identity crossed”, “refresh breaks”, “rule did not apply”, “memory forgot a concrete fact”, or similar objective evidence, automation should have found it first.

## Campaign design

Use disposable TEST games only.

### Smoke campaign

- fresh browser
- Korean Setup
- Opening
- 5 turns
- choice and free input
- refresh
- mobile viewport
- screenshot inspection
- console/network check

### Primary campaign

- 30+ turns continuous
- several locations
- multi-NPC scene
- offscene named NPC reference
- positive, negative/refusal and self-directed actions
- choice/free-input alternation
- refresh after commit
- refresh during stream/recovery
- duplicate submit
- scene/object/pose continuity
- relevant MM
- history/readback

### Independent campaign

- fresh second game
- 15+ turns
- materially different route/action style
- purpose: catch accidental scenario overfitting

### Long-memory campaign

- 50+ turns
- revisit facts older than recent raw-window
- revisit people/locations/topics after detours
- inspect summary/memory grounding and scene reset behavior

### CSA campaign

For each of the accepted nine templates:

- valid subject scope
- representative counterparty where meaningful
- apply
- confirm revision changes and gameplay turn does not
- play subsequent Story and verify premise/scope is represented
- inspect clothing state for clothing rules
- ensure no automatic affection/comfort/private consent/desire/obedience/trust/romance is inferred solely from activation
- remove
- confirm state/readback

Use multiple valid scopes where the template is intended to be flexible, not only one historical pair.

## Browser QA requirements

Use real deployed frontend/API.

At each relevant step assert actual usability, not hidden DOM state:

- fallback/loading surface is gone when game is ready;
- visible shell is not covered;
- Setup fields are reachable and scrollable;
- Story deltas visibly appear;
- player can still read while Story streams;
- current choices are enabled after terminal commit;
- current choice button maps to full literal action;
- free Korean input survives unchanged;
- map click is prefill only;
- app/history/TTS/feedback controls do what their visible state promises;
- refresh returns same save and API origin;
- no unexplained required-request failure;
- no uncaught console error.

Screenshots must be visually inspected. Pixel/image inspection is part of acceptance, not a logging artifact.

## Play-data inspection requirements

For sampled/all critical turns compare:

`submitted literal -> Story -> observer raw -> observer applied -> state_after -> next Story/UI`

Flag:

- substituted player action/target/intent;
- invented voluntary player action;
- wrong speaker/name;
- wrong location/presence;
- stale scene_note;
- disappeared supported scene fact;
- unsupported structural state mutation;
- stale/nonliteral choice;
- unrelated MM actor;
- fabricated MM event;
- memory fact loss/fabrication;
- CSA premise/scope mismatch;
- narrative text that looks like assistant/protocol rather than fiction.

## Latency review

Record at minimum:

- submit -> first Story token;
- Story total generation;
- Story complete -> observer complete;
- observer complete -> commit/terminal;
- full submit -> ready-for-next-action.

Do not pass obvious stalls because they eventually finish. Compare repeated runs and investigate regressions/outliers. Any long tail that materially blocks normal play is an objective QA defect.

## Agent roles

### Codex

Codex is the worker.

- implement;
- run focused tests;
- deploy TEST;
- create disposable games;
- browser-play repeatedly;
- inspect DB/state/Story/screenshots/logs;
- fix defects;
- rerun reproducer and broader campaign;
- report evidence in Issue #68;
- continue until exit matrix is clean.

Do not wait for the owner after a narrow fix if objective QA work remains.

### Hermes

Hermes is watchdog/reviewer, not a passive timer.

- detect idle/stopped Codex when CURRENT_TASK is READY;
- re-kick the same task if coverage is incomplete;
- reject false-green terminal claims;
- compare claimed success against screenshots, browser usability and play-data evidence;
- require expanded replay after a fix;
- keep the task READY while objective gaps remain;
- only permit owner gate after the full exit matrix is demonstrated.

Examples of terminal claims Hermes must reject:

- “451 tests passed” without deployed browser proof;
- “HTTP 200” without visible-screen proof;
- “15 turns committed” without Story/state review;
- “mobile screenshot captured” without visual inspection;
- “CSA RPC succeeded” without subsequent Story/effect/readback review;
- “button exists” without clicking it.

### ChatGPT operator / normal progress chat

The normal project ChatGPT session is the product QA lead.

When asked for progress or review:

- read current main, CURRENT_TASK and latest Issue #68 evidence;
- inspect actual commits and live-play data rather than repeating terminal claims;
- identify blind spots in the current QA matrix;
- distinguish structural green from product green;
- if objective defects remain, reopen/keep CURRENT_TASK READY and write precise next coverage/fix instructions;
- never send the owner to reproduce a basic defect that can be reproduced autonomously;
- owner-facing manual testing begins only after objective exit criteria are met.

## Exit matrix

Owner-ready requires all of the following:

- clean boot desktop/mobile;
- Setup/Opening/normal turn real browser path;
- no blocking Story overlay;
- current 4 choices + literal free input;
- 30-turn + independent 15-turn + 50-turn memory campaign;
- identity/location/presence/scene_note/MM objective review;
- refresh/reconnect/double-submit coverage;
- all 9 CSA templates with narrative/readback verification;
- retained sidecars usable or explicitly owner-deferred;
- screenshots visually inspected;
- required network/console clean;
- persisted state matches visible/narrative evidence;
- no known objective P0/P1/P2 defect;
- only subjective taste/quality questions remain.

If any item is missing, do not wait for owner play. Continue the loop.
