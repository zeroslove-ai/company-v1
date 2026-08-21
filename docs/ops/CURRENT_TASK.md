# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-owner-live-gate-l1-handoff-v1
Mode: TEST / OWNER LIVE GATE L1 HANDOFF PREPARATION ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Trigger / accepted predecessor

This task follows accepted Live Gate L0 Opening evidence:

- predecessor task: `company-full-redesign-milestone0-opening-agency-test-rerun-v1`
- terminal: Issue #68 `5369418168`
- operator acceptance: Issue #68 `5369499698`
- accepted source SHA: `4a253756f172862219729429a7e11ceb9ec69254`
- source merge main SHA: `af52e198d6f958aa1b97a0a5e0e18699e011806d`
- current main before this registration: `d1c3e80c29822934beec15270bac484988c49a20`
- accepted API Worker version from L0: `7da2be05-e8e9-4fa1-b121-7157b435202d`
- accepted L0 evidence game: `10984458-7a23-47ac-9ec0-bb13753ea85a`

The L0 evidence game is immutable acceptance evidence. Do not reuse, reset, delete, repair, replay, or mutate it.

## 1. Binding authority

Obey, in order:

1. PR #95 Product-first redesign canon at owner-locked lineage `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
2. PR #96 A-prime engine / live-first acceptance canon at `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
3. especially `docs/redesign/10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md` Live Gate L1 and `11_TARGET_GAP_MATRIX_A_PRIME.md` Cut 1 success definition;
4. Company v1 complete UI/content donor snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`;
5. accepted R3 source on main through merge `af52e198d6f958aa1b97a0a5e0e18699e011806d` and Opening agency correction `4a253756f172862219729429a7e11ceb9ec69254`;
6. Issue #68 operator acceptance `5369499698`.

Product live acceptance outranks green automated tests.

## 2. Exact purpose

Prepare the real R3 TEST product for **owner Live Gate L1** only.

Live Gate L1 is not an automated canary. The owner must personally:

- open the real Company-looking UI;
- complete Setup in-browser on a fresh TEST game;
- see Opening in-browser;
- play freely for 3–5 ordinary turns using choices and/or free input;
- judge Story quality, literal agency, four useful choices, identity, Mind Monitor relevance, visible streaming, no blocking loader, and high UI parity with Company v1.

Runner/Codex must **not** create the owner game or perform Setup, Opening, or any ordinary turn. The purpose of this task is only to make the exact live UI/API handoff reachable and trustworthy.

## 3. Race/preflight — read only first

Before any deploy:

1. re-read latest Issue #68 comments as duplicate/race guard;
2. confirm this exact CURRENT_TASK blob and Task ID are still authoritative;
3. confirm `main` contains accepted source ancestry through `af52e198...` / `4a253756...` and only later ops/docs descendants unless explicitly reviewed;
4. confirm API Worker identity remains `game-proxy-company-r3` and inspect whether deployed version/source still matches accepted R3 source;
5. inspect the R3 frontend deployment identity and exact repository deployment config; expected product is `gamebuilder-company-r3` unless current repository config proves a different accepted name;
6. verify frontend source on main is the Milestone 0 high-parity Company v1 transplant with thin R3 controller, not `frontend-v2` and not the historical browser-owned Story→Extract→Commit coordinator;
7. confirm the frontend supports owner-created fresh games through Setup and routes to the R3 API;
8. do not access/mutate any historical/manual/QA/evidence game.

If source ancestry, worker identity, or frontend target is ambiguous, STOP `BLOCKED_HANDOFF_IDENTITY_DRIFT` rather than guessing.

## 4. Deployment authority

This task may deploy **only what is necessary to produce the exact owner handoff**.

### API

- If read-only verification proves `game-proxy-company-r3` is already serving the accepted source corresponding to the L0 accepted lineage/version, do not redeploy it.
- If the API deployment is stale/unavailable, deploy exact accepted merged main R3 API source only using the repository's R3 API deployment config.
- Do not change provider/model/temperature/token/config/secrets.

### Frontend

- Verify current `gamebuilder-company-r3` (or exact accepted config-defined R3 frontend identity) deployment against `frontend-r3/` on current accepted main lineage.
- If stale/unavailable, deploy the exact current accepted `frontend-r3/` source using the repository's R3 frontend deployment config.
- No frontend source patch is authorized in this task.
- Do not substitute `frontend-v2/` or redesign the UI.

After any required deploy, perform only read-only reachability/product-shell checks sufficient to prove:

- frontend loads;
- R3 catalogs/API are reachable;
- Setup UI is present;
- Story area is visible;
- no blocking loading overlay covers the Story surface;
- four-choice area + free input surface are present;
- Company map / Mind Monitor / player-state surfaces match the Milestone 0 accepted shell;
- the page can begin a fresh Setup without an existing game ID.

Do not submit Setup during these checks.

## 5. Owner handoff URL

Produce one canonical owner URL for the R3 frontend root **without a game_id**, so the owner creates a fresh manual TEST game through the real Setup UI.

Do not pre-create a game for the owner.

If API origin must be supplied through a query parameter, use only the repository/deployment-authorized R3 API origin and report the exact resulting URL. Otherwise use the normal root product URL.

The owner-created game becomes the Live Gate L1 manual fixture. Automation must not consume its 3–5 turns.

## 6. Live Gate L1 criteria to report to owner

The terminal report must explicitly tell the owner to play 3–5 ordinary turns and evaluate:

1. rich Company-life Story quality;
2. literal player action fidelity / no silent action replacement;
3. exactly four useful current Story-authored choices when available;
4. free-form input works literally;
5. registered actor identity and no fabricated/crossed NPC identity;
6. Mind Monitor relevance and no unrelated NPC projection;
7. visible Story streaming;
8. no blocking loader hiding Story;
9. high-parity Company v1 presentation (Setup, Story, state, map, MM, input);
10. refresh/reload at least once after a committed turn if natural during play, but do not deliberately induce failure/reconnect yet — that belongs to later gate L3.

Do not instruct the owner to test CSA/TTS/Image/Feedback yet.

## 7. Hard prohibitions

- no source/runtime/frontend code edits;
- no migration edit/new migration/reapply;
- no DB repair/reset/reseed;
- no automated game creation;
- no automated Setup or Opening;
- no automated ordinary gameplay turn;
- no mutation of L0 game `10984458-7a23-47ac-9ec0-bb13753ea85a`;
- no mutation of failed evidence game `80095cdd-c901-4370-8387-66dcb756b72a`;
- no v1/v2/manual/QA/evidence game access for mutation;
- no Production access/change;
- no provider/model/config/secret change;
- no retry/regeneration/harness gameplay;
- no CSA/TTS/Image/Feedback implementation;
- no Milestone 1 / Cut 2 continuity work;
- no new branch or PR for this handoff-only task.

## 8. Completion / stop boundary

Post exactly one Issue #68 terminal report:

`COMPANY_FULL_REDESIGN_MILESTONE0_OWNER_L1_HANDOFF_READY`

Status: `WAITING_USER_ACCEPTANCE`

Include:

- Task ID and task blob SHA;
- main/source lineage verified;
- API Worker identity/version and whether redeployed;
- frontend Worker identity/version and whether redeployed;
- exact owner root URL;
- confirmation no game was created by runner;
- confirmation no Setup/Opening/ordinary turn was executed by runner;
- read-only UI/reachability checks performed;
- explicit 3–5-turn Live Gate L1 checklist;
- confirmation L0 evidence and all preserved games untouched;
- confirmation no migration/DB/source/provider/Milestone1 change occurred.

Then STOP `WAITING_USER_ACCEPTANCE`.

Do not register the next task automatically. After the owner reports the 3–5-turn result, operator must inspect that exact fresh game/turn evidence before choosing a narrow correction or advancing to Live Gate L2 / Cut 2.
