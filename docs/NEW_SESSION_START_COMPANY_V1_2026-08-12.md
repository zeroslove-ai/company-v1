# 새 세션 시작 프롬프트 — Company v1 (2026-08-12)

게임개발 / Company v1 프로젝트를 이어서 진행한다.

먼저 첨부된 `SESSION_HANDOFF_2026-08-12_COMPANY_V1.md` 전체를 읽어라.
그 다음 추측하지 말고 실제 GitHub와 Supabase를 도구로 감사하라.

## 가장 중요한 현재 목표

현재 다음 두 UI blocker가 사용자 실제 브라우저에서 재현됐다.

1. `player_setup.completed=true`, `opening_state.status=complete` 상태인데도 2턴 전후 플레이어 설정 UI가 반복적으로 다시 노출됨.
2. Opening canonical choices 4개가 DB에 저장되어 있는데 Opening 직후 하단 선택지가 화면에 나타나지 않음.

별도 P1 실제 버그:
- NPC 내면이 `[THOUGHT]`로 생성되어 `player_inner_thought`에 저장되는 ownership 오염.

## 우선순위

1. 게임 진행 가능
2. Story 자연스러움 / Player Agency
3. state integrity
4. semantic completeness

## 현재 GitHub

- repo: `zeroslove-ai/company-v1`
- branch: `hotfix/playtest-presentation-monitor-v1`
- expected HEAD: `001c66ce352631911347a4554816bfeda34a8338`
- PR #61: Open / Draft / Unmerged

확인 전 쓰기 금지.

## Supabase

- project: `fmcrspgxstsmxxsmkeee`
- test game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- production game: `11111111-1111-4111-8111-111111111111`

Production 접근/write/reset 금지.

## 현재 제품 판정

Phase 12L rerun에서 다음은 PASS:
- Company edition master parity
- clothing CSA applicable actor
- `required_now`
- `mandatory_execution`
- `transition_required_now=true`
- Story concrete clothing execution
- Extract `underwear_bottom=removed`
- Commit `underwear_bottom=removed`
- Opening/Turn1/Turn2/Turn3 진행

즉 현재 CSA engine을 다시 뜯지 마라.

## 다음 작업

`Phase 12M — Frontend Lifecycle Regression + THOUGHT Ownership Diagnosis`

먼저 진단:
- player-setup-overlay writer 전수 추적
- deployed frontend와 GitHub HEAD parity
- setup lifecycle runtime snapshot
- opening choices dataflow
- THOUGHT ownership dataflow
- Mind Monitor capture gap

Root cause 확정 전 src 수정 금지.

## 금지

- 새 CSA subsystem
- DB migration
- model/provider 변경
- retry/regeneration
- 추가 LLM
- 전체 frontend 리팩터
- THOUGHT 자연어 semantic classifier
- THOUGHT/Mind Monitor hard gate
- PR Ready/merge

## 중요한 사용자 정책

사용자가 setup overlay가 또 뜬 화면을 보내면 닫거나 다시 저장하기 전에 DB/context부터 읽어서 frontend stale state와 server state를 비교한다.

수동 플레이를 다시 막는 자동 harness 과잉 검증은 금지한다.
