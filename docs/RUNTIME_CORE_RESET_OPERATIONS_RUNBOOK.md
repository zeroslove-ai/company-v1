# Company v1 Runtime Core Reset 운영 적용 Runbook

## 1. 기준과 범위

- PR #54: `refactor: integrate runtime core reset v1`
- 병합 시각: 2026-08-10
- 병합된 `main` 기준 SHA: `662cb06663d7863a771df50248fdae167f0c9acd`
- Integration head: `cd62e295d6ce246d4472f2b5c26bff7a14aecdf5`
- 적용 대상: Company v1 전용 Supabase 프로젝트와 전용 테스트 게임

이 문서는 Phase 6 코드의 운영 적용 절차만 고정한다. migration package 작성과 정적 검토는 완료됐지만, 이 문서를 작성하는 단계에서는 migration·verification SQL을 실행하지 않는다.

## 2. 적용 대상 파일과 불변 원칙

적용 순서를 바꾸거나 과거 migration을 수정하지 않는다.

```text
supabase/migrations/20260809000100_company_v1_initial_clothing_v2.sql
supabase/migrations/20260810000100_company_v1_canonical_opening_bootstrap.sql
supabase/verification/20260810000100_company_v1_canonical_opening_bootstrap.verify.sql
```

- `20260809000100...`은 immutable history다. 이미 적용된 환경에서도 파일을 수정하거나 재실행하지 않는다.
- `20260810000100...`은 preserving clothing helper를 먼저 재정의한 뒤 canonical opening helper, wrapper, turn-0 backfill, 권한 순서로 처리한다.
- backfill은 `edition_id='company-v1'`, `committed_turn=0`, `opening_state.plan` object인 `game_save`만 대상으로 한다.
- `game_master`, `game_actions`, `game_turns`, 운영 save를 별도 update하지 않는다.
- 내부 clothing helper와 canonical opening helper는 외부 직접 실행 대상이 아니며, service role wrapper만 운영 API 표면이다.

## 3. Migration 적용 전 backup/checklist

아래 항목을 모두 기록하고 하나라도 충족하지 못하면 적용하지 않는다.

- [ ] 승인된 병합 SHA가 `662cb06663d7863a771df50248fdae167f0c9acd`인지 확인
- [ ] 배포 작업자와 대상 Supabase project/environment가 일치하는지 확인
- [ ] 현재 migration history와 위 두 migration 파일의 SHA-256을 저장
- [ ] Supabase managed backup 또는 승인된 `pg_dump` snapshot ID와 시각 기록
- [ ] 최소 `games`, `game_save`, `game_master`, `game_actions`, `game_turns` 백업 확인
- [ ] 진행 중인 setup/opening/turn 요청과 자동 reset 작업이 없는지 확인
- [ ] service-role 운영 자격과 migration 실행 권한을 별도로 확인
- [ ] rollback 담당자, 승인자, 중단 시각, 복구 snapshot을 지정
- [ ] 전용 첫 게임 검증용 game ID를 새로 준비하고 기존 운영 save를 사용하지 않음
- [ ] backup이 복구 가능한지 별도 환경에서 확인

Backup ID·파일 hash·작업자·승인자는 운영 변경 기록에 남긴다. backup이 없거나 복구 가능성이 확인되지 않으면 migration을 시작하지 않는다.

## 4. Supabase migration 적용 순서

승인된 migration runner를 사용하며, 아래 순서를 유지한다.

1. 현재 migration history에서 `20260809000100...`의 적용 여부와 checksum을 확인한다. 과거 파일은 수정하지 않는다.
2. `20260810000100_company_v1_canonical_opening_bootstrap.sql`을 한 번 적용한다.
3. runner가 하나의 transaction으로 처리하는지 확인한다. 중간 오류가 나면 후속 SQL을 수동 실행하지 않는다.
4. 적용 결과에서 preserving helper 정의가 canonical opening helper보다 앞서고, wrapper가 legacy alias를 내부 호출하는지 확인한다.
5. turn-0 backfill 범위가 Company `game_save`에만 제한됐는지 확인한다.
6. `game_master`, action/turn/story row에 변경이 없음을 확인한다.
7. public/anon/authenticated/service_role의 내부 helper 직접 실행 권한 revoke와 service-role wrapper grant를 확인한다.

Migration 파일을 복사해 SQL console에서 일부만 실행하거나, 실패한 statement를 임의로 재실행하지 않는다.

## 5. Migration 후 verification SQL 순서

Migration transaction이 성공적으로 완료된 뒤에만 다음 순서로 실행한다.

1. `20260810000100_company_v1_canonical_opening_bootstrap.verify.sql` 전체를 read-only 검증 단계로 실행한다.
2. `company_apply_opening_scene_v1(jsonb)`, `reserve_company_player_setup(...)`, `commit_company_opening(...)` signature가 존재하는지 확인한다.
3. canonical scene의 `version=1`, `beat=0`, plan 기반 `location_id/goal/focus_thread`, canonical presence/focal/speaker를 확인한다.
4. legacy `scene_state`, `last_npcs_present`, flat focal/speaker projection이 canonical scene과 일치하는지 확인한다.
5. existing `removed/open/unknown/custom` clothing과 unrelated root/state가 보존되고, 누락 슬롯만 `worn`인지 확인한다.
6. malformed scene backfill, off-scene NPC 보존, helper idempotence를 확인한다.
7. 내부 helper와 legacy alias에 외부 직접 실행 권한이 없고, service role wrapper만 실행 가능한지 확인한다.
8. 전 항목이 통과한 뒤에만 첫 게임 생성 검증으로 이동한다.

Verification 실패 시 게임 생성이나 운영 턴을 시작하지 않는다.

## 6. 첫 게임 생성 검증 시나리오

전용 test game에서 순서대로 수행하고 각 단계의 request/response와 저장 snapshot을 남긴다.

### 6.1 Player setup

- 유효한 player setup을 한 번 제출한다.
- `setup_id`, `opening_plan`, `idempotent` 응답을 기록한다.
- opening plan의 location, primary/supporting NPC, work hook, scene goal을 기록한다.
- 재전송 시 기존 setup이 중복 생성되지 않는지 확인한다.

### 6.2 Opening

- opening Story/background/choices가 한 번 저장되는지 확인한다.
- `committed_turn=0`을 확인한다.
- gameplay `game_actions`/`game_turns`가 생성되지 않고 Extract가 호출되지 않는지 확인한다.
- canonical scene이 opening plan과 일치하는지 확인한다.

### 6.3 Turn 1

- 일반 player input으로 Story를 생성한다.
- 화면에 보인 raw Story, `game_actions.story_text`, `game_turns.story_text`, Extract 입력이 동일한지 확인한다.
- Extract V2가 observation-only 결과를 반환하고 `reduceGameplayCommit()`이 한 번 실행되는지 확인한다.
- Commit 후 `committed_turn=1`과 canonical scene을 기록한다.

### 6.4 Turn 2

- Turn 1과 다른 일반 input으로 다시 진행한다.
- 이전 raw Story가 덮어써지지 않고 history/replay가 동일한지 확인한다.
- Extract가 save patch나 선택된 actor/target을 새로 권위화하지 않는지 확인한다.
- Commit 후 `committed_turn=2`와 scene `updated_turn=2`를 확인한다.

### 6.5 이동

- 등록된 location으로 이동하는 입력을 보낸다.
- 이동이 실제 Story와 Extract evidence에 나타난 경우에만 canonical `location_id`가 변경되는지 확인한다.
- blocked/partial movement에서는 기존 canonical scene이 보존되는지 확인한다.

### 6.6 NPC presence

- Story에 명시된 entrance/exit와 final presence를 확인한다.
- `scene.present_npc_ids`가 presence 정본이고, stale participants/last_npcs_present/present flag가 NPC를 추가하지 않는지 확인한다.
- current scene 밖 NPC의 등록 여부나 마지막 위치만으로 presence가 복구되지 않는지 확인한다.

### 6.7 Clothing preservation

- 기존 NPC/player clothing에 `removed`, `open`, `unknown`, custom key를 준비한다.
- canonical opening/helper 경로가 기존 값을 유지하고 누락된 기본 슬롯만 `worn`으로 보충하는지 확인한다.
- CSA 활성화/해제만으로 clothing/posture가 자동 변경되지 않는지 확인한다.
- 실제 Story evidence가 있는 탈의·착의만 Extract/Commit 후 state에 반영되는지 확인한다.

### 6.8 CSA projection

- 승인된 CSA transaction으로 규칙 하나를 활성화한다.
- 다음 context projection만 확인한다.

```text
context.active_world_rules
```

- 활성 규칙 원문·강도·범위·활성 시각이 한 번 전달되는지 확인한다.
- Story 전에 actor_id/target_id/character_id가 생성되지 않는지 확인한다.
- 적용 범위에 해당하는 현재 장면 인물은 Story가 판단하고, Extract는 실제 결과만 기록하는지 확인한다.
- 규칙 해제 시 active projection에서만 사라지고 과거 physical state가 자동 복구되지 않는지 확인한다.

## 7. 실패 및 rollback 기준

다음 중 하나라도 발생하면 즉시 신규 game/API 입력을 중단하고 상태를 보존한다.

- migration statement 오류, transaction abort, checksum 불일치
- verification SQL의 helper/signature/권한/canonical scene 실패
- turn-0 backfill이 Company 이외 row 또는 `game_master`/action/turn/story를 변경
- 기존 clothing 값 손실, custom key 손실, unrelated root 변경
- opening이 `committed_turn`을 0에서 변경하거나 gameplay row/Extract를 생성
- raw Story와 저장/replay/Extract 입력 불일치
- canonical presence/location/focal/speaker와 Story evidence 불일치
- CSA projection에 사전 actor/target 선택이 나타남
- 첫 게임의 setup/opening/turn 1/turn 2/movement/presence/clothing/CSA 단계 중 하나라도 실패

Rollback 원칙:

1. migration이 transaction 중 실패하면 후속 SQL을 실행하지 않고 transaction rollback 상태를 확인한다.
2. 이미 commit된 뒤 verification 또는 첫 게임 검증이 실패하면 운영 write를 동결하고, 사전 승인된 backup snapshot으로 복구한다.
3. historical migration 파일을 수정하거나 down migration을 임의로 만들지 않는다.
4. backup restore가 불가능하면 rollback 완료로 보고하지 않고 DB 담당자와 함께 중단 상태로 escalation한다.
5. 전용 test game 실패는 해당 game을 격리하고 운영 save에 수동 repair SQL을 적용하지 않는다.
6. 복구 후 verification SQL을 처음부터 다시 통과시킨 뒤에만 운영 재개를 승인한다.

## 8. 승인 기록

| 단계 | 결과 | 기록 |
|---|---|---|
| PR #54 merge SHA | 대기/완료 | `662cb06663d7863a771df50248fdae167f0c9acd` |
| Backup snapshot | 대기 | snapshot ID / 시각 |
| Migration apply | 대기 | runner / 시각 |
| Verification SQL | 대기 | 결과 / 시각 |
| First game validation | 대기 | game ID / 결과 |
| Production go/no-go | 대기 | 승인자 |

이 문서는 migration 적용 자체를 승인하지 않으며, 별도 운영 승인과 backup 확인이 선행되어야 한다.
