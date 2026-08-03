# 상식개변 회사편 v1

`company-v1`는 독립된 Company v1 애플리케이션 저장소입니다.

현재 상태:

- Phase 1 database migration package: complete, merged, applied, and verified.
- Phase 2 API vertical loop and live in-process turn: complete.
- Phase 3 API Worker: deployed at `https://game-proxy-company-v1.zeroslove.workers.dev`.
- Phase 4 frontend vertical loop: in progress on `phase/4-frontend-loop`.
- The frontend Worker has not been deployed.

The browser frontend uses the API Worker for Context, Story SSE, Extract, Commit, and action recovery. It does not contain Supabase or LLM credentials and does not call Supabase directly.

This repository does not import or fall back to legacy application repositories, Workers, databases, game IDs, or deployment resources.
