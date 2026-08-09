# Runtime Target State

이 문서는 Phase 0에서 고정하는 향후 canonical save의 설계다. 현재 `save` shape를 즉시 바꾸지 않으며, 구현·migration·운영 repair는 후속 PR에서만 수행한다.

## 1. Canonical save 핵심 shape

```json
{
  "scene": {
    "location_id": "registered-location-id",
    "present_npc_ids": ["registered-npc-id"],
    "focal_character_id": "registered-npc-id-or-null",
    "last_speaker_id": "registered-npc-id-or-player-or-null"
  },
  "npc_state": {
    "npc-id": {
      "location_id": "registered-location-id-or-null",
      "posture": {},
      "clothing": {},
      "work": {},
      "stats": {}
    }
  },
  "rules": {
    "active": {},
    "runtime": {}
  }
}
```

Canonical state는 Commit reducer만 만든다. `scene.present_npc_ids`에는 현재 장면에 실제로 남아 있는 NPC만 들어가며 player는 별도 player state로 보존한다. 등록되지 않은 location/NPC ID는 저장하지 않는다.

## 2. 단일 writer 규칙

`previous canonical save + stored structured_action + Extract observation`만 reducer 입력으로 허용한다.

- Story route: raw text와 action metadata만 기록한다.
- Extract route: observation envelope만 기록한다.
- Commit route: reducer 결과를 `commit_company_turn`에 전달한다.
- API/frontend projection: 읽기 전용이다.
- CSA active/rules/runtime: structured action operation이 있을 때만 reducer가 변경한다.
- Story text: reducer가 수정하지 않으며, 저장된 action text를 그대로 유지한다.

## 3. Legacy API projection

기존 endpoint와 UI가 요구하는 shape는 canonical state에서 매번 생성한다.

```text
scene_state.scene_id/location_id ← scene
scene_state.participants ← [player_id, ...scene.present_npc_ids]
last_npcs_present ← scene.present_npc_ids
npc_scene_state[id].present ← scene.present_npc_ids.includes(id)
npc_scene_state[id].location_id ← npc_state[id].location_id
focal_character_id ← scene.focal_character_id
last_speaker_id ← scene.last_speaker_id
npc_scene_state[id].posture/clothing ← npc_state[id]
csa_active/csa_rules ← rules.active
csa_runtime_state ← rules.runtime
```

Projection은 canonical save를 다시 쓰지 않는다. 과거 row에 `last_npcs_present` 또는 `stream_segments`가 있어도 canonical `story_text`와 `scene.present_npc_ids`가 있으면 legacy 값을 우선하지 않는다.

## 4. Presence·speaker 규칙

### Presence

`scene.present_npc_ids`가 현재 장면의 유일한 멤버십 정본이다. `last_npcs_present`, `npc_scene_state[id].present`, focal, last speaker, location 일치만으로 NPC를 추가하지 않는다. Extract가 final scene presence를 명시한 경우에만 reducer가 새 배열을 반영한다.

### Focal

`focal_character_id`는 현재 `present_npc_ids`에 포함된 NPC 또는 null이다. 후보가 현재 장면 밖이면 null로 정규화한다. NPC가 하나뿐이라는 이유로 Story 원문에 없는 인물을 추가하지 않는다.

### Last speaker

`last_speaker_id`는 이번 raw Story에서 명시적으로 식별된 speaker만 기록한다. 화자가 장면을 떠났어도 마지막 발화 기록은 유지할 수 있지만, 그 값으로 presence를 복구하지 않는다. 확인되지 않은 화자는 null이며 이름·문맥·focal로 추정하지 않는다.

## 5. Physical state와 evidence

`npc_state[id].posture`, `clothing`, `location_id`는 Extract의 관찰과 Story evidence가 있을 때만 갱신한다. 활성 CSA 또는 required clothing만으로 actual clothing을 자동 변경하지 않는다. 이전 값은 observation이 없을 때 보존한다. unknown 값은 빈 객체를 성공 상태로 해석하지 않는다.

## 6. CSA lifecycle

`rules.active`는 활성 CSA 정의, `rules.runtime`은 lifecycle 관찰이다. continuous 규칙을 특정 NPC 한 명의 `executed` 플래그로 대표하지 않는다. on-request action의 in-progress/completed 상태만 structured action과 Extract evidence로 기록한다. `structured_action=null`이면 활성 규칙 목록은 변경되지 않는다.

## 7. Invariants

Commit 전 `invariants.js`는 최소 다음을 검사한다.

1. `present_npc_ids`와 projected participants가 일치한다.
2. focal은 현재 NPC 또는 null이다.
3. last speaker는 이번 Story의 명시 화자 또는 null이다.
4. 등록된 location과 NPC ID만 저장된다.
5. structured action이 없는 CSA mutation은 없다.
6. raw Story hash와 action/turn Story text가 같다.
7. Story가 관찰하지 않은 physical/stat/relationship 값을 생성하지 않는다.
8. Commit replay가 동일 action에 중복 writer를 만들지 않는다.

## 8. 구현 순서

Canonical state 도입은 `RUNTIME_CORE_RESET_CHARTER.md`의 Phase 1–7 순서를 따른다. 먼저 action authority를 분리하고, 그 다음 scene reducer, observation envelope, invariants, legacy projections 순으로 진행한다. UI나 DB schema는 canonical reducer가 검증된 뒤에만 별도 범위로 다룬다.
