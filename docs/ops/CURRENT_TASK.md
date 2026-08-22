# Company — CURRENT TASK

Status: READY
Task ID: company-r3-feedback-revision-continuation-proof-v1
Mode: CONTINUE SAME TEST GAME 5 HUMAN-LIKE TURNS -> PROVE REVISED TURN IS SOLE FUTURE CONTEXT AUTHORITY -> STOP
Updated: 2026-08-23 00:06 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, compatibility layer, or competing execution authority.

## 0. Authority / accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `A-FEEDBACK-001 — Revise latest turn, do not advance chronology`;
- `docs/FEEDBACK_REVISION_CONTRACT.md`;
- owner lean-development directives `5380380688` and `5380381500`;
- feedback source implementation/fix through source head `2898a929db239f210f448bab87579872aae8ec81`;
- TEST rollout terminal `5381058522`;
- operator review `5381069587`;
- this exact CURRENT_TASK blob after registration.

Accepted TEST identities are already live and MUST be reused without redeploy:
- API `game-proxy-company-r3` version `43179146-b0b3-4be9-b750-781c3ad3b61d`;
- frontend `gamebuilder-company-r3` version `016422f6-2c1f-4ac5-b4ec-eab7c7f2a5f6`.

Accepted TEST migration is already applied exactly once and MUST NOT be reapplied:
- `20260822000300_company_r3_feedback_revision`.

Use ONLY the existing disposable feedback game:
- `ac3706aa-29b2-4a24-8b23-e61ce96a26d7`.

Current accepted state of that game:
- Opening committed;
- chronological Turn 1 committed once;
- Turn 1 logical revision is 3 after two accepted feedback revisions;
- `company_r3_state.committed_turn = 1`;
- state revision is 3;
- canonical Turn 1 row appears once;
- revision-history rows for Turn 1 are exactly revisions 1, 2, 3;
- same-request replay created no revision 4;
- original literal action remains `회의 자료를 정리하며 팀원들에게 오늘 일정부터 확인한다.`.

CSA rules 7/9 remain frozen capability exceptions and are outside this task.

## 1. Purpose

Close the one remaining live acceptance point for `A-FEEDBACK-001`:

> After the latest turn is revised, subsequent normal Story/context/history must use only the accepted latest revision of that chronological turn. Superseded revisions remain audit-only and must not re-enter gameplay context.

Do this as a lean human-like continuation, not as a new QA framework.

No source change is expected or authorized unless a deterministic product defect is first proven and this task stops for review.

## 2. Preflight — read only

Before any new turn:
1. Verify Issue #68 still has this exact task READY and no competing owner/operator directive or active lease.
2. Verify repo/main source remains executable-equivalent to accepted source `2898a929db239f210f448bab87579872aae8ec81` plus docs-only registrations.
3. Verify TEST API/frontend identities above are still active. Do not redeploy merely to refresh identity.
4. Read the disposable game through canonical context and TEST DB/service-role readback.
5. Require the starting truth:
   - committed_turn = 1;
   - state revision = 3;
   - exactly one canonical Turn 1 row at logical revision 3;
   - Turn 1 literal action exact-match;
   - Turn 1 revision history 1/2/3 remains audit-only and no revision 4 exists;
   - no pending/failed Turn 2 job.

If deterministic starting truth differs, STOP and report `BLOCKED_FEEDBACK_CONTINUATION_PREFLIGHT_MISMATCH`. Do not reset or repair the game.

## 3. Human-like continuation

Continue this SAME disposable game naturally from Turn 1 revision 3.

Target:
- Turn 2 through Turn 6 maximum;
- stop earlier if five committed continuation turns are reached;
- use ordinary free-input or current Story-authored choices as a normal human player would;
- inputs should be coherent with the accepted revised Turn 1 scene, not artificial invariant phrases.

Keep the gameplay varied enough to expose continuity without turning this into a semantic torture test. Suitable beats may include ordinary office conversation, a small movement/location change, a personal/non-work topic, a refusal/boundary, or a quiet self-directed beat when naturally available.

For each submitted turn:
- exactly one user action;
- exactly one normal Story request;
- no hidden retry/regeneration;
- if the turn commits, continue;
- if a turn deterministically corrupts chronology/projection/state, STOP immediately;
- if a provider-style timeout occurs and the existing explicit retry contract clearly applies, one existing explicit failed-turn retry may be used at most once for that same turn, exactly as already accepted; do not tune timeouts/provider/model/config;
- a lone semantic miss is evidence to log, not authorization for retry-until-pass or prompt tuning.

Do NOT submit additional feedback revisions in this task. The object is to prove what normal future turns consume after revision 3.

## 4. Required proof after Turn 2

Immediately after Turn 2 commits, capture enough canonical/API/DB evidence to prove:
- Turn 1 exists once in normal context/history and is logical revision 3;
- Turn 1 Story text exposed to normal gameplay is the accepted revision-3 Story, not revision 1 or 2;
- Turn 1 original literal action remains exact;
- Turn 1 revision-history 1/2/3 remains separately auditable but none appears as an extra chronological turn;
- Turn 2 is chronological turn 2, not a revision artifact;
- committed_turn advanced exactly 1 -> 2;
- state revision advanced exactly 3 -> 4 for the ordinary Turn 2 commit;
- no revision 4 was created for Turn 1.

Where observable without instrumentation changes, inspect the server-owned Story context/request evidence or equivalent accepted logs to confirm the `recent_turns`/context passed to Turn 2 contains Turn 1 once with the accepted revision-3 narrative. Do not add diagnostic metadata or a harness solely for this proof.

## 5. Required proof through final continuation

After the final committed continuation turn (Turn 6 maximum), verify:
- chronology is Opening + Turn 1 + subsequent ordinary turns exactly once each;
- Turn 1 remains one canonical row at logical revision 3;
- superseded Turn 1 revisions remain audit-only;
- all later context/history/readback continue to show only accepted Turn 1 revision 3;
- no later Story materially regressed to a superseded Turn 1 fact because the old revision re-entered canonical context;
- every ordinary committed turn advances `committed_turn` exactly once;
- every ordinary committed turn advances state revision exactly once;
- literal action parity holds for each new ordinary turn;
- current location/scene_note/presence/MM remain internally coherent enough for ordinary play; do not reopen already-frozen location/scene/MM clusters for cosmetic variance;
- refresh at the end reconstructs the same canonical chronology/state without duplicate turns.

Product judgment:
- judge obvious deterministic continuity/projection defects strictly;
- do not classify one stylistic/semantic provider miss as a global blocker;
- repeatable player-agency substitution or deterministic stale/superseded revision leakage is a real blocker.

## 6. Browser/UI check

Use the deployed TEST frontend on this game for the continuation where practical.

Confirm after final refresh:
- revised Turn 1 appears once;
- subsequent turns appear once and in order;
- direct input remains usable;
- choices reflect current latest Story when present;
- feedback control can remain enabled for the current latest ordinary turn, but DO NOT invoke it;
- no blocking loader or duplicate rendering regression was introduced by the already-deployed feedback feature.

Do not run a broad desktop/mobile/TTS/history matrix. One normal browser viewport plus final refresh is enough unless a real UI defect appears.

## 7. RLS advisory — retain, do not fix here

The TEST Supabase project currently emits an RLS-disabled advisory covering existing tables including the two new feedback tables.

This task MUST NOT:
- create/alter RLS policies;
- change grants;
- create a security migration;
- turn the continuation run into a security audit.

Record the advisory in terminal as `RLS_ADVISORY_RETAINED_FOR_SEPARATE_REVIEW` only. Explicit anon/auth privilege denial for the feedback tables was already verified during rollout.

## 8. Forbidden

Do NOT:
- apply/reapply any migration;
- deploy/redeploy API or frontend;
- touch Production;
- create/reset another game;
- reset this disposable game;
- mutate preserved historical games;
- submit feedback again;
- touch CSA or sample CSA 7/9;
- change source/runtime/frontend/tests/docs other than the normal terminal report to Issue #68;
- change provider/model/config/timeout;
- add semantic parser/classifier/router/verifier/gate;
- add diagnostics metadata/harness/framework;
- run 15/20/30/50-turn campaigns;
- use retry-until-pass.

## 9. Terminal report

Post one terminal comment to Issue #68 and STOP.

If green, status:
`STATUS: COMPLETE_FEEDBACK_CONTINUATION_GREEN`

If a deterministic real product/data defect is proven:
`STATUS: BLOCKED_FEEDBACK_CONTINUATION_REAL_DEFECT`

If an isolated provider/capability event prevents all required continuation after the already-accepted explicit recovery option is exhausted:
`STATUS: BLOCKED_FEEDBACK_CONTINUATION_PROVIDER_CAPABILITY`

Terminal must include:
- Task ID and CURRENT_TASK blob;
- execution lease;
- start/final repo HEAD (expected unchanged executable source);
- reused TEST API/frontend identities and confirmation of no deploy/migration;
- game id;
- exact starting committed_turn/state revision/Turn1 revision;
- exact Turn 2 through final submitted literal actions and commit outcomes;
- any explicit failed-turn retry used, if any, with same-row attempt evidence;
- Turn 2 proof that canonical context/history used Turn 1 once at revision 3;
- final chronology and state revision progression;
- final canonical Turn 1 row/revision/literal-action proof;
- revision-history 1/2/3 remains audit-only and no new Turn1 feedback revision appeared;
- final refresh/browser result;
- any semantic misses clearly separated from deterministic defects;
- `RLS_ADVISORY_RETAINED_FOR_SEPARATE_REVIEW`;
- confirmation that Production, CSA, source, provider/model/config, migrations, deploys, other games, and preserved games were untouched.

Then STOP. Do not overwrite CURRENT_TASK or choose the next task.