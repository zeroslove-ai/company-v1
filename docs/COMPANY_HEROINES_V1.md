# Company heroines v1

This registers the five Company edition heroine profiles in `content/characters.json` (`heroine1`–`heroine5`, map key = stable `character_id`) and connects a filtered narrative canon to the Story and Extract prompts. It does not create an image catalog, touch Storage, add voice IDs, or add CSA presets.

## Not real people

All five characters are entirely fictional company employees. Production content and prompts never reference any real group or person's name. Any creative inspiration behind an appearance description is written as fiction about a fictional character — never as a factual claim about a real person's private life, personality, or career.

## Adults only

Every character is an adult company employee: 서원희 (33), 윤민아 (29), 김제나 (24), 한리브 (27), 이메이 (24).

## Role differentiation

Each of the five has one clearly distinct core role — none are interchangeable "bright, friendly office woman" filler:

- **서원희 (heroine1)** — team lead: responsible for people, direction, and outcomes as the 브랜드전략팀 team lead (차장).
- **윤민아 (heroine2)** — the ace: responsible for execution, presentation, external communication, and delivering results as the 글로벌 캠페인 PM (대리).
- **김제나 (heroine3)** — the observant junior: reads expressions, mood, and visual sense; a 주니어 브랜드 플래너 (사원) three months in.
- **한리브 (heroine4)** — the quiet backbone: responsible for language, voice, and polish as the 브랜드 보이스·콘텐츠 리드 (대리).
- **이메이 (heroine5)** — the active junior: responsible for community, engagement, and bright execution as the 브랜드 커뮤니티·SNS 주니어 플래너 (사원), three months in.

## Team relationships and the youngest line

All five sit on the same 브랜드전략팀 under 서원희. `addressing_rules` on each profile fixes how that character addresses every other registered colleague and the player, so Story never has to invent a title. `heroine3`과 `heroine5`는 동갑 입사 동기로, 서로의 `youngest_line.partner_character_id`가 상대를 가리키며 우정과 은근한 경쟁 관계를 `youngest_line.relationship`에 기록한다. 이 필드는 두 사람에게만 존재한다.

## Story canon fields

`content/characters.json` carries the full profile per character. Only a filtered subset — built by `buildCharacterCanonSnapshot(edition)` in `src/engine/story-prompt.js` — reaches the Story prompt's `character_canon` payload:

`name`, `age`, `department`, `position`, `role_title`, `public_role_summary`, `appearance`, `personality`, `speech_style`, `addressing_rules`, `habits`, `work_profile`, `relationship_hooks`, `csa_response_profile`, and (`heroine3`/`heroine5` only) `youngest_line`.

`storage_bucket`, `storage_prefix`, `primary_image_path`, `adult_image_prefix`, `voice_id`, `mapping_status`, and the internal `initial_stats`/`initial_relationship`/`initial_csa_attitudes` numbers never reach Story or Extract. `buildCharacterCanonSnapshot` is a pure read of `edition` — it never mutates the edition object, and since only five characters exist, all five are sent every turn rather than being filtered further.

The Story system prompt states that `character_canon` is the only fact source for a registered character, that Story must not change a character's name, age, department, position, appearance, personality, speech style, or addressing rules, must not promote or reassign a character to a different position or role, and must not force an unregistered-in-scene character into the current scene.

## Extract stable-ID mapping

`buildRegisteredCharacters(edition)` in `src/engine/extract-prompt.js` produces only `{ character_id, name }` pairs for `heroine1`–`heroine5` and is sent to Extract as `registered_characters`. Storage/adult/voice fields are excluded. The Extract system prompt instructs the model to use only those stable IDs, to return an ID only when the name matches a Story character exactly, never to invent an ID for someone not in Story or not in that list, never to turn the narrator into an NPC ID, and to keep `action_target_id`/`focal_character_id`/`last_speaker_id`/`image_character_id` independent — unchanged from the existing identity-axis contract. The existing post-normalization ID validation (`buildStableNpcIdSet` / `npcIdsFromEdition` in `src/api/turn-routes.js`, enforced inside `normalizeGameplayExtractEnvelope`) still runs regardless of what the model returns, so an unknown ID is dropped/nulled with a warning either way.

## Global CSA stays global

There is still no per-player suggestion list and no per-NPC list of currently-active common-sense rules. The only per-NPC variation is `csa_attitudes[npc_id][csa_id]`, and every character's `initial_csa_attitudes` is `{}` in this PR because `content/csa_presets.json` has no registered rule items yet — see `docs/COMPANY_GAMEPLAY_STATE_CONTRACT_V1.md` for why inventing a rule ID here would be unsafe. Each character's narrative disposition toward common-sense change instead lives in `csa_response_profile` (`adaptability`, `baseline_familiarity`, `baseline_resistance`, `baseline_acceptance`, `baseline_discomfort`, `conscious_analysis`, `outward_composure`, `conscious_violation`, `notes`) — Story-facing canon, not persisted per-rule attitude state. The five profiles deliberately differ (e.g. `baseline_resistance` ranges from 58 to 82, `adaptability` from `medium_low` to `high`) so no two characters react identically to a common-sense change.

## Deferred to follow-up PRs

- **Voice IDs**: `voice_id` is `null` for all five; no ID was guessed or assigned.
- **CSA preset IDs**: `content/csa_presets.json` stays empty; converting `csa_response_profile` into real `initial_csa_attitudes[csa_id]` entries needs an approved global CSA rule set first.
- **Image catalog / Storage runtime**: this PR only records the five existing Storage bindings (bucket/prefix/primary path/adult prefix) as content; it does not query, upload, move, rename, or delete anything in Storage, and does not build an image catalog or shortlist.
