# Company R4 progress

- Updated: 2026-10-15 KST
- Branch: `rebuild/company-core-r4-20261015`
- Worktree: `C:\Users\JAEWAN\Documents\Codex\2026-10-15\company-r4-rebuild-worktree`
- Implementation HEAD: `fc13366aa70c974683e028d776a392b02c6f540e` (report/status closure commit follows)
- Status: PARTIAL_BLOCKED

## Product direction and source wiring

- Re-read `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md` (P-IDENTITY/P-PREMISE/P-STORY/P-CHARACTER/P-OPENING/P-MEMORY), `LIVE_ACCEPTANCE_MATRIX.md`, `MEDIA_CATALOG_CONTRACT.md`, and original character/map/organization/position/media records.
- Product remains the source adult, character-first interactive fiction `상식개변: 회사편`, including the player-private unfamiliar app premise. Cafeteria/notices/on-call examples are technical fixtures only. Canon/source records remain unchanged.
- Existing local game `4dc4ba9c-afe3-4618-8635-ac86313cde3e` has two persisted `scripted-preview` turns. Turn 1 leaked internal label “생활형 리더”; turn 2 was generic office prose. Both are retained as historical fixture output, never actual-model or product acceptance evidence. The UI now labels a scripted turn “구조 검증용 스크립트 결과”.
- Before the provider correction, missing model configuration selected `scripted-preview`; live mode now fails closed as `company-unconfigured`. Scripted mode is opt-in only (`R4_PROVIDER=scripted`) and visibly marked as not a model.
- Current path is `content/characters.json` and `content/map.json` → `runtime-r4/domain/content.js` loader → `runtime-r4/domain/context.js` scene/persona projection → `runtime-r4/adapters/provider.js` Story request serialization. One opening heroine's full dramatization card (speech/addressing, personality, private/stress/continuity traits) and the private-app world premise enter the Story `context`; compact cast/map directories supply source names without impersonating all five as present. The five women are not forced into every scene.
- Scene image metadata is sent in the separate Observer context (`available_media`) only. Observer prompt requires an exact Story quote, present registered heroine, active matching catalog entry, and situation fit; normalized `mediaHint` is non-authoritative. UI chooses the committed scene hint or a suitable present-speaker/sole-heroine portrait, with a stable unavailable-asset fallback. This branch has no actual Story request payload capture because no approved model provider is configured.
- Existing reading surface has Story/full choices/compact buttons/free input, company map, present cast/source directory, Mind Monitor, source-media panel, voice controls/audio player, History, feedback, retry, and local-save state. Default browser fresh URL creates a new local game at `http://127.0.0.1:4174/?fresh=1`.

## Preservation, voice, and image work

- Original `content/media_catalog.json` (102 stable references: 5 general portraits and 97 scene/adult-pool refs) and five heroine `voice_id` mappings are loaded without editing canonical source files.
- Setup choices now use the source catalogs: six player departments from `organization.departments` and four ranks from `positions.json` (`인턴/대리/TF팀장/임원`). A browser review caught and fixed the earlier R4 drift that had offered general-NPC departments and inferred character job titles as player ranks.
- Only catalog metadata/stable locators are committed. There are no local original image/audio binaries. `R4_PUBLIC_STORAGE_URL` and `R4_TTS_API_URL` are absent, so no original image pixels or generated voice audio were delivered in this execution.
- Reader media resolves optional `storage://bucket/path` references through `R4_PUBLIC_STORAGE_URL`; it never marks a missing asset as loaded. GIF stop/replay and static poster fallback were exercised on a separate, explicit scripted fixture game and DB; this is presentation-structure evidence only.
- TTS is disabled by default and requires existing voice mappings, a configured synthesis service, and a dialogue line saved by the completed Observer for the present heroine. Requests send exact saved Story evidence/text/direction; the server validates it against the latest committed observer projection before accessing the server-side voice ID. UI/validation tests do not demonstrate audio synthesis or playback.

## Implementation and verification evidence

- Independent `runtime-r4` command/context/observation/reducer/turn-pipeline/provider/PGlite store remains in place for Story → Observer → atomic Commit; feedback, original-command retry, recovered checkpoint, memory retrieval, paginated history, live-call accounting, and media fallback remain branch-local.
- Full automated suite: 608/608 passed before the final Setup catalog correction (structural/regression coverage; includes a scripted 40-turn fixture and synthetic 1,005-turn storage test, neither is real-model narrative evidence). The 11-test R4 core file passed; after the Setup correction its source-projection test passed again. JS syntax checks and `git diff --check` pass.
- Actual local DB survives a Node server process restart: existing game `4dc…` was read back with its same committed turn 2 and `scripted-preview` provenance. Health shows disk-backed PGlite, model mode `company-unconfigured`, actual model calls `0`, budget remaining `120`.
- Earlier browser inspection at desktop 1280×900 and mobile 390×844 showed no horizontal overflow and no console errors. A separate scripted fixture browser confirmed Setup → Opening → one turn → DB commit → refresh. The fixture page was stopped; the primary local server is running on port 4174.
- The current browser is on a separate fresh setup game `http://127.0.0.1:4174/?gameId=3d0ecd06-f392-4fa1-9040-46baf3b4d2d2`, with Setup dialog and canonical six/four department/rank options. This has not produced a Story because the approved model provider is unavailable.

## Commands, database, budget

- Start local UI/runtime: `npm run r4:dev`
- Fresh game URL: `http://127.0.0.1:4174/?fresh=1`
- New local data: `var/r4-local-postgres/` (persistent PGlite directory; all `var/r4-*/` paths are gitignored).
- Story + Observer calls: `0 / 120`, remaining `120`; no external model calls made.
- Scripted fixture GIF/poster has no copied or modified original content; its separate data directory is local and gitignored.

## Next

- Final report is drafted at `docs/rebuild-r4/FINAL_REPORT.md`; implementation is committed at the HEAD listed above.
- Commit the final status/report documents, regular-push without rewrite/force, then create and attach a draft PR. Do not merge or deploy.

## Blockers / unverified

- No approved `LLM_API_URL`, `LLM_API_KEY`, `STORY_MODEL`, or `EXTRACT_MODEL` is present. Thus no actual Story payload delivery, representative live character scene, actual-model 40-turn memory campaign, or actual-model 8–12-turn boundary campaign has run.
- No original image bytes/public storage URL or TTS synthesis service is present. Scene-specific selection code and voice projection are wired, but actual image visibility, adult-pool selection acceptance, and voice sound are unverified.
- Full existing browser product acceptance (including actual free input/choice/History/feedback/TTS/media path in a real-provider game) remains incomplete. Do not claim `LOCAL_CANDIDATE_READY` until required evidence exists; present assessment is expected to be `PARTIAL_BLOCKED` if no configuration becomes available.
