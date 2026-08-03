# 상식개변 회사편 v1

`company-v1`는 독립된 Company v1 애플리케이션 저장소입니다.

현재 상태:

- Phase 1 database migration package: complete, merged, applied, and verified.
- Phase 2 API vertical loop and live in-process turn: complete.
- Phase 3 API Worker: deployed at `https://game-proxy-company-v1.zeroslove.workers.dev`.
- Phase 4 frontend vertical loop: complete and merged.
- Phase 5 frontend Worker: deployed at `https://gamebuilder-company-v1.zeroslove.workers.dev`.
- Public game URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=11111111-1111-4111-8111-111111111111`.
- Public asset and read-only Context smoke tests passed. The first public browser Story turn is reserved for user validation.
- First-turn choices and Extract latency hotfix: deployed to both Workers; the next live gameplay validation is user-run Turn 2.

The browser frontend uses the API Worker for Context, Story SSE, Extract, Commit, and action recovery. It does not contain Supabase or LLM credentials and does not call Supabase directly.

This repository does not import or fall back to legacy application repositories, Workers, databases, game IDs, or deployment resources.

The next user validation is a browser Story turn followed by Company v1 content configuration. A future enhancement backlog includes a game clock with default elapsed minutes and Extract-proposed time progression.
