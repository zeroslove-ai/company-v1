# Company — CURRENT TASK

Status: READY
Task ID: company-r3-observer-dialogue-quote-escape-parity-v1
Mode: FREEZE ACCEPTED R3 -> REPRODUCE VALID DIALOGUE PROJECTION DROP -> FIX QUOTE-ESCAPE PARITY ONLY -> API TEST DEPLOY -> BARE-PUBLIC PROJECTION+TTS ACCEPTANCE
Updated: 2026-08-24 05:40 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388331463`
Operator review: Issue #68 comment `5388366958`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source before this repair:
- `dc91e06897d17f3759773023abdff8abb39abe58`

Current reviewed main before this registration:
- `8d4dfc2632d546a75388555919d0fdd0a6660db7`
- direct docs-only terminal child of accepted source `dc91e068...`.

Accepted TEST artifacts before this repair:
- API `game-proxy-company-r3` version `074ed8b6-58a5-4648-a0da-e387f427761b`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation from the immediately preceding server-authorization repair:
- deterministic pre-fix multi-speaker TTS authority split reproduced;
- focused R3 media/TTS/server-route + choice tests: 25/25 PASS;
- full `npm.cmd test`: 539/539 PASS;
- changed JS/MJS syntax: PASS;
- `git diff --check`: PASS;
- changed source was only `runtime-r3/domain/media.js` + `test/r3-approved-media.test.mjs`;
- server now authorizes exact current committed present registered-heroine speaker/text rather than re-selecting a different primary speaker.

Freeze as already GREEN:
- exact visible choice dispatch;
- agency/navigation/canonical player identity;
- Story-owned exact-four choices;
- CSA draft/Revert/APPLY/CHANGE/REMOVE chronology;
- same-game reset runtime;
- latest-only current Story + History chronology;
- approved image grounding/fail-open behavior;
- turn timeout/terminalization lifecycle;
- server TTS committed-dialogue authorization at source/unit-route level;
- TTS fresh-session OFF => zero calls;
- browser `speechSynthesis` absent.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V4 fixture `ec8a906c-e540-4be4-b959-0ec0208c076d`
- prior TTS authorization failure `e7e7025c-539a-4139-9348-cac597b9c688`
- new dialogue-projection failure `e675437c-4dfe-4dd0-b542-d52ae224f98e`
- every previously preserved holistic/repair/identity fixture.

Use a NEW disposable TEST game for mutable live acceptance.

## 1. Correct classification of terminal 5388331463

Do NOT treat the fresh live result as a frontend TTS enqueue defect.

Independent READ ONLY DB evidence for game `e675437c-4dfe-4dd0-b542-d52ae224f98e`, Turn 1:
- committed `focal_actor.actor_id = heroine1`;
- committed `observer_applied.dialogue_lines = []`;
- warnings include `dialogue_projection_dropped` three times;
- `observer_raw.dialogue_lines` contains exactly three grounded candidates:
  - heroine1 / 서원희 line 1;
  - heroine1 / 서원희 line 2;
  - heroine5 / 이메이 line 1;
- each raw line has speaker id, exact spoken text, direction, and evidence_quote;
- Story visibly contains the same spoken dialogue.

The frozen frontend TTS controller intentionally queues only committed `dialogue_lines`. Therefore `/media/tts` request count 0 on that turn was correct fail-open behavior. The previous task enabled TTS before satisfying its own mandatory precondition of non-empty committed heroine dialogue projection.

The real product defect is one layer earlier: valid exact Observer dialogue evidence is dropped during normalization.

## 2. Independently proven first source boundary

Current source:
`runtime-r3/domain/observer-normalizer.js`

Relevant flow:
- `groundedDialogueLine()` requires registered/present heroine speaker id;
- requires non-empty exact spoken text;
- requires exact evidence via `evidenceQuote(item.evidence_quote, storyText)`;
- `evidenceQuote()` currently performs raw `storyText.includes(quote)` only;
- it then also requires evidence to contain canonical speaker name + spoken text.

The preserved Turn 1 Story and Observer evidence differ in the representation of escaped quote characters surrounding dialogue, while speaker identity and spoken text are otherwise exact. Raw substring matching therefore rejects all three candidates.

This is analogous to an already-bounded representation parity handled elsewhere: choice comparison uses `choiceParityKey()` to tolerate escaped-quote representation without semantic/fuzzy rewriting. Dialogue evidence currently has no equivalent bounded quote parity.

## 3. Required correction — quote representation only

Fix only the dialogue/evidence grounding seam so semantically identical quote escaping representation does not cause valid exact evidence to be dropped.

Required contract:
- speaker id must still be a registered heroine;
- speaker must still be present in the committed post-Story scene projection;
- spoken text must still occur exactly in Story content;
- evidence must still contain the canonical speaker name;
- evidence must still contain the exact spoken text;
- evidence must still correspond to a contiguous Story substring after ONLY a bounded quote-escape representation normalization.

Allowed parity examples:
- literal `"..."` representation vs normal `"..."` quote representation where the only difference is escape characters used to encode the same quote;
- repeated backslash escaping around quotation marks caused by transport/model string representation, provided normalization changes quote-escape representation only.

Do NOT normalize arbitrary content.

Forbidden:
- whitespace-insensitive matching;
- punctuation-insensitive matching;
- Unicode fuzzy matching beyond existing exact text behavior;
- substring matching that omits speaker context;
- edit distance / semantic similarity;
- name inference;
- speaker guessing;
- arbitrary backslash stripping;
- JSON parse/unparse of Story prose as a general fallback;
- parsing raw Story in frontend to bypass committed Observer projection;
- accepting raw dialogue solely because `spokenText` exists somewhere in Story;
- generic NPC TTS enablement;
- client-provided voice trust.

Prefer one small parity helper used only by exact evidence containment comparison. If a more precise bounded implementation is proven necessary by the failing fixture, keep it restricted to quote-escape representation.

## 4. Deterministic pre-fix reproduction — mandatory

Before editing, encode the preserved failure shape so it FAILS on accepted source `dc91e068...`:
- Story contains the exact preserved 서원희 dialogue and surrounding speaker context with the escaped quote representation seen in live data;
- Observer raw candidate uses the equivalent evidence quote representation seen in live data;
- speaker `heroine1` is registered and present;
- exact spoken text is unchanged;
- current normalizer returns no committed dialogue line and emits `dialogue_projection_dropped`.

Also include the preserved heroine5 line if useful to prove this is representation-wide rather than one speaker special case.

After the bounded correction require:
1. preserved heroine1 line 1 projects;
2. preserved heroine1 line 2 projects;
3. preserved heroine5 line projects when heroine5 is present;
4. canonical speaker names remain exact;
5. exact spoken text remains byte/content exact after normal trimming already defined by the source;
6. direction remains presentation-only and bounded as before;
7. evidence_quote stored after normalization remains auditable and tied to Story;
8. ordinary unescaped quote evidence still passes unchanged;
9. wrong speaker id still fails;
10. absent heroine still fails;
11. speaker name missing from evidence still fails;
12. altered spoken text still fails;
13. evidence containing same speaker but different dialogue still fails;
14. evidence from an older/different Story still fails;
15. generic NPC still does not become heroine dialogue;
16. focal actor grounding remains unchanged;
17. choices/choice parity remain unchanged GREEN;
18. Mind Monitor/clothing/location grounding remain unchanged GREEN;
19. media/TTS server authorization tests remain GREEN;
20. frontend TTS tests remain GREEN;
21. full accepted suite remains GREEN.

Do not modify tests to accept fuzzy evidence.

## 5. Hard scope freeze

Expected source boundary:
- `runtime-r3/domain/observer-normalizer.js`
- focused observer/media regression tests.

Do NOT change unless a failing test proves unavoidable:
- `runtime-r3/domain/media.js` accepted server TTS authorization repair;
- `runtime-r3/server/worker.js` media route;
- frontend TTS/media/view-model code;
- Story/Observer prompt semantics;
- provider/model/temperature/thinking/max_tokens/timeouts;
- choice parser/render/dispatch;
- player identity/agency/navigation;
- CSA;
- reset/history/current-scene;
- DB schema/table/RPC/migration/RLS/grants;
- content voice mappings;
- TTS_WORKER binding/provider/config/secrets;
- Production.

No new branch.
No new service.
No retry/regeneration system.
No compatibility path that trusts ungrounded client text.

## 6. Validation

Run at minimum:
- new focused observer quote-parity regression;
- existing observer-normalizer/choice/media tests;
- R3 media/TTS/server-route tests;
- relevant frontend TTS tests even if frontend unchanged;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS;
- `git diff --check`.

Record exact counts.

## 7. TEST deployment boundary

If the expected backend-only boundary holds:
- deploy exact corrected source to TEST API `game-proxy-company-r3` only;
- preserve existing environment/secrets/bindings including `TTS_WORKER`;
- record new API Worker version;
- frontend must remain exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- frontend deploy count 0.

No Production.
No DB migration.
No provider/model/config/secret change.

## 8. Fresh bare-public acceptance — projection first, TTS second

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create one NEW disposable game.
Do not mutate/retry/reset preserved failure fixtures.
Do not use direct gameplay API, DOM mutation, storage preseed, or `?api=` override.
Do not retry/regenerate the same semantic action to manufacture a favorable Observer result.

Reach a natural committed turn with visible registered heroine dialogue.

BEFORE touching the TTS toggle, prove from the SAME committed turn:
- heroine id is registered and present;
- `observer_raw.dialogue_lines` contains the candidate;
- `observer_applied.dialogue_lines` is NON-EMPTY and contains the exact same heroine speaker/text;
- no `dialogue_projection_dropped` warning applies to that accepted line;
- frontend `view.dialogue_lines` contains that committed line;
- repository canonical voice_id exists for that heroine.

If Story has visible heroine dialogue but committed projection is still empty/drop-only, STOP `FAILED_PRODUCT_DIALOGUE_PROJECTION` immediately. Do NOT enable TTS and do NOT misclassify it as frontend TTS.

Only after projection preconditions are proven:
1. TTS OFF baseline => zero `/media/tts` calls;
2. click visible TTS ON once;
3. browser sends exactly one R3 `/media/tts` request for exact committed heroine speaker/text;
4. API returns success with audio URL;
5. server `TTS_WORKER` path is exercised, no browser-direct provider call;
6. audio element receives returned URL;
7. autoplay policy may be recorded separately if audible play is blocked;
8. UI must not show `Voice unavailable` for a successful eligible request;
9. click replay once after cache fill;
10. replay adds zero new `/media/tts` synthesis request;
11. no browser `speechSynthesis`;
12. one distinct ordinary subsequent turn commits once;
13. stale prior dialogue/audio does not leak into new turn;
14. approved image/fail-open behavior remains non-regressed.

## 9. Failure handling

GREEN only if BOTH are green:
A. valid quote-escaped Observer dialogue is committed into `observer_applied.dialogue_lines` under the strict exact-evidence contract;
B. that committed heroine dialogue then traverses frontend -> R3 `/media/tts` -> TTS_WORKER -> audio URL and replay cache.

If A fails, classify `FAILED_PRODUCT_DIALOGUE_PROJECTION` and stop before TTS.
If A passes but visible TTS ON still produces zero `/media/tts`, classify `FAILED_PRODUCT_TTS_ENQUEUE` with exact view/identity/DOM evidence.
If `/media/tts` is sent but exact committed dialogue is again rejected, classify `FAILED_PRODUCT_TTS_AUTHORIZATION`.
If upstream/binding fails after correct authorization, classify the exact TTS service boundary separately.
If browser autoplay blocks only audible playback after valid URL/cache, classify `BROWSER_AUTOPLAY_LIMITATION`, not server/product authorization failure.

Do not patch a second unrelated defect in the same task after the first decisive failure.
Do not start holistic V5 inside this task.
Do not claim owner-ready.

## 10. Completion protocol

At completion post to Issue #68:
- source SHA and final main SHA;
- exact pre-fix reproduction and quote representation boundary;
- changed files and why;
- focused/full/syntax/diff results;
- TEST API and unchanged frontend versions;
- fresh disposable game id/turn;
- observer_raw vs observer_applied exact speaker/text evidence;
- dialogue projection warnings;
- heroine canonical voice mapping;
- `/media/tts` request count/status;
- TTS_WORKER/audio URL evidence;
- replay request delta;
- confirmation all preserved fixtures remained READ ONLY;
- confirmation no retry/regeneration/provider/model/DB/migration/Production/frontend drift;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not create the next task yourself.