# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-image-media-live-acceptance-v2
Mode: ACCEPTANCE-ONLY — IMAGE MEDIA ROUTING / ADULT POOL / REFUSAL / DE-ESCALATION / REFRESH
Updated: 2026-08-25 07:24 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Registration base main before this overwrite: `36ef8b5a5f7596d03c262f3deb2027ce8f03fb9c`
Previous task: `company-r3-deploy-target-contract-recovery-v1`
Previous terminal: Issue #68 `5402220722`
Operator review: Issue #68 `5402267821`
Accepted media implementation: `1055a7d34d5739f121b29af767cb5cd5a276ed04`
Accepted deploy-wrapper implementation: `d2a4aafc04cd2993b1dde2a8f50caa400dc19de1`
Accepted TEST API: `game-proxy-company-r3` / `4f8e8697-7b9e-4d91-8a50-35463309ce4a`
Frozen TEST frontend: `gamebuilder-company-r3` / `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`
TEST Supabase project: `fmcrspgxstsmxxsmkeee`

Success terminal:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_FUNCTIONAL_GREEN_AWAITING_OPERATOR_REVIEW`

Product blocked terminal:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Browser-control blocked terminal:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

## 0. Authority / reuse law

- Work on `main` only.
- Reuse this exact `docs/ops/CURRENT_TASK.md` path. Never create another CURRENT_TASK file, branch, ops branch, implementation branch, or PR.
- Mandatory read order: `AGENTS.md`, `CURRENT_TRUTH.md`, `docs/redesign/COMPANY_CANON.md`, `docs/redesign/LIVE_ACCEPTANCE_MATRIX.md`, `docs/redesign/MEDIA_CATALOG_CONTRACT.md`, terminal `5402220722`, operator review `5402267821`, then this task.
- Actual deployed browser play is the product gate.
- This is acceptance-only. Source/content/test/config/provider/model/DB/storage changes are forbidden.
- Freeze the 102-entry manifest (5 general + 97 sex), manifest-first exact-image-id authority, DB serving-index-only behavior, deploy-wrapper guard, CSA, Story/Observer architecture, MM, memory, TTS implementation, and frontend source.
- No Production. No OWNER_READY claim.

## 1. Exact goal

Close the functional image portion of `A-MEDIA-001` / `M-ACCEPT-001` on the currently deployed TEST build without mixing TTS into the run.

Prove in one fresh visible game:

1. an ordinary committed heroine scene produces the correct heroine `general` media request/response and visible image;
2. a requested-but-cancelled/refused/non-occurring adult act cannot switch to false `sex` media;
3. a genuinely committed adult/sexual act reaches the correct heroine `sex` pool and a manifest-approved sex image;
4. explicit stop/de-escalation removes stale sex media once the committed scene no longer establishes the act;
5. refresh/re-entry preserves equivalent media meaning without duplicate Story/Commit;
6. any natural image failure remains local and does not block Story/Commit.

Known quality gap must be reported separately, not hidden: the current manifest has only one `general` image per heroine. Functional routing can be GREEN while `M-CATALOG-002` ordinary-image variety remains a P2/product-quality gap. Do not fabricate general variation from sex assets or external media.

## 2. Preflight — zero gameplay mutation until stable

Verify once, read-only:

- current executable/content is accepted source plus docs descendants only;
- TEST API is exactly `4f8e8697-7b9e-4d91-8a50-35463309ce4a` or proven source-equivalent;
- TEST frontend is exactly `af6c13bf-ef57-40cb-a4f0-e3569b301bc5` or proven source-equivalent;
- `/api/r3/catalogs` reports 102 active media entries = 5 `general` + 97 `sex`;
- bare public TEST frontend loads with usable DOM and screenshot;
- browser/network observation can capture current-game `/media/image` request and response while also confirming the visible `<img>` state.

If DOM/screenshot/browser network observation is unavailable before game creation, STOP browser-control blocked with fresh games = 0. Do not create a game hoping tooling recovers.

No full npm test is required in this acceptance-only task.

## 3. Setup validity barrier / one game only

Create exactly one fresh TEST game through visible Setup.

Use a definitely valid adult profile:
- name `김도현`
- age `30`
- height `180`
- weight `75`
- penis length `15`
- department visible Brand Strategy / `brand_strategy`
- position visible Intern / `intern`
- body type = first currently valid visible catalog option
- speech style = first currently valid visible catalog option

Before the single Setup submit prove client constraints are valid. Then click `설정 완료` once.

- no second Setup submit;
- no second game;
- no reset/regenerate/sample;
- no direct gameplay API substitute;
- no DB state seeding.

Record fresh game ID.

## 4. Lane A — ordinary heroine / general image

Use visible play to establish one exact registered heroine as current/focal/relevant, preferably `서원희` (`heroine1`) because both general and multiple sex assets are canonically present.

A practical visible input may be a simple direct social approach such as going to 서원희 and speaking with her; do not require work-task framing.

Only judge the image after the turn is committed and the UI has settled.

PASS requires:
- committed Story actually establishes the chosen heroine as current/present/relevant;
- actual `/media/image` request is observable;
- request is for that exact heroine and `general`, not another heroine and not `sex`;
- response image ID is manifest-approved for that heroine/general pool;
- visible rendered image corresponds to the returned image URL/ID;
- Story remains primary/readable and image loading does not cover/block arrived Story.

For heroine1 the only current general entry is `heroine1-main`; seeing the same portrait across ordinary heroine1 contexts is not a routing P1, but must be recorded under the known M-CATALOG-002 P2 quality gap.

Wrong heroine or false sex pool on an ordinary committed scene = deterministic P1 STOP.

## 5. Lane B — non-occurring adult intent must not create false sex media

While the same heroine is current, use exactly one visible input whose literal meaning explicitly cancels/stops before the adult contact occurs, for example:

`서원희에게 입맞춤하려다가 생각을 바꿔 멈추고, 아무 행동도 하지 않는다.`

The Story must preserve the non-occurrence. If Story silently performs the act anyway, that is an agency/product P1 and STOP.

If Story preserves non-occurrence:
- no committed evidence may authorize a sex image merely because the request/intention contained adult wording;
- any media request must remain semantically safe (`general` for the same heroine or no image, according to current projection); and
- a sex-pool request/visible sex image is P1 STOP.

Do not retry with another refusal/cancellation sample.

## 6. Lane C — genuine adult act / sex pool

Reach one genuinely committed sexual act with the same heroine using visible gameplay only.

Preferred bounded setup if needed for deterministic reachability:
- use the already accepted visible S1 authority surface only as a setup mechanism, not as a new CSA acceptance campaign;
- select exact valid subject/counterparty roles for the same heroine and player;
- S1 APPLY announcement itself does **not** count as an adult act and must not independently justify sex media;
- then issue one visible S1-supported `oral` instruction in the exact selected actor/direction, because heroine1 has approved oral/deepthroat/fellatio sex assets.

Do not rerun S1 supported/unsupported boundary as a pass-seeking campaign. Use at most one S1 APPLY and one supported adult instruction if this route is used.

The positive media lane is reached only if committed Story clearly states that the adult act actually begins/occurs. A request, discussion, announcement, refusal, or blocked attempt does not count.

If the supported instruction is silently substituted, wrong actor/target is used, or official supported S1 authority is ignored in a deterministic way, classify the actual owning product P1 and STOP; do not hunt another adult route.

Once a genuine adult act is committed, PASS requires:
- actual `/media/image` request is observable;
- exact heroine ID is preserved;
- pool is `sex`;
- returned image ID exists in the repository manifest for that exact heroine/sex pool;
- selected situation/tags are not contradicted by the committed act;
- DB-only image IDs never appear;
- visible image matches returned media;
- media remains presentation-only and Story/Commit already exists independently.

Wrong heroine, `general`-only despite clear eligible committed adult evidence, unrelated sex act, or DB-only row = P1 STOP.

## 7. Lane D — de-escalation / stale sex removal

After the genuine adult scene, use one visible literal stop/de-escalation input such as:

`지금 하던 성적 행동을 즉시 멈추고 서원희와 평범한 대화로 돌아간다.`

Pass requires the Story to preserve stop/change intent. Once the committed Story clearly ends the sexual act:
- stale sex media must not remain as the authoritative current-scene image after projection/render settles;
- subsequent media may be same-heroine `general` or no image;
- another heroine or stale unrelated sex act is forbidden.

If the Story refuses to stop without a concrete active physical/rule constraint, or silently continues the act against the literal stop, classify agency/product P1 and STOP.

## 8. Refresh / re-entry

Perform one deliberate read-only browser refresh/re-entry on the same fresh game after the de-escalated committed state.

Pass:
- no duplicate Story/Commit/action;
- same committed turn reconstructs;
- media reconstructs to equivalent **non-sex/de-escalated** meaning (`general` same heroine or no image);
- stale sex image does not resurrect from browser cache;
- free input/choices remain usable.

Do not use refresh as a retry of a failed action.

## 9. Browser-control recovery law

If browser control times out after an action was submitted:

1. do not click/resend/retype the action;
2. inspect read-only request/job/context/history footprint for the fresh game only;
3. allow at most one read-only reattach to that same game;
4. continue only if exactly-one commit and coherent visible state are proven;
5. otherwise STOP `IMAGE_MEDIA_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`.

If media network observation itself cannot be recovered, do not infer request pool from DOM alone and do not call the product GREEN.

## 10. TTS separation

TTS is out of scope in this task.

- Do not toggle TTS for acceptance.
- Do not call/replay `/media/tts` intentionally.
- Do not classify TTS based on this run.
- A separate TTS-only live acceptance task follows after image routing review.

## 11. Frozen / forbidden

Counts must remain zero:
- source/runtime/frontend/content/test/prompt/provider/model/config/secret edits;
- API/frontend deploy;
- DB/schema/RPC/migration/history repair/backfill;
- Storage mutation/upload/delete;
- Production access/deploy;
- existing/preserved game access/reset/mutation;
- direct API gameplay substitute;
- retry/regeneration/sample-until-pass;
- second fresh game;
- new branch/PR/CURRENT_TASK file;
- OWNER_READY claim.

Normal visible commits in the single fresh game are the only allowed gameplay writes.

## 12. Severity / stopping

At first deterministic P0/P1, STOP and preserve the fresh game read-only. Do not patch product in the same task.

Known general-image variety limitation is P2 unless it causes a concrete wrong-image/routing P1. Continue the mandatory functional lanes despite this known P2 so the routing boundary is actually tested.

If no P0/P1 occurs and all mandatory functional lanes complete, success terminal may be GREEN while explicitly carrying the M-CATALOG-002 P2 gap.

## 13. Terminal report contract

Report exactly:
- start/final main SHA and proof no executable/content drift;
- TEST API/frontend versions and deploy counts;
- browser DOM/screenshot/network readiness;
- exact valid Setup values and one-submit proof;
- fresh game ID;
- ordinary heroine turn: literal input, committed heroine, `/media/image` request pool/heroine, response image ID, visible image;
- non-occurring adult lane: exact literal, Story non-occurrence proof, media request/result, false-sex result;
- adult positive route: any S1 setup operation if used, exact supported literal, Story evidence the act actually occurred, sex request/response image ID and manifest membership;
- de-escalation literal, Story stop proof, post-stop media result;
- deliberate refresh/re-entry result and duplicate count;
- any natural media failure and proof Story/Commit survived; if none occurred, say not naturally encountered and rely only on frozen deterministic fail-open tests as supporting evidence;
- M-CATALOG-002 quality assessment, explicitly noting 1 general image per heroine;
- browser timeout/reattach/resend counts;
- all forbidden write/deploy/Production/preserved-game counts;
- P0/P1/P2/P3 findings.

Success:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_FUNCTIONAL_GREEN_AWAITING_OPERATOR_REVIEW`

Product blocked:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

Browser-control blocked:
`IMAGE_MEDIA_LIVE_ACCEPTANCE_BROWSER_CONTROL_BLOCKED_AWAITING_OPERATOR_REVIEW`

Finish by changing only this same `docs/ops/CURRENT_TASK.md` lifecycle to `WAITING_REVIEW`, posting exactly one terminal report to Issue #68, then STOP. Do not self-register another task.

## Terminal execution report

`IMAGE_MEDIA_LIVE_ACCEPTANCE_PRODUCT_BLOCKED_AWAITING_OPERATOR_REVIEW`

`OUTCOME: SUPERSEDED_BY_OWNER_PRIORITY_CORE_P1_REVIEW`

- Start/final main SHA: `3ffc6abc8ae258f9483a74f4560b1add0390429f` / `3ffc6abc8ae258f9483a74f4560b1add0390429f`. No source, runtime, frontend, content, test, prompt, provider, model, config, secret, deploy, DB, or storage drift occurred; only this lifecycle file was changed.
- TEST executable: API `game-proxy-company-r3` `4f8e8697-7b9e-4d91-8a50-35463309ce4a`; frontend `gamebuilder-company-r3` `af6c13bf-ef57-40cb-a4f0-e3569b301bc5`. Deploy count: 0.
- Preflight: public frontend DOM and screenshot usable; CDP Network observation usable; `/api/r3/catalogs` read-only check was 200 with 102 entries (5 general + 97 sex). Browser readiness passed before game creation.
- Setup: exactly one fresh visible Setup submit, with valid values `김도현`, age `30`, height `180`, weight `75`, penis length `15`, `brand_strategy`, `intern`, and first visible body/speech options (`balanced`, `polite`). Fresh game: `ebc440ea-5f2e-41dc-8333-12cedc1ad772`.
- Opening: committed Turn 0 only, with four choices and visible image request `GET /api/r3/games/ebc440ea-5f2e-41dc-8333-12cedc1ad772/media/image?character_id=heroine5&pool=general...`; response 200; visible image was `https://fmcrspgxstsmxxsmkeee.supabase.co/storage/v1/object/public/Image/Heroine5/may_main.jpg` (`heroine5` general). Opening context after reattach contained exactly one turn (`turn_number: 0`, empty literal action, four choices); no duplicate commit.
- Ordinary lane attempt: one visible literal only: `명찰을 확인하고 서원희 차장에게 다가가 정중히 출근 인사를 하며 오늘 업무와 자리 안내를 여쭙는다.`. The single POST was sent once with action id `e0748f8f-438c-4465-b3b8-ee183114d2cb`, `expected_turn: 1`, and exact UTF-8 literal in `postData`. No response, `loadingFailed`, or `loadingFinished` event arrived during 35 seconds of observation; UI remained Turn 0 with the original Story and enabled input. One allowed read-only reattach to the same URL returned context 200 and again proved only Turn 0. No resend/retype occurred. This product/API block prevented reaching a committed ordinary heroine turn and all subsequent lanes.
- Lane B non-occurring adult intent: not run because the single-game run stopped at the first deterministic product block; no false-sex judgment made.
- Lane C adult positive route: not run; no S1 operation and no adult instruction.
- Lane D de-escalation: not run.
- Refresh/re-entry acceptance: the one allowed read-only reattach was diagnostic recovery after the hung action, not a retry; it produced no duplicate Story/Commit and preserved non-sex Turn 0. The mandatory post-de-escalation refresh was not run because no adult lane was reached.
- Natural media failure: not naturally encountered. The observed `/media/image` opening request succeeded; no fail-open judgment beyond the frozen deterministic contract was made.
- M-CATALOG-002: remains a known P2 quality gap; current manifest has one general image per heroine. Opening used the manifest-backed `heroine5` general image; no variety conclusion was drawn.
- Browser recovery: timeout/reattach/resend counts `0 / 1 / 0` (one read-only reattach, no action resend or retype). DOM, screenshot, and network tooling remained available; therefore this is PRODUCT_BLOCKED, not browser-control blocked.
- Forbidden operations: source/content/test/config/provider/model edits `0`; deploys `0`; DB/schema/RPC/migration/history writes `0`; storage mutations `0`; Production access/deploy `0`; existing/preserved-game access or reset `0`; direct API gameplay substitute `0`; second fresh game `0`; retry/regeneration/sample-until-pass `0`; new branch/PR/CURRENT_TASK `0`; OWNER_READY `0`; intentional TTS toggle/call/replay `0` (TTS not judged).
- Findings: the observed pending TEST `/turn` behavior and P2 M-CATALOG-002 gap are partial evidence only. The terminal decision is owner-review supersession, not a GREEN claim and not permission to continue media lanes. The later Issue #68 operator intervention requires this safe stop because current-main review identified core P1 defects in navigation actor binding, active-CSA ordinary literal agency, institutional rule-change announcement/source semantics, unsupported S1 action agency, and CSA compatibility/precedence. No source patch is authorized in this acceptance task. P0/P3: none asserted by this run. Fresh game is preserved read-only for operator review.
