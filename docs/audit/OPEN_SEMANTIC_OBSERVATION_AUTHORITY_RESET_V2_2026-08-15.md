# Company v1 Open Semantic Observation Authority Reset — V2

Status: architecture audit, implementation not authorized

This document is a corrected replacement audit. It does not overwrite
`OPEN_SEMANTIC_OBSERVATION_AUTHORITY_RESET_2026-08-15.md`.

## 1. Scope, evidence, and conclusion

The question is not whether a list is finite. The question is whether a
current product, UI, identity, structural-integrity, transaction, or narrow
mechanical consumer requires it. A finite setup catalog or registered NPC ID
can therefore be canonical product content, while a finite event/relation or
physical-action taxonomy can still be an invalid semantic authority.

Evidence used in this audit:

- current source and tests at docs-only descendant `ba456e4b8c9a1634f92fd0e2c4d0c446da5d1ab3`;
- `content/*.json`, active API/engine/frontend callers, and migration source;
- current-truth/operator-verified TEST catalog facts (read only);
- deployed Worker context/history read only for preserved game
  `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- preserved manual-game response: committed turn 7, save revision 9,
  seven history records, compact clothing state, active CSA rules, empty
  relation/event/sexual ledgers, empty per-turn summaries, and corrupted
  overall summary.

The direct Supabase catalog was not queried in this lease because local psql
and the Supabase CLI are unavailable and no database credential is assumed.
The database sections below distinguish migration/source evidence from
operator-verified live facts and do not claim a new live catalog read.

No implementation is authorized by this document. The recommended first cut
is a deletion-first source/normalizer/reducer cut after a contract fixture and
caller proof are accepted; it is not an additive ledger-only implementation.

## 2. Product model in plain language

The player configures a deliberate Company setup: department, position, body
type, speech style, and an opening selection from registered Company NPCs.
Those are product choices. `content/organization.json`, `positions.json`,
`body_types.json`, `speech_styles.json`, `characters.json`, and
`general_npcs.json` are content inputs, not narrative meaning taxonomies.

Story owns the raw narrative presentation: scene prose, dialogue, acting,
thought, and four provider-authored literal choices. Extract observes what the
Story actually states, with exact Story evidence, and may produce narrow
projections needed by the product. Extract must not be forced to classify all
meaning into a closed event, relation, emotion, posture, sexual-action, or
CSA-physical vocabulary.

The server owns identity, action ownership, expected turn, exact evidence
provenance, transactionality, replay/idempotence, structural save validity,
scene integrity, and narrow deterministic projections with a proven consumer.
`commit_company_turn` remains the normal durable save/turn boundary.

The UI requires current scene/location/presence, registered character
identity, choices, story/parsed blocks, summary/readback, and compact clothing
continuity. It reads relationship/stat/CSA/media projections as product
display where present; those displays must not become the only storage for
open narrative facts. Image and TTS selection are presentation adapters.

## 3. End-to-end authority trace

| Stage | Current producer and consumer | Authority finding |
|---|---|---|
| Setup input | `src/frontend/pages/app.js` reads `CATALOGS`; `pages/setup.js` validates; `src/api/turn-routes.js` validates again; `src/api/edition.js` exposes content JSON | Product catalogs are needed, but frontend and API copies are duplicate authorities; server validation must remain structural/security-boundary validation, not semantic Story gating. |
| Opening plan | `src/engine/player-setup.js`, `opening-prompt.js`, `turn-routes.js`, setup/opening RPCs | Stable registered IDs and four literal choices are structural/product contracts. SQL has duplicate catalog/heroine arrays. |
| Story prompt | `src/engine/story-prompt.js`, `story-wire-protocol.js`, provider | Story raw text is the narrative authority; registered speaker/scene identity is structural. |
| Story wire/parser | `src/engine/narrative-parser.js` and fresh protocol readers | Protocol blocks are structural. Parser vocabulary must not become a closed semantic universe. |
| Extract prompt | `src/engine/extract-prompt.js` | Prompt currently describes closed physical/emotion/relationship/work/CSA domains and finite posture/clothing/sexual shapes; only narrow proven UI/mechanical projections should remain. |
| Extract normalizer | `src/engine/runtime-core/extract-observation.js`, `legacy-extract-adapter.js` | Current normalization rejects unknown keys/types and can drop facts that do not fit; this is the main semantic reset target. Legacy adapter is read-only compatibility until readers are removed. |
| Reducers | `observation-reducers.js`, `relation-event-reducer.js`, `relationship/reducer.js`, sexual ledger/validator, scene reducer | Scene/identity/evidence/turn guards are structural. Relation/event/sexual/intimacy lists are competing semantic authorities unless a concrete UI/mechanical consumer proves a projection. |
| CSA | `csa/*`, `csa-commit-reducer.js`, planner/validator/mandatory enactment | Rule identity/lifecycle/app transaction may be mechanical. Physical command grammar and forced enactment must be removed or individually proved. Institutional rule state is not consent, affection, comfort, trust, or emotion. |
| Commit | `turn-routes.js` → `commit_company_turn`; setup/opening RPCs | Durable state, turn identity, replay, and structural validation remain server-owned. Semantic inference must not be added here. |
| Persistence/readback | `game_save`, `game_turns`, `game_actions`; `get_company_context`, history, replay | Existing save has many projections; readback must expose open facts to next Story/history, otherwise an open ledger is write-only. |
| Frontend | `src/frontend/pages/view-model.js`, `render.js`, `app.js`, character/CSA/media pages | Clothing, choices, scene, identity, summaries, and media have real readers. Current compact projections are not proof that every stored enum is needed. |

## 4. Corrected classification vocabulary

- `CONTENT_CATALOG_KEEP`: deliberate finite product/content choices or
  registered identities; one canonical source, duplicate copies removed when
  safe.
- `STRUCTURAL_KEEP`: identity, protocol framing, exact evidence, shape,
  ownership, turn/replay/idempotence, scene integrity, and transactionality.
- `UI_STATE_KEEP`: narrow state visibly/functionally consumed by UI and kept
  deterministic, with one writer and no erasure of richer facts.
- `MECHANICAL_PROVE_OR_REMOVE`: finite deterministic mechanics that survive
  only if a concrete current consumer and breakage proof exists.
- `SEMANTIC_REMOVE`: a finite list, regex, fallback, or ladder that defines
  arbitrary narrative meaning or drops valid observed facts.
- `LEGACY_READ_ONLY`: historical saved-data/replay reader only; no new write
  or validation authority.
- `DEAD_DELETE`: no live caller or obsolete tests/docs only.

## 5. Expanded finite-list and gate inventory

The following is an expanded caller-based inventory, not a proposal to delete
all finite values. Each row names the current owner and the effect of removal.

| # | Family / current location | Caller evidence | Removal impact | Disposition / canonical owner |
|---:|---|---|---|---|
| 1 | Departments in `content/organization.json` | `edition.js`, setup UI, `turn-routes.js`, `product-recovery.js` | Removes intentional setup choices | `CONTENT_CATALOG_KEEP`; content JSON is canonical; derive UI/API. |
| 2 | Positions in `content/positions.json` | same setup/recovery path | Removes intentional setup choices | `CONTENT_CATALOG_KEEP`; content JSON canonical. |
| 3 | Body types in `content/body_types.json` | setup UI/API and player recovery | Removes intentional setup choices | `CONTENT_CATALOG_KEEP`; content JSON canonical. |
| 4 | Speech styles in `content/speech_styles.json` | setup UI/API and Story context | Removes intentional setup choices | `CONTENT_CATALOG_KEEP`; content JSON canonical. |
| 5 | General-NPC departments in organization content | edition/master projection | Removes content labels only | `CONTENT_CATALOG_KEEP` if displayed/used; not a Story taxonomy. |
| 6 | `heroine1..heroine5` stable IDs | characters JSON, setup/opening, parser, scene, TTS/image/UI, save fixtures, SQL opening | Breaks identity, assets, voice, scene and replay references | `CONTENT_CATALOG_KEEP` + `STRUCTURAL_KEEP`; derive registered IDs from characters. |
| 7 | General NPC registry | `general_npcs.json`, edition, scene cast, prompt/parser/reducers | Breaks NPC identity and scene validity | `CONTENT_CATALOG_KEEP`/`STRUCTURAL_KEEP`; one registry projection. |
| 8 | Frontend setup catalog copy in `pages/catalogs.js` | `app.js`, `setup.js`, `view-model.js` | UI can use server edition instead | `DEAD_DELETE` after API-driven catalog proof; no independent list. |
| 9 | SQL department arrays in setup RPCs | `reserve_company_player_setup` and later replacement migrations | Security boundary may need ID validation, but duplicate semantic ownership causes drift | `MECHANICAL_PROVE_OR_REMOVE`; retain only structural/untrusted-input boundary or derive from canonical DB content. |
| 10 | SQL position arrays | setup RPCs | Same as row 9 | `MECHANICAL_PROVE_OR_REMOVE`; remove duplicate after safe boundary proof. |
| 11 | SQL body-type arrays | setup RPCs | Same as row 9 | `MECHANICAL_PROVE_OR_REMOVE`; remove duplicate after safe boundary proof. |
| 12 | SQL speech-style arrays | setup RPCs | Same as row 9 | `MECHANICAL_PROVE_OR_REMOVE`; remove duplicate after safe boundary proof. |
| 13 | SQL heroine arrays | opening bootstrap/setup RPCs | Structural registered-ID validation is needed; hardcoded copy drifts | `STRUCTURAL_KEEP` with one derived registry; delete duplicate arrays. |
| 14 | Scene v1 required key set | `readCanonicalSceneV1`, validator/gate | Missing required structural scene fields must fail | `STRUCTURAL_KEEP`; JS and DB exact same set. |
| 15 | Scene movement intent kinds | scene reducer/navigation route | Needed only to encode ephemeral navigation intent | `STRUCTURAL_KEEP` if route contract; do not treat as world fact taxonomy. |
| 16 | Parser block names `SCENE/DIALOGUE/THOUGHT/CHOICE/ACTING` | narrative parser and renderer | Breaks provider wire framing if removed | `STRUCTURAL_KEEP`; not semantic event taxonomy. |
| 17 | Speaker IDs / registered character IDs | parser, story projection, TTS, UI | Unregistered identity cannot safely become canonical speaker | `STRUCTURAL_KEEP`; registry-derived. |
| 18 | Choice exactly-four count | opening/turn route, DB opening RPC, UI buttons | Breaks button presentation contract | `STRUCTURAL_KEEP`/`UI_STATE_KEEP`; provider authors literals; no server prose fallback. |
| 19 | Deterministic choice fallback strings | `observation-reducers.js` | Removal preserves raw Story but may expose malformed provider output for review | `SEMANTIC_REMOVE`; fail-open must not author choices. |
| 20 | Choice metadata/type fields not rendered | route/save/UI audit | No product impact if no reader | `DEAD_DELETE` after reader proof. |
| 21 | Posture tokens `sitting/standing` | extract prompt/normalizer, UI posture display | Removing limits compact posture display, but opens narrative facts | `MECHANICAL_PROVE_OR_REMOVE`; not semantic authority; raw facts preserved. |
| 22 | Position label shape | Extract and render display | Removing only projection may lose a display | `UI_STATE_KEEP` only if UI requirement is proven; open position facts separate. |
| 23 | Clothing slots | `extract-prompt`, clothing state, view-model/render, preserved game | Removing loses visible continuity | `UI_STATE_KEEP`; one canonical writer; four slots only as projection. |
| 24 | Clothing states `worn/removed/open/unknown` | clothing projection and render | Current UI depends on compact display | `UI_STATE_KEEP` subject to slot/state consumer audit; unknown must not erase raw fact. |
| 25 | Sexual action type list | sexual ledger/validator and character display | May remove counters/display; does not remove raw narrative | `MECHANICAL_PROVE_OR_REMOVE`; no gate on arbitrary facts. |
| 26 | Intimacy ladder | `sexual-state/validator.js` guards/counters | Removing ladder changes old progression mechanic | `SEMANTIC_REMOVE` unless an explicit product progression reader proves it; never relationship authority. |
| 27 | Sexual ledger fields/directions | ledger and character display | Narrow product display may be affected | `MECHANICAL_PROVE_OR_REMOVE`; retain only consumed counters, preserve open facts. |
| 28 | Emotion mood vocabulary | Extract normalizer and view model | Removing improves arbitrary emotional observation | `SEMANTIC_REMOVE`; optional presentation projection only. |
| 29 | Relationship kinds `RELATION_KINDS` | extract normalizer, relation-event reducer, presentation | Current empty ledger shows taxonomy is not producing continuity | `SEMANTIC_REMOVE` for narrative authority; retain structural IDs/evidence only. |
| 30 | Relation states `started/ended` | relation-event reducer | Removes current lifecycle projection | `MECHANICAL_PROVE_OR_REMOVE`; keep only if actual product relation feature requires it. |
| 31 | General event types | relation-event reducer / ledger | Valid facts outside list are dropped | `SEMANTIC_REMOVE`; event evidence should be open text with provenance. |
| 32 | Event trigger states | extract/reducer/runtime | Restricts event interpretation | `SEMANTIC_REMOVE` unless a narrow deterministic timer mechanic proves it. |
| 33 | CSA rule/app IDs | CSA definition/app transaction/context/UI | Removes user-created rule identity | `CONTENT_CATALOG_KEEP`/`STRUCTURAL_KEEP`; user rule IDs remain opaque. |
| 34 | CSA active/inactive/paused/ended lifecycle | CSA transaction and UI | Breaks rule lifecycle | `STRUCTURAL_KEEP`/`MECHANICAL_PROVE_OR_REMOVE`; keep lifecycle, not physical narration. |
| 35 | CSA capacity/activation/applicability | CSA capability/applicability/planner | May break deterministic rule eligibility | `MECHANICAL_PROVE_OR_REMOVE`; keep only proven app mechanics. |
| 36 | CSA `execution_action` kinds | semantic contract, planner, mandatory enactment, Story projection | Forces narrative into finite bodily actions | `SEMANTIC_REMOVE` / `DEAD_DELETE` by caller proof; primary removal target. |
| 37 | CSA `posture_after` | execution policy/mandatory enactment | Forces physical pose after rule | `SEMANTIC_REMOVE` unless a real mechanical projection proves it. |
| 38 | CSA `RELATION_KINDS` coupling | CSA and relation-event reducer | Confuses rule compliance with relationship | `SEMANTIC_REMOVE`; institutional rule separate from affection/consent/trust. |
| 39 | Mandatory enactment / direct coverage | `mandatory-enactment.js`, csa commit reducer | Can synthesize success from player intent | `SEMANTIC_REMOVE` unless reduced to explicit rule transaction integrity. |
| 40 | Scene obligation finite behavior types | CSA planner/tests | Coerces Story facts into commands | `MECHANICAL_PROVE_OR_REMOVE`; default remove. |
| 41 | Image pool/tag allowlist | `turn-routes.js`, image API, image UI | Affects asset selection only | `CONTENT_CATALOG_KEEP`/`MECHANICAL_PROVE_OR_REMOVE`; media failure never blocks narrative memory. |
| 42 | Sexual image families (`oral`, `penetration`, etc.) | image selection/tests/media UI | Removes presentation asset choice | `CONTENT_CATALOG_KEEP` as media adapter; not action authority. |
| 43 | TTS speaker/present-NPC selection | TTS controller/UI | Removes audio selection | `UI_STATE_KEEP`/`MECHANICAL_PROVE_OR_REMOVE`; no narrative durability impact. |
| 44 | Save required keys | `validate_company_save_v1`, commit RPC | Breaks structural save/readback if removed | `STRUCTURAL_KEEP`; semantic values inside optional projections must be open/fail-open. |
| 45 | `csa_active` max count | DB validator | Capacity may be product mechanic | `MECHANICAL_PROVE_OR_REMOVE`; keep only if rule capacity is real. |
| 46 | `event_ledger` array shape | DB validator/context | Array shape is structural, event taxonomy is not | `STRUCTURAL_KEEP` shape; remove closed item validation. |
| 47 | Scene registered-location IDs | edition/map/scene validator | Breaks navigation/scene identity | `CONTENT_CATALOG_KEEP`/`STRUCTURAL_KEEP`; not open narrative semantics. |
| 48 | Reset/replay status literals | reset RPC, action/turn routes | Breaks transaction/recovery | `STRUCTURAL_KEEP`; not narrative meaning. |

## 6. REMOVE WITH ZERO GAMEPLAY IMPACT

These are proposed zero-impact removals only after each caller check in the
implementation cut. They are not deleted in this audit.

| Candidate | Why zero-impact is expected | Proof required before deletion |
|---|---|---|
| Unread choice type/event metadata | UI submits literal choice strings and does not need semantic type | Search API, context, history, frontend readers. |
| Server-authored deterministic choice fallback prose | It authors meaning and raw Story remains available | Provider-authored four-literal contract and malformed-output observability. |
| Uncalled relationship regex guards | Current source search shows no active server caller | Full source/test/workflow caller inventory. |
| Closed event-type validation | It drops facts outside a taxonomy | Open evidence path and legacy read-only replay coverage. |
| Closed relation-kind validation as narrative authority | Preserved game has empty active relation ledger after seven turns | Relation UI/mechanical reader inventory and migration plan. |
| Intimacy-stage ladder as relationship authority | It is a semantic interpretation, not identity/transaction | No required product reader or explicit progression requirement. |
| CSA physical `execution_action` catalog | It forces bodily narration into commands | CSA rule UI/app transaction callers and scenario proof. |
| CSA `posture_after` and mandatory physical enactment | It can synthesize a physical result from rule/player intent | Commit/reducer tests and live scenario coverage. |
| Duplicate frontend setup catalogs | API edition already returns setup catalogs; UI can consume it | Setup bootstrap and offline/error behavior proof. |
| Duplicate SQL setup arrays | Content/API already owns product meaning | Secure untrusted-input validation replacement. |
| Duplicate heroine arrays in SQL | Characters JSON is identity source | Opening/reset/asset/voice/replay parity proof. |
| Legacy scene hydration alias after caller inventory | Canonical scene is now live; alias is compatibility only | Current production/test caller inventory and persisted replay sample. |

## 7. KEEP BECAUSE PRODUCT ACTUALLY NEEDS IT

| Product contract | Actual consumer proof | Retention boundary |
|---|---|---|
| Four setup catalogs | `app.js` renders four selects; API edition and setup validation consume them; recovery resolves names | Keep content catalog; remove independent copies where safe. |
| `heroine1..heroine5` | `characters.json`, setup/opening, scene membership, Story speaker/parser, TTS/image, save/history fixtures | Keep stable opaque IDs; do not use “heroine” as semantic taxonomy. |
| General NPC registry | edition, Story projection, scene cast, parser and reducer use registered IDs | Keep identity registry; arbitrary observed facts remain open. |
| Scene v1 identity | scene reducer, navigation, validator, context and frontend map/render | Keep exact shape/registered IDs; mirrors are compatibility only. |
| Compact clothing | `view-model.js` and `render.js` display clothing; preserved game context has NPC and player clothing | Keep narrow projection with one writer; preserve unmatched open clothing facts separately. |
| Choices | UI renders four buttons and submits selected literal; DB opening contract requires four | Keep count/framing only, remove semantic fallback author. |
| Action/turn ownership | named lifecycle RPCs, commit/replay and expected-turn guards | Keep transaction and fencing semantics. |
| Image/TTS catalogs | `runtime-display`, image API, `content-media-contract`, TTS controller | Keep as presentation adapters; never gate Story/Extract/durable fact. |
| CSA rule identity/lifecycle candidate | CSA app UI and transaction modules consume active rule IDs/capacity/activation | Keep only after proving each lifecycle field; remove physical enactment coupling. |

## 8. Duplicate authority map

| Intended authority | Copies found | Proposed surviving copy / removal |
|---|---|---|
| Setup departments/positions/body/speech | content JSON; `pages/catalogs.js`; SQL arrays; API edition projection | Content JSON + server edition projection. Remove frontend copy after API-loaded setup proof; replace SQL semantic copies with safe canonical validation. |
| Main NPC identity | `content/characters.json`; frontend `catalogs.js`; several SQL heroine arrays; fixtures | Characters content/edition registry. SQL must validate against a canonical registry or structural approved IDs, not repeated arrays. |
| General NPC identity | `content/general_npcs.json`; master projections in story/scene/CSA modules | One edition/master registry projection; remove module-local copies. |
| Clothing | setup/bootstrap defaults; Extract reducer; `csa-commit-reducer`; legacy projections; frontend view model | One explicit clothing projection writer in normal Commit path; CSA must not be a second semantic writer. UI reads projection; raw evidence is separate. |
| Scene/presence | `save.scene`; scene_state/player_scene_state/npc_scene_state mirrors; `hydrateLegacySceneV1` | `save.scene` canonical. Mirrors are read-only compatibility and should be deleted after stored-data reader inventory. |
| Relations/events | Extract normalization; relation-event reducer; presentation; save ledgers | Open evidence/fact writer once. Any narrow relation projection must be derived, not a second durable semantic writer. |
| Summary/memory | Extract/commit summary fields; context recent/overall; history turn summaries | One durable summary writer/readback contract with raw evidence fallback; fix empty/corrupt readback before declaring memory complete. |
| Choices | parser choices; reducer deterministic fallback; DB `last_choices`; UI | Provider literal choices are source; persist/read exact literals; remove deterministic semantic fallback. |
| CSA physical enactment | prompt sections; semantic contract; planner; mandatory enactment; csa commit reducer; Extract fields | Remove finite bodily command authority. Story narrates rule naturally, Extract observes exact outcome. |

## 9. CSA before/after decision map

### Current model

The active CSA path carries rule IDs and active state, but also maps rules to
finite `execution_action`/execution-kind values, `RELATION_KINDS`, posture
changes, clothing transitions, mandatory enactment and direct-coverage checks.
The planner, validator, Story projection, mandatory-enactment module and CSA
commit reducer can therefore make a rule look like a deterministic physical
command. That mixes institutional compliance with personal consent, comfort,
affection, trust and emotion.

### Target model

Keep only user-created rule identity, lifecycle, activation/deactivation,
capacity/applicability and transaction integrity where actual callers prove
they are product mechanics. Pass active rules and context to Story. Let Story
describe compliance, resistance, interpretation or refusal naturally. Let
Extract record what the Story explicitly observed with exact evidence. Do not
require every consequence to map to a finite physical token, posture, relation
kind or mandatory enactment. Clothing remains a narrow UI projection only
when the evidence proves it, and it cannot erase richer clothing facts.

Every physical CSA token family in rows 36–40 is therefore
`MECHANICAL_PROVE_OR_REMOVE`, with `SEMANTIC_REMOVE` the default. No new
semantic matcher, catch-all enum, or retry is proposed.

## 10. Open observation/fact schema

The durable observation envelope should be structural and evidence-backed,
not semantically enumerated:

```json
{
  "fact_id": "server-generated-id",
  "game_id": "...",
  "action_id": "...",
  "turn_number": 8,
  "subject_id": "registered-id-or-player",
  "object_id": "registered-id-or-null",
  "fact_text": "provider-observed literal fact",
  "story_quote": "exact substring from committed Story",
  "source_block": "DIALOGUE|ACTING|THOUGHT|SCENE",
  "observed_at_turn": 8,
  "provenance": { "story_hash": "...", "extract_hash": "..." }
}
```

Only identity, action/turn ownership, exact quote provenance, dedupe and
transactionality are required. `fact_text` has no required event/emotion/
relation/posture/sexual type enum. Narrow derived projections such as scene
identity or compact clothing may coexist, but an unknown optional projection
must not delete or null the underlying fact. No arbitrary LLM save patch is
allowed.

## 11. Memory and readback

The current preserved game proves why write-only facts are unacceptable:

- context reports committed turn 7 and save revision 9;
- `csa_active` contains `csa_1` and `csa_1_1`, including physical-contact and
  clothing-state rule definitions;
- heroine4 clothing is `uniform_top=worn`, `underwear_top=removed`,
  `uniform_bottom=worn`, `underwear_bottom=worn`; player clothing is also
  present;
- seven history records exist, but every observed `turn_summary` is empty;
- `active_relations`, `event_ledger`, and `sexual_event_ledger` are empty
  despite turns containing physical/sexual inputs and a later apology;
- `story_summary_overall` is corrupted while `story_summary_recent` contains
  long raw-story material.

The next design must make open facts reachable by the next Story prompt,
long-term per-NPC continuity, context, history and replay. Readback should
include recent raw Story/parsed blocks plus durable evidence facts and a
bounded, deterministic projection for each proven UI feature. Important facts
must be queryable after they leave the immediate recent-turn window. A future
acceptance cannot treat seven turns as sufficient depth; it must use coverage
scenarios and a dedicated TEST-only level-7 acceleration seam without
changing Production progression or introducing ad-hoc DB writes.

## 12. Choice simplification

The product path is `Story provider -> four literal choice blocks -> parser /
persist -> UI buttons -> selected literal string as player input`. Exactly
four is a presentation/shape contract, not a semantic taxonomy. The
deterministic server-authored fallback in `observation-reducers.js` is a
second semantic author and should be deleted or isolated so malformed output
is visible without rewriting raw Story. No numbered-text parser or semantic
adapter is authorized.

## 13. DB and additive migration strategy

Historical applied migrations are immutable. Future additive cuts should:

1. add structural open-fact storage/read RPCs with action/turn/evidence
   identity and idempotence;
2. add context/history/next-Story readback before deleting old readers;
3. prove content catalog parity and safe setup validation before deleting SQL
   semantic copies;
4. replace/revoke semantic writer paths only after caller inventory;
5. retain scene structural validation and action ownership;
6. keep only approved RPC EXECUTE and no direct raw gameplay DML;
7. remove old compatibility readers after persisted-data coverage is proven.

The database must not become a second world-definition authority. Structural
identity checks are distinct from finite semantic validation. Scene/save
required keys may remain strict; open observation payload values may not be
rejected merely because they are outside a list.

## 14. Test KEEP / REWRITE / DELETE plan

Keep behavioral tests for action fencing, turn/replay/idempotence, scene
identity/integrity, exact Story evidence, provider-authored choices, setup
catalog UI behavior, compact clothing rendering, media failure isolation and
approved DB contract behavior.

Rewrite tests that currently assert valid invariants through old enums,
closed Extract shapes, SQL duplicate arrays, old scene mirrors, deterministic
choice prose, CSA forced physical enactment, or implementation-private order.

Delete source/SQL regex tests, dead semantic guards, tests for removed direct
PATCH/legacy writers, exact prompt prose, obsolete phase/hotfix expectations,
and tests that only preserve a reader with no current caller. Preserve a
narrow legacy replay test only if a current reader still consumes the saved
shape.

The existing test reset is not acceptance evidence for this redesign. Future
scenario coverage must include ordinary workplace facts, CSA compliance and
resistance without physical-token coercion, non-enum physical/posture facts,
clothing continuity, intimacy/sexual paths, media presentation, older-than-
recent-window memory and four literal choices/free text.

## 15. Preserved seven-turn game evidence (READ ONLY)

Worker `/api/context` and `/api/history` were queried read only for game
`78fb1d94-266f-455a-bda4-7656cc2370c1`. No reset, write, migration, or
gameplay call was made. The seven player actions included two rule changes,
physical/sexual comments/actions, repeated touching/sexualized remarks and a
final apology. History returned seven records. The evidence demonstrates
product-visible clothing and active CSA rule state, but it also demonstrates
empty relation/event/sexual ledgers and empty summaries. It is a failure and
design clue, not acceptance depth or proof of the future architecture.

## 16. Revised implementation sequence and recommended first cut

### Cut A — catalog and reader proof, then deletion

Inventory/fixture-proof `edition.js`, `pages/catalogs.js`, setup validation,
SQL setup arrays, character registry and all `heroine1..5` callers. Keep one
canonical content/identity source; delete duplicate frontend/SQL authorities
only after parity and untrusted-input safety are proved. Keep stable IDs.

### Cut B — open observation boundary

Add structural evidence-backed observation persistence/readback and next-Story
consumption. Then remove closed Extract normalizer fields, event/relation/
emotion/sexual ladders and legacy adapters whose readers are gone. Preserve
exact Story quote and registered identity checks. This cut must delete
substantial semantic gates rather than add a parallel ledger forever.

### Cut C — CSA rule/mechanics separation

Prove actual CSA UI/transaction consumers. Keep rule identity/lifecycle and
applicability only where required. Delete physical execution action catalogs,
posture-after, relation-kind coupling and mandatory enactment where no
deterministic product consumer survives. Add scenario acceptance for natural
compliance/resistance and separation from personal state.

### Cut D — projection/readback cleanup

Make clothing the single narrow UI projection writer, preserve unmatched
clothing/accessory facts in open observations, consolidate summary/memory
readback, and remove scene/legacy mirrors and compatibility aliases after
persisted-data inventory. Media remains presentation-only.

### Recommended first implementation cut

Cut B is recommended first, but only after a short caller/contract freeze:
remove the current closed semantic gate at the Extract boundary and replace
it with an evidence-backed structural envelope plus readback in the same cut.
Do not add a write-only open ledger beside the current authority. The cut must
delete or bypass the old normalizer/reducer semantic writers in the same
reviewable change, retain structural scene/action/turn guards, and include
targeted behavior tests and a later coverage-driven TEST acceptance plan.

## 17. Audit disposition summary

Inventory rows: 48 expanded families.

Proposed zero-gameplay-impact deletion candidates in the dedicated table: 12
(all require the stated caller proof before implementation).

Proven product/identity/UI keeps in the dedicated table: 9 categories.

Main architecture conclusion: intentional setup catalogs and stable NPC IDs
remain; compact clothing remains a narrow UI projection candidate; open
narrative semantic taxonomies and CSA physical enactment grammar do not remain
authoritative without concrete consumer proof. DB semantic duplicates are a
real later redesign surface, while structural DB authority remains.

This audit is complete as documentation only. It does not claim any runtime,
DB, migration, deployment, test, or live-game change.
