# Runtime Target State

Phase 0에서 고정하는 향후 canonical save와 Extract observation 계약이다. 현재 save shape·RPC·운영 데이터는 변경하지 않는다.

## 1. Canonical scene

```json
{
  "scene": {
    "scene_id": "registered-scene-id",
    "location_id": "registered-location-id",
    "beat": 0,
    "goal": null,
    "focus_thread": null,
    "present_npc_ids": [],
    "focal_character_id": null,
    "last_speaker_id": null
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

`scene_id`와 `location_id`는 서로 다른 등록 축이다. 같은 값이라고 가정하지 않는다.

- `scene_id`: 현재 장면/비트의 등록 ID. Story scene identity와 beat 진행을 담당한다.
- `location_id`: 물리적 장소의 등록 ID. 이동 완료 시 location evidence와 함께 갱신한다.
- `beat`: canonical scene의 진행 순서로 유지한다. Story/Extract가 임의로 증가시키지 않고 Commit reducer가 검증된 turn progression으로 갱신한다.
- `goal`: 현재 장면 목표의 canonical nullable 값으로 유지한다. 관찰되지 않은 목표를 Extract가 창작하지 않으며, 새 장면으로 이동할 때 이전 장소의 stale 값을 carry-forward하지 않는다.
- `focus_thread`: 현재 장면의 canonical nullable thread로 유지한다. location/scene이 바뀌면 명시적으로 유지·갱신·null 중 하나를 reducer가 결정하며, 다른 장소의 stale 값은 남기지 않는다.

`beat`, `goal`, `focus_thread`는 현재 코드의 `scene_state` 관련 field와 직접 대응 여부를 후속 구현에서 조사한다. target state에서는 세 값 모두 canonical scene 안에서만 writer를 허용하고, legacy projection이 다른 장소의 값을 다시 쓰지 못하게 한다.

## 2. Presence observation

Extract는 최종 snapshot을 관찰하지 못한 경우와 명시적으로 빈 장면인 경우를 구분한다.

```json
{
  "scene_observation": {
    "scene_id": null,
    "location_id": null,
    "final_present_npc_ids": null,
    "entered_npc_ids": [],
    "exited_npc_ids": [],
    "focal_candidate_id": null,
    "evidence": []
  }
}
```

- `final_present_npc_ids: null`: 최종 snapshot 미관찰. 기존 presence 전체 삭제 금지.
- `final_present_npc_ids: []`: Story 근거가 있는 명시적 빈 장면. player만 남기는 full replacement 후보.
- `entered_npc_ids`/`exited_npc_ids`: Story evidence가 있는 ID만 patch 가능하다.
- full replacement는 등록 ID와 Story evidence 검증 후에만 허용한다.
- `last_npcs_present`나 `npc_scene_state[id].present`는 observation의 멤버십 근거가 아니다.

## 3. Focal 규칙

1. Extract focal candidate가 current `present_npc_ids`에 있으면 사용한다.
2. 후보가 없고 current NPC 중 이번 Story에서 행동·발화한 NPC가 정확히 한 명이면 그 NPC를 deterministic 후보로 사용한다.
3. 그 외에는 `null`이다.

current NPC 밖의 focal 후보는 무효화한다. focal 값으로 presence를 복구하지 않는다.

## 4. Last speaker 규칙

1. 이번 raw Story의 마지막 유효 명시 speaker를 사용한다.
2. player도 유효 speaker다.
3. 같은 턴에 발화 후 퇴장한 NPC라도 historical last speaker로 기록할 수 있다.
4. last speaker 값으로 presence를 복구하지 않는다.
5. 이번 Story에 유효 화자가 없으면 `null`이다.
6. 이전 턴 speaker를 carry-forward하지 않는다.

## 5. Rule projection과 semantic 불변성

```text
csa_rules  = rules.active의 canonical rule map
csa_active = rules.active 중 active인 rule ID 배열
```

preset/template의 의미는 structured action 검증 시 확정하고 `rules.active`에 보존한다. 이후 Story·Extract·Commit은 다음을 재정의할 수 없다.

- trigger 의미
- actor/target
- initiation과 continuation 구분
- scope
- strength
- duration

Extract는 실행 근거만 관찰한다. `structured_action`이 없으면 active rule 정의 목록을 생성·삭제·교체하지 않는다.

## 6. Continuous rule과 physical state 충돌

continuous rule과 actual physical state가 충돌하면:

- physical state를 자동 변경하지 않는다.
- rule을 `executed`/`completed`로 기록하지 않는다.
- active rule을 종료하지 않는다.
- `rule_physical_conflict` invariant/warning을 기록한다.

규정 자체와 실제 복장·자세·행동은 별도 축이다. Story evidence 없는 physical patch는 저장하지 않는다.

## 7. Legacy projection

기존 API/UI shape는 canonical state에서 읽기 전용으로 만든다.

```text
scene_state.scene_id/location_id ← scene.scene_id/location_id
scene_state.participants ← [player_id, ...scene.present_npc_ids]
last_npcs_present ← scene.present_npc_ids
npc_scene_state[id].present ← scene.present_npc_ids.includes(id)
npc_scene_state[id].location_id ← npc_state[id].location_id
npc_scene_state[id].posture/clothing ← npc_state[id]
focal_character_id ← scene.focal_character_id
last_speaker_id ← scene.last_speaker_id
csa_active/csa_rules ← rules.active
csa_runtime_state ← rules.runtime
```

legacy projection은 canonical save를 다시 쓰지 않는다. 과거 `stream_segments`가 있어도 `story_text`가 있으면 Story 정본으로 사용하지 않는다.

## 8. Commit invariants

Commit reducer는 최소한 다음을 검사한다.

1. current participants와 `scene.present_npc_ids`가 일치한다.
2. focal은 current NPC 또는 null이다.
3. last speaker는 이번 raw Story의 명시 화자 또는 null이다.
4. scene/location/beat/goal/focus_thread가 서로 다른 장소의 stale 값을 포함하지 않는다.
5. 등록된 location/NPC ID만 저장된다.
6. structured action 없는 rule semantic mutation이 없다.
7. raw Story hash와 action/turn Story text가 같다.
8. physical/stat/relationship 값은 Story evidence 없이 생성되지 않는다.
9. 동일 action replay가 중복 writer를 만들지 않는다.
