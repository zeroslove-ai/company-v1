# 17턴 운영 회귀 목록

이 문서는 운영 17턴에서 관찰된 사례를 향후 fixture/test game으로 재현하기 위한 기록이다. 운영 DB와 과거 save는 수정하지 않는다. 각 항목은 `입력 조건 → Story 관찰 → 잘못 저장된 상태 → 위반 invariant → 미래 테스트 이름 → 구현 단계` 순서다.

| # | 입력 조건 | Story 관찰 | 잘못 저장된 상태 | 위반 invariant | 미래 회귀 테스트 | 단계 |
|---:|---|---|---|---|---|---|
| 1 | 2·5·6턴에서 `structured_action=null` | 일반 Story/Extract 턴 | CSA 목록 또는 lifecycle이 바뀜 | structured action 없는 CSA mutation 금지 | `null structured action cannot mutate CSA` | Phase 1 |
| 2 | 8턴의 특정 인물만 노브라 상태 | Story가 해당 인물만 묘사 | continuous 복장 규정이 satisfied로 기록 | 규정 범위와 실제 physical evidence 분리 | `continuous clothing does not imply execution` | Phase 3/5 |
| 3 | 9턴 Story/선택지 일부 malformed | raw Story는 존재 | fallback이 Story 원문을 잃거나 선택지를 바꿈 | raw Story 보존 | `malformed story remains observable` | Phase 3 |
| 4 | 10턴에서 동일 CSA가 반복 노출 | 이전 규칙이 이미 활성 | 같은 CSA가 매 턴 새 전환처럼 기록 | lifecycle 중복 writer 금지 | `ongoing CSA is not reactivated` | Phase 5 |
| 5 | 12턴에 실제 NPC 2명 등장 | Story 마지막 장면에 2명 존재 | `npcs_present=[]` | final presence와 Story가 일치해야 함 | `two present NPCs survive commit` | Phase 2/3 |
| 6 | 13턴에서 규칙이 계속 적용 중 | Story는 행동을 이어감 | continuous 규정이 종료된 것으로 저장 | continuous lifecycle은 action completion과 다름 | `continuous rule stays active` | Phase 5 |
| 7 | 14턴에 존재하지 않는 규정 번호가 입력/언급됨 | Story에 없는 규칙을 언급하지 않음 | 없는 rule id/문구가 save에 생성 | 등록 rule만 저장 | `unknown rule id is warning only` | Phase 1/5 |
| 8 | 16턴에서 이동이 Story에 완료됨 | Story는 새 장소까지 도착 | save에는 이전 location/scene이 남음 | Story 이동과 canonical scene location 일치 | `completed movement updates canonical location` | Phase 2/4 |
| 9 | 16턴에 cast 밖 NPC를 Story가 언급 | 이름이 장면에 등장했지만 등록/참여 근거 없음 | unknown NPC가 participants/presence로 추가 | registered IDs와 scene cast 불변 | `unregistered NPC is not saved` | Phase 3 |
| 10 | 17턴 현재 NPC가 Story에 잔류 | Story 마지막 장면에 NPC가 있음 | `npc_scene_state[id].present=false` | participants가 presence 정본 | `present NPC is not removed by stale flag` | Phase 2 |
| 11 | 17턴에 현재 NPC가 없음 | Story 마지막 장면에 player만 남음 | `focal_character_id`가 과거 NPC로 유지 | focal은 현재 NPC 또는 null | `empty scene clears focal` | Phase 2 |
| 12 | 17턴 마지막 대사는 퇴장한 NPC | 마지막 유효 발화는 해당 NPC | `last_speaker_id`가 임의로 다른 화자로 변경되거나 presence 복구 | speaker와 presence 독립 | `exited last speaker remains record only` | Phase 2/3 |
| 13 | 사용자가 NPC와 성적 행동을 요청 | Story는 요청된 실제 행동을 묘사 | 발언/행동이 다른 NPC로 재배정되거나 downstream 값이 덮어씀 | 명시 speaker/actor와 observation evidence 일치 | `explicit actor is not reassigned` | Phase 3/4 |
| 14 | 첫 활성화 장면에서 공지/규정 문구가 길게 생성 | Story는 장면과 행동을 진행해야 함 | 공지·규정 설명만 저장되고 행동/관계가 누락 | Story-first, raw 보존, Extract 후행 | `activation does not replace scene progression` | Phase 1/5 |
| 15 | 공개 장면에서 성적 행동과 감정이 함께 발생 | Story가 행동·감정·관계 변화를 분리해 묘사 | 규정/공포/공식 절차 설명이 arousal·관계 수치를 자동 상승시킴 | emotion/arousal와 규정 lifecycle 독립 | `public scene does not infer arousal from notice` | Phase 3/5 |

## 재현 원칙

- 각 fixture는 운영 save를 복사하되 game id와 캐릭터 stable id를 테스트 전용으로 바꾼다.
- Story fixture의 raw text는 parser가 이해하지 못해도 그대로 보존한다.
- Extract는 실제 문장에 근거가 있는 관찰만 반환한다.
- Commit 결과는 canonical scene/presence/focal/speaker/rule invariants를 검사한다.
- 같은 action replay는 Story LLM을 호출하지 않고 저장된 `story_text`를 재사용한다.
- 운영 17턴 데이터를 repair하거나 Supabase에 write하지 않는다.
