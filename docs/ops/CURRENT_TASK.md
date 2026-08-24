# Company — CURRENT TASK

Status: READY
Task ID: company-r3-canon-convergence-p1-repair-and-acceptance-v2
Mode: OWNER-ACCEPTED CANON — P1 ROOT-CAUSE REPAIR + LIVE ACCEPTANCE CONTINUATION
Updated: 2026-08-24 20:43 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Owner-accepted canon SHA: `b6af51cbcf7d1d870ae48de012d5da42de161019`
Accepted implementation baseline: `c166eee1ccbca23227a7b8f6fd30800c4ba392bb`
Failed terminal: Issue #68 comment `5394670021`
Previous product-audit terminal: Issue #68 comment `5394232327`

IMPORTANT REUSE LAW:
- overwrite this SAME `docs/ops/CURRENT_TASK.md` path only;
- work on `main` only;
- do NOT create a new CURRENT_TASK file;
- do NOT create an ops branch;
- do NOT revert or redo already accepted `c166eee...` work unless evidence proves that exact landed behavior is wrong.

## 0. Mandatory authority read before edits

Read in this exact order:

1. `AGENTS.md`
2. `CURRENT_TRUTH.md`
3. `docs/redesign/COMPANY_CANON.md`
4. `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
5. `docs/redesign/MEDIA_CATALOG_CONTRACT.md`
6. this CURRENT_TASK

Historical PR #95/#96, Issue #102, old tasks/tests, and old v1/v2 behavior are evidence/provenance only. They cannot override main canon.

Target terminal:
`CANON_CONVERGENCE_P1_REPAIR_AND_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

Do NOT claim OWNER_READY.

---

# 1. Operator review of failed v1 task — what is ACCEPTED vs what failed

Treat source SHA `c166eee1ccbca23227a7b8f6fd30800c4ba392bb` as the accepted baseline, not a failed implementation to discard.

The previous execution successfully landed and validated:

- all-five-heroine dramatization cards and bounded character projection;
- repository media manifest + loading/validation/catalog exposure;
- player-inner-thought grounding gate;
- malformed MM fail-open handling;
- exact `media_hint` routing and committed-media presentation path;
- CSA subject scoping to current scene and clothing activation/deactivation residue correction;
- grounded continuity-memory contracts;
- focused canon-convergence regressions;
- focused tests `5/5 PASS`;
- full npm test `552/552 PASS`;
- syntax/JSON/diff checks PASS;
- TEST API deployment `game-proxy-company-r3@177d74ba-485b-4ed3-b589-fd4027a2e6c1`;
- TEST frontend deployment `gamebuilder-company-r3@6bdac269-8073-41ec-8305-1008aa02f6cd`.

The failed terminal is accepted because real browser play exposed two unresolved P1 defects:

### P1-A — deployed browser turn stalls

Fresh Campaign A:
- game `3295849e-3734-4c96-90f7-8ea54042968c`;
- junior/intern adult profile;
- Opening + ordinary Turns 1–10 committed through visible deployed UI;
- Turn 11 browser action stalled;
- UI remained at Turn 10 with `company_r3_stale_turn_timeout` / `Retry failed action`;
- no retry-until-pass was used.

This is a P1 product/reliability defect until its first broken boundary is identified and repaired.

### P1-B — Story / Mind Monitor actor identity mismatch

Fresh Campaign B:
- game `17b85d0b-fc18-4a6f-9670-caab09cf09e8`;
- executive/audit adult profile;
- Opening + ordinary Turns 1–10 committed through visible deployed UI;
- at least one turn had Story addressing/using a different active participant while Mind Monitor presented `김제나` as the active heroine/internal target.

This violates `P-MIND-001`: MM must deepen the SAME committed reality and must not switch actor identity.

### Remaining acceptance debt, not yet disproven implementation

Because the P1 blocker interrupted the campaign, the previous run did NOT complete acceptance for:

- 15+ turn Campaign A;
- complete desktop + 390x844 matrix;
- CSA new-notice reaction -> compliance -> later adaptation;
- CSA CHANGE/REMOVE live residue;
- Rule 9 negative + positive live cases;
- memory beyond recent raw window;
- History + refresh/re-entry completion;
- adult/sex media reachability;
- full catalog reconciliation/curation.

Do not misclassify those as already-failed features. They are unaccepted debt until this task proves them.

Preserve both failed browser game IDs above READ ONLY. Never reset, continue, or mutate them.

---

# 2. First phase — P1-A stale-turn forensic and smallest owning fix

Before modifying source, perform read-only forensics on Campaign A Turn 11 and capture the exact evidence chain:

`visible literal -> browser POST/request id -> action_id/attempt -> R3 job -> Story provider lifecycle -> observer lifecycle -> commit/result -> reconnect/poll/recovery -> UI timeout state`

Record at minimum:

- exact Turn 11 visible player literal and input type;
- request id / action id / attempt id if present;
- job timestamps/status transitions;
- whether Story request began and whether it completed;
- whether observer began/completed/failed;
- whether durable turn 11 exists;
- whether a terminal response was generated but lost to the browser;
- whether frontend declared stale while server was still legally processing;
- whether server job became orphaned/stale;
- whether recovery/reconnect had enough information to recover the same job;
- first exact boundary where progress diverged.

Then fix the smallest owning cause.

### Forbidden false fixes

Do NOT fix by:

- increasing global timeout merely to hide the stall;
- automatic hidden retry/regeneration;
- submitting a second Story request for the same logical turn;
- provider/model/temperature/token changes;
- swallowing an unresolved job and pretending the turn succeeded;
- adding a parallel turn coordinator;
- weakening action/attempt fencing or atomic Commit.

A′ remains binding: one server-owned turn lifecycle, one logical `(game,turn)` job, fencing, bounded reconnect/recovery, atomic Commit.

### Required focused regressions

Protect whichever root cause is proven. At minimum include:

- a legal slow in-flight job must not be falsely abandoned by UI;
- an actually stale/orphaned job reaches an explicit recoverable terminal state;
- reconnect/refresh cannot create duplicate Story generation or duplicate committed turn;
- a failed action does not permanently block the next explicit player action;
- normal fast path remains one visible action -> one logical turn -> one commit.

Player-facing copy must not expose `company_r3_stale_turn_timeout`, `r3_*`, or `Retry failed action` as normal game language. Technical codes may remain in diagnostics/logs.

---

# 3. Second phase — P1-B Mind Monitor same-reality / actor identity repair

Use Campaign B read-only evidence to identify the exact mismatch turn.

Capture:

`Story rendered actors/dialogue -> committed present/focal actor ids -> observer raw mind_monitor actor ids -> normalizer/applied ids -> frontend rendered MM name`

Determine whether the first broken boundary is:

- Story actor identity;
- observer raw actor_id selection;
- evidence grounding;
- normalizer target mapping;
- stale previous-turn MM reuse;
- frontend projection/render mapping.

Fix only the owning boundary.

Binding behavior:

- MM actor IDs must be exact registered canonical IDs;
- normally MM may only include relevant/current-scene actors supported by current committed evidence;
- no fuzzy name matching, near-name inference, pronoun speaker guessing, or cross-turn stale carry-forward;
- if actor identity is ambiguous, drop that MM entry locally with a warning rather than assigning it to a different heroine;
- MM failure never destroys valid Story;
- Story and MM must describe the same event/reality;
- player-inner-thought remains grounded-only and must not regress.

Add focused regression using the exact failure shape plus a multi-NPC case where the correct heroine remains distinguishable.

---

# 4. Preserve all already-landed canon convergence behavior

While fixing P1-A/P1-B, explicitly regression-check and DO NOT casually redesign:

- five heroine dramatization content;
- profile-tag prose leakage protections;
- work-as-context Story instruction;
- literal player agency;
- grounded player-inner-thought;
- MM `{surface, subconscious}` schema + fail-open;
- CSA institutional-new-rule semantics;
- CSA scope/current-state projection;
- existing CHANGE/REMOVE residue fix;
- simple grounded memory architecture;
- media manifest + media_hint architecture;
- two-layer full choices + compact 5-character buttons;
- TTS sidecar / TTS OFF=zero;
- A′ one-Story + one-observer architecture.

Do not introduce generic relationship/consent/emotion state, generic physical ontology, generic sexual-action DSL, second choice/MM/media LLM, or a third parser generation.

---

# 5. Media catalog continuation — actual assets only

The previous task correctly refused to invent adult image entries. Now finish the factual inventory work required by `MEDIA_CATALOG_CONTRACT.md`.

Read only first:

- current `content/media_catalog.json`;
- live TEST `image_library` rows for `edition_id=company-v1`;
- actual referenced Storage/public asset objects where safely inspectable.

Known prior read-only live baseline was:

- heroine1: general 1 / sex 13
- heroine2: general 1 / sex 21
- heroine3: general 1 / sex 20
- heroine4: general 1 / sex 22
- heroine5: general 1 / sex 21

For every adult/sex row, determine whether the asset and its semantic metadata are actually verifiable.

### If verified real asset + sufficient metadata exists

Promote it into repository `content/media_catalog.json` using the contract fields without inventing semantics:

- stable image_id;
- character_id;
- pool;
- situation;
- tags;
- active;
- curation_rank;
- asset locator/deployed mapping.

### If asset exists but semantic metadata is insufficient

Do NOT fabricate a sexual situation/tag from filename guesswork. Record it as a curation gap and keep it inactive/unclassified until visually/metadata grounded.

### If DB row points to missing/unusable asset

Record and reconcile it as stale deployment-index debt; do not pretend it is catalog coverage.

Repository manifest remains semantic/curation authority; DB remains deployed/query index.

No image LLM, no sexual-event ledger, no gameplay-state expansion solely for media.

---

# 6. Focused source validation before deploy

Run focused tests for P1-A and P1-B first, then relevant canon-convergence/media/frontend tests, then full npm suite as regression signal.

Required checks:

- changed JS/MJS syntax;
- JSON parse;
- `git diff --check`;
- focused P1 tests;
- canon convergence tests;
- media/frontend turn contract tests;
- full suite triaged against current canon.

Raw test count is not product acceptance. Do not restore stale semantics to satisfy obsolete tests.

Land fixes normally on `main` only.

---

# 7. TEST deployment

Deploy only changed R3 TEST components after source/tests are clean.

- R3 API if backend changed;
- R3 frontend if frontend changed;
- no Production;
- no destructive DB work;
- no historical migration rewrite;
- no preserved/evidence-game mutation.

Record exact accepted source SHA and Worker version IDs.

---

# 8. Mandatory focused browser proof after P1 repair

Before the full campaign, create fresh disposable adult-profile browser fixtures through the bare public TEST UI.

### P1-A focused proof

Run one fresh continuous 12-turn browser session with no retry/sample-until-pass.

Requirements:

- at least one free input and one native choice;
- normal social and adult-oriented interaction mix;
- refresh after Turn 3+;
- every turn must either commit or fail with a real explicit recoverable terminal;
- no stale timeout leaving the UI/action/job permanently ambiguous;
- no duplicate POST/Story/Commit from reconnect.

If the same stale-turn class recurs, preserve the fresh failed fixture and perform at most TWO evidence-driven source repair cycles for this proven P1. Each repair cycle requires a concrete new root-cause finding; no blind retries or provider sampling.

### P1-B focused proof

In the same or a second fresh fixture, create a multi-NPC scene and inspect at least five consecutive MM-bearing turns.

Pass requires:

- every visible MM name maps to its exact observer-applied actor ID;
- actor is current/relevant and grounded in the same committed scene;
- Story/MM identity does not cross;
- ambiguous entries are dropped, not reassigned;
- player-thought remains empty unless literally grounded.

Do not move to full acceptance with either P1 still unresolved.

---

# 9. Full real-browser canon acceptance continuation

After both P1s are green, run a NEW clean acceptance campaign set. Do not continue the old failed games.

Create exactly TWO new disposable adult profiles through visible Setup.

## Campaign A — junior/ordinary adult

- age 25+ preferred;
- normal department;
- intern/staff/assistant-level rank;
- Opening + at least 15 ordinary turns.

## Campaign B — experienced/authority adult

- age 30+;
- different department where practical;
- manager/executive rank;
- Opening + at least 10 ordinary turns.

Play as an actual adult user of an adult company-life character simulation, not as a corporate QA checklist.

Across the two campaigns naturally cover:

- non-work small talk;
- heroine-specific conversation and follow-up;
- attraction/flirting/suggestive adult interaction;
- explicit adult request when context permits;
- escalation and de-escalation;
- refusal;
- changing mind;
- stopping/changing ongoing romantic/intimate/sexual interaction;
- being alone / asking to be left alone;
- self-directed action;
- multi-NPC interaction;
- location movement;
- work as one life context, not universal goal;
- permanent agency probes including 한리브 lunch, alone-at-window, 윤민아 movement when context permits;
- character differentiation and no dossier-label prose leakage;
- four semantically different Story choices;
- player-inner-thought negative cases;
- MM raw/applied spot checks;
- History;
- refresh/re-entry;
- desktop + 390x844 mobile.

No retry/regeneration/sample-until-pass.

---

# 10. Mandatory CSA live acceptance

Through visible CSA product UI, prove the current owner canon in live Story.

### A. New institutional notice -> reaction -> adaptation

APPLY a visibly disruptive accepted preset.

Required live sequence:

1. rule becomes a NEW official company rule/notice;
2. relevant NPCs may react with surprise/embarrassment/annoyance/questions in character;
3. they do not know/sense the private app;
4. when applicable they follow the authoritative rule;
5. compliance does not become automatic desire/affection/private consent/romance;
6. after later turns they show character-specific adaptation/practicalization rather than instant eternal normality.

### B. CHANGE / REMOVE

- play unrelated turns after APPLY;
- CHANGE same rule or scope where product allows;
- play an unrelated turn;
- REMOVE;
- play another unrelated turn;
- prove future Story uses only current rule authority and no stale enforcement remains.

### C. Rule 9 exact semantic boundary

Preset `continue_until_recipient_orgasm`:

Negative case:
- no qualifying current sexual action underway;
- player requests a new sexual act;
- rule MUST NOT create authority to start the new act merely because of the request.

Positive case:
- a qualifying current sexual action is genuinely already underway through prior committed Story;
- request condition is met;
- rule may require continuation according to preset semantics.

Do not create or test a generic sexual action DSL.

---

# 11. Mandatory long-memory acceptance

Extend at least one new campaign far enough that a meaningful event leaves the recent raw-turn window.

Use a concrete earlier event such as:

- refusal/boundary;
- conflict/pressure;
- help/care;
- promise;
- intimate event;
- meaningful CSA first reaction/adaptation.

Later return to the same character/topic.

Pass requires the later Story to preserve the grounded significance without introducing a numeric relation/consent/emotion engine and without resetting tension merely because of one later polite sentence.

Inspect the actual committed summary/memory payload to prove source-turn grounding and chronology.

---

# 12. Mandatory media live acceptance

Using only actually verified catalog entries:

1. ordinary heroine scene -> correct same-character general image;
2. if multiple verified general situations exist, observe meaningful variation rather than a systematic wrong portrait;
3. genuinely committed adult/intimate scene -> appropriate sex-pool image when a verified matching asset exists;
4. requested-but-refused/non-occurring act -> must NOT switch to false sex image;
5. de-escalation/end/leave -> stale sex media clears;
6. refresh/replay -> equivalent media meaning;
7. image failure -> Story/Commit unaffected.

Record `/media/image` request pool, selected image id, character id, and reason/hint for the adult proof.

If no sex asset can be semantically verified from the existing 97 DB rows, do not fabricate success. Report a precise remaining **content curation gap** with counts and evidence.

---

# 13. Presentation acceptance

Verify in real browser:

- no player-facing `r3_*`, `company_r3_*`, `revision`, `Commit`, or developer retry jargon in normal failure/recovery UI;
- Story reading surface is not jarringly blanked/covered during next stream;
- full four choices + separate compact five-character buttons remain intentionally present and correspond exactly;
- compact click submits the full current literal;
- dialogue-card/TTS projection works once for a real registered heroine line;
- TTS OFF makes zero TTS requests;
- mobile 390x844 keeps Story/choices/input primary over secondary panels.

Do not report the intentional two-layer choice UI as duplication.

---

# 14. Evidence and severity rules

For every live defect record:

`literal -> Story -> observer raw -> observer applied -> durable state -> next Story/UI`

Classify P0/P1/P2/P3 by user-visible impact.

Do not stop merely because a P2/P3 exists; collect it and finish the matrix when core play can continue.

Stop/repair immediately for a proven P0/P1 that invalidates subsequent evidence, including:

- stuck/duplicate turn lifecycle;
- direct player-agency substitution;
- actor identity crossing;
- wrong active CSA authority;
- persistent state corruption.

Up to TWO evidence-driven repair cycles are authorized for the two known P1 classes only. New unrelated P1 requires preservation + terminal/operator review unless the fix is obviously within the same owning boundary and does not broaden architecture.

---

# 15. Completion report

Post one NEW Issue #68 terminal containing:

- task id and starting/current task blob;
- owner canon SHA;
- accepted baseline `c166eee...` confirmation;
- exact source/final main SHA;
- changed files grouped by P1-A / P1-B / media curation / presentation;
- Campaign A Turn 11 forensic root cause;
- Campaign B MM mismatch forensic root cause;
- tests and stale-test triage;
- exact TEST Worker versions;
- focused P1 fresh fixture IDs/results;
- two final fresh full-campaign IDs/profiles;
- per-lane LIVE_ACCEPTANCE_MATRIX result;
- CSA reaction/adaptation + CHANGE/REMOVE + Rule 9 evidence;
- long-memory evidence;
- media manifest counts by heroine/pool and verified-vs-gap counts;
- actual general/sex browser reachability evidence;
- desktop/mobile/TTS/History/refresh results;
- remaining defects P0/P1/P2/P3;
- source edits / deploys / DB operations listed explicitly.

Then overwrite this SAME file to:

`Status: WAITING_REVIEW`

Terminal:
`CANON_CONVERGENCE_P1_REPAIR_AND_ACCEPTANCE_COMPLETE_AWAITING_OPERATOR_REVIEW`

STOP. Do not create the next CURRENT_TASK yourself.
