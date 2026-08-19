# Company v2 Product Canon (candidate, 2026-08-20)

Status: candidate binding canon, awaiting owner review. This document is the
output of `company-v2-product-canon-and-gap-matrix-v1`; it is not yet a
replacement for `CURRENT_TRUTH.md`.

## 1. Authority and conflict resolution

The order used for this audit was: the latest Issue #68 owner decision and
task registration; the product contracts; `CURRENT_TRUTH.md`; the clean v2
canon; repository content; the historical UI donor; then current v2 source,
migrations, and tests as an implementation audit. The current task and the
2026-08-19 clean-runtime owner decision are later than the older v1 narrative
contracts, so they control where they conflict.

Material conflicts resolved here:

1. `COMPANY_GAME_CONTRACT_V1.md` and `COMPANY_NARRATIVE_CONTRACT_V1.md`
   describe an older exact-four-choice wire contract. The current Phase 1
   owner decision is free-form player input with no active choices. The old
   choice contract is retained as historical evidence only; v2 must not render
   or require choices in Phase 1.
2. `CURRENT_TRUTH.md` and
   `COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md` preserve the clean v2
   server-owned spine, but do not authorize replacing the Company product with
   a minimal demo. Product identity, catalogs, setup, and presentation remain
   required.
3. The owner audit in Issue #68 comment `5348837128` supersedes the rejected
   source correction represented by closed PR #93. PR #93 is diagnostic
   evidence only and was not copied, cherry-picked, or used as an implementation
   base.
4. The current v2 implementation is evidence of gaps, not product authority.
   Static lists in `runtime-v2/domain/content.js`, demo provider prose, and
   reduced `frontend-v2` markup cannot override `content/*.json` or the donor
   contract.

## 2. Product identity and player experience

| Item | Binding requirement |
|---|---|
| Title | `상식개변: 회사편` |
| Genre | Company-life interactive fiction in a living workplace, not a productivity assistant, chatbot, or generic chat demo. |
| Premise | `상식개변` is a private, unfamiliar app known to the player. NPCs know the company, their work, and what occurs in the scene; they do not know the app's private premise unless the player reveals it. |
| Agency | The player literal action is authoritative input. The runtime may narrate consequences, but must not silently replace, complete, or reinterpret the requested action. |
| Primary UX | Rich streamed Story is the primary surface. Structured observation is a small post-Story projection, not a second narrative author. |
| Normal turn | The player enters one literal action, sees streamed Story, receives the committed observation/state and summary, and chooses the next free-form action. One server-owned request owns the turn lifecycle. |
| Phase 1 choices | No active choice buttons or choice requirement. Free-form input is the only active next-action path. |
| Loading | Story remains visible while streaming; no blocking overlay may cover the narrative. |

An opening must feel like entering the company's day, not opening a helpdesk.
It establishes location, time, registered people, workplace context, and first
impressions, then hands the next decision back to the player without inventing
an unrequested action.

## 3. Canonical content authority

The sole semantic source is the repository catalog under `content/`. v2 may
read it through a narrow adapter, but may not maintain shadow/demo lists in
runtime, frontend, SQL, or tests.

### 3.1 Edition

Source: `content/edition.json` at registration main SHA
`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`.

`edition_id=company-v1`, `title=상식개변: 회사편`,
`content_version=0.1.0-heroines-v1`, `scope=company`.

### 3.2 Heroines: exactly five registered actors

Source: `content/characters.json`; object `characters` has exactly 5 keys.

| ID | Name | Department | Position | Default location |
|---|---|---|---|---|
| `heroine1` | 서원희 | 브랜드전략팀 | 브랜드 전략 담당 | `brand_strategy_office` |
| `heroine2` | 윤민아 | 브랜드전략팀 | 브랜드 전략 담당 | `brand_strategy_office` |
| `heroine3` | 김제나 | 브랜드전략팀 | 브랜드 전략 담당 | `brand_strategy_office` |
| `heroine4` | 한리브 | 브랜드전략팀 | 브랜드 전략 담당 | `brand_strategy_office` |
| `heroine5` | 이메이 | 브랜드전략팀 | 브랜드 전략 담당 | `brand_strategy_office` |

Each actor's prompt card is the source projection of identity, appearance,
personality, speech, addressing, distinctive traits, and CSA style. IDs are
stable; names are not an alias-inference mechanism.

### 3.3 General NPCs: exactly eight profiles

Source: `content/general_npcs.json`; object `profiles` has exactly 8 keys.

| ID | Name | Role | Department |
|---|---|---|---|
| `general_park_jungwoo` | 박정우 | 브랜드전략1팀 팀장 | `brand_strategy` |
| `general_lee_minseok` | 이민석 | 디자인팀 대리 | `design` |
| `general_choi_yujin` | 최유진 | 재무팀 사원 | `finance` |
| `general_seo_hyejin` | 서혜진 | 인사팀 과장 | `hr` |
| `general_oh_sehoon` | 오세훈 | 시설·보안 담당 | `operations` |
| `general_yoon_taekyung` | 윤태경 | 신사업TF 프로젝트 담당 | `new_business_tf` |
| `general_jung_daeun` | 정다은 | 마케팅 인턴 | `marketing` |
| `general_han_jiseok` | 한지석 | 경영지원팀 차장 | `management_support` |

### 3.4 Map: exactly 24 locations

Source: `content/map.json`; `locations` has 24 entries and `floors` has 5.
The finite location IDs are:

`lobby`, `elevator_hall`, `archive_room`, `hr_office`, `finance_office`,
`training_room`, `office`, `team_office`, `small_meeting_room`,
`meeting_room`, `brand_strategy_office`, `brand_strategy_meeting_room`,
`marketing_office`, `pantry`, `employee_lounge`, `design_office`,
`project_room`, `cross_team_space`, `cross_dept_meeting_room`,
`audit_office`, `executive_office`, `large_meeting_room`,
`executive_meeting_room`, `project_report_room`.

The adapter must preserve each location's source name, description,
department, type, floor, adjacency, and default NPC IDs. A two-location demo
map is not an acceptable substitute.

### 3.5 Organization and setup catalogs

Source: `content/organization.json`, `positions.json`, `body_types.json`, and
`speech_styles.json`.

- Company: `luminous_brand_group` / `루미너스 브랜드 그룹`.
- Six organization departments: `brand_strategy` 브랜드전략팀, `audit` 감사실,
  `human_resources` 인사팀, `new_business_tf` 신사업TF,
  `finance_planning` 재무기획팀, `public_relations` 홍보팀.
- Six general-NPC departments: `design` 디자인팀, `finance` 재무팀,
  `hr` 인사팀(현업), `operations` 시설·보안, `marketing` 마케팅팀,
  `management_support` 경영지원팀.
- Four positions: `intern` 인턴, `assistant_manager` 대리,
  `tf_lead` TF팀장, `executive` 임원.
- Five body types: `balanced` 균형 잡힌 체형, `muscular` 근육질,
  `athletic` 탄탄한 체형, `slender` 호리호리한 체형,
  `large_frame` 큰 체격.
- Six speech styles: `polite` 정중한 존댓말, `calm` 차분한 말투,
  `friendly` 친근한 말투, `playful` 능글맞은 말투, `cold` 냉정한 말투,
  `rough_yangachi` 거친 양아치 말투.

### 3.6 CSA product definitions

Source: `content/csa_presets.json`, schema/version 2. It contains 3 selector
options (`female_employee`, `male_employee`, `company_employee`), 3 strengths
(`weak`, `medium`, `strong`), 5 categories (`posture`, `contact`, `clothing`,
`sexual_action`, `world_behavior`), 44 items, and 3 authority tiers.

These definitions are product canon even while active mutation is deferred.
Their IDs, scopes, triggers, mode, required state, and authority tier must be
preserved. The current v2 Phase 1 does not apply CSA mutations and must not
pretend that a disabled control changed durable state.

## 4. Player setup and profile contract

The established Company setup must be represented deliberately rather than
replaced by `playerName` plus prompt defaults.

| Field | Setup source | Classification | Visible | v2 persistence decision |
|---|---|---|---|---|
| name | user text | user-entered, static creation profile | yes | durable in game creation profile |
| department | organization catalog selection | user-selected catalog ID | yes | durable ID, resolve name from catalog |
| position | positions catalog selection | user-selected catalog ID | yes | durable ID, resolve name from catalog |
| age | user input/validation | static profile, sensitive prompt context | controlled | durable profile value with prompt policy |
| height | user input | static profile, sensitive prompt context | controlled | durable profile value |
| weight | user input | static profile, sensitive prompt context | controlled | durable profile value |
| body type | body-types catalog selection | user-selected catalog ID | yes/controlled | durable ID, resolve label from catalog |
| speech style | speech-styles catalog selection | user-selected catalog ID | yes | durable ID, resolve label from catalog |

The profile is distinct from mutable turn state. Location, posture, clothing,
meters, active CSA, relation/event memory, and time are not setup defaults;
they require explicit state ownership. Sensitive fields are included only in
the prompt projection justified by the current turn and must not be leaked to
unrelated UI or NPC context.

## 5. Opening, Story, and observation contracts

### Opening

Setup resolves catalog IDs and creates a durable creation profile. Opening then
reads the canonical company day/time/location, registered actor roster, and
the private app premise. It may select relevant actors from the registered
roster, but may not invent a new semantic NPC or use generic assistant/help
framing. It shows why the player is in this company scene, introduces actual
workplace/social context, and returns agency to the player. Phase 1 has no
choice buttons and does not auto-complete a player action.

### Ordinary Story context

The Story provider receives exactly the following bounded projection:

1. the literal player action verbatim;
2. current canonical location ID, name, description, and relevant adjacency;
3. present/relevant registered actor IDs and names;
4. compact prompt cards for relevant heroines and role/department facts for
   relevant general NPCs;
5. the applicable player profile projection (not unrelated sensitive fields);
6. current company time/day;
7. recent raw turn continuity and summaries;
8. the current `상식개변`/CSA background state allowed by the phase;
9. hard rules preserving actor identity, player agency, company-life framing,
   and no assistant/meta narration.

Story output is streamed and remains the only narrative author. Extract or a
small typed post-Story observation may project scene/time/active actors,
summary, and Mind Monitor evidence. It must never invent a new character,
rewrite the literal action, create choices in Phase 1, author a second
narrative, or manufacture physical/sexual/relation state without exact Story
evidence. Deterministic reducer logic may normalize a typed observation but
cannot promote missing provider evidence into gameplay truth.

## 6. Presentation donor parity contract

The donor is exact commit
`f4b228f14d3a0e4446b0ae62e441ed659d3609ca`, under
`src/frontend/pages/`. The inventory is `index.html`, `styles.css`, `app.js`,
`config.js`, `narrative.js`, `render.js`, `sse.js`, `state.js`,
`view-model.js`, with API/controller behavior audited separately from
presentation. The donor HTML includes these semantic surfaces: game header
and title/day/time/turn/connectivity; status/error banner; story history and
current streaming turn; current action; character/current scene state; focal
character; Mind Monitor; player situation; direct input/action controls;
choice surface (historical/disabled in current Phase 1); stream status;
resume/history/feedback/apps utility actions.

### Element status for current Phase 1

| Donor surface | Status | Binding behavior |
|---|---|---|
| title, day/time, turn, connection | ACTIVE NOW | Preserve header information architecture. |
| Story history/current stream/action | ACTIVE NOW | Story is primary and streaming remains visible. |
| free-form action input and submit | ACTIVE NOW | Literal text is sent unchanged. |
| current character/scene and posture/position | ACTIVE NOW | Render canonical observation/state. |
| character image/media surface | DEFERRED/HIDDEN | Keep a reserved non-fake surface; activate only in later phase. |
| Mind Monitor tabs/cards/empty state | ACTIVE NOW | Preserve surface, exact evidence only; no physical-reaction field. |
| player profile/situation/state | ACTIVE NOW | Show approved setup/profile and current state separately. |
| company map/navigation | PRESENT BUT DISABLED/LOCKED | Keep discoverable parity surface; Phase 1 does not mutate navigation. |
| `상식개변` app/tool entry | PRESENT BUT DISABLED/LOCKED | Preserve entry/presentation; no active CSA transaction in Phase 1. |
| turn summary/history | ACTIVE NOW | Summary and history are distinct from live Story. |
| feedback | DEFERRED/HIDDEN | No fake submit path until v2 feedback contract exists. |
| reset | ACTIVE NOW | Safe game-local reset may be exposed only with a real v2 owner. |
| NPC find/search | DEFERRED/HIDDEN | No fabricated search result or catalog shadow. |
| TTS | DEFERRED/HIDDEN | Later nonblocking sidecar; preserve slot if donor requires it. |
| image generation | DEFERRED/HIDDEN | Later sidecar; no provider/config change here. |
| old choice buttons | REMOVED BY LATEST OWNER DECISION | Do not render or require active choices in Phase 1. |

Desktop information order is header/status, Story/history, right-side
character/Mind Monitor/player state, then action input and utilities. Mobile
collapses to header, Story/history, action input, current scene/character,
Mind Monitor, player state, progress/summary, then utility surfaces. The
implementation may change controller wiring but not this product/information
architecture. It must not replace it with a minimal blank shell or blocking
loading screen.

## 7. Persistence and DB product contract

The clean v2 durable boundary is `company_v2_games`, `company_v2_state`,
`company_v2_turn_jobs`, and `company_v2_turns`. Current migrations and RPCs
provide isolated game creation, opening, turn-job ownership, Story/observation
commit, attempt fencing, reconnect, and durable turn history. That isolation
and server-owned commit spine is sufficient infrastructure and must remain.

The current schema is **not sufficient for full approved product setup/profile
parity**: `createGame` and `createInitialState` primarily carry `playerName`,
while the product requires department, position, age, height, weight, body
type, and speech style plus explicit profile/state separation. It is also not
sufficient to claim active map/CSA/clothing/physical/sexual/relation features
without durable owners.

| Product data | Authority/classification | Required v2 treatment |
|---|---|---|
| edition, characters, NPCs, map, org, positions, body/speech, CSA definitions | static content lookup | Catalog adapter only; never duplicate in mutable rows. |
| name, department, position, age, height, weight, body type, speech style | game creation profile | Additive profile payload/columns or a versioned profile object with validation and RPC ownership. |
| location/time/active actor/posture/clothing and approved meters | mutable turn state | Add only fields with explicit reducer and observation authority. |
| raw action, Story, parsed blocks, summary, observation evidence | turn history | Preserve immutable turn row and exact literal action. |
| CSA mutation, clothing progression, sexual gauges, relations/events, image/TTS/feedback | deferred phase state | Add only in their authorized phase, never prompt-only or fake UI state. |

Future implementation tasks must first specify additive migration/RPC changes,
field ownership, validation, and readback proof. This audit writes no SQL and
applies no migration.

## 8. Clean runtime spine to preserve

Keep the following v2 infrastructure unless an owner-reviewed product cut
proves a narrower change:

`literal action -> one server-owned turn request -> Story SSE -> one small
typed post-Story observation -> deterministic reducer -> one atomic v2 durable
commit -> next readback`.

Also preserve physically isolated v2 code, one canonical job per game+turn,
same-job reconnect, explicit failed-attempt retry only, attempt fencing,
bounded progress/subrequest budget, and one authoritative durable commit. The
browser must not own Story/Extract/Commit stage progression. These are
implementation invariants, not permission to omit Company catalogs, setup,
presentation, or product behavior.

## 9. Phase map

| Feature | Phase 1 status | Later requirement |
|---|---|---|
| Free-form player input | ACTIVE NOW | Literal action fidelity remains binding. |
| Choice buttons | REMOVED | Do not revive old exact-four contract without a new owner decision. |
| CSA mutation | DEFERRED | Phase 2 transaction, non-gameplay turn. |
| Map/navigation | PRESENT BUT DISABLED/LOCKED | Phase 2 exact catalog navigation. |
| Four-slot clothing | DEFERRED | Phase 2 exact state mutation/readback. |
| Physical state | DEFERRED | Phase 2 observation/state contract; no invented reaction field. |
| Sexual gauges/progression | DEFERRED | Phase 3 only if owner retains it. |
| Relationship/event memory | DEFERRED | Later explicit v2 state owner. |
| Feedback revision | DEFERRED | Later v2-native contract. |
| Image | DEFERRED/HIDDEN | Nonblocking sidecar after earlier acceptance. |
| TTS | DEFERRED/HIDDEN | Nonblocking sidecar and `speaker_id` binding later. |
| NPC search | DEFERRED/HIDDEN | Later catalog-backed feature. |
| Player inner thought | DEFERRED/HIDDEN | Separate from Mind Monitor; never add to MM implicitly. |

## 10. Product acceptance gates

Before source merge, require direct evidence for all of the following:

- exact catalog parity and no fabricated semantic lists;
- full active Setup/profile parity and durable authority for every field;
- Opening premise, registered identity, location, and agency parity;
- Story prompt context contains the correct relevant canon and literal action;
- typed observation cannot invent identity, action, choice, or unsupported state;
- every donor presentation component is accounted for by the parity table;
- no old frontend coordinator owns a turn stage;
- v2 DB has a real owner for each approved mutable field;
- disabled/deferred controls cannot claim fake functionality;
- Story remains visibly streaming without a blocking overlay.

Before owner handoff, require exact reviewed source/deploy identity, fresh
Setup and Opening, one bounded automated turn, DB/SSE readback, and actual
Story/product inspection. A passing structural test count is not sufficient.

## 11. Source inventory used

- Authority: `CURRENT_TRUTH.md`, `AGENTS.md`, audit files `09_CURRENT_TRUTH.md`
  and `10_SOLE_WRITER_DECISION.md`.
- Product contracts: `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`,
  `docs/COMPANY_PROMPT_V2_DESIGN.md`, `docs/COMPANY_GAME_CONTRACT_V1.md`,
  `docs/COMPANY_NARRATIVE_CONTRACT_V1.md`.
- Clean v2: `docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`.
- Static catalogs: all eight JSON files in `content/` named above.
- Donor: `src/frontend/pages/*` at
  `f4b228f14d3a0e4446b0ae62e441ed659d3609ca`.
- Audit implementation: `runtime-v2/*`, `frontend-v2/*`,
  `supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql`,
  `_00300_stuck_turn_closure.sql`, `_00400_attempt_fencing.sql`,
  `_00500_acl_closure.sql`, and `_00600_choice_contract_closure.sql`.

This candidate does not alter any of those sources.
