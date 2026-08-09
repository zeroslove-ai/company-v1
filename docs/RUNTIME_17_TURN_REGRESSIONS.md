# 17턴 운영 회귀 목록

운영 감사에서 확인된 15건을 향후 fixture/test game으로 고정한다. 운영 DB와 과거 save는 수정하지 않는다. 각 항목은 턴, Story 관찰, 잘못 저장된 상태, invariant, 정확한 테스트명, 구현 단계로 기록한다.

| # | 턴 | Story 관찰 | 잘못 저장된 상태 | invariant | 정확한 미래 테스트명 | 단계 |
|---:|---|---|---|---|---|---|
| 1 | 2, 5, 6 | 실제 상식개변 앱 적용 행동 | `structured_action=null`, `action_kind=player_turn`; active CSA 목록 생성·삭제·교체 | structured action 없는 턴은 CSA 정의 목록을 바꿀 수 없음 | `null structured action cannot mutate active rules` | Phase 1 |
| 2 | 8 | 블라우스만 벗고 브라·치마·팬티는 착용 | 속옷 차림 continuous 규정을 `satisfied`로 저장 | 일부 clothing evidence를 전체 규정 이행으로 승격하지 않음 | `partial clothing change cannot satisfy underwear-only rule` | Phase 3/5 |
| 3 | 9, 16 | 플레이어 속마음과 선택지 섹션 없음; parsed choices 0 | stored choices 4개 fallback | fallback 선택지는 raw Story 계약 성공을 의미하지 않음 | `missing Story choices remain an explicit format failure` | Phase 3/6 |
| 4 | 10→11 | 10턴에는 현재 성적 행동 계속 규정을 새 성행위 의무로 해석하지 않음; 11턴에는 규정 변경 없이 새 성행위 시작으로 반대로 해석; runtime paused/continuing/partial도 불일치 | 턴 간 동일 preset semantic이 재정의됨 | preset semantic은 활성화 후 LLM이 재정의할 수 없음 | `active rule semantics remain stable across turns` | Phase 1/5 |
| 5 | 12 | 윤민아와 박정우가 Story에 실제 등장 | state delta에는 player·heroine2·general_park_jungwoo가 있었지만 저장 `npcs_present=[]` | final presence snapshot은 Story evidence와 일치 | `explicitly present NPCs cannot collapse to empty snapshot` | Phase 2/3 |
| 6 | 13→14 | 13턴 박정우 지시로 윤민아가 겉옷을 다시 입음; 14턴 박정우가 동일 규정 유효성을 인정 | continuous rule 종료 및 `clothed_by_team_lead` 저장 | 일반 NPC 지시는 active world rule 정의를 종료할 수 없음 | `NPC instruction cannot deactivate continuous world rule` | Phase 1/5 |
| 7 | 14 | 저장 규정에 없는 “규정 제6조”를 Story가 창작 | unknown rule이 save에 생성된 문제는 아니지만 Story가 canonical rule 밖의 조문을 창작 | Story는 canonical rule definition 밖에서 rule ID·조문·문구를 창작하지 않음 | `Story cannot invent legal clause numbering` | Story grounding / Phase 1/5 |
| 8 | 16 | 브랜드전략팀 사무실에서 회의실로 이동 완료 | save는 `brand_strategy_office` 유지; stale `scene_goal`·`focus_thread`도 다른 장소를 가리킴 | 명시적으로 완료된 이동은 canonical scene 또는 explicit inconsistency로 기록 | `completed movement updates canonical scene metadata together` | Phase 2/4 |
| 9 | 16 | heroine2는 등록 NPC지만 pre-state presence와 scene cast에는 없음; transition은 stationary인데 Story가 회의실 이동·heroine2 등장·발화를 생성 | registered NPC가 current presence 없이 등장 | registered 여부와 current scene presence는 구분 | `registered remote NPC does not become present without observed entrance` | Phase 2/3/4 |
| 10 | 17 | Story와 `last_npcs_present`에는 heroine2 존재 | `npc_scene_state.heroine2.present=false` | canonical `scene.present_npc_ids`만 presence 정본 | `legacy present flag cannot contradict canonical presence` | Phase 2/6 |
| 11 | 17 | heroine2가 유일한 present NPC이며 행동·발화 | `focal_character_id=null` | 명시 focal이 없어도 유일하게 행동·발화한 current NPC는 deterministic focal 후보 | `single acting current NPC becomes focal` | Phase 2/3 |
| 12 | 17 | 이번 Story 마지막 명시 화자는 heroine2 | 이미 퇴장한 general_park_jungwoo가 `last_speaker_id`로 유지 | last speaker는 이번 Story에서 계산하며 이전 턴 값을 carry-forward하지 않음 | `current explicit speaker replaces stale previous speaker` | Phase 2/3 |
| 13 | 7, 12, 16 | 7턴 이동만 요청했는데 플레이어의 첫인사를 창작; 12턴 “문 왜 닫아요”를 heroine2 대사로 저장; 16턴 사용자 입력에 없는 조건·위협 문장 추가 | 플레이어 발화가 NPC 발화로 재배정되거나 입력 의도가 확장됨 | 명시 actor/speaker를 재배정하지 않고 플레이어 의사를 임의 확장하지 않음 | `player utterance is never assigned to NPC`; `Story does not invent material player dialogue` | Phase 3/4 |
| 14 | 6 | Story 공지/규정 인용문 | speaker null dialogue line으로 저장 | 문서·화면·공지 인용과 실제 발화를 구분 | `notice text is not extracted as spoken dialogue` | Phase 3 |
| 15 | 17 | 떨림·긴장·시선 회피·불안 | `sexual_arousal_delta=+1`, `csa_acceptance_delta=+2` | fear/tension/compliance는 arousal 또는 acceptance evidence가 아님 | `fear and compelled compliance do not imply arousal or acceptance` | Phase 3/5 |

## 재현 원칙

- 각 fixture는 운영 사례의 관찰·저장 shape를 보존하되 테스트 전용 game id를 사용한다.
- `final_present_npc_ids=null`은 최종 snapshot 미관찰, `[]`은 Story 근거가 있는 명시적 빈 장면이다.
- fallback choices는 format failure를 성공으로 바꾸지 않는다.
- raw Story는 parser가 실패해도 보존하며, Extract는 관찰만 반환한다.
- 운영 17턴 save와 Supabase에는 write하지 않는다.
