# Company — CURRENT TASK

Status: READY
Task ID: company-r3-tts-end-to-end-live-acceptance-v3
Mode: SOURCE-FROZEN STRICT-PROJECTION-AWARE TTS END-TO-END LIVE ACCEPTANCE
Updated: 2026-08-24 07:59 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388935415`
Operator review: Issue #68 comment `5388953161`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Frozen accepted baseline

Accepted executable/source:
- `5709c4a894430b74cf5a985da57747c1cafcfd15`

Reviewed terminal main before this registration:
- `891fb31c31b74e28a31cfb21fe051e2cac6f55ec`
- source -> reviewed main is exactly one docs-only `docs/ops/CURRENT_TASK.md` commit.

Accepted source delta:
- `runtime-r3/server/provider.js`: Observer `max_tokens` exactly `1600 -> 2400`;
- `test/r3-observer-failure-provenance.test.mjs`: bounded request-budget invariant only.

Accepted validation:
- focused R3/media/frontend/turn tests: `39/39 PASS`;
- full `npm.cmd test`: `547/547 PASS`;
- changed JS/MJS `node --check`: PASS;
- `git diff --check`: PASS;
- `wrangler.r3.api.jsonc` dry-run: PASS.

Accepted TEST deployment state:
- R3 API `game-proxy-company-r3@bee01bf9-b79f-433e-9cfb-6fc09a2379cc`;
- R3 frontend `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- legacy Company worker `game-proxy-company-v1@7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`.

Freeze as accepted:
- Observer output budget `2400` and existing 75s timeout;
- Observer fail-open and sanitized error/finish provenance;
- dialogue completeness and quote-escape parity;
- strict raw->applied dialogue normalizer;
- server exact committed-dialogue TTS authorization;
- canonical heroine voice mappings and server `TTS_WORKER` binding;
- frontend `buildR3ViewModel -> selectPrimaryTtsLines -> batchDialogueLines -> api.tts` contract;
- image/media grounding;
- Story agency, canonical identity, navigation, time, choices;
- CSA chronology/UI;
- turn terminalization, current-scene timeline, History and reset;
- DB schema/RPC/migrations;
- deployment hygiene.

Preserve READ ONLY all prior fixtures, especially:
- `6f7e4d23-b413-45f0-9b7a-f57e01f1bc78` — proven 1600-token truncation failure;
- `bb6a318a-ccd4-4158-a691-64d9ffdbd72c` — 2400 repair fresh projection evidence;
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`.

Never reset/revise/retry/regenerate/mutate preserved fixtures.

## 1. Operator reclassification that controls this task

Terminal `5388935415` incorrectly stopped as `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

Independent READ ONLY verification of fresh game `bb6a318a-ccd4-4158-a691-64d9ffdbd72c`, Turn 1 proves:
- Story contained direct registered/present `heroine3` / 김제나 speech;
- Observer completed successfully at the new 2400-token budget; no `observer_failed`, no `r3_observer_json_invalid`, no `r3_observer_finish_length`;
- `observer_raw.dialogue_lines` had three heroine3 candidates;
- `observer_applied.dialogue_lines` correctly retained one exact line;
- raw lines 1 and 3 were correctly dropped because their own `evidence_quote` spans contained only pronoun attribution (`그녀`) plus spoken text and did NOT contain canonical actor name `김제나`;
- raw line 2 was correctly retained because its own exact contiguous evidence span contained both canonical actor name `김제나` and the exact spoken text.

Therefore:
- `dialogue_projection_dropped` warning presence alone is NOT a product failure;
- invalid raw siblings may be warning-dropped while a valid applied sibling qualifies the turn for TTS;
- do NOT weaken the normalizer, infer pronoun speakers, expand evidence fuzzily, parse raw Story in frontend, or patch TTS because of those correct drops.

Accepted source is now `5709c4a...` and accepted TEST API is `bee01bf9...`.

## 2. Purpose

Close the remaining media/TTS owner-ready gate without any source or deployment change:

`valid committed registered-heroine dialogue -> R3 view model -> visible TTS ON -> exact R3 /media/tts -> server committed-dialogue authorization -> TTS_WORKER -> audio URL/cache -> Replay cache -> next-turn TTS-OFF stale fencing`.

This is acceptance only. Do not patch source. Do not start holistic V5 inside this task.

## 3. Preflight — source and deployment must remain frozen

Before gameplay prove:
1. current `main` is a docs-only descendant of accepted source `5709c4a894430b74cf5a985da57747c1cafcfd15`;
2. no product source/config/test/content/migration drift exists after that source;
3. R3 API active version is exactly `bee01bf9-b79f-433e-9cfb-6fc09a2379cc`;
4. R3 frontend active version is exactly `71416b75-9cca-45ee-9b32-7cf209f16395`;
5. legacy worker remains exactly `7ea46aaf-493f-4323-bc1f-f5ab8d47477d`;
6. deploy/rollback count for API/frontend/legacy in this task must remain ZERO;
7. full `npm.cmd test` = `547/547 PASS`;
8. `git diff --check` PASS.

If any deployed artifact drifts, stop `BLOCKED_DEPLOYMENT_DRIFT`. Do not redeploy inside this task.

## 4. Hard prohibitions

Do NOT:
- edit source/tests/content/config/migration/script;
- deploy or rollback any Worker;
- change Observer/Story prompts, models, provider options, max_tokens, timeout, temperature, thinking, response_format;
- add retry/regeneration/second Observer;
- add JSON repair/parser/fallback/fuzzy matching;
- loosen dialogue grounding or infer pronoun speaker identity;
- change normalizer/media/TTS/frontend behavior;
- change DB schema/RPC/migration/RLS/grants;
- touch Production;
- mutate preserved fixtures;
- use `?api=` override, localStorage preseed, DOM mutation, hidden-state injection, synthetic/direct JS submit, direct gameplay/media/provider/TTS API calls;
- repeat the same semantic action to manufacture favorable evidence.

Visible bare-public browser interaction plus READ ONLY context/DB/network verification is allowed.

## 5. Fresh game and bounded projection qualification

Create ONE NEW disposable TEST game through visible bare-public Setup and Opening.

TTS must be visibly OFF before ordinary-turn projection search. If persisted ON, visibly toggle it OFF first. Do not edit storage.

Use up to THREE distinct natural ordinary turns, each visibly submitted exactly once, to obtain at least one valid committed registered-heroine dialogue line. Prefer a natural direct interaction with a canonical heroine, but do not manufacture NPC compliance.

For every attempted turn record:
- exact visible literal action;
- exactly one `/turn` POST, `attempt_no=1`, one durable commit;
- Story text/direct heroine speech if any;
- committed `present_actor_ids`;
- `observer_raw.dialogue_lines` with each raw item's `speaker_id`, `text`, `evidence_quote`;
- `observer_applied.dialogue_lines`;
- warnings/provenance;
- canonical voice mapping for retained heroine lines.

Stop immediately on primary Observer fail-open and classify from existing provenance. In particular:
- `r3_observer_finish_length` at 2400 => `FAILED_PRODUCT_OBSERVER_OUTPUT_BUDGET_2400`;
- other Observer failure => report exact existing sanitized class and stop without retry.

If Story has a clearly qualifying registered/present heroine direct line that the Observer omits from raw, stop `FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION` only when the Story attribution itself is unambiguous under the existing contract.

## 6. Correct strict raw->applied normalization classification

Do NOT treat `dialogue_projection_dropped` by itself as failure.

For EACH dropped raw dialogue item, first evaluate the frozen strict grounding predicate independently. A raw item is VALID only if ALL are true:
1. `speaker_id` is a registered heroine ID;
2. that heroine is present in the committed post-Story scene;
3. `text` is non-empty and occurs exactly/verbatim in the Story;
4. `evidence_quote` is an exact contiguous Story substring, with only the already-accepted escaped-quote representation parity;
5. that SAME `evidence_quote` contains the heroine's exact canonical actor name;
6. that SAME `evidence_quote` contains the exact `text`;
7. no player/narrator/thought/remote/ambiguous attribution is being substituted.

Only if a raw item satisfies ALL seven predicates and is still absent from `observer_applied.dialogue_lines` may the task stop `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`.

Examples that are NOT product failures:
- evidence quote says only `그녀` and never contains canonical name;
- exact text is present but canonical actor name is outside that evidence span;
- anonymous/proximity attribution;
- invalid raw sibling drops while another valid applied sibling survives.

A TTS-qualifying turn needs only at least ONE valid applied registered/present heroine line with canonical voice mapping and no primary Observer failure. Do not require all raw lines to survive.

If no qualifying applied heroine line is observed after three distinct turns and no proven product defect occurred, stop `BLOCKED_TTS_PRECONDITION_NOT_OBSERVED`.

## 7. Compute exact expected frontend TTS batches

Once a qualifying current committed turn exists, derive expected batches from the frozen frontend contract, not DOM guesses:
1. source lines = current `observer_applied.dialogue_lines`;
2. filter to non-empty lines whose `speaker_id` is in current committed `present_actor_ids`;
3. sort by numeric `order`;
4. focal actor = current committed `observer_applied.focal_actor.actor_id` when present/valid, otherwise existing scene focal fallback exactly as `buildR3ViewModel()` does;
5. apply frozen `selectPrimaryTtsLines()` focal-first, otherwise highest accepted-line count with existing insertion/tie behavior;
6. keep only primary speaker lines;
7. apply frozen `batchDialogueLines()` same-speaker + same-tone + combined text <=350 char merge behavior.

Record exact expected `{speaker_id,text,direction/tone}` batch list before enabling TTS.

Do NOT require `.narrative-dialogue`, `data-speaker-id`, or any invented dialogue-card DOM selector. Current R3 consumes committed dialogue through the view model directly.

## 8. TTS OFF baseline

With qualifying turn current and TTS visibly OFF:
- browser `/media/tts` request count since that turn committed = 0;
- no browser-direct external TTS provider/worker request;
- no browser `speechSynthesis`;
- no stale prior-game audio may be claimed as current synthesis.

## 9. Visible TTS ON end-to-end

After projection and exact expected batches are proven:
1. click visible TTS toggle ON exactly once;
2. capture browser Network evidence;
3. every generated R3 `/media/tts` request must correspond exactly to an expected current-turn batch;
4. no request may use raw Story fallback, dropped raw lines, absent actor, narrator/player text, Mind Monitor, or unprojected text;
5. server committed-dialogue authorization must accept each exact expected batch;
6. server route must use existing `TTS_WORKER` binding; browser must not call external provider/worker directly;
7. each uncached required batch must return a valid audio URL;
8. returned URL must enter the existing audio/cache path.

Request count is the number of uncached batches produced by the frozen batching contract; do not arbitrarily require exactly one when multiple valid batches exist.

Failure classification:
- qualifying applied projection + visible ON + zero R3 requests => `FAILED_PRODUCT_TTS_ENQUEUE`;
- request identity differs from expected applied batch => `FAILED_PRODUCT_TTS_BATCH_IDENTITY`;
- exact expected committed batch rejected as `dialogue_not_committed` => `FAILED_PRODUCT_TTS_AUTHORIZATION`;
- authorized R3 request reaches service path but binding/upstream fails => `FAILED_PRODUCT_TTS_SERVICE` with bounded status/error;
- valid URL exists and only audible autoplay is blocked => `BROWSER_AUTOPLAY_LIMITATION`, not authorization failure.

Stop on first decisive failure. Do not repair source in this task.

## 10. Replay cache

After at least one successful current-turn audio URL is cached:
- record `/media/tts` synthesis count immediately before Replay;
- click visible Replay exactly once;
- Replay synthesis delta must be 0;
- replay must remain the same current committed heroine batch;
- no browser `speechSynthesis`.

If identical cached Replay causes a new synthesis request, stop `FAILED_PRODUCT_TTS_REPLAY_CACHE`.

## 11. Next-turn stale fencing

After successful Replay:
1. visibly switch TTS OFF;
2. submit ONE distinct natural ordinary action through public UI exactly once;
3. require one durable next-turn commit and no duplicate `/turn`;
4. if Observer fails, record exact provenance and stop without retry;
5. current Story/context must advance to the new turn;
6. while TTS OFF, zero new `/media/tts` requests;
7. no late prior-turn audio/TTS async result may overwrite/relabel the new current turn.

If stale prior-turn media state becomes current, stop `FAILED_PRODUCT_TTS_STALE_FENCE`.

## 12. GREEN exit

GREEN disposition:
`TTS_END_TO_END_GREEN`.

Requires in one fresh disposable game:
- no Observer 2400 truncation/fail-open on qualifying turn;
- at least one valid applied registered/present heroine dialogue line with voice mapping;
- strict-drop siblings classified correctly and not treated as failures unless they independently satisfy the full grounding predicate;
- exact expected frontend primary/batch list derived from frozen source contract;
- TTS OFF = 0 requests;
- visible TTS ON emits only exact expected R3 batch request(s);
- server authorization succeeds;
- server-side TTS binding returns valid audio URL(s);
- no direct browser provider/worker call and no speechSynthesis;
- Replay adds zero synthesis requests;
- subsequent distinct turn commits once;
- next-turn TTS OFF = 0 new requests;
- no stale prior-turn overwrite;
- source/deploy/provider/model/prompt/token/timeout/DB/Production all unchanged;
- full tests remain `547/547 PASS`.

If GREEN, stop `WAITING_REVIEW`. Do NOT start holistic V5 and do NOT claim owner-ready. The operator will register holistic V5 separately.

## 13. Completion report

Post a NEW Issue #68 terminal comment recording:
- start/final main and final CURRENT_TASK blob;
- accepted source and exact active API/frontend/legacy versions;
- deployment counts all zero;
- full test count and diff check;
- fresh game id;
- each projection-search turn/action/durable outcome;
- raw dialogue items and per-item strict grounding validity decision;
- applied dialogue lines/warnings/provenance;
- qualifying heroine id/name/voice mapping;
- exact expected primary speaker and batch list;
- TTS OFF request count;
- TTS ON R3 request count/identity/status;
- server authorization/TTS_WORKER/audio URL evidence;
- proof of no browser-direct provider call/speechSynthesis;
- Replay synthesis delta;
- next-turn commit/TTS-OFF/stale-fence result;
- any autoplay-only limitation separately;
- preserved fixtures untouched;
- zero source/deploy/provider/model/prompt/token/timeout/DB/migration/Production changes;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal, and stop.

Do not create the next task yourself. Do not start holistic V5. Do not claim owner-ready.
