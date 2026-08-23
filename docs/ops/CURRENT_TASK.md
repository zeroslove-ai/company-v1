# Company — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-r3-story-canonical-player-identity-v1
Mode: FREEZE CANONICAL PROFILE/PERSISTENCE -> PROJECT EXACT PLAYER IDENTITY ON EVERY STORY TURN -> API TEST DEPLOY -> EXECUTIVE/JUNIOR LIVE IDENTITY ACCEPTANCE
Updated: 2026-08-24 03:22 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387578154`
Operator review: Issue #68 comment `5387600560`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Accepted baseline — freeze

Accepted executable/source before this cut:
- `ef52695668ab8548ed89b2eeb68c21ea95d836ba`

Current main before this registration:
- `43ef86b2de3f34193487cafcb84514536c856cbd`
- docs-only terminal descendant of the accepted executable lineage; holistic V2 made no product/source/deploy change.

Accepted TEST artifacts:
- API `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`
- Frontend `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`
- bare public frontend `https://gamebuilder-company-r3.zeroslove.workers.dev`

Accepted validation before this cut:
- full `npm.cmd test`: 531/531 PASS;
- CSA active-rule replacement UI + chronological APPLY/CHANGE/REMOVE GREEN;
- all previously frozen agency/navigation/reset/media/TTS/timeline behavior remains accepted unless this task directly disproves it.

Preserved games — READ ONLY, never reset/revise/retry/mutate:
- owner manual game `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`;
- holistic V1 failure fixture `f84aa0f0-6658-41a2-8fed-c307d4d2e219`;
- CSA repair fixture `f1285f4c-4719-4dc2-a18d-9fa5ad86d40c`;
- holistic V2 identity-failure fixture `4b050667-cca3-43a0-b483-d16c86a2873e`.

Use fresh disposable TEST games for mutable acceptance.

## 1. Exact proven product defect

Holistic V2 stopped correctly at the first decisive product failure.

Fresh Campaign A setup/readback was canonical:
- department: `신사업TF` (`new_business_tf`)
- position/rank: `임원` (`executive`)

At committed Turn 5 the visible Story authored the player's business card as:
- `서윤호 / 신사업TF 팀장`

This contradicts the committed canonical `임원` rank. No setup/readback mutation occurred, and the failure was not caused by player-action substitution.

Canonical repository content is unambiguous:
- `content/positions.json`: `executive -> 임원`, `tf_lead -> TF팀장`;
- `content/organization.json`: `new_business_tf -> 신사업TF`.

Source boundary at accepted executable:
- `runtime-r3/domain/memory.js::buildStoryContext()` resolves canonical `department` and `position` catalog entries on every call;
- however their human-readable names are emitted only inside `opening_contract.selected_department` / `selected_position`;
- ordinary Story turns receive raw `profile` IDs but no all-turn canonical player-identity label contract;
- `runtime-r3/server/provider.js` explicitly hard-binds player agency dimensions, but does not currently hard-bind the player's formal name/department/position identity on every ordinary turn.

Therefore this cut is a Story input/prompt identity-boundary correction. Do not change profile persistence or invent a second identity authority.

## 2. Frozen contracts — do not reopen

Freeze:
- setup/profile writer and DB persistence;
- department/position catalog content and IDs;
- first-arrival Opening behavior;
- player agency/target/action/refusal/self-state/topic/intent contract;
- canonical navigation/location/presence;
- Story-owned exact choices;
- Observer gameplay projection semantics;
- CSA chronology and repaired active-rule CHANGE UI;
- image/TTS/timeline/reset behavior;
- provider/model/configuration values.

Do NOT:
- change DB/schema/RPC/migration/RLS/grants;
- change `content/positions.json` or organization semantics merely to mask the problem;
- create a second rank/title inference system;
- rewrite Story output after generation with regex/string replacement;
- reject and regenerate Story because a rank looks wrong;
- add retry/regeneration/second LLM/semantic classifier;
- change provider/model/temperature/token/timeout/config/secrets;
- modify Production or preserved games.

Expected source boundary:
- `runtime-r3/domain/memory.js`;
- `runtime-r3/server/provider.js`;
- focused tests only as required.

Frontend should not need a source change.

## 3. Mandatory pre-edit trace

Before editing, prove and record:
1. `content/positions.json` exact canonical position mapping including `executive -> 임원`, `tf_lead -> TF팀장`, `intern -> 인턴`;
2. `content/organization.json` exact canonical department mapping including `new_business_tf -> 신사업TF`;
3. failing fixture remains read-only and its canonical readback profile is still `new_business_tf/executive`;
4. `buildStoryContext()` already resolves `department` and `position` labels but only includes those labels under Opening-specific fields;
5. an ordinary-turn Story payload contains raw `profile.position_id` / `department_id` but lacks an explicit all-turn canonical label boundary;
6. Opening currently has stronger rank preservation language than ordinary turns;
7. no later reducer/Observer step mutates the player's canonical profile to `팀장`.

If any of these are false and a different first boundary is proven, STOP and report before broadening the patch.

## 4. Correction contract — canonical player identity on every Story turn

Project one bounded canonical identity object into `buildStoryContext()` for BOTH Opening and ordinary turns.

Preferred shape may be named `canonical_player_identity` or equivalent and must include only server-resolved canonical facts, e.g.:

```js
{
  name: state.profile?.name ?? null,
  department: {
    id: state.profile?.department_id ?? null,
    name: department?.name ?? null
  },
  position: {
    id: state.profile?.position_id ?? null,
    name: position?.name ?? null
  }
}
```

Do not derive formal rank/title from department names, NPC roles, scene context, seniority stereotypes, or model inference.

Add an explicit all-turn `player_identity_contract` or equivalent hard-boundary statement. It must establish:
- canonical player name, department, and formal position/rank are authoritative Story facts on every turn;
- Story must not replace, normalize, downgrade, upgrade, or invent a different formal department/rank/title;
- if Story chooses to render or mention an identity artifact/reference — business card, employee badge, introduction, signature, formal title/address, organizational listing — it must use the exact canonical labels supplied in `canonical_player_identity`;
- `임원` must never become `팀장`, `TF팀장`, `대리`, `인턴`, or another invented formal rank unless a future explicit product mechanic changes the canonical profile; no such mechanic exists in this cut;
- similarly, a canonical `인턴` must not be promoted merely because the narrative context seems senior;
- ordinary descriptive words that are not formal player rank/title must not be over-policed, but any formal player identity assertion must match canonical facts.

Update the Story system/product prompt narrowly so it treats the supplied canonical identity contract as a hard boundary alongside player agency.

Do not require Story to repeat the player's rank every turn. The rule applies whenever Story mentions it.

## 5. Keep one identity authority

The canonical source remains:
`committed profile IDs -> repository content catalog -> bounded Story context labels`.

Requirements:
- do not add a durable duplicate `position_name`/`department_name` writer to DB state;
- do not let client/frontend become identity authority;
- do not parse rank back out of Story;
- do not let Observer overwrite player identity;
- preserve raw `profile` in context for existing consumers;
- Opening `selected_department` / `selected_position` must remain coherent with the same canonical identity values, preferably derived from the same local objects to avoid future drift.

If a legacy/invalid profile ID cannot resolve a catalog label, do not invent one in prompt construction. Preserve existing structural validation/fail-open behavior; do not broaden this task into legacy migration.

## 6. Deterministic regressions

Add focused tests proving at minimum:
1. ordinary-turn `buildStoryContext()` for `new_business_tf/executive` includes exact canonical department `신사업TF` and position `임원` labels;
2. Opening and ordinary turns expose the same canonical identity labels;
3. `brand_strategy/intern` exposes `브랜드전략팀/인턴`, proving the contract is not executive-specific;
4. player name is preserved exactly in canonical identity;
5. the all-turn identity contract explicitly forbids alternate formal rank/title assertions;
6. Story provider ordinary-turn request payload includes the canonical identity object/contract, not only Opening requests;
7. Opening's existing first-arrival/rank contract remains present and consistent;
8. recent turns, location, actors, active rules, player-agency contract, choices, and CSA pending operation context remain unchanged by identity projection;
9. no output post-processor/regex replacement/retry path is introduced;
10. Observer does not gain player-rank mutation authority;
11. existing executive and junior setup/profile tests remain GREEN;
12. agency/navigation/CSA/media/TTS/timeline frontend/backend contracts remain GREEN.

Run:
- focused R3 memory/provider/opening/profile tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

Do not weaken existing tests to accept rank drift.

## 7. TEST deployment

Expected affected artifact: API only.

If only runtime/backend/test source changes:
- deploy exact corrected source to TEST `game-proxy-company-r3`;
- record new API Worker version;
- keep frontend exactly `gamebuilder-company-r3` version `71416b75-9cca-45ee-9b32-7cf209f16395`;
- do not redeploy frontend merely for symmetry.

No Production.
No migration/schema/RPC.
No provider/model/config/secret change.

## 8. Mandatory bare-public acceptance — executive identity

Use only bare public frontend:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override.
No storage preseed.
No direct gameplay API substitute.
No retry/regeneration.

Create a NEW disposable game with:
- department `신사업TF` / `new_business_tf`;
- position `임원` / `executive`;
- a normal fresh player name.

Run visible Setup -> Opening -> at least **6 ordinary committed turns**.

The sequence must naturally include identity exposure without supplying the expected rank text in the literal itself. Include at minimum:
- one action that causes the player to inspect the newly issued business card or employee badge, e.g. `새로 지급받은 명함에 적힌 이름과 부서, 직급을 확인한다.`;
- one first-meeting introduction or business-card exchange with an NPC;
- one work/context action;
- one visible choice click;
- one free-form action after refresh/re-entry.

Require on every turn/readback:
- committed profile stays `new_business_tf/executive`;
- if Story prints player name, it equals canonical player name;
- if Story prints player department, it is `신사업TF`;
- if Story prints formal rank/title, it is `임원` and never `팀장`, `TF팀장`, `대리`, `인턴`, or another invented rank;
- business card/badge/introduction/signature identity, when shown, uses the same canonical labels;
- no identity correction is performed client-side after Story arrival;
- normal choices/input/agency remain usable;
- no blocking console/network error.

Refresh/re-enter after at least Turn 3, then continue. Canonical profile and Story identity must remain coherent after refresh.

If Story avoids mentioning a requested identity field, that is not itself rank drift; however the explicit card/badge inspection action should give a reasonable opportunity to verify all three identity fields. Do not regenerate solely to force a different wording.

## 9. Mandatory bare-public acceptance — junior counterexample

Create a separate NEW disposable game with:
- a low/junior canonical position, preferably `인턴`;
- a valid canonical department such as `브랜드전략팀`.

Run Opening + at least **3 ordinary committed turns** including:
- an identity artifact/intro action that does not include the expected rank text in the literal;
- one NPC interaction;
- one ordinary follow-up.

Require:
- committed profile remains the selected junior profile;
- Story does not promote the player to 팀장/임원 or any different formal position;
- when formal identity is mentioned it uses exact canonical labels;
- first-arrival framing remains valid;
- no executive assumptions leak into this game.

## 10. Scope acceptance / failure handling

GREEN only if:
- the pre-edit trace confirms the ordinary-turn identity-context gap;
- all-turn canonical identity labels are present in Story input;
- hard-boundary prompt language covers formal player identity references;
- no post-hoc output rewrite or regeneration path is added;
- focused/full/syntax/diff tests pass;
- API-only TEST deployment succeeds if backend changed;
- fresh executive live probe preserves `신사업TF / 임원` through card/badge/intro references and refresh;
- fresh junior probe preserves its own exact canonical rank/department;
- no regression in ordinary Story/choices/agency/navigation/CSA/media/timeline surface is observed.

On any deterministic product failure:
- preserve the fresh fixture;
- capture literal action -> request/context evidence -> Story -> committed/readback identity;
- STOP `FAILED_PRODUCT`;
- do not broaden into another subsystem or retry to manufacture a pass.

Do NOT claim owner-ready.

If GREEN, stop at WAITING_REVIEW. The next operator task will restart the full holistic owner-style long-play from NEW clean campaigns. Do not resume holistic V2 fixture `4b050667-cca3-43a0-b483-d16c86a2873e`.

## 11. Terminal protocol

At completion report:
- status `WAITING_REVIEW` / `FAILED_PRODUCT` / `BLOCKED_CONTRACT`;
- source SHA, final main SHA, final CURRENT_TASK blob SHA;
- exact changed files;
- pre-edit identity-boundary trace;
- focused/full/syntax/diff results;
- TEST API/frontend versions;
- fresh executive/junior fixture IDs;
- canonical profile readbacks before/after relevant turns and refresh;
- exact Story snippets sufficient to prove rank/department/name coherence without excessive quoting;
- whether any alternate formal rank appeared;
- deployments/source/config/DB operations performed;
- remaining defect if any.

Overwrite this SAME `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW` in place and post the terminal report to Issue #68.
Stop. Do not create or start the next task.

## Terminal result — WAITING_REVIEW

- Source branch: `company-r3-story-canonical-player-identity-v1`
- Source SHA: `8199c8b7b4b86ac936b9785b19f2340a40336ef1`
- Source PR: Draft PR #101
- TEST API: `game-proxy-company-r3@53a91cb4-9317-4198-8d7c-52a9e8e34571`
- TEST frontend unchanged: `gamebuilder-company-r3@71416b75-9cca-45ee-9b32-7cf209f16395`
- Fresh executive game: `a78b91bd-4216-4e31-91ab-fd2705f0a99c`; setup/readback and every post-save view remained `서윤호 / 신사업TF / 임원` through Opening + 6 ordinary turns, including refresh after Turn 3 and free input after refresh. Play History showed Opening + Turns 1–6.
- Fresh junior game: `6b8ba038-50f0-408b-8210-20fed28bd0bc`; setup/readback and every post-save view remained `홍길동 / 브랜드전략팀 / 인턴` through Opening + 3 ordinary turns. Play History showed Opening + Turns 1–3.
- Focused identity/opening/turn tests: 44/44 PASS. Full `npm.cmd test`: 536/536 PASS. Changed JS/MJS syntax checks and `git diff --check`: PASS.
- Live evidence: `.tmp/company-r3-story-canonical-player-identity-v1-live-evidence.md`.
- Preserved failure fixture `4b050667-cca3-43a0-b483-d16c86a2873e` was not opened, reset, or modified. No Production, migration, frontend deployment, provider/model/config change, retry, or regeneration.
- No alternate formal rank appeared in either fresh game. Stop for owner/operator review; do not claim owner-ready and do not start the next task.
