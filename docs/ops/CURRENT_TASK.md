# Company — CURRENT TASK

Status: READY
Task ID: company-r3-autonomous-qa-csa-change-remove-p1-20261014
Mode: OWNER-AUTHORIZED LUNA XHIGH AUTONOMOUS DEVELOPMENT; TEST-ONLY
Updated: 2026-10-14 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## 0. Owner decision / authorization

On 2026-10-14 the owner explicitly resumed the Company R3 quality loop for up to 24 hours. This supersedes `MANUAL_PLAYTEST_HOLD` **for development, verification, fresh-game playtesting, and deployment to the Company R3 TEST Workers only**. It does not authorize Production access or changes, preserved-game mutation, DB repair, unapproved migrations, provider/model changes, force-push, or use of Sol, Claude, or other implementation agents. Luna XHigh performs PM, analysis, implementation, and QA.

The owner authorized local changes, branches, small PRs, tests, GitHub CI, verified fixes merged to `main`, TEST Worker deployment, new disposable TEST games, and progress-document / GitHub Issue updates. Product law is unchanged; the current canon and specialized contracts remain binding.

## 1. Current baseline

Repository: `zeroslove-ai/company-v1`
- Clean working checkout: `C:\Users\JAEWAN\company-v1`
- Start branch: `main`
- Working branch: `work/company-r3-csa-change-remove-p1-20261014`
- Start / registration SHA: `7780759fd595247bd05d13f89ce44847e4551d8a`
- `origin/main` was verified at the same SHA on 2026-10-14.

Current TEST frontend:
- Worker: `gamebuilder-company-r3`
- URL: `https://gamebuilder-company-r3.zeroslove.workers.dev/`
- Version: `94bdf291-739a-4452-bcb4-e35ec6b96f5d`
- Executable source SHA: `9b3f4f26c97828ec18e05f29f8df7f18df4bbe81`

Current TEST API:
- Worker: `game-proxy-company-r3`
- Version: `26fc1dd2-9354-4b99-b6ee-b4c53306c607`
- Executable source SHA: `fab6f43f937dde317fbdf152a41a7942e24d3669`

Latest preserved evidence game: `8a61332b-8365-4655-97c4-754332407948` — READ ONLY. It and all earlier evidence games must not be changed.

### Accepted core boundaries to preserve

- A′/R3: server-owned turn kernel -> one Story -> one post-Story Observer -> atomic Commit.
- Current free-form literal precedence over prior unchosen Story choices.
- PLAYER movement authority and NPC-only movement separation; final Story-grounded NPC presence and canonical PLAYER location.
- Registered NPC identity authority and completed-Story Observer evidence law.
- Company Map current-presence truth vs default/reference location distinction.
- Opening stationary-start/private-app provenance.
- Exactly four Story choices plus unrestricted free input; selected-choice submission and reload/re-entry behavior.

## 2. Initial registered lane — known P1 CSA CHANGE/REMOVE boundary

The first implementation lane is to verify and, if confirmed on current `main`, narrowly correct the known CHANGE/REMOVE prospective-state and rule-owned clothing provenance defect recorded in the latest accepted Issue #68 review. Specifically inspect whether rule-change Story context receives stale prior authority and whether replacing/removing a same-instance rule leaves clothing contributions owned only by the old rule.

Acceptance must preserve the binding contracts in:
- `CURRENT_TRUTH.md`
- `docs/redesign/COMPANY_CANON.md`
- `docs/redesign/CSA_COMPATIBILITY_AND_AUTHORITY_CONTRACT.md`
- `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`
- `docs/redesign/POST_LIVE_CANON_AUDIT_CONTRACT.md`

Use the smallest existing rule-change/reducer owner boundary. Keep one structured rule-change turn -> one Story -> one post-Story Observer -> atomic Commit. Preserve the operation and history; do not add a generic engine, rule DSL, extra state machine, second Story, semantic retry, prompt-only guarantee, provider/model swap, or generic clothing solver. Existing active-rule state remains authoritative only after successful commit. Retraction is limited to finite state owned only by the replaced/removed rule.

First inspect source and existing focused tests, then implement only if the deterministic defect remains. Record the first broken boundary and targeted source evidence. Test relevant focused coverage and the requested full-impact path. Do not modify evidence games.

## 3. Live verification and post-live audit

After initial smoke and any accepted source fix, deploy only the affected TEST Worker through the repository's existing deployment gates. Create a fresh disposable TEST game through the visible UI; preserve its ID and never reset or mutate it afterward. Verify the relevant CSA APPLY/CHANGE/REMOVE path, then complete a 15–30 turn continuous play run as practical across social/non-work interaction, free input and four choices, movement/exit/re-entry, refusal/change-of-mind/topic change, active and multiple CSA rules, MM/History/Memory, image/TTS, refresh/re-entry, and desktop/mobile surfaces. Do not substitute unit tests for browser play or retry until lucky.

After every deployed browser campaign, re-read current authority and complete `POST_LIVE_CANON_AUDIT_CONTRACT.md` before registering another lane. Record task compliance and independent `WHOLE_CANON_AUDIT_*` conclusion separately. If a broader P0/P1 or contaminating P2 appears, reorder work to the earliest broken boundary.

## 4. Operating and reporting rules

At each meaningful verification checkpoint record: current SHA; defect and root cause; code changed/deleted; test results; actual-game result and preserved game ID; unresolved issues; next lane. Prefer removing/replacing duplicate or stale code before adding features. A passing test count alone is not success.

Production is prohibited. No preserved game edits, arbitrary DB repair, unapproved migration, force-push, correctness-motivated model/provider change, or new generic validation/action/relationship/CSA engine.

## 5. Initial status

The current source SHA and TEST Worker versions above are the verified start baseline. The latest accepted live review explicitly named the CSA CHANGE/REMOVE prospective-state and old-rule clothing provenance path as the first-resume candidate. Earlier accepted full-test evidence was 597/597 on the frontend map-fix cut; it is historical baseline evidence, not fresh verification of this start SHA.

Start-of-task GitHub review found open issue #68 as the current ops thread; open issues #63/#64 are historical docs-only DB/architecture audit requests, and #102 is reference-only. Draft PR #101 is OPEN/DRAFT/DIRTY and has no accepted deployed evidence attached to the current start SHA; do not merge or copy it into this lane without a current-canon failure confirmed at its owning boundary.

This task is now READY under the owner's explicit TEST-only restart authorization.

## 6. Execution checkpoint — implementation and regression verified

Checkpoint: 2026-10-14 KST. Working tree is based on start SHA `7780759fd595247bd05d13f89ce44847e4551d8a`; no new commit has been created yet.

- Confirmed source defects: CHANGE/REMOVE Story context was projected from pre-operation CSA authority, and same-ID CHANGE could overwrite old rule identity before retracting that rule's finite clothing state. W3 also lacked the canon-supported `uniform_top: worn` projection. Cleanup previously revisited inactive rules on unrelated operations, and reset could miss an absent actor still represented in clothing state or fail to retain a different active rule's required slot.
- Changed: `runtime-r3/server/worker.js` computes one prospective CSA state for the Story context and commits only after Story and Observer; `runtime-r3/domain/csa.js` carries the explicit previous rule as transition history and retracts only affected finite clothing contributions while retaining active-rule projection or current Story clothing evidence; `runtime-r3/domain/memory.js` clarifies prospective authority vs transition history; `content/csa_catalog.json` gives W3 its canonical finite top-clothing projection. Removed the old broad inactive-rule cleanup loop. Added deterministic coverage in `test/r3-csa-contract.test.mjs`.
- Tests after the latest patch: focused CSA/turn-kernel/Observer suite 43/43 passed; full `npm.cmd test` 601/601 passed; `git diff --check` passed. This is pre-deployment source verification, not live acceptance.
- Live TEST game: not yet created. Preserved evidence game remains read-only. TEST API Worker remains baseline version `26fc1dd2-9354-4b99-b6ee-b4c53306c607` until gated deployment succeeds.
- Remaining: review final diff; create and push small PR; deploy only `game-proxy-company-r3`; smoke TEST; create fresh visible-UI TEST game; run the 15–30-turn acceptance campaign and post-live whole-canon audit; merge only after that evidence and CI.
- Next lane: complete diff/authority review, then proceed to TEST API deployment.

## 7. Follow-up checkpoint — local in-memory smoke

Checkpoint: 2026-10-14 KST. Commit `4f18126` is the source under test; this follow-up is local-only and does not change any TEST or Production Worker.

- `deploy-api-with-contract-gate.mjs --config wrangler.r3.api.jsonc --expect-worker game-proxy-company-r3` stopped before Wrangler because neither `SUPABASE_DB_URL` nor `COMPANY_DB_CATALOG_PATH` is configured. No gate bypass was attempted. Supabase project listing identified the configured TEST project `fmcrspgxstsmxxsmkeee` as `INACTIVE`.
- Local in-memory API smoke passed on a fresh ephemeral game `b95b4e9e-d87c-40dd-87d1-3ff44c845fbd`: opening plus APPLY → same-instance CHANGE → REMOVE → ordinary free input committed at turn 4; Story and Observer each ran five times; Story received the prospective W3 state; REMOVE left no active rule. The smoke used a scripted local fixture provider and in-memory store, so it is wiring/commit-boundary evidence only—not a real-model playtest, persistent reload test, or product-quality acceptance. The temporary script was removed and no game row was created in Supabase.
- UI/browser play remains unverified. The computer-use surface could not determine the browser URL after navigating and halted that UI session. Do not count this local API smoke as the required 15–30-turn campaign.
- Current TEST API and frontend Worker versions remain the baseline versions in Section 1. PR #104 remains draft and unmerged.
- Next: resume with a permitted browser-control path and an available Stage A read-only DB catalog; deploy only the R3 API TEST Worker after the existing gate passes, then perform fresh-game live acceptance and the full post-live canon audit.
