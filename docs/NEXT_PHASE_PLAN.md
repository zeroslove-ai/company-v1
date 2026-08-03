# Next phase plan

## Current status

- Repository: `zeroslove-ai/company-v1`
- API runtime: `src/api`
- Engine: `src/engine`
- Frontend: `src/frontend`
- Phase 0 independent repository bootstrap: complete and merged.
- Phase 0.5 gameplay, recovery, and state contracts: complete and merged.
- Phase 1 company database migration package: complete, merged, applied, and verified.
- Main base SHA: `19ffdfbd962cd883330466ba826025f625fd6b0b`.
- Current work branch: `phase/2-vertical-loop`.
- Current work: **Phase 2 context → Story SSE → Extract → guarded Commit vertical loop implementation**.
- Target Supabase project: `fmcrspgxstsmxxsmkeee` (`https://fmcrspgxstsmxxsmkeee.supabase.co`), project name `company-v1`, region `ap-northeast-1`.
- Four migrations and the fixed development seed are applied.
- Phase 2 tests use mock Supabase and mock LLM calls only.
- Real Story and Extract model calls have not been performed.
- Cloudflare resources and deployment remain unperformed.
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

1. Complete the Phase 2 API and engine implementation.
2. Validate the implementation with mock Supabase and mock LLM tests.
3. Review and merge the Phase 2 pull request.
4. Configure local runtime secrets outside the repository.
5. Run one live development-game turn against the independent Supabase project and selected Story/Extract models.
6. Fix only errors found in that live vertical-loop test.
7. Create and configure the API Cloudflare Worker after the local vertical loop is stable.
8. Add company content, CSA presentation, frontend gameplay, images, and TTS in later phases.

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
