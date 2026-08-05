# Session handoff — 2026-08-03

## Current repository state

- Repository: `zeroslove-ai/company-v1`
- Local path: `C:\Users\JAEWAN\projects\company-v1`
- Current branch: `hotfix/first-turn-choices-latency`
- Current HEAD: `a5c350a8d0559944b30626adbe0cb33773784b43`
- Working tree was clean immediately before this handoff document was added.
- Draft PR: [#10 — fix: persist choices and accelerate extract](https://github.com/zeroslove-ai/company-v1/pull/10)
- Do not merge the PR automatically.

## Completed in this session

## Session chronology

1. Synced the repository to Phase 5 deployment work and confirmed the Phase 5 branch was based on `7e74ed6c07fd39c05be7ddebc74c3a1743a04b65`.
2. Verified the frontend static-assets-only Worker configuration, ran syntax checks, 55/55 tests, `git diff --check`, and a frontend Wrangler dry-run.
3. Manually deployed the Phase 5 frontend Worker and verified public assets, read-only Context, and the browser-rendered game screen. This work was committed as `2725b625221399e83d41929c1fbfcf3a29f54e66` and opened as Draft PR #9.
4. The subsequent remote `main` baseline was `b20d07a9583111f250458fa2320a70d3d3994605`; the hotfix branch starts from that commit.
5. Investigated the first public turn without changing its database records. Read-only Context evidence showed the turn was committed and both Extract and `game_turns.choices` had four choices, while `game_save.data.last_choices` was empty.
6. Implemented and mock-tested the persistence, Story-choice precedence, Extract latency, and frontend recovery fixes.
7. Ran 58/58 tests, both Wrangler dry-runs, then manually deployed the API and frontend hotfix versions.
8. Re-ran read-only remote Context, public static asset, and browser DOM smoke. No live turn was initiated.
9. Committed the hotfix as `a5c350a8d0559944b30626adbe0cb33773784b43`, pushed `hotfix/first-turn-choices-latency`, and opened Draft PR #10.

### Phase 5 frontend deployment

- Frontend Worker `gamebuilder-company-v1` was manually deployed.
- Public URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
- Public game URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=11111111-1111-4111-8111-111111111111`
- Phase 5 frontend version: `f6522975-f653-4290-9ad1-ba66d86740e8`.
- Public HTML and static asset smoke tests passed.
- Public read-only Context smoke passed.
- Browser-rendered DOM showed the Company v1 title, API-connected state, and game state.
- Direct installed-browser `--dump-dom` output was unavailable in this environment; no artifact was retained.

### First-turn incident and hotfix

The first public action committed successfully, but the browser lost its choices after Context reload because the authoritative save had an empty `last_choices` array despite Extract and the committed turn both containing four choices.

- Development game ID: `11111111-1111-4111-8111-111111111111`
- First committed action ID: `64df8e22-54f5-43fc-ada5-623f6e7a91b0`
- Current committed turn: 1
- Observed first-action duration: approximately 113 seconds

The hotfix implements the following:

- `src/engine/guarded-merge.js`: top-level Extract `choices` is now the authoritative `nextSave.last_choices` snapshot. Empty arrays intentionally clear stale choices; non-four choices add `choices_not_exactly_four` without blocking the turn.
- `src/api/turn-routes.js`: parsed Story choices take precedence over Extract-generated choices whenever Story has valid choices.
- `src/api/llm.js`: Extract requests disable DeepSeek thinking, request JSON object output, cap output at 2048 tokens, and return `extract_truncated` if the response ends for length.
- `src/engine/extract-prompt.js`: Extract is instructed to use Korean human-readable strings, keep the delta and summaries concise, avoid repeating Story text, and leave choices empty when Story choices are available.
- `src/frontend/pages/state.js`: Context reload falls back from `save.last_choices` to the latest committed turn's `choices` and then parsed Story choices.
- `src/frontend/pages/render.js`: Mind monitor falls back from the current result to the latest committed turn.
- `src/frontend/pages/app.js`: parsed Story choices render immediately while Extract and Commit continue; choices remain disabled during the pending operation. Extract and Commit display distinct elapsed-progress messages.

## Current deployments

- API Worker: `game-proxy-company-v1`
  - URL: `https://game-proxy-company-v1.zeroslove.workers.dev`
  - Hotfix version: `e524b347-21c3-481e-afb3-9ba70f649d03`
- Frontend Worker: `gamebuilder-company-v1`
  - URL: `https://gamebuilder-company-v1.zeroslove.workers.dev`
  - Hotfix version: `f6fe2da9-629e-4d68-97b9-b68ad87043b4`

Both deployments were manual Wrangler deployments tagged `first-turn-choices-latency-hotfix`.

## Hotfix file map

| File | Change | Reason |
| --- | --- | --- |
| `src/engine/guarded-merge.js` | Copies normalized `envelope.choices` to `nextSave.last_choices` after state-delta merging. | The save, rather than only the turn row, is the browser's durable source for next choices. |
| `src/api/turn-routes.js` | Replaces Extract choices with valid parsed Story choices when present, before `record_extract_result`. | The user sees Story choices first; later Extract must not invent or remove them. |
| `src/api/llm.js` | Sends Extract with non-thinking JSON parameters and detects `finish_reason: length`. | Reduces Extract latency and makes output-limit failure recoverable rather than silently malformed. |
| `src/engine/extract-prompt.js` | Narrows Extract output instructions. | Avoids redundant Story reproduction and keeps the Extract payload small. |
| `src/frontend/pages/state.js` | Adds ordered Context choice recovery. | Restores choices after reload if the save is empty for a historical turn. |
| `src/frontend/pages/render.js` | Adds ordered Mind monitor recovery. | Preserves the last committed Mind monitor after reload. |
| `src/frontend/pages/app.js` | Renders Story choices during streaming and adds Extract/Commit progress labels. | Gives feedback before Extract completes while preserving the busy guard. |
| `test/phase-2-engine.test.mjs` | Tests authoritative choice persistence, non-four warning, and intentional empty replacement. | Locks down the root-cause fix. |
| `test/phase-2-api.test.mjs` | Tests Story-choice precedence, Extract request shape, and truncation handling. | Locks down API behavior without a live model call. |
| `test/frontend-state.test.mjs` | Tests latest-turn choice and Mind monitor fallbacks. | Locks down reload recovery. |
| `docs/FIRST_TURN_HOTFIX.md` | Incident and deployment record. | Companion reference for PR review and future incident work. |

## Runtime behavior after the hotfix

### Turn sequence

```text
Context load
→ user starts an action
→ Story SSE streams
→ parsed Story choices render immediately, disabled
→ Extract runs once with thinking disabled
→ valid Story choices overwrite Extract choices when present
→ guarded merge writes those choices to nextSave.last_choices
→ guarded Commit persists save and game_turn
→ Context reload renders committed choices and Mind monitor
→ choice controls are enabled for the next user action
```

The existing busy guard still blocks a second action while Story, Extract, or Commit is in progress. The frontend timer is display-only: it does not introduce a timeout, retry, or extra API call. Its interval is cleared in the operation `finally` block.

### Choice and Mind monitor fallback order

Choices use this order:

1. Non-empty `save.last_choices`.
2. `context.recent_turns.at(-1).choices`.
3. `context.recent_turns.at(-1).parsed_blocks.choices`.
4. Empty array.

Mind monitor uses this order:

1. Current Extract result's non-empty `mind_monitor`.
2. `context.recent_turns.at(-1).mind_monitor`.
3. Empty object.

`recent_turns` is already ordered from oldest to newest for the frontend; therefore the final array item is the newest committed turn.

### Extract request contract

Only Extract changed. Story remains streaming and uses its prior model configuration. The Extract request includes:

```json
{
  "stream": false,
  "thinking": { "type": "disabled" },
  "response_format": { "type": "json_object" },
  "max_tokens": 2048
}
```

There is no fallback model, retry model, repair call, or arbitrary temperature override. If the upstream choice has `finish_reason: "length"`, the API returns a retryable `extract_truncated` error.

## Validation completed

- `npm.cmd test`: 58/58 passed.
- `git diff --check`: passed before the hotfix commit.
- API Wrangler dry-run: passed.
- Frontend Wrangler dry-run: passed.
- Read-only API `/health`, `/api/version`, and `/api/context` smoke passed.
- Context verified turn 1, four authoritative save choices, four newest committed-turn choices, and a present newest Mind monitor.
- Public frontend asset smoke passed.
- Public browser DOM showed Turn 1, four choice buttons, Mind monitor, and API-connected status.

The remote smoke scope was deliberately read-only:

- Allowed: `GET /health`, `GET /api/version`, `POST /api/context`, public frontend HTML, static JavaScript/CSS, and browser DOM inspection.
- Not performed: `/api/story`, `/api/extract`, `/api/commit`, feedback, reset, direct Supabase access, model calls, database writes, or migration work.

## Safety and operating boundaries

- No automatic Story, Extract, or Commit request was made during either deployment or smoke validation.
- No DeepSeek live model call was made in this session.
- No additional Supabase write, reset, feedback action, migration, or schema change was made.
- Do not modify the existing first-turn Story, Extract, or Commit records.
- Keep secrets outside the repository; do not print or commit secret values.
- Do not force-push, reset, rebase, or merge PR #10 automatically.
- Do not modify the retired Dify project.

## Recommended next step

Have the user run and validate **Turn 2** in the public browser. Confirm that Story choices appear as soon as Story parsing completes, stay disabled until Commit finishes, and remain present after the Context reload. If Turn 2 exposes a new issue, collect only the minimum read-only Context/action status evidence before changing code.

## Resume checklist

Before any further work:

```powershell
$Repo = 'C:\Users\JAEWAN\projects\company-v1'

git -C $Repo fetch origin
git -C $Repo status --short
git -C $Repo branch --show-current
git -C $Repo rev-parse HEAD
gh pr view 10 --repo zeroslove-ai/company-v1 --json number,url,isDraft,headRefOid
```

Expected local branch before PR #10 is merged:

```text
branch: hotfix/first-turn-choices-latency
HEAD: a5c350a8d0559944b30626adbe0cb33773784b43
PR: #10, Draft
```

If PR #10 is merged, switch to `main`, fast-forward only, and begin any follow-up work from the resulting `main` SHA. Do not start a follow-up from an older Phase 5 or Phase 4 branch.
