# Independent runtime decision

Company v1 is not a derived runtime or a deployment mode of any legacy application. It is an independent application repository with independently managed GitHub history, API Worker, frontend Worker, engine, Supabase project, migrations, secrets, game IDs, image catalog, build, and deployment.

The runtime must not import legacy application code or call legacy Workers or databases as fallbacks. Future common code may be extracted only after independent tests prove equivalent behavior, and only as an explicitly scoped package.

This repository does not use text patch generators or generated Workers. The intended runtime policy is one Story SSE call, one Extract call, one Commit call, and zero LLM repair calls.

## Superseded imported documentation assumptions

Any imported statement that treats `zeroslove-ai/py-all`, `apps/company-v1`, or `packages/game-core` as this repository's runtime topology is superseded. Phase 0 does not create a Supabase project or immediately implement migrations.

The current sequence is: Phase 0 independent repository bootstrap; Phase 0.5 gameplay, recovery, and state contracts; Phase 1 company-only database migration package; Phase 2 context, Story, Extract, and Commit loop.
