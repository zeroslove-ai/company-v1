# Company v1 development rules

- Read `CURRENT_TRUTH.md` before code changes.
- Keep one active implementation PR by default; do not create stacked PRs without owner approval.
- Current source and live DB outrank historical handoff prose.
- Work only inside the currently authorized implementation cut.
- Use targeted tests during development and run the full suite once at the final candidate.
- Do not add semantic gates or retries as incidental fixes.
- Do not fix unrelated bugs discovered during a cut; record them instead.
