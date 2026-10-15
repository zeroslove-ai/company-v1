# Company R4 progress

- Updated: 2026-10-15 KST
- Branch: `rebuild/company-core-r4-20261015`
- Worktree: `C:\Users\JAEWAN\Documents\Codex\2026-10-15\company-r4-rebuild-worktree`
- Implementation checkpoint HEAD: `e6d51a1` (`feat: add R4 prospective rule lifecycle core`)
- Closeout checkpoint pushed: `22e7391` (`docs: record R4 rule core validation and blockers`)
- Status: `PARTIAL_BLOCKED` (branch push completed; draft PR #105 remains open)

## Product direction and source wiring

- Rechecked `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, source `characters.json`, `map.json`, `organization.json`, `positions.json`, `media_catalog.json`, and `csa_catalog.json`. Canonical content files remain unchanged.
- Product is the original character-first `상식개변: 회사편`, including the player's private unfamiliar app premise. Office notices/lunch/assignments are test examples only. The saved game `4dc4ba9c-afe3-4618-8635-ac86313cde3e` contains two `scripted-preview` turns: one exposed an internal label in place of dramatized prose; the next flattened to generic office prose. Those results are preserved and are not actual-model evidence.
- R4 source path remains `content/characters.json` + `content/map.json` → `runtime-r4/domain/content.js` → `runtime-r4/domain/context.js` → `runtime-r4/adapters/provider.js` request JSON. Source-backed dramatization cards and the app/world premise are built into Story context; the actual HTTP Story/Observer request was not sent because no approved provider settings are present.
- Rule mechanics now stage a server-owned prospective rule snapshot and event before Story, include current and historical rule records plus affected source-character cards in context, and apply rules only after reducer success. Observer data cannot write active rules. Story failure leaves rules and turn uncommitted; retry retains the original structured command. Feedback reruns the rule turn with its original command. PGlite stores current rules, a bounded recent event projection and durable per-turn rule events.
- The source CSA catalog has 21 entries; all are sexual or intimate. There is no permitted non-explicit canonical example for live product validation. No substitute product catalog was added, none of those rule texts was sent to a model, and `POST /commands` rejects `RULE_CHANGE` with `r4_non_explicit_canonical_rule_unavailable` (HTTP 503). Thus the core mechanics are structural plumbing only; no product NPC reaction has passed.

## UI, source images, and voice

- Existing reader UI remains on the branch: Story and choices, free input, map, present cast, Mind Monitor, scene media, voice/TTS controls, History, feedback, retry, and local save state. No frontend files changed in this checkpoint.
- `/api/content` on the updated local server reports all five source heroines, 102 original image references, and five voice mappings. `media_available=false`; there are no local original image/audio bytes and neither `R4_PUBLIC_STORAGE_URL` nor `R4_TTS_API_URL` is configured. Actual scene art and synthesized voice remain unverified/unavailable.
- Prior browser evidence remains: 1280×900 desktop and 390×844 mobile had no horizontal overflow or console errors; a separate fixture verified Setup→Opening→one turn→local DB→reload and GIF pause/replay/poster fallback. These checks were performed before this no-frontend-change checkpoint and are structural/UI evidence, not real-model acceptance.

## Verification at this checkpoint

- `node --test test/r4-core.test.mjs`: 12/12 passed.
- `npm test`: 609/609 passed; `git diff --check` passed. The added rule fixture uses a synthetic, test-only descriptor and provider. It exercised Story failure without partial state, exact structured-command retry, feedback revision, rule-history retrieval beyond the recent-turn window, APPLY → ordinary turn → CHANGE → REMOVE, an Observer state-mutation attempt, source cards for two selected canon characters, PGlite restart restoration, and inactive-rule absence. It is only pipeline/storage structure; its generated text is not character/narrative acceptance.
- Updated server on port 4177: `/api/health` says provider `company-unconfigured`, live configured `false`, model calls `0`, remaining budget `120`, `mediaAvailable=false`, source voice mappings `5`, source image references `102`.
- Production RULE_CHANGE endpoint returns HTTP 503 because there is no permitted canonical non-explicit rule to use. No model was called. The pre-existing `4dc…` game was read only; no preserved game was edited.

## Commands, URL, DB, and budget

- Standard start: `npm run r4:dev`
- Current updated candidate: PowerShell `$env:PORT='4177'; $env:R4_DB_PATH='var/r4-rule-check-db'; npm run r4:dev`
- Fresh local game: `http://127.0.0.1:4177/?gameId=328140e6-9432-42bf-9b04-cb1e02734350` (Setup only; no Story generated)
- Current disposable DB: `var/r4-rule-check-db/`; test DBs are temporary. Existing local game DB was read only.
- Story + Observer use: `0 / 120`; remaining `120`. No API calls were made.

## Next / final state

- Focused review, 609-test regression run, final report, and branch push are complete. PR #105 is updated and remains draft. Do not merge or deploy.
- Blocking evidence: no approved model configuration; no permitted non-explicit canonical rule example; no original image storage endpoint or TTS service. Continue no-go on product rule Story until the canonical source and authorized validation case allow it.
