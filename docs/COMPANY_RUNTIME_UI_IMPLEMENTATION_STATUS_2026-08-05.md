# Company Runtime UI implementation status — 2026-08-05

기준 제품 계약: `docs/COMPANY_RUNTIME_UI_PRODUCT_CONTRACT_V1.md`

## 구현 완료 범위

- Mind Monitor NPC별 `surface` / `subconscious` 렌더링
- `physical_reaction` 및 신체반응 제3필드 미사용 유지
- Mind Monitor 인물 탭과 명시적 빈 상태
- Mind Monitor를 이미지·TTS 다음의 우선 정보로 배치
- TTS OFF 상태의 자동 요청 0건 정책 유지
- TTS OFF 상태에서도 수동 대사 재생 허용
- `speaker_id`, 연기지시, 모바일 audio priming 지원
- 기존 독립 TTS Worker `fancy-dust-7f8c` Service Binding 연결
- Story가 전문 선택지와 짧은 라벨을 함께 생성하는 계약
- 전문 선택지와 라벨 분리 parser
- 하단 버튼은 라벨만 표시하고 원문 전문을 실행
- 과거 unlabeled 턴은 의미 추측 없이 원문 앞부분 fallback
- player/NPC `position_label`과 정확한 Story evidence 계약
- 자세 연속성 유지 및 근거 없는 자세·위치 변경 거부
- 메인 서사의 중복 `turn_summary` 제거
- 기록 모달의 턴 요약 유지
- 중복 현재 장면 문구 제거
- 플레이어 속마음 스크롤 초기화
- 사정 가능 50% 중앙 기준선 유지
- 모바일 이미지 높이 및 TTS 도구막대 압축

## 변경하지 않은 범위

- 추가 LLM 호출 없음
- Supabase migration/DDL 없음
- Hospital 게임 Worker·Supabase·프론트 의존 없음
- Story → Extract → guarded merge → Commit 파이프라인 유지
- CSA 앱·structured action·recovery 계약 유지

## 배포 상태

코드 및 회귀 테스트 구현 단계이며 Worker 배포 전이다. 최종 CI와 Wrangler dry-run이 모두 통과한 exact SHA만 별도 배포 지시 대상으로 사용한다.
