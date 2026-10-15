# Company R4 progress

- Updated: 2026-10-15 KST
- Branch: `rebuild/company-core-r4-20261015`
- Worktree: `C:\Users\JAEWAN\Documents\Codex\2026-10-15\company-r4-rebuild-worktree`
- Implementation checkpoint HEAD: `d3632cb4630618c53f7f07efcf8a05f13745e182` (`docs: mark R4 candidate checkpoint pushed`)
- Previous closeout checkpoint: `22e7391` (`docs: record R4 rule core validation and blockers`)
- Status: `PARTIAL_BLOCKED` (branch push completed; draft PR #105 remains open)

## Product direction and source wiring

- Rechecked `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, source `characters.json`, `map.json`, `organization.json`, `positions.json`, `media_catalog.json`, and `csa_catalog.json`. Canonical content files remain unchanged.
- Product is the original character-first `상식개변: 회사편`, including the player's private unfamiliar app premise. Office notices/lunch/assignments are test examples only. The saved game `4dc4ba9c-afe3-4618-8635-ac86313cde3e` contains two `scripted-preview` turns: one exposed an internal label in place of dramatized prose; the next flattened to generic office prose. Those results are preserved and are not actual-model evidence.
- R4 source path remains `content/characters.json` + `content/map.json` → `runtime-r4/domain/content.js` → `runtime-r4/domain/context.js` → `runtime-r4/adapters/provider.js` request JSON. Source-backed dramatization cards and the app/world premise are built into Story context; the actual HTTP Story/Observer request was not sent because no approved provider settings are present.
- Rule mechanics now stage a server-owned prospective rule snapshot and event before Story, include current and historical rule records plus affected source-character cards in context, and apply rules only after reducer success. Observer data cannot write active rules. Story failure leaves rules and turn uncommitted; retry retains the original structured command. Feedback reruns the rule turn with its original command. PGlite stores current rules, a bounded recent event projection and durable per-turn rule events.
- The source CSA catalog has 21 entries; all are sexual or intimate. There is no permitted non-explicit canonical example for live product validation. No substitute product catalog was added, none of those rule texts was sent to a model, and `POST /commands` rejects `RULE_CHANGE` with `r4_non_explicit_canonical_rule_unavailable` (HTTP 503). Thus the core mechanics are structural plumbing only; no product NPC reaction has passed.

## UI, source images, and voice

- Existing reader UI remains on the branch: Story and choices, free input, map, present cast, Mind Monitor, scene media, voice/TTS controls, History, feedback, retry, and local save state. No frontend files changed in this checkpoint.
- `/api/content` on the updated local server reports all five source heroines, 102 image catalog references, and five voice mappings. General portraits resolve in the source catalog to `Image/Heroine1/one_main.jpg`, `Heroine2/minami_main.jpg`, `Heroine3/jena_main.jpg`, `Heroine4/live_main.jpg`, and `Heroine5/may_main.jpg`. Those bytes are not in any local Git ref. The configured Supabase project `company-v1` (`fmcrspgxstsmxxsmkeee`) reports `INACTIVE`; the public Storage hostname did not resolve and a read-only Storage query timed out. No project state, database, or objects were changed. An older `py-all` handoff describes lower-case `heroine1/` paths; the current Company source catalog is the authority and those old paths were not mixed in.
- Corrected the earlier conclusion that there was no TTS service. `wrangler.api.jsonc`/`wrangler.r3.api.jsonc` point to `https://fancy-dust-7f8c.zeroslove.workers.dev/` and bind `TTS_WORKER` to `fancy-dust-7f8c`. Cloudflare read-only metadata reports the Worker at 100% on its latest deployment, secret names for Fish Audio and R2 are configured (values were not read), and R2 bucket `tts` contains 2,804 objects totaling 426 MB. Public `r2.dev` access is enabled; no custom domain is attached. The R4 TTS route already accepts the same `{ voice_id, text, direction }` request and `{ url }` response, but the current R4 process has no `R4_TTS_API_URL`, so its UI controls stay disabled. GitHub's `zeroslove-ai/py-all` TTS Worker source confirms Fish Audio MP3 synthesis and R2 storage. The object keys were not enumerated, and no existing audio was fetched or played; object count is evidence of a populated TTS bucket, not a content-by-content audio audit.
- GitHub search also found a historical Dify workflow YAML containing a plaintext Fish API credential. Its value was not repeated or used. Treat that credential as exposed and revoke it; no key or Cloudflare secret was changed. Historical handoff notes mention a time-limited free model period, so current synthesis cost/availability remains unverified and no synthesis request was sent.
- The five original voice mappings are present in `content/characters.json`. R4's image `media_available` and live voice playback are still unverified: images are unavailable while the source Supabase project is inactive, and live synthesis was not called. Prior browser evidence remains: 1280×900 desktop and 390×844 mobile had no horizontal overflow or console errors; a separate fixture verified Setup→Opening→one turn→local DB→reload and GIF pause/replay/poster fallback. Those checks were structural/UI evidence, not real-model or asset-service acceptance.

## Verification at this checkpoint

- `node --test test/r4-core.test.mjs`: 12/12 passed.
- `npm test`: 609/609 passed; `git diff --check` passed. The added rule fixture uses a synthetic, test-only descriptor and provider. It exercised Story failure without partial state, exact structured-command retry, feedback revision, rule-history retrieval beyond the recent-turn window, APPLY → ordinary turn → CHANGE → REMOVE, an Observer state-mutation attempt, source cards for two selected canon characters, PGlite restart restoration, and inactive-rule absence. It is only pipeline/storage structure; its generated text is not character/narrative acceptance.
- Updated server on port 4177: `/api/health` says provider `company-unconfigured`, live configured `false`, model calls `0`, remaining budget `120`, `mediaAvailable=false`, source voice mappings `5`, source image references `102`. Read-only service investigation commands: `wrangler whoami`; `wrangler deployments status --name fancy-dust-7f8c --json`; `wrangler secret list --name fancy-dust-7f8c`; `wrangler r2 bucket info tts`; Supabase project metadata read via the connected Supabase app. No model or TTS generation call was made.
- Production RULE_CHANGE endpoint returns HTTP 503 because there is no permitted canonical non-explicit rule to use. No model was called. The pre-existing `4dc…` game was read only; no preserved game was edited.

## Commands, URL, DB, and budget

- Standard start: `npm run r4:dev`
- Current updated candidate: PowerShell `$env:PORT='4177'; $env:R4_DB_PATH='var/r4-rule-check-db'; npm run r4:dev`
- Fresh local game: `http://127.0.0.1:4177/?gameId=328140e6-9432-42bf-9b04-cb1e02734350` (Setup only; no Story generated)
- Current disposable DB: `var/r4-rule-check-db/`; test DBs are temporary. Existing local game DB was read only.
- Story + Observer use: `0 / 120`; remaining `120`. No API calls were made.

## Next / final state

- Focused review, 609-test regression run, final report, and branch push are complete. PR #105 is updated and remains draft. Do not merge or deploy.
- Blocking evidence: no approved model configuration; no permitted non-explicit canonical rule example; original image storage is in the inactive Supabase project and cannot be fetched; TTS Worker exists but the R4 process is not configured to call it, and current provider cost/availability has not been confirmed. Continue no-go on product rule Story until the canonical source and authorized validation case allow it. Do not describe the prior fixture runs as live product or model acceptance.
