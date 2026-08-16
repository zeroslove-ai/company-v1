# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-csa-agency-continuity-product-play-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309209515` — ACCEPTED `minimal-story-runtime-destination-target-handoff-test-rollout-v3`.
Accepted Minimal Story Runtime executable SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
Accepted V3 docs SHA / registration parent: `18a3bcdc88834ce52694ae838424531efc97eb51`.

V3 proved the registered destination handoff live: a non-destination source with heroine5/heroine1 -> exact `윤민아 보러간다` -> `brand_strategy_office` with registered `heroine2` exactly once, no source-NPC teleport/fake Mina, exact history echo, same-action replay/idempotence, and final canonical reset. Do not create another navigation/Mina micro-probe without new evidence.

Canonical owner direction is `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`. This task closes the next unproved **product-play** axis. Structural transport success alone is not sufficient.

TEST Minimal Story Runtime migration `20260816050000_company_v1_minimal_story_runtime_contract` is already applied. DO NOT REAPPLY, EDIT, OR REAUTHOR IT.

Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Forbidden Production/sentinel game: `11111111-1111-4111-8111-111111111111`.
Forbidden preserved manual game: `78fb1d94-266f-455a-bda4-7656cc2370c1`.
Forbidden QA evidence game: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.

Independent operator verification immediately before registration:
- PR #67 remained OPEN / DRAFT / UNMERGED / mergeable at head `18a3bcdc88834ce52694ae838424531efc97eb51`.
- V3 terminal commit was docs-only.
- Disposable TEST final DB state was clean: committed_turn=0, save_revision=1095, setup/opening not_started, canonical scene=setup with empty presence, Level 1/exp 0, csa_active=[], game_turns=0, game_actions=0.
- Current API exposes the canonical app transaction path `/api/app-state` -> `/api/app-validate` -> the same signed `structured_action` carried through `/api/story`, `/api/extract`, `/api/commit`.
- Current `content/csa_presets.json` includes the weak non-clothing premise `interlace_fingers_with_recipient`; current content must be re-read at execution time rather than assumed.

## Objective

Run **one coherent bounded TEST-only product-play scenario** that validates the remaining central Minimal Story Runtime semantics together:

1. an applicable CSA rule is activated at a concrete current time and is treated from then on as an in-force ordinary workplace premise, not as optional policy or retroactive memory;
2. personality/emotional reaction remains free while CSA compliance stays separate from unrelated consent, comfort, affection, trust, romance and arousal;
3. explicit player intent is not silently replaced by a materially different action;
4. Story does not contradict canonical game time;
5. provider choices remain exact literal transport and are meaningfully distinct enough to be useful choices;
6. an important work promise/detail survives after its source turn leaves the latest-six raw window through chronological `turn_summary` memory;
7. refresh/context/history/replay show the same committed reality;
8. final disposable TEST reset is canonical and clean.

This is acceptance/evidence, not a source-fixing task. Do not patch runtime in response to a failure. Stop on the first decisive deterministic/product-semantic defect after safe cleanup.

## Mandatory safety and preflight

Before any network/API/DB/reset/gameplay operation:

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Fail closed unless the game ID is exactly `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Do not access Production/sentinel `11111111-1111-4111-8111-111111111111`, preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, or any other game ID.
4. Verify TEST API Worker identity. If the deployed runtime already contains the accepted `beae855...` lineage, deploy 0. If drift is proven, deploy only that exact reviewed runtime lineage. Do not deploy frontend.
5. Do not apply/reapply/edit any migration or DDL.
6. Verify the current repository app transaction/client contract before constructing a CSA action. Use the existing canonical `/api/app-state`, `/api/app-manual` if needed, `/api/app-validate`, and signed `structured_action` contract; do not hand-invent proof fields or create a new harness/protocol.
7. Start from the disposable game's actual clean state. If unexpectedly dirty, one canonical reset is authorized before Setup; record why. No repeated reset to obtain a preferred Opening.

## One product attempt

One attempt means one Setup/Opening and one continuous gameplay sequence. No provider retry/regeneration, second Opening, alternate scenario rerun, or choice reroll to obtain prettier evidence.

### A. Setup / Opening

1. Use existing reviewed repository request/capture primitives for canonical Setup -> Opening. Prefer the existing `scripts/live-playtest-canary.mjs --opening-only` path rather than hand-rolling Opening.
2. Verify Opening HTTP/SSE/parsing succeeds and returns exactly four provider-authored literal choices.
3. Continue the same game without reset.
4. Record canonical scene, present registered NPCs and canonical `world_state.game_time` before the first ordinary turn.

### B. Establish one important work-memory fact

Within the first two ordinary turns, naturally establish a concrete work promise/detail that should matter later, for example a specific review/deadline time such as **"오늘 오후 4시에 최종 시안을 다시 검토한다"**. Do not inject the fact directly into save/DB; it must be established by player input + Story and captured by normal Extract/Commit.

Requirements:
- Story must not materially replace the player's harmless explicit work intent with a different action.
- Capture the committed `turn_summary` for the turn that establishes the promise/detail.
- Do not repeat the full fact in every later player input; later memory verification must actually depend on committed continuity.

### C. Activate one weak CSA through the real app transaction path

1. Read `/api/app-state` and current content/capability. Level 1 is sufficient for a weak rule; do not use the Level-7 acceleration seam unless current canonical capability unexpectedly proves otherwise. If so, STOP for operator review rather than silently escalating capability.
2. Prefer current preset `interlace_fingers_with_recipient` **only if the current app-state/catalog exposes it and its scope can validly apply to a currently present registered female employee and the player**. Use subject/counterparty scope exactly as the current product contract requires. If that exact preset is absent because current content legitimately changed, choose another current weak **non-clothing** CSA premise with clear applicability and record the reason; do not substitute a deterministic clothing rule merely to force a pass.
3. Construct the operation through the same canonical app contract/frontend semantics used by the product. Call `/api/app-validate`; take its signed/validated result unchanged into `/api/story`, `/api/extract`, `/api/commit` for that transaction turn.
4. Record immediately before activation:
   - canonical game time;
   - csa_active/current rule state;
   - relevant narrow mechanical/relationship/sexual state that could reveal unrelated mutation.
5. The activation Story must be evaluated against the owner canon:
   - the rule becomes current/in-force from activation time;
   - Story may frame it as a company notice/rule/regulation;
   - it must not claim a false retroactive history/memory that the rule had always existed;
   - an applicable NPC may dislike, joke, resent, enjoy or feel awkward about it, but must not treat whether the valid active rule itself applies/is in force as an optional personal vote.
6. This semantic evaluation is **test evidence only**. Do not create a runtime semantic gate, keyword regex, second model call, or repair loop.

### D. Applicable CSA interaction + unrelated request separation

1. On the next applicable ordinary interaction, make the scene naturally satisfy the rule's current applicability (for `interlace_fingers_with_recipient`, a close seated/work conversation or equivalent current trigger). Do not server-script the outcome.
2. Verify Story treats the active applicable rule as the altered ordinary workplace premise rather than reverting to pre-activation common sense or debating whether the rule is valid.
3. Then make one clearly unrelated request outside the CSA scope, preferably an intimate request such as asking for a kiss, while preserving the exact player wording.
4. Acceptance does **not** require the NPC to refuse or accept. Either may be narratively valid. It requires:
   - Story must not say the CSA mandates the unrelated request;
   - the CSA activation itself must not automatically create consent/comfort/affection/trust/romance/arousal;
   - if an unrelated act actually occurs in Story, any narrow sexual/mechanical projection may follow its own evidenced path, but it must be attributable to that Story event rather than inferred merely from CSA.
5. Compare committed state before/after and record the exact evidence.

### E. Player agency, time and choice quality during ordinary turns

Continue the same scenario to a total of **9–12 committed ordinary turns** (including the CSA transaction turn) unless a decisive defect stops it earlier.

During these turns:
- use several free-text actions;
- click at least two actual provider-returned choices unchanged, if normal turns expose choices;
- verify the outbound literal equals committed player_action/history input exactly;
- include at least one harmless, concrete player action whose material intent can be checked against Story; Story may narratively resolve an attempt but must not silently substitute a materially different action;
- capture canonical game time each turn and flag a clear Story contradiction of day/time as a product defect; do not demand prose mention the clock every turn;
- inspect each four-choice set qualitatively. Exact duplicates or a set that is effectively four restatements of the same no-op are product-quality defects. Do not add a server choice author/repairer to fix them.

### F. Long-horizon summary continuity

Once the early work promise/detail has left the latest-six raw Story window:

1. Fetch canonical context/history/readback and prove the latest raw projection is six turns and the older chronological `turn_summary` path contains the earlier important promise/detail with enough fidelity to support continuation.
2. Use one natural follow-up that refers to the earlier promise without restating its decisive value, e.g. "아까 약속한 최종 시안 검토 시간에 맞춰 자료를 챙긴다." Do not repeat "오후 4시" in the follow-up if 4시 was the remembered value.
3. PASS requires later Story to preserve/use the earlier important detail naturally from committed continuity. If the committed summary omitted/corrupted the decisive detail and later Story therefore loses it, record that as a real product-memory defect; do not synthesize or patch memory during this task.

### G. Refresh / history / replay

Before final reset:

1. Perform a fresh `/api/context` read and `/api/history` read; verify canonical scene, active CSA state, latest choices/readback, committed summaries and player inputs agree with the committed turns.
2. Select one already committed ordinary action and perform same-action Story/Extract/Commit replay through the canonical endpoints.
3. Verify replay flags and idempotence: no additional committed turn, no duplicate CSA activation, no duplicate presence/state mutation, no save revision mutation caused by replay.
4. Do not require optional/non-contract evidence fields merely because a temporary evaluator would find them convenient.

## Stop-on-defect policy

On the first decisive product defect after a canonical request reaches the server:
- preserve exact turn number, player input, canonical pre-state/time, raw Story, parsed blocks, Extract result, committed post-state/history as available;
- perform one final canonical cleanup reset if safe;
- mark the task BLOCKED/FAILED for operator review;
- do not retry/regenerate or patch source to get a pass.

Operator/evidence-tool mistakes are not product failures. If gameplay already proves the invariant and only an auxiliary evaluator expects a non-contract field, correct the evidence interpretation from preserved raw evidence without rerunning the product attempt.

## Final cleanup

Finish with one canonical reset of the disposable TEST game and independently verify:
- committed_turn=0;
- game_turns=0;
- game_actions=0;
- processing idle/not active;
- player setup/opening not_started;
- canonical scene=setup with empty presence;
- player_progress Level 1 / exp 0;
- csa_active=[];
- Minimal Story Runtime retired semantic roots remain absent.

## Architecture constraints

- Story LLM remains narrative authority.
- CSA is an active world/workplace premise from activation time, not retroactive memory and not optional policy once valid/applicable.
- CSA compliance is separate from unrelated consent/comfort/affection/trust/romance/arousal.
- No finite physical execution grammar is restored.
- No generic relationship/event/emotion/open-fact memory system is introduced.
- Long-horizon narrative continuity is recent six raw turns + older natural-language `turn_summary`.
- Exact registered identity/navigation and canonical scene remain narrow deterministic mechanics.
- Player input is intent/attempt, but its material meaning must not be silently replaced.
- Choices remain provider-authored literals; testing may judge their usefulness, but runtime must not add semantic fallback/repair choices.
- Image/media/TTS remain presentation sidecars and cannot determine whether narrative facts occurred.
- No new parser generation, semantic router/gateway, fuzzy matcher, compatibility layer, retry/regeneration system, third Summary/Memory LLM, or runtime evaluation judge.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- exact reviewed TEST API deployment only if lineage drift is proven;
- disposable TEST game canonical reset/setup/opening;
- canonical `/api/context`, `/api/app-state`, `/api/app-manual`, `/api/app-validate`, `/api/story`, `/api/extract`, `/api/commit`, `/api/history`, `/api/reset` operations for this one scenario;
- read-only TEST DB verification for the disposable game only;
- external evidence artifacts outside the repository;
- docs-only completion commit and immutable Issue #68 terminal report.

Not authorized:
- Production/sentinel access of any kind;
- preserved manual or QA evidence game access;
- direct DB writes;
- migration/DDL authoring/edit/apply/reapply;
- frontend deployment;
- source/runtime/test/content/config behavior edits;
- provider/model/temperature/token changes;
- retry/regeneration, semantic repair, parser relaxation/new parser, fuzzy matching, compatibility layer, new repository harness;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the single coherent scenario proves, without product reruns or runtime patches:
- canonical Setup/Opening and exact literal transport;
- one real CSA activation through the canonical app transaction path;
- activation-time/non-retroactive premise coherence;
- applicable rule treated as in-force while unrelated consent/emotion remains independent;
- player agency and canonical time remain coherent;
- provider choices remain exact and meaningfully useful;
- one important early work detail survives beyond the six-raw-turn boundary through committed chronological `turn_summary` and influences later Story naturally;
- refresh/history/replay preserve the same committed reality;
- final TEST reset is clean.

On PASS or first blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, Worker identity/deploy decision, exact CSA operation/rule and activation time, turn-by-turn decisive semantic evidence, promise/summary boundary evidence, literal-choice/agency/time observations, replay result, final reset state, forbidden-operation confirmation and FINAL docs SHA;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.

## Execution result — WAITING_REVIEW / BLOCKED

- Start HEAD: `541ce96a34eaa0a7d742f74923fcc03d6317162f`.
- Accepted runtime SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`. The TEST Worker deployment was read-only verified as `game-proxy-company-v1` version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`, 100%; no deploy was needed. No migration was applied.
- One canonical TEST Setup/Opening attempt and one continuous 9-turn sequence were run only on disposable game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Opening passed at `brand_strategy_meeting_room`, Day 1 / Thursday `minute_of_day=611`, with present registered `heroine1` and exactly four provider-authored choices.
- CSA activation passed through the real app path on turn 3: `/api/app-validate` accepted the exact current weak non-clothing preset `interlace_fingers_with_recipient`, with `subject_scope=female_employee`, `counterparty_scope=player`, `trigger=when_in_close_conversation`, `base_turn_count=2`; the validated canonical action was carried unchanged through Story/Extract/Commit. The committed rule became `csa_3` at Day 1 `minute_of_day=617` and remained active through turn 9. Replay of turn 8 returned Story/Extract/Commit `replayed=true` with no state change.
- BLOCKER: the temporary PowerShell inline runner's non-ASCII source encoding converted all free-text Korean player inputs (turns 1, 3–5, 7, and 9) to literal `?` characters before transport. The committed turn/history records preserve those corrupted literals. Consequently the required early concrete work promise (turn 1) was not actually established, the later follow-up could not prove continuity from that promise, and the required free-text player-intent/agency evidence is invalid. Provider choices selected unchanged on turns 2 and 6 were preserved, but they cannot cure the failed work-memory premise.
- The raw Story/Extract/Commit evidence, canonical validation result, per-turn context/time/state, history, replay, and reset readback are preserved outside the repository at `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-csa-v1-opening-20260817.json` and `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-csa-v1-continuation-20260817.json`. This is an operator/evidence-tool encoding failure, not a runtime defect conclusion; no rerun, retry, regeneration, source patch, or alternate scenario was attempted.
- Final canonical reset succeeded once and independent readback was clean: `committed_turn=0`, canonical scene `setup`, empty presence, `csa_active=[]`, setup/opening not_started, processing idle, Level 1 / exp 0, and zero game turns/actions. No Production/sentinel, preserved manual, or QA evidence game was accessed.
- No source/runtime/test/content/config change, migration/DDL, deploy, direct DB write, frontend operation, new harness, parser, semantic gate, retry, or provider change occurred. Stop for operator review/rearm. No next task generated.
