# Phase 2 live E2E result

## Result

- Core live vertical loop: **PASSED**.
- Harness final verdict: **FALSE NEGATIVE**.
- Cleanup: **PASSED**.
- Live replay verification: **NOT COMPLETED**.

The final harness failure came from an absolute `save_revision === 1` expectation. `reset_company_game` increments `save_revision` instead of resetting it to zero, so the second run correctly committed at revision 2 after the first run's cleanup established revision 1.

## Verified live sequence

- Independent Company v1 Supabase context loaded.
- DeepSeek `deepseek-v4-flash` completed Story SSE and the Story result persisted.
- DeepSeek `deepseek-v4-flash` completed Extract and the normalized envelope persisted.
- Guarded Commit succeeded at turn number 1 with a committed action status.
- Cleanup restored `committed_turn` to 0, removed recent turns, and removed the generated action row.
- The Worker ran in-process; no Cloudflare resource was created and no deployment was performed.
- Secrets were not printed or committed.

## Not verified live

- Story replay
- Extract replay
- Commit replay

The post-Commit context assertion stopped the harness before replay checks. No additional LLM call will be made in this phase because the two-attempt live-call limit was reached. Mock tests continue to cover replay behavior.

## Revision assertion

Live validation is baseline-relative:

```text
expected committed revision = baseline revision + 1
expected cleanup revision = committed revision + 1
```

The clean precondition remains `committed_turn === 0`, save schema version 1, and edition `company-v1`; a clean development game does not require an absolute save revision of zero.
