# Next phase plan

## Current status

- Repository: `zeroslove-ai/company-v1`
- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay, recovery, and state contracts: complete and merged.
- Phase 1 company database migration package: complete, merged, applied, and verified.
- Main base SHA: `7e74ed6c07fd39c05be7ddebc74c3a1743a04b65`.
- Current work branch: `phase/5-frontend-deploy`.
- Phase 2 context → Story SSE → Extract → guarded Commit vertical loop: complete, including local live E2E verification.
- Phase 4 frontend vertical loop: complete and merged.
- Current work: **Phase 5 frontend Worker deployment, public asset smoke, and Context smoke**.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied.
- Phase 2 contract tests use mock Supabase and mock LLM calls; its separately authorized live E2E is complete.
- Phase 3 smoke uses remote read-only endpoints only and performs no Story or Extract model call.
- Cloudflare API Worker `game-proxy-company-v1` is deployed and remote smoke verification is complete.
- API Worker URL: `https://game-proxy-company-v1.zeroslove.workers.dev` (version `5b6471ab-d212-4f91-be11-bc9be463c129`).
- Frontend Worker `gamebuilder-company-v1` is deployed at `https://gamebuilder-company-v1.zeroslove.workers.dev`.
- Public game URL: `https://gamebuilder-company-v1.zeroslove.workers.dev/?game=11111111-1111-4111-8111-111111111111`.
- Public asset and read-only Context smoke tests passed. No public Story, Extract, or Commit request was performed.
- The API Worker is updated by the first-turn choices and Extract latency hotfix.
- First-turn choices and Extract latency hotfix: deployed to the API and frontend Workers; Context reload now restores committed choices and Mind monitor.
- Next live gameplay validation: user-run Turn 2. No automatic Story, Extract, or Commit request is authorized for this hotfix.
- The retired Dify project is not used and must not be modified.

## Phase 2 implementation target

The current implementation must complete one recoverable game-turn path:

```text
Context
→ action reservation
→ one Story SSE call
→ one Extract call
→ guarded state merge
→ one Commit call
→ action recovery
```

Runtime principles:

* one Story call
* one Extract call
* one Commit call
* zero LLM repair calls
* Story text is preserved even when parsing has warnings
* Extract returns a delta rather than a full save
* Commit uses the authoritative database save
* duplicate actions reuse stored Story or Extract results
* noncritical mismatches become warnings
* database turn conflicts and critical integrity failures remain blocking

## Sequence

1. User validates the first public browser Story turn.
2. Configure Company v1 content and CSA presentation.
3. Add images and TTS in later phases.
4. Consider a game clock with default elapsed minutes and Extract-proposed time progression; do not implement it before the gameplay requirement is approved.

## Current Phase 2 boundaries

Included:

* `/api/context`
* `/api/story`
* `/api/extract`
* `/api/commit`
* `/api/action-status`
* Story and Extract prompts
* completed Story parser
* Extract envelope normalization
* guarded state delta merge
* action recovery calculation
* mock-based API and engine tests

Not included:

* feedback runtime
* reset runtime
* image runtime
* TTS
* finished frontend gameplay UI
* real LLM calls during this PR
* Cloudflare resource creation
* Cloudflare secret configuration
* deployment
* additional database or security migrations

## Phase 2 live E2E result

Phase 2 core live Context → Story → Extract → Commit passed against the independent development game. The final harness failure was a false negative from an absolute save-revision expectation; cleanup completed successfully. Live replay remains unverified, and no additional LLM calls will be made in this phase. The subsequent Phase 3 API Worker deployment and read-only remote smoke test completed successfully.
