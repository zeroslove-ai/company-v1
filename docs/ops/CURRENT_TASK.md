# Company — CURRENT TASK

Status: READY
Task ID: company-r3-observer-dialogue-completeness-contract-v1
Mode: FREEZE ACCEPTED QUOTE-PARITY + TTS AUTH -> STRENGTHEN SINGLE OBSERVER DIALOGUE COMPLETENESS CONTRACT -> API TEST DEPLOY -> PROJECTION-FIRST TTS ACCEPTANCE
Updated: 2026-08-24 06:04 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5388433835`
Operator review: Issue #68 comment `5388458753`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery/source branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source:
- `cd16dfb44115a5b70ec67ba3e079b48d9b040237`

Reviewed main before this registration:
- `367be43437f7cacaf1e8b53d57f370989e440dc7`
- direct docs-only terminal child of accepted source `cd16dfb...`.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `b1da918b-269c-4724-8a12-18b9deaca78a`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Freeze as GREEN:
- quote-escape evidence parity in `observer-normalizer.js`;
- server exact committed-dialogue TTS authorization;
- registered heroine voice mapping / TTS_WORKER binding;
- TTS fresh-session OFF => zero calls;
- exact visible choice dispatch;
- player agency/navigation/canonical identity;
- Story-owned exact-four choices;
- CSA draft/Revert/APPLY/CHANGE/REMOVE chronology;
- reset, current-scene/History, image grounding, turn timeout/terminalization;
- browser `speechSynthesis` absent.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`
- holistic V4 `ec8a906c-e540-4be4-b959-0ec0208c076d`
- prior TTS authorization failure `e7e7025c-539a-4139-9348-cac597b9c688`
- prior quote-projection failure `e675437c-4dfe-4dd0-b542-d52ae224f98e`
- current Observer-omission fixture `be0a3e57-e36d-4f5a-86b9-75d60e2dfbef`
- all previously preserved fixtures.

Use a NEW disposable TEST game for mutable live acceptance.

## 1. Exact accepted defect

The previous quote-parity source correction passed deterministic and full validation, but fresh live failed before normalization.

READ ONLY evidence for game `be0a3e57-e36d-4f5a-86b9-75d60e2dfbef`, Turn 1:
- Story contains five direct quoted dialogue lines;
- four are from general NPC `general_park_jungwoo` / 박정우;
- one is clearly attributed to registered heroine `heroine2` / 윤민아:
  `박지훈 씨, 인사팀 가시기 전에 명함판에 이름 적어 놓으셔야 해요. 담당자한테 말하면 프린트해 줘요.`
- committed present_actor_ids includes `heroine2`;
- Observer returned other fields normally, including location, present_actor_ids, scene_note, summary, player thought, and mind monitor;
- but `observer_raw.dialogue_lines = []`;
- therefore `observer_applied.dialogue_lines = []` by correct fail-open behavior.

This is NOT a normalizer failure and NOT a frontend TTS enqueue failure. There was no raw candidate to normalize or enqueue.

## 2. Independently proven source boundary

`runtime-r3/server/provider.js` uses the existing single post-Story Observer call with:
- temperature 0;
- JSON object response;
- `OBSERVER_ACCEPTANCE_PROMPT`, which includes `OBSERVER_PRESENTATION_PROMPT`.

Current presentation prompt defines validity for `focal_actor` and `dialogue_lines`, but only says to "also return" them. It does not impose a completeness invariant when at least one clearly supported registered/present heroine direct-speech line exists.

Consequently an otherwise valid Observer response with `dialogue_lines: []` is accepted even when Story contains a safe, exact heroine dialogue candidate.

## 3. Required correction — completeness contract only

Strengthen only the existing single Observer presentation prompt/contract.

Required behavior:
- if the completed current Story contains one or more clearly attributable direct quoted speech lines by registered heroines;
- and the heroine is present after the Story;
- and an exact contiguous Story evidence span can contain both the canonical heroine name and the exact spoken text;
- then `dialogue_lines` MUST include every such supported heroine line;
- it MUST NOT return `[]` merely because `focal_actor` is null, general NPCs speak more often, the heroine is not the focal actor, or presentation metadata is otherwise optional.

For consecutive same-speaker dialogue where the immediate local sentence uses a pronoun such as `그녀는`, the Observer may use a larger exact contiguous evidence_quote spanning back to the nearest explicit canonical heroine-name attribution, provided the span still contains the exact spoken text. Do not infer across ambiguous speaker changes.

The existing strict normalizer remains the authority that accepts/drops each raw candidate.

## 4. Hard prohibitions

Do NOT add:
- a new Story dialogue parser as canonical/fallback authority;
- frontend parsing of raw Story to synthesize TTS;
- a second Observer/LLM call;
- retry/regeneration to obtain a favorable Observer result;
- fuzzy speaker attribution;
- proximity-only attribution;
- generic NPC TTS voices;
- client-provided voice trust;
- whitespace/punctuation/edit-distance semantic matching;
- provider/model/temperature/thinking/max_tokens/timeout changes;
- DB/schema/RPC/migration/RLS/grant changes;
- Production changes.

Do not change `observer-normalizer.js`, `media.js`, frontend TTS, or TTS route unless a deterministic regression proves the expected provider-prompt boundary is false. If that happens, stop before broadening.

Expected source boundary:
- `runtime-r3/server/provider.js`
- focused provider/observer contract tests.

## 5. Mandatory pre-edit proof and deterministic tests

Before editing, prove and record:
1. `OBSERVER_ACCEPTANCE_PROMPT` is the actual prompt used by `observe()`;
2. current prompt defines validity but not mandatory completeness;
3. current normalizer correctly cannot create dialogue when raw `dialogue_lines=[]`;
4. current fresh fixture contains a qualifying heroine2 direct dialogue line and present heroine2.

Add focused tests that lock the new prompt contract without mocking away the real boundary:
- Observer prompt explicitly requires all safely supported registered/present heroine direct-speech lines;
- prompt explicitly forbids empty `dialogue_lines` when at least one qualifying heroine line exists;
- prompt states general-NPC dominance/focal null is not a reason to omit heroine dialogue;
- prompt preserves exact contiguous evidence + canonical name + exact spoken text requirements;
- prompt allows larger contiguous evidence for an explicitly named speaker followed by pronoun continuation, but forbids ambiguous attribution;
- no requirement to project general NPC dialogue;
- unsupported/player/narrator/thought dialogue remains excluded.

Also keep GREEN:
- quote-escape parity regressions;
- observer normalizer strict rejection cases;
- server TTS authorization multi-speaker cases;
- frontend TTS OFF/cache/stale fencing;
- choice dispatch;
- image media tests;
- full accepted suite.

Run:
- focused provider/observer/media/TTS tests;
- full `npm.cmd test`;
- `node --check` for changed JS/MJS;
- `git diff --check`.

Record exact counts.

## 6. Deployment boundary

If provider-prompt-only boundary holds:
- deploy exact corrected source to TEST API `game-proxy-company-r3` only;
- preserve existing environment, model, temperature, token limits, timeouts, secrets, and TTS_WORKER binding;
- record exact API Worker version;
- frontend remains exactly `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`;
- frontend deploy count = 0.

No Production. No migration. No config/model change.

## 7. Fresh bare-public acceptance — projection first

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

Create one NEW disposable game through visible setup.
No `?api=` override, storage preseed, DOM mutation, direct gameplay API, reset of preserved games, retry, or regeneration.

If persisted TTS state opens ON, visibly switch it OFF before the qualifying ordinary turn; do not mutate localStorage directly.

Reach a natural committed ordinary turn containing at least one clearly attributed direct quoted dialogue line by a registered/present heroine.

BEFORE touching TTS ON, prove same-turn:
- exact Story dialogue text;
- heroine canonical id/name;
- heroine is in committed present_actor_ids;
- `observer_raw.dialogue_lines` contains that exact speaker/text;
- raw evidence_quote is exact contiguous Story evidence satisfying canonical-name + exact-text contract;
- `observer_applied.dialogue_lines` contains the same accepted speaker/text;
- frontend `view.dialogue_lines` contains it;
- canonical voice_id exists.

Failure classification:
- qualifying heroine line exists but `observer_raw.dialogue_lines=[]` or omits it => `FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION`;
- raw candidate exists but applied drops => `FAILED_PRODUCT_DIALOGUE_NORMALIZATION`;
- do not test TTS after either failure.

## 8. TTS acceptance after projection is proven

Only after Section 7 is GREEN:
1. confirm TTS OFF => zero `/media/tts` calls;
2. click visible TTS ON once;
3. browser sends exactly one R3 `/media/tts` request for exact committed heroine speaker/text batch;
4. API returns success audio URL;
5. server TTS_WORKER path is used; no browser-direct provider request;
6. audio element receives URL;
7. browser autoplay limitation, if any, is recorded separately after valid URL/cache;
8. UI does not show `Voice unavailable` for successful eligible request;
9. click replay once after cache fill;
10. replay adds zero new synthesis request;
11. no `speechSynthesis`;
12. one distinct ordinary subsequent turn commits once;
13. prior dialogue/audio does not leak into new turn;
14. image/fail-open behavior remains correct.

If projection succeeds but visible ON emits zero request, stop `FAILED_PRODUCT_TTS_ENQUEUE`.
If request is sent but rejected as uncommitted, stop `FAILED_PRODUCT_TTS_AUTHORIZATION`.
If authorized request reaches service but upstream fails, classify exact service boundary.

## 9. GREEN criteria

GREEN only if:
- completeness boundary is proven pre-edit;
- correction is limited to existing single Observer contract;
- focused/full/syntax/diff pass;
- API-only TEST deploy succeeds;
- fresh qualifying heroine dialogue appears in observer_raw and observer_applied;
- frontend sees the committed line;
- TTS OFF=0;
- TTS ON traverses R3 -> TTS_WORKER -> audio URL;
- replay uses cache with zero new synthesis;
- one subsequent turn commits without stale TTS state;
- no frozen subsystem regression or forbidden operation occurs.

If prompt strengthening still produces raw omission on a fresh qualifying heroine turn, preserve fixture and stop `FAILED_PRODUCT_OBSERVER_DIALOGUE_OMISSION`. Do not add parser fallback or retry in this task.

Do not start holistic V5 inside this task.
Do not claim owner-ready.

## 10. Completion protocol

At completion post Issue #68 with:
- source SHA / final main SHA / final task blob;
- pre-edit boundary proof;
- exact changed files;
- focused/full/syntax/diff counts;
- TEST API + unchanged frontend versions;
- fresh game id/turn;
- exact heroine Story line;
- observer_raw and observer_applied line evidence;
- canonical voice mapping;
- `/media/tts` request count/status;
- TTS_WORKER/audio URL/playback evidence;
- replay request delta;
- subsequent-turn stale-state result;
- preserved fixture confirmation;
- forbidden operation counts;
- exact disposition.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` in place to `Status: WAITING_REVIEW`, push main, post terminal report, and stop.

Do not generate the next task yourself.
