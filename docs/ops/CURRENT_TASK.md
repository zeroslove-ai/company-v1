# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-narrative-acceptance-browser-recovery-v1
Mode: FREEZE ACCEPTED SOURCE -> CLEAN BROWSER RECOVERY -> COMPLETE HIGH-RANK/CAMPAIGN/MOBILE ACCEPTANCE
Updated: 2026-08-23 21:22 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5385871423`
Operator review: Issue #68 comment `5385903330`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path and do not create a new ops/recovery branch.

## 0. Accepted source/deploy baseline — freeze

Accepted executable/source:
- `4d84b12b2733f9510f5a4b92bef22041976cca5d`

Current TEST artifacts from that exact source:
- API `game-proxy-company-r3` version `279cbde2-fe76-4816-81f0-8f3fc27a9f1b`
- Frontend `gamebuilder-company-r3` version `e139f60f-00b6-49ed-891b-070dd2143f57`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN unless new contradictory product evidence appears:
- first-day / first-arrival Opening while preserving selected department/rank;
- private `상식개변` app remains unfamiliar/private/optional and Opening does not pre-complete voluntary player action;
- committed player-inner-thought pipeline and visible player-panel F-boundary correction;
- character-specific first-person NPC Mind Monitor direction;
- choice semantic-diversity and elapsed-time guidance;
- choice-tail structural formats now accepted on server/frontend: plain numbering, symmetric whole-line `**...**` / `__...__`, and symmetric number-token-only emphasis such as `**1.** 행동` / underscore equivalent;
- exact choice literal click round-trip;
- bare-public cold start, exact player agency, canonical navigation, choice dispatch, CSA chronological APPLY/CHANGE/REMOVE and post-CSA continuation.

Validation already accepted for `4d84b12...`:
- focused source/frontend tests 36/36 PASS;
- full npm test 514/514 PASS;
- changed JS/MJS syntax PASS;
- git diff --check PASS.

Do not change source, tests, provider/model/config or deployments merely because the previous browser automation session timed out.

## 1. Accepted live evidence — do not rerun for more green proof

Gate A is GREEN on fresh disposable game:
- `53a0fefe-479c-42ec-8969-8521d40ecd01`
- visible Setup -> Opening through bare public UI;
- four usable canonical choices;
- visible natural first-person player thought;
- relevant character-specific NPC MM;
- one visible choice click produced the intended committed Turn 1;
- refresh/re-entry preserved Turn 1/time/thought/MM/four choices.

Low/junior Gate B is GREEN on fresh disposable game:
- `457c1960-6d82-44a4-8b55-869ebf8f4b0f`
- brand-strategy/intern first-arrival Opening;
- selected role preserved;
- four choices, player thought and relevant NPC MM present.

Do not rerun Gate A or the low-rank fixture merely to accumulate evidence.

## 2. Previous blocker — environment only

High/executive disposable game created in prior task:
- `0888980b-fd86-41de-8798-eaaed1ae6f6d`

No product result is claimed for it.

The prior runner lost Chrome DOM/CUA/Playwright read access on that tab and then on other live tabs. Reconnect/fresh-tab attempts also timed out. Because direct API gameplay substitution and guessed UI state were forbidden, the task correctly stopped BLOCKED before high-rank Gate B, Gate C and Gate D.

This is not evidence of an R3 runtime/frontend defect.

## 3. Required first step — clean browser acceptance recovery

Before touching gameplay:
1. confirm main/source remains `4d84b12...` or a docs-only descendant with no executable drift;
2. confirm the deployed TEST API/frontend versions above are still active/reachable;
3. start a clean browser/automation session rather than reusing the poisoned prior tab/session;
4. navigate only to the bare public URL with no `?api=` override and no storage preseed;
5. verify basic DOM read/click/network observation works before creating the first new game.

If browser automation/control itself still cannot reliably read/click a fresh bare-public page, STOP `BLOCKED_ENVIRONMENT` with exact tooling symptoms. Do not patch source and do not use direct API gameplay as a substitute.

Do not modify/redeploy source in this task unless the operator has explicitly rearmed a separate source-fix task. This task is acceptance-only.

## 4. Gate B remainder — high/executive Opening

Create one NEW fresh disposable game using a materially high/senior/executive position available in the visible Setup catalog. Do not rely on the prior inaccessible high-rank fixture.

Require through visible UI:
- explicit first arrival / first appointment / first day framing appropriate to a newly appointed high-rank employee;
- selected department and high rank preserved exactly;
- no invented prior tenure, prior office routine, or pre-existing personal relationship;
- private app unfamiliar/private/optional; no voluntary app action pre-completed;
- exactly four visible usable choices;
- visible natural first-person player thought;
- relevant NPC MM natural character-specific first-person prose, not labels/third-person analyst text;
- no blocking console/page/network error.

If this product gate fails, capture Story, committed/readback state, thought/MM/choices/DOM and STOP without retry-until-pass or source patch.

## 5. Gate C — 8–10-turn narrative-quality campaign

Use a separate NEW fresh disposable game on the accepted deployed source.

After Opening commit at least 8 ordinary turns, mixing all of:
- free input;
- at least three actual visible choice-button clicks;
- direct NPC conversation and follow-up;
- explicit movement/location change;
- work-context action;
- non-work/social action;
- refusal/change-of-mind or explicit self-state action.

For every sampled turn inspect the complete Story and committed server context, not only summaries.

Require:
- exact player literal remains the narrative center; no actor/target/action/topic/request/refusal/self-state/intent substitution;
- explicit navigation updates canonical destination/presence coherently and persists through refresh;
- player thought remains first-person, substantive, action-safe, non-duplicative and does not invent a different action/decision/app use;
- relevant NPC MM remains first-person, character-specific, non-label and not copied dialogue;
- CSA compliance alone never manufactures unsupported affection/comfort/desire/arousal/attraction/trust/liking;
- four choices remain exact full literals and are meaningfully different, not four near-paraphrases, not all-work, not all-CSA escalation;
- canonical time advances plausibly across conversation/movement/work/social actions rather than remaining frozen;
- streaming remains visible and non-blocking;
- no duplicate requests/jobs/turns or blocking console/network errors.

Refresh/re-enter once mid-campaign and once at the end. Latest player thought, MM, canonical time/location/presence and four current choices must reconstruct from committed server context with no resubmission.

Do not retry/regenerate a failed provider turn merely to seek a better sample. A real product defect is terminal evidence for this acceptance task.

## 6. Gate D — mobile

In a clean approximately 390x844 viewport on the same accepted deployed frontend, verify:
- Setup/gameplay shell usable;
- player-thought surface readable/reachable;
- Mind Monitor readable/reachable;
- four choice controls and direct input reachable;
- choice click works once with exact literal submission;
- no horizontal overflow hiding controls;
- no blocking overlay/tool bar interception;
- no console/page/network blocker.

Use a fresh disposable game if needed. Do not mutate owner/preserved games.

## 7. GREEN criteria

GREEN only if:
- browser automation recovered on a clean session;
- high/executive Opening passes;
- Gate C completes at least 8 ordinary committed turns with all required action classes;
- at least three visible choice clicks in the campaign produce exact literal single commits;
- narrative agency, navigation, player thought, character-specific MM, choice diversity and plausible time progression remain qualitatively acceptable;
- refresh/re-entry reconstructs committed state correctly;
- ~390x844 mobile passes;
- accepted number-token choice fix remains healthy;
- no source/config/provider/model/migration/reset/Production/owner-game mutation occurred.

If browser tooling fails before product evidence is obtainable, report `BLOCKED_ENVIRONMENT`, not a product failure.
If a genuine product defect appears, report `FAILED_PRODUCT` with the first decisive fixture/turn and STOP; do not repair it in this acceptance-only task.

Do NOT claim owner-ready after this task.

## 8. Remaining owner-remediation after narrative-surface GREEN

Do not implement here:
1. high-parity Company donor CSA UI + draft/unsaved-change behavior;
2. approved-media image projection + character-aware server TTS;
3. deployed same-game reset integration failure;
4. timeline/current-scene presentation residue;
5. final holistic owner-style long-play acceptance.

## 9. Completion report

Post to Issue #68:
- exact source/deployed version verification;
- browser recovery method/result;
- high-rank fixture ID and qualitative Opening evidence;
- Gate C fixture ID, every committed action literal/type and sampled complete Story/thought/MM/choice/time/location findings;
- mid/end refresh evidence;
- Gate D viewport/fixture/click diagnostics;
- console/page/network diagnostics;
- remaining objective defects.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK.
