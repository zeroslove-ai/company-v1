# Hospital donor inventory

Source inspected: `zeroslove-ai/py-all` at `origin/feature/csa-only` (`16944160994d05968687333bddbf2ad97bd3b1a9`). This is inventory only; no donor file is copied wholesale. `pages/main.js` and `pages/hypnosis-app.js` do not exist on that latest branch.

| 기능 | 병원편 원본 파일 | 직접 의존성 | 병원편 API 의존성 | 병원편 save 필드 의존성 | 전역 상태 의존성 | Company adapter 필요 여부 | 처리 | 회사편 목표 필드·endpoint | legacy 주의 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 페이지 shell | `pages/index.html` | fixed DOM/CSS ids | none | none | browser DOM | yes | 재작성 | Company view-model renderer | hospital markup and global wiring |
| 화면 갱신 | `pages/ui.js` | DOM, image, audio | indirect | player/status/choices | singleton UI | yes | adapter 뒤 재사용 | view-model `story/scene/player/media` | raw mutable state and element singleton |
| sidebar | `pages/sidebar.js` | DOM, TTS, CSA app | resume API | relationships/thought | `window.csaApp` | yes | 재작성 | focal character / relationship display | hospital navigation and global app |
| TTS | `pages/tts.js` | AudioContext/audio element | TTS endpoint | dialogue/history | sessionStorage | yes | adapter 뒤 재사용 | later dialogue-lines/TTS contract | session-global playback and direct DOM |
| history modal | `pages/history.js` | DOM/download | `/api/history` | turn history | modal singleton | yes | adapter 뒤 재사용 | later Company history endpoint | endpoint absent in Company today |
| API client | `pages/api.js` | fetch | `game-proxy-v2` many routes | app state/save | API base global | yes | 재작성 | Company `/api/context`, Story, Extract, Commit | legacy Worker, direct endpoint shape |
| Story stream | `pages/stream.js` | fetch/ReadableStream | legacy `/api/story` | choices/story text | callbacks | yes | adapter 뒤 재사용 | Company named SSE adapter | legacy sanitizer and unnamed assumptions |
| main bootstrap | `pages/main.js` | — | — | — | — | yes | 재작성 | Company `app.js` | file absent in current donor |
| client state | `pages/state.js` | plain object | none | pending action/media | module singleton | yes | adapter 뒤 재사용 | Company pending + view model | do not promote donor globals to authority |
| CSA app | `pages/csa-app.js` | DOM/history events | CSA endpoints | CSA rules/attitudes | `window.csaApp` | yes | 재작성 | later Company CSA adapter | hospital overlays and global history |
| hypnosis app | `pages/hypnosis-app.js` | — | — | — | — | no | 제외 | none | file absent in current donor |
| API Worker | `worker/game-proxy-v2.js` | Supabase, LLM, legacy routes | many hospital endpoints | extensive hospital JSON | Worker env/defaults | yes | 재작성 | existing Company Worker endpoints | 13k-line legacy Worker, hospital project defaults |

## Classification result

- Direct extraction: none.
- Reuse behind an adapter: streaming parser patterns, TTS/history presentation ideas, and client-state boundaries only after their Company contracts exist.
- Rewrite: API client, page shell, sidebar, CSA UI, and all Worker logic.
- Excluded: missing `pages/main.js`, missing `pages/hypnosis-app.js`, hospital Worker defaults, hospital database assumptions, and all donor deployment assets.
