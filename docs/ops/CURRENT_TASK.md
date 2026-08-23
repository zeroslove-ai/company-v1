# Company — CURRENT TASK

Status: READY
Task ID: company-r3-owner-exact-utf8-p0-acceptance-v1
Mode: EXACT OWNER LITERAL UTF-8 ACCEPTANCE -> ROOT-FIX ONLY IF STILL FAILING -> NEXT PHASE GATE
Updated: 2026-08-23 16:52 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5384919557`
Owner manual-play override: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path or an ops/recovery branch.

## 0. Review decision and accepted baseline

The previous source/canon correction is accepted as a candidate baseline, but P0 closure is NOT accepted because the terminal explicitly reported that the exact owner P0-A literal was recovered as mojibake (`??? ...`) and was not submitted in live replay.

Accepted candidate executable/source:
- `ed7919b142ef116d76c4e08fec73e3818ff6106a`
- TEST API `game-proxy-company-r3` version `5d9ca276-b688-4b9a-8a5f-1bae13416c48`
- TEST frontend remains `gamebuilder-company-r3` version `731cc702-2451-442a-895c-2d10c38dccc9`
- source->final checkpoint was exactly one docs-only lifecycle commit after the executable source.

Accepted source changes to keep unless contradicted by exact live evidence:
- Story context now distinguishes rule/app/topic mention from voluntary CSA-app interaction;
- exact unique catalog navigation has deterministic destination authority through Story/Observer/Commit;
- source-location presence is not allowed to override a resolved destination;
- owner supersession was synchronized into existing canon docs without a new competing architecture file.

Do not reopen these by speculation. This task exists only because exact UTF-8 owner-literal live acceptance was not completed.

## 1. Exact owner literals — binding acceptance text

P0-A exact text, character-for-character:
`이메이 사원. 일단 공자룰 좀 확인해보게나`

P0-B exact text, character-for-character:
`직원 라운지로 이동한다`

The issue report itself is the text authority. Do not recover these strings through a broken shell/codepage path. Do not replace them with question marks, transliteration, paraphrase, or a similar motif.

## 2. UTF-8 integrity gate before gameplay

Before submitting either acceptance action:
1. construct/read the literal in a UTF-8-safe path;
2. prove the exact intended string survives into the browser input value;
3. capture the outgoing visible-UI request payload and compare its literal action to the authority text;
4. after commit, compare persisted/readback literal action to the same authority text;
5. report either exact string equality or code-point equality. If any stage contains `?`, U+FFFD, mojibake, truncation, or normalization that changes the literal, STOP that fixture as harness/input corruption and fix the QA path before drawing a gameplay conclusion.

Do not use corrupted strings as evidence for or against gameplay behavior.

## 3. Mandatory bare-public fixtures

Use only the bare public frontend URL:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=`, no preseeded game_id/storage, no direct-API substitute for gameplay, no owner-game mutation, no Production.

### Fixture A — exact owner agency reproduction
- create one fresh disposable game through visible Setup;
- reach a valid scene where addressing `이메이 사원` is coherent; use ordinary visible gameplay to do so if needed;
- submit exactly:
  `이메이 사원. 일단 공자룰 좀 확인해보게나`
- PASS only if:
  - request and persisted literal are exact UTF-8 matches;
  - Story preserves the addressed target/request/topic or handles ambiguity through natural clarification;
  - Story does NOT invent player opening/scrolling/reading/applying/changing/closing the CSA app unless the literal actually authorizes such an action;
  - observer/state do not fabricate a CSA-app operation from topic mention alone.

### Fixture B — exact owner navigation reproduction
- create a separate fresh disposable game;
- establish a confirmed non-lounge source scene through visible gameplay;
- submit exactly:
  `직원 라운지로 이동한다`
- PASS only if:
  - request and persisted literal are exact UTF-8 matches;
  - resolved canonical destination is `employee_lounge`;
  - Story, observer, committed state/readback all agree on `employee_lounge`;
  - source-scene NPCs do not teleport into the destination without destination evidence;
  - refresh/re-entry preserves `employee_lounge`.

### Fixture C — generic control
- one different addressed-NPC/topic action and one different exact canonical location movement;
- verify the source correction is generic and not special-cased to the two owner phrases.

## 4. Replay requirement

After the exact owner fixtures pass, continue 4-6 ordinary human-like committed turns across the disposable fixtures, including:
- at least one choice-button action;
- at least one Korean free input;
- one refusal/change-of-mind/self-state action;
- one direct NPC follow-up;
- one non-work/social beat.

Inspect complete Story text, not just commit status. Watch for action/target substitution, wrong-location continuation, fake/duplicate identities, stale source presence, blocking UI/network failures, or duplicate turns.

## 5. Source-change rule

First run against the already-deployed candidate baseline. Do NOT make a source change merely because the previous report contained mojibake.

If and only if an exact, UTF-8-verified owner literal still reproduces P0-A or P0-B:
- capture literal -> Story request context -> Story -> observer -> state/readback evidence;
- identify the actual remaining loss point;
- make only the smallest generic correction in the existing R3 path;
- no keyword intent parser, fuzzy matcher, semantic classifier/gate, second Story/repair LLM, hidden retry/regeneration, provider/model/temperature/token change, generic action executor, old v1/v2 action DSL, Production, or unrelated migration/schema work;
- run focused tests and deploy only the affected TEST artifact;
- replay the exact owner literal again from a fresh bare-public disposable game.

## 6. Acceptance and next-phase boundary

This task may be accepted only when both exact owner literals have UTF-8 integrity proof and live behavior proof on deployed TEST, plus the generic control and narrow replay are green.

Do NOT claim owner-ready. After this exact P0 closure, the next remediation phase remains:
1. CSA APPLY/CHANGE/REMOVE chronological streamed enactment turns + anti-hijack/private-emotion boundary;
2. Opening first-arrival motivation + player inner thought + first-person character-specific Mind Monitor + choice diversity/time progression;
3. high-parity donor CSA UI;
4. approved-media image projection + character-aware server TTS;
5. deployed same-game reset integration failure;
6. timeline/current-scene UI residuals and final holistic owner-style acceptance.

## 7. Completion report

Post to Issue #68:
- exact fixture IDs;
- exact UTF-8 owner literal shown in the report, not `???`;
- browser input equality, request payload equality, persisted literal equality/code-point proof;
- Story/observer/state/readback result for P0-A and P0-B;
- refresh/presence result for P0-B;
- generic-control result;
- 4-6 turn replay result;
- any source/test/deploy changes, final source SHA, TEST version IDs;
- explicit final classification: exact P0 closure GREEN or remaining defect with evidence.

Then set this SAME file to `WAITING_REVIEW` and STOP. Do not create the next CURRENT_TASK yourself.