# Company Redesign — Minimal Tests + Live Acceptance Policy

Status: OWNER-DIRECTION DRAFT  
Date: 2026-08-21

## 1. Principle

The previous Company process treated a growing automated test count as evidence that the game was becoming correct. That failed: hundreds of tests could certify a structurally consistent but wrong product.

The redesign reverses the priority.

```text
1. catastrophic invariant tests
2. TEST deploy smoke
3. owner live play
4. targeted regression only after a real failure
```

Automated test quantity is not a success metric.

## 2. Default action on the old suite

When implementation begins, assume the existing broad `test/*.test.mjs` suite is **historical implementation evidence, not forward CI authority**.

Do not spend time making the new engine satisfy old tests.

Old tests may be deleted or archived when they cover:

- obsolete v1 orchestration;
- browser-owned Story → Extract → Commit stages;
- removed choice contracts;
- old Story wire markers;
- old physical/posture/contact ontology;
- dynamic player sexual meter;
- old relation/event ledgers;
- 44-rule CSA runtime assumptions;
- legacy save compatibility;
- source-regex/migration-text assertions that do not prove runtime behavior;
- exact old prompt wording;
- old frontend-v2 demo product behavior;
- test-count parity with prior commits.

A historical test is retained only when it directly protects the selected A′ architecture or accepted product behavior.

## 3. New CI suite — deliberately small

Start with a fresh small suite. The exact file names are not binding, but the scope is.

### T1 — Content + Setup contract

Protect only finite facts that code must never silently change:

- Company edition identity;
- five heroine IDs/names;
- registered general NPC catalog loads;
- map IDs load from canonical content;
- accepted Setup fields validate server-side;
- active CSA catalog is exactly the accepted nine templates.

Do not snapshot full prose/prompt cards.

### T2 — Turn atomicity / fencing

Protect the expensive infrastructure invariants:

- exact literal action is reserved and committed;
- one `(game, turn)` has one current attempt;
- duplicate submit cannot create two committed turns;
- stale attempt cannot commit over newer attempt;
- expected-turn/revision conflict does not corrupt state;
- Commit advances state/turn atomically.

### T3 — Stream / recovery contract

Protect:

- Story deltas can stream before Commit;
- bounded progress persistence does not require a write per delta;
- reconnect can see current job/progress;
- successful terminal readback equals committed context;
- Story provider failure does not create a committed turn.

Do not test every possible SSE chunk boundary unless a real bug proves it necessary.

### T4 — Observer fail-open + minimal reducer

Protect:

- observer failure does not erase valid Story;
- unknown actor/location cannot mutate structured state;
- evidence-bound entered/exited/location changes work;
- `scene_note` can replace the previous note;
- invalid/missing choices never reuse stale choices;
- relevant Mind Monitor can be omitted without failing Commit.

Do not test generic narrative semantics.

### T5 — CSA transaction

Protect:

- only 9 active template IDs are accepted;
- finite subject/counterparty scope validation;
- apply/change/remove advances state revision but **not gameplay turn**;
- system event is recorded;
- one representative clothing rule updates exact four-slot state;
- unknown/removed template cannot activate.

Do not exhaustively test every valid scope × template combination unless a failure appears there.

### T6 — Thin frontend contract

Keep this extremely small or omit it if live browser review covers it better.

If automated:

- choice click submits full literal choice text;
- free-form input submits exact entered text;
- no browser Story→Observer→Commit stage coordinator exists;
- Story area is not replaced by a blocking loading overlay.

Do not rebuild a large DOM snapshot suite.

## 4. No required test-count target

There is no requirement such as “400 tests”, “same count as main”, or “all old tests green”.

CI passes when the selected small invariant suite passes.

A useful target is that the core suite stays easy to understand in one sitting. If tests become larger than the code they protect, review whether the contract is overbuilt.

## 5. When a new automated regression test is allowed

Add a test only when at least one is true:

1. the failure can corrupt/delete/duplicate committed gameplay data;
2. the failure violates literal player action authority;
3. the failure breaks turn fencing/reconnect/atomic Commit;
4. the failure activates an invalid CSA rule or mutates another actor;
5. the exact failure has occurred in live play and is deterministic enough to protect cheaply.

Do not add a test merely because a helper function exists.

## 6. Live provider play is the primary product test

The engine is not accepted from deterministic mocks alone.

Every meaningful gameplay milestone goes to the real TEST Worker/model quickly.

### Live Gate L0 — Opening

Immediately after the first deploy:

- create a fresh TEST game;
- complete real Setup;
- inspect Opening before doing further stabilization.

Reject immediately if it feels like a helpdesk/demo, uses wrong people/place, speaks for the player, or misses the private `상식개변` premise.

### Live Gate L1 — 3–5 ordinary turns

Owner plays freely, not a scripted happy path.

Check:

- Story quality;
- literal agency;
- four useful choices;
- free input;
- identity;
- Mind Monitor relevance;
- visible streaming;
- no blocking loader;
- UI high parity with Company v1.

If this gate fails, fix the product failure before building deeper systems.

### Live Gate L2 — 10–20 turns continuity

Deliberately exercise:

- move between locations;
- refer to an off-scene canonical NPC by name;
- multi-character dialogue;
- direct question and follow-up;
- ongoing pose/contact/object fact in `scene_note`;
- leave and resume a topic;
- refresh during normal play.

This is the primary proof for scene/memory design.

### Live Gate L3 — failure/recovery mini-pass

Perform only a few high-value failures:

- double submit once;
- refresh/reconnect while Story is streaming;
- explicit retry after one induced/real failed turn;
- observer malformed/disabled test if easy to inject.

Verify no duplicate committed turn and no hidden Story regeneration after a successful Story.

### Live Gate L4 — 9-rule CSA

After core play is accepted:

- apply/change/remove each of the 9 rules at least once across real play;
- use representative individual/group scope combinations;
- verify CSA transaction consumes zero Story turns;
- verify exact clothing continuity for clothing rules;
- verify open-ended emotional/narrative consequences stay Story-authored;
- verify removal changes future premise without rewriting history.

Do not build an exhaustive combinatorial automation matrix first.

### Live Gate L5 — 20–30+ turn long play

Use normal gameplay rather than a scripted state machine.

Check whether:

- older relevant facts remain usable beyond recent raw context;
- summaries are enough;
- character voices remain distinct;
- `scene_note` is enough for immediate continuity;
- prompt/context size remains reasonable.

Only this gate may justify adding a separate memory compactor or additional physical structure.

## 7. Fresh-game rule

All automated or manual redesign tests use new TEST game IDs.

Historical/manual/evidence games remain read-only forever unless the owner explicitly identifies one as disposable.

Automation never consumes the owner’s preserved manual acceptance fixture.

## 8. Live diagnostics

Live testing should produce evidence, not another giant validation engine.

For each test turn make it possible to inspect:

- literal action;
- raw Story;
- four extracted choices or extraction warning;
- raw observer JSON;
- applied observer projection;
- committed state after;
- turn/job IDs and attempt number;
- error stage/code when failed;
- Story first-token and total latency where practical.

Do not automatically use diagnostics to rewrite/regenerate Story.

## 9. Bug handling rule

When live play finds a defect:

1. preserve the exact game/turn as evidence;
2. identify whether the defect is prompt, observer, reducer, persistence, UI, or content;
3. fix the narrow owning layer;
4. add an automated regression only if it meets Section 5;
5. replay with a fresh TEST game/turn;
6. return to owner play quickly.

Avoid broad “fix all similar semantic cases” engines unless multiple concrete failures prove the abstraction.

## 10. Release truth

The release decision order is:

```text
structural invariant suite green
AND
exact TEST deploy healthy
AND
owner live acceptance green
```

If CI is green and live play is bad, the build is bad.

If live play is good but a removed/obsolete old test is red, the old test is deleted rather than forcing the product backward.
