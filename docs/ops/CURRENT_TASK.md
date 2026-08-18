# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-live-input-utf8-fidelity-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Owner review decision

Previous terminal: Issue #68 comment `5321134956`
Previous task: `test-effective-db-contract-live-resume-v1`
Previous terminal status: `BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION`
Previous final branch SHA: `dd8c7ef4741655cedc9ebb8dc3313eea6e441168`
Previous CURRENT_TASK blob: `34bc131e0201ac4fb247447c989399220430516f`
Expected main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
Expected branch: `company/test-live-input-utf8-fidelity-v1`
TEST project: `fmcrspgxstsmxxsmkeee`
API Worker: `game-proxy-company-v1`
Frontend Worker: `gamebuilder-company-v1`
Production/hospital-v2: forbidden.

The previous stop itself is valid, but its root-cause classification is not accepted as an architecture/provider conclusion.

Independent operator readback of the preserved disposable game `1cb25cc3-7e7e-4dcf-b0f3-b54e1338eb20` proved that **all 15 committed `game_turns.player_action` values were already corrupted to ASCII `?` characters before they could serve as meaningful Korean gameplay evidence**. Direct `convert_to(player_action,'UTF8')` hex for the Korean portions is `3f...`, not Korean UTF-8 bytes.

Examples independently verified:
- turn 4 stored `player_action` is `?? ?????? ????? ...` and hex is `3f...`;
- turn 6 stored `player_action` is likewise `3f...` while its structured CSA JSON still contains intact Korean content;
- turns 8 and 10 also have corrupted `player_action` but intact structured-action Korean where present;
- the same pattern exists across turns 1–15.

Therefore the previous findings “provider ignored movement/personal/intimate semantics” and “general correctness would require prohibited architecture/provider changes” are **not proven**. A provider cannot be judged for failing to follow text that reached persistence as `?`.

Do not change gameplay architecture, provider/model, Story semantics, scene authority, CSA authority, physical/sexual reducers, or persistence based on the previous terminal until UTF-8 input fidelity is proven.

## 1. Purpose

Determine exactly where Korean free-text `player_action` was corrupted in the previous live harness and establish one reproducible UTF-8-safe TEST request path.

This is a harness/input-transport diagnostic only. It is not a gameplay repair task and not a full live acceptance.

## 2. Mandatory read-only preflight

Before any TEST write:

1. Fresh-fetch and require `main` is still exactly `8f3c5326e483650211fbc6c9f54a7527d2278d4e`.
2. Require this branch descends directly from previous final `dd8c7ef4741655cedc9ebb8dc3313eea6e441168` with only this registration commit before execution.
3. Re-read terminal `5321134956` and previous final CURRENT_TASK.
4. Read-only verify preserved game `1cb25cc3-7e7e-4dcf-b0f3-b54e1338eb20` remains committed turn 15 and is not mutated by this task.
5. Read-only query both `game_actions.player_action` and `game_turns.player_action` for turns 1–15 and record exact text plus UTF-8 hex. Confirm the observed `?` bytes are literal `0x3f`, not display/OCR/rendering loss.
6. Confirm structured-action Korean JSON from turns such as 6/8 remains valid UTF-8, proving this is not a blanket Postgres/Worker Unicode failure.
7. Inspect the exact local runner/invocation used by the previous live session, including preserved evidence at `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-live-resume-v1-terminal.md` and any temporary script that generated those requests, if still present.
8. Inspect existing maintained repo tooling, especially `scripts/live-playtest-canary.mjs`, before creating or modifying any harness. Do not build another large harness.

If the preserved DB facts differ materially from the above, STOP `BLOCKED_LIVE_INPUT_UTF8_EVIDENCE_AMBIGUOUS` with exact evidence and no TEST write.

## 3. UTF-8-safe probe design

Use a **brand-new disposable TEST game**. Never reset/reuse any prior evidence game, including:
- `1cb25cc3-7e7e-4dcf-b0f3-b54e1338eb20`
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA/protected sentinel games.

Create only the minimum normal setup/opening state needed for one gameplay action. No Level-7 acceleration is required unless the normal setup contract requires it.

The probe request must avoid shell/codepage interpretation of literal Korean. Preferred method:
- create a temporary Node `.mjs` file **outside the repository**;
- keep its source transport-safe by constructing the Korean test string from ASCII JavaScript `\uXXXX` escapes or an equivalent ASCII-only encoding;
- use Node `fetch` + `JSON.stringify` directly;
- do not pass Korean text through `cmd.exe`, PowerShell interpolation, environment-variable transcoding, or CLI arguments.

Canonical probe action after decoding in Node:
`UTF8검증: 브랜드전략팀 사무실로 이동한다.`

Record the exact JavaScript string, code points, expected UTF-8 bytes, request JSON bytes where practical, new game ID, action ID, HTTP/SSE status, and durable DB values.

Run exactly **one** gameplay action in the probe game. No retry if Story/Extract/Commit fails; the input reservation evidence is still sufficient for transport diagnosis.

## 4. Required diagnosis

After the one request, read back `game_actions.player_action` and, if a turn committed, `game_turns.player_action`.

### A. UTF-8 arrives intact

If the exact string `UTF8검증: 브랜드전략팀 사무실로 이동한다.` and its expected UTF-8 bytes are preserved in `game_actions` (and `game_turns` when committed):

- classify previous corruption as runner/harness/shell-side, not Worker/DB/provider architecture;
- identify the exact previous corruption point as narrowly as evidence permits;
- establish the ASCII-only Node request pattern as the required path for the next full live acceptance;
- do not modify runtime/provider architecture;
- do not continue into a 15–20 turn session in this task.

If the maintained repo canary itself is proven to corrupt input, a minimal test-harness-only patch is allowed. Prefer fixing the existing harness rather than adding a new large one.

Allowed repo changes in that case only:
- `scripts/live-playtest-canary.mjs` as narrowly necessary;
- one tightly related test file for the harness;
- `docs/ops/CURRENT_TASK.md` lifecycle evidence.

If the existing canary is not the source of corruption, do not patch it merely for convenience.

### B. UTF-8 is corrupted despite ASCII-only Node construction

If the request is constructed correctly in Node but `game_actions.player_action` is already corrupted:

- stop before any gameplay architecture change;
- locate the earliest transport boundary where bytes/text diverge: request construction → HTTP body → Worker JSON parse → action reservation RPC → DB;
- no provider/model call is a valid explanation if corruption is already present at reservation persistence;
- terminal must preserve exact boundary evidence.

No broad repair is authorized in this task.

## 5. Safety and scope

Allowed TEST writes:
- create one brand-new disposable game;
- normal setup/opening for that game;
- exactly one normal gameplay action for UTF-8 diagnosis.

Forbidden:
- resetting or mutating any prior evidence game;
- Production/hospital-v2 access or mutation;
- migration-history repair, `db push`, DDL, schema/RPC changes;
- API/frontend Worker deploy/redeploy;
- provider/model change;
- gameplay engine/Story/Extract/Commit semantic patch;
- semantic router/verifier, finite action grammar, consent/event ledger, generic CSA DSL, shadow compatibility layer;
- second gameplay action, retry-to-pass, or full live session;
- PR merge/Cut3.

The previous deployed TEST Workers stay exactly as they are for this probe:
- API version `43512536-7933-4274-bc1d-269d2281c335`
- frontend version `2da6d9e9-6dc6-4d05-9d0b-09469c7e3617`

## 6. Verification if a harness-only source patch is needed

If and only if a maintained harness source patch is made:
- add focused regression proving non-ASCII Korean survives argument/request construction exactly;
- run focused tests;
- run full `npm test`;
- run relevant `node --check`;
- run `git diff --check`;
- no Worker deployment.

Do not alter runtime expectations to make the test pass.

## 7. Terminal classifications

Choose exactly one:

### `LIVE_INPUT_UTF8_FIDELITY_PROVEN`
Use when the ASCII-only Node probe proves exact Korean action fidelity through durable action reservation, and the previous 15-turn architecture/provider conclusion is invalidated as harness-corrupted evidence.

### `BLOCKED_LIVE_INPUT_UTF8_TRANSPORT`
Use when correctly constructed UTF-8 is still corrupted within the API/Worker/RPC/DB transport and the exact earliest failing boundary is preserved.

### `BLOCKED_LIVE_INPUT_UTF8_EVIDENCE_AMBIGUOUS`
Use only when preflight evidence cannot establish the previous corruption or the probe cannot be interpreted without unsafe/repeated writes.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, previous-game read-only byte evidence, probe game/action IDs, exact probe code points/UTF-8 bytes, request method, durable DB readback, corruption boundary classification, repo diff/tests if any, and all mutation/deploy/safety counts;
3. STOP. Do not start full live acceptance, architecture repair, provider change, Production, merge, or Cut3.

## 8. Terminal evidence — `LIVE_INPUT_UTF8_FIDELITY_PROVEN`

- Registration: `4c078c2b973e61627fbc4e22c61ac37f544fdf27`; branch: `company/test-live-input-utf8-fidelity-v1`; accepted main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`; base terminal SHA: `dd8c7ef4741655cedc9ebb8dc3313eea6e441168`.
- Preserved game read-only evidence: `1cb25cc3-7e7e-4dcf-b0f3-b54e1338eb20` remained `committed_turn=15`, `save_revision=17`, with 15 active turns (1–15). Turns 1–15 `game_actions.player_action` and `game_turns.player_action` all began with literal ASCII `?`; selected turn 4 action hex began `3f3f203f...`, turn 6 `3f3f203f...`, turn 8 `3f3f203f...`, and turn 10 `3f3f203f...`. Turn 6 and 8 structured JSON retained non-ASCII content, proving this was not a blanket DB Unicode failure.
- Prior runner evidence inspected: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-live-resume-v1-terminal.md`, `company-v1-deep-level7-v9-run.mjs`, and maintained `scripts/live-playtest-canary.mjs`. The prior request path used JSON POSTs; this task did not modify the canary.
- Probe game: `78bb312e-4d66-4ee6-acde-7c3fe58c4136` (created once via the existing `create_company_game` RPC from canonical TEST seed data; no prior game was reset or changed). Setup: `6eb4101a-a871-4806-8ce2-ee74289eac3d`. Action: `26d0b147-e3ca-4513-bce0-c0af0c108f16`.
- Exact probe string: `UTF8검증: 브랜드전략팀 사무실로 이동한다.`. Code points: `[85,84,70,56,44160,51613,58,32,48652,47004,46300,51204,47029,54016,32,49324,47924,49892,47196,32,51060,46041,54620,45796,46]`. UTF-8 hex: `55544638eab280eca69d3a20ebb88ceb9e9ceb939ceca084eb9eb5ed8c8020ec82acebacb4ec8ba4eba19c20ec9db4eb8f99ed959ceb8ba42e`.
- Request method/path: Node `fetch` with `POST`, `content-type: application/json`, direct `JSON.stringify`, ASCII-only `.mjs` source using `String.fromCodePoint`; Korean was not passed through PowerShell, cmd, env, or CLI arguments. Setup/opening/story/extract/commit returned HTTP 200; the one gameplay action committed.
- Durable readback: `game_actions` row for the action stored the exact string and hex above with `processing_status=committed`; `game_turns` turn 1 stored the exact same string and exact same hex. `game_save` readback was `committed_turn=1`, `save_revision=3`. No retry or second gameplay action was run.
- Boundary classification: previous corruption was runner/harness/shell-side; the UTF-8-safe Node path preserved exact input through HTTP, Worker, reservation RPC, `game_actions`, and committed `game_turns`. No runtime/provider/semantic patch, deploy, migration/DDL, Production access, preserved-game mutation, merge, or Cut3 was performed. Repo source diff is lifecycle evidence only; tests were not applicable because no harness source was changed.
