# Company — CURRENT TASK

Status: READY
Task ID: company-r3-media-focal-dialogue-projection-v1
Mode: FREEZE ACCEPTED MEDIA PLUMBING -> ADD GROUNDED COMMITTED PRESENTATION PROJECTION -> RETEST IMAGE/TTS LIVE
Updated: 2026-08-24 00:27 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5386778945`
Operator review: Issue #68 comment `5386804081`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Accepted baseline and exact failure

Current main before registration:
- `f01a871c9effab941028b61f06acf380dd6af4c5`

Accepted media source foundation from the previous cut:
- `25688dd4c478b72ace1ad514e99498fc3469cfc0`

`f01a871...` is a docs-only descendant of `25688dd...`; there is no later executable drift.

Freeze the bounded implementation already accepted in operator review `5386804081`:
- deterministic approved `image_library`/canonical media selection;
- current-character/presence eligibility and fail-open behavior;
- R3 image/TTS server routes and frontend media controllers;
- `TTS_WORKER` Service Binding to existing service `fancy-dust-7f8c`;
- canonical `character_id -> voice_id` server eligibility;
- TTS OFF => zero synthesis calls;
- narrator/player/player-inner-thought/Mind Monitor/unknown speaker ineligibility;
- stale image/audio fencing, dedup/cache/replay lifecycle;
- browser `speechSynthesis` / `SpeechSynthesisUtterance` removed from the R3 product path;
- media remains presentation-only and fail-open.

Previous deterministic verification was GREEN:
- focused R3 media: 5/5;
- R3 frontend contract: 14/14;
- full npm: 526/526;
- changed JS/MJS syntax, `git diff --check`, Wrangler dry-runs: PASS.

Current TEST artifacts from that source:
- API `game-proxy-company-r3` version `e1135324-20ba-4410-91bf-c3c31b59a10f`;
- frontend `gamebuilder-company-r3` version `1efd7d4a-b9b6-48af-9b07-baab0f2f6000`;
- bare public `https://gamebuilder-company-r3.zeroslove.workers.dev`.

Previous live fixture — READ ONLY, never reset/revise/retry/mutate:
- `e0238ff2-9cfb-4c60-a74c-ab03a0c732d1`.

Exact prior product failure:
- Setup/Opening + three ordinary turns committed successfully;
- five registered heroines were present in committed scene state;
- there was no committed canonical focal/relevant heroine field usable by media;
- Story direct dialogue appeared as natural quoted prose, not reliably as deterministic speaker-prefixed lines;
- media code correctly refused to choose one of five heroines or assign a bare quote to a guessed speaker;
- therefore live image Gate A and character-aware server TTS Gate C/D could not become eligible;
- TTS OFF gate remained GREEN with zero `/media/tts` calls.

This is a committed presentation-projection defect. It is NOT evidence that image data, `TTS_WORKER`, voice IDs, media selectors, or media frontend plumbing are broken.

Do not roll back or redesign the accepted media foundation merely because eligibility correctly failed closed.

## 1. Product/architecture boundary

R3 remains:
- Story LLM;
- one small post-Story Observer;
- committed turn + `observer_raw`/`observer_applied`;
- minimal reducer/state;
- presentation sidecars derived from committed evidence.

This cut may extend the EXISTING Observer response with narrowly scoped presentation-only evidence because the previous live gate proved that the current committed projection structurally lacks the information necessary for truthful character image/TTS routing.

No new model call.
No second observer.
No provider/model/temperature/token/timeout change.
No DB schema/RPC/migration.
No new gameplay durable authority.
No new client gameplay state.
No arbitrary/fuzzy speaker guessing.
No semantic rewrite of Story.

The presentation projection must live in the existing turn Observer projection (`observer_raw` -> strict normalizer -> `observer_applied`) and be consumed from the latest committed turn. Do NOT make it a writer for player agency, location, presence, relationships, CSA, clothing, time, or any other gameplay fact.

Do not add `scene.focal_actor_id` as a new gameplay-state authority in the reducer merely to satisfy media. If a presentation field needs a focal actor, keep that field turn-scoped in validated `observer_applied` unless an already-existing canonical field is discovered during inventory.

## 2. Mandatory pre-edit boundary trace

Before editing source, inspect the previous failed fixture `e0238ff2-9cfb-4c60-a74c-ab03a0c732d1` READ ONLY and record for its Opening/latest ordinary turns:
1. exact raw Story dialogue shape;
2. `observer_raw` actor-related evidence;
3. `observer_applied` actor-related evidence;
4. post-turn `state.scene.present_actor_ids`;
5. `mind_monitor` target IDs;
6. current `projectCurrentMedia()` inputs/outputs;
7. whether any existing committed field already encodes relevant/focal speaker identity.

Do not infer from DOM alone. Do not mutate the fixture.

If an existing committed, strictly grounded focal/speaker projection already exists and the only defect is that media failed to read it, use that existing field instead of creating a duplicate Observer key.

Otherwise proceed with the bounded Observer extension below.

## 3. Bounded Observer presentation projection

Use the existing single Observer call. Add only the minimum presentation keys needed for current image/TTS routing.

Preferred normalized shape unless existing canon provides an equivalent:

```json
{
  "focal_actor": {
    "actor_id": "heroineN",
    "quote": "exact contiguous Story evidence containing the canonical actor name"
  },
  "dialogue_lines": [
    {
      "speaker_id": "heroineN",
      "text": "exact spoken dialogue text from Story",
      "direction": "optional short delivery direction",
      "evidence_quote": "exact contiguous Story span grounding speaker attribution and the dialogue"
    }
  ]
}
```

Names may be adjusted only to fit an already-existing R3 contract cleanly; semantics must remain this narrow.

### Focal actor rules

A focal/relevant actor projection is valid only when:
- `actor_id` is a registered canonical Company heroine;
- that actor is present in the post-Story scene after applying entered/exited/present evidence;
- `quote` is an exact contiguous substring of the current Story;
- the quote contains that actor's exact canonical name and materially grounds that actor as current/relevant to the scene.

Invalid focal evidence is dropped locally to `null` with a warning. It must never fail the Story turn.

Do not select the first present heroine, alphabetically lowest heroine, or arbitrary heroine when five are present.

### Dialogue-line rules

Each projected line is valid only when:
- `speaker_id` is a registered canonical Company heroine;
- the speaker is present in the post-Story scene;
- `text` is non-empty and occurs verbatim as spoken dialogue in the current Story;
- `evidence_quote` is an exact contiguous substring of the current Story and provides bounded attribution evidence tying that canonical actor to that spoken text;
- no narrator/player/inner-thought/Mind-Monitor text is projected as NPC dialogue.

Normalize exact text, do not paraphrase or translate it. Do not merge different speakers.

If the Observer returns invalid/fabricated/remote speaker evidence, drop only that line and record a bounded warning. The Story/commit remains usable.

Natural bare-quote Story prose is allowed. Do NOT require a Story rewrite just to make TTS work in this cut. The Observer is already the one post-Story projection step and may identify speaker attribution, but strict server-side grounding must reject unsupported mappings.

Do not add a fuzzy heuristic that assigns anonymous quotes to the nearest actor name without validated Observer evidence.

### Prompt scope

If the Observer system/product prompt must be updated:
- add only these presentation extraction requirements;
- preserve all existing player-agency, choices, time, scene, Mind Monitor, CSA/private-emotion and navigation instructions verbatim in meaning;
- do not change Story generation prompts in this cut.

## 4. Persistence/reducer boundary

The new validated presentation fields may be stored in the existing per-turn `observer_applied` JSON that is already persisted with the turn.

Requirements:
- no DB migration;
- no new table/column;
- reducer must not use dialogue/focal presentation fields to mutate gameplay state;
- readback/refresh obtains them from the committed latest turn;
- old turns without the fields remain valid and simply produce no eligible media unless deterministic legacy speaker parsing already proves eligibility.

The failing previous fixture may be used only to test backward-compatible fail-open behavior; never revise its committed turns.

## 5. Rewire current media projection — minimal only

Update `runtime-r3/domain/media.js` and frontend/view-model plumbing only as necessary so current media consumes validated committed presentation evidence.

Character priority:
1. explicitly requested character only if currently present and registered;
2. latest validated `observer_applied.focal_actor` when currently present;
3. validated current committed dialogue speaker when unambiguous/relevant;
4. single present registered heroine if exactly one exists;
5. otherwise no image character — never arbitrary choice.

Dialogue/TTS priority:
- use validated committed `dialogue_lines` first;
- deterministic explicit speaker-prefix parsing may remain as a compatibility fallback only when it independently proves canonical speaker identity;
- never synthesize anonymous quotes by guessing.

All existing media constraints remain:
- image pool is general unless already-committed evidence proves sex pool eligibility;
- no raw player intent as sexual success proof;
- no LLM image ranking;
- no media state mutation;
- server is final TTS voice/presence eligibility authority;
- TTS OFF remains zero calls;
- no speech synthesis browser fallback.

## 6. Deterministic regressions

Add exact tests before live deploy.

At minimum prove:
1. five present heroines + validated focal heroine => exact focal image character;
2. five present heroines + no focal + one validated dialogue speaker => that speaker is eligible;
3. five present heroines + no grounded focal/dialogue => no arbitrary character;
4. focal actor with non-Story quote is dropped;
5. focal actor not present after Story is dropped;
6. dialogue text not verbatim in Story is dropped;
7. dialogue attribution evidence not exact/current is dropped;
8. remote/unknown/player/narrator dialogue is dropped;
9. valid bare-quote Story plus strictly grounded Observer speaker projection yields canonical dialogue line;
10. invalid media projection never blocks turn commit;
11. presentation fields do not alter reduced gameplay scene/location/presence/time/CSA state;
12. committed readback/refresh can reconstruct current media projection;
13. TTS server still maps exact registered speaker to canonical voice ID;
14. TTS OFF still makes zero API calls;
15. TTS ON uses only validated committed dialogue;
16. replay cache/dedup/stale fencing from `25688dd...` remains green;
17. image stale fencing from `25688dd...` remains green;
18. source scan still finds no R3 product `speechSynthesis` / `SpeechSynthesisUtterance`;
19. frozen agency/navigation/choice/CSA/draft/reset regressions remain green.

Run focused tests, full `npm.cmd test`, changed JS/MJS `node --check`, and `git diff --check`.

## 7. TEST deploy

Deploy exact affected TEST artifacts only.

Likely API changes:
- Observer prompt/normalizer/applied projection;
- media projection consumption.

Likely frontend changes only if view-model/controller requires the newly committed fields. If frontend source is unchanged, do not redeploy it merely for symmetry.

Preserve the existing `TTS_WORKER` binding and all current vars/secrets exactly.

No Production.
No migration.
No secret rotation/printing.
No provider/model/config change beyond the already accepted media binding.

Record source SHA and exact Worker version IDs.

## 8. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override.
No storage preseed.
No direct-API gameplay substitute.
Fresh disposable TEST games only.
Never mutate owner game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`.
Never mutate previous failure fixture `e0238ff2-9cfb-4c60-a74c-ab03a0c732d1`.

### Gate A — grounded image

Create visible Setup -> Opening and ordinary company/social turns that materially involve a registered heroine.

Require:
- committed latest turn contains strictly validated relevant/focal and/or dialogue speaker projection;
- chosen image character equals that grounded present heroine;
- server returns an approved image for that exact heroine;
- visible image renders without blocking Story/choices/input;
- no arbitrary heroine is selected when evidence is ambiguous;
- refresh/re-entry reconstructs the same current eligible heroine/image from committed context;
- stale prior response cannot overwrite a later committed media projection.

### Gate B — TTS OFF

With fresh/session TTS OFF:
- commit a turn containing validated registered heroine dialogue;
- prove zero `/media/tts` synthesis calls;
- narrator/player/private thought/Mind Monitor remain unsent.

### Gate C — TTS ON character routing

Enable through the visible TTS control and use a committed turn with validated present heroine dialogue.

Require:
- frontend sends exact validated dialogue + canonical character ID only;
- R3 server resolves exact canonical voice ID;
- transport is R3 API -> `TTS_WORKER` Service Binding -> audio URL;
- `#audio-player` receives a playable returned URL;
- no direct browser-to-TTS-worker call;
- no browser speechSynthesis;
- no duplicate synthesis for same committed batch;
- UI/gameplay stays responsive.

If live dialogue projection is invalid, stop on that exact projection failure. Do not retry/regenerate until a better sample appears.

### Gate D — replay/transition/refresh

Require:
- replay uses cached URL without duplicate synthesis where existing contract specifies;
- next committed turn fences old image/audio;
- refresh/re-entry reconstructs media eligibility from committed turn evidence;
- gameplay state/turn count is unchanged by media actions.

### Gate E — mobile

Approx `390x844`:
- image panel is usable/non-blocking;
- TTS toggle/replay/audio remain reachable;
- choices and direct input remain reachable;
- no overflow/overlay blocker.

## 9. Stop conditions

GREEN only if:
- committed presentation projection is strictly grounded and fail-open;
- live image Gate A passes with an approved image for the exact relevant present heroine;
- TTS OFF zero-call gate passes;
- TTS ON server character routing/audio URL passes;
- replay/transition/refresh passes;
- mobile passes;
- no gameplay authority or provider/model/schema drift.

If the existing Observer cannot reliably produce exact grounded speaker attribution without inventing data, STOP `FAILED_PRODUCT` with raw Story + observer raw/applied evidence. Do not add another model call, fuzzy quote-speaker heuristic, or arbitrary fallback.

If `TTS_WORKER` or approved media data newly becomes unavailable, STOP with the exact environment/data boundary; do not fall back to browser TTS or placeholders.

Do not claim owner-ready.
Do not start timeline cleanup or holistic owner play in this task.

## 10. Completion report

Post to Issue #68:
- final source/main SHA;
- exact changed files;
- focused/full validation counts;
- TEST API/frontend version IDs;
- fresh fixture IDs;
- sampled raw Story dialogue + normalized focal/dialogue projection evidence;
- Gate A image character/source/render result;
- Gate B zero-call evidence;
- Gate C canonical character/voice/server-binding/audio URL evidence without exposing secrets;
- Gate D replay/transition/refresh evidence;
- mobile result;
- any dropped invalid projection warnings;
- confirmation that gameplay state/turn authority was unchanged;
- remaining defect: timeline/current-scene residue and final holistic owner-style acceptance only if this cut is GREEN.

Then overwrite this SAME `docs/ops/CURRENT_TASK.md` to `WAITING_REVIEW` and stop. Do not create or start the next task.