# Open State UI v1

## Scope

This patch removes narrative-facing allow-list behavior without weakening system
integrity. Posture, relative position, location labels, and clothing descriptions
may be concise Korean natural language when exact final-Story evidence exists.

## Compatibility boundary

- Legacy English posture/clothing/location identifiers remain readable for old saves.
- They are compatibility input, not the complete output catalog.
- Unknown English internal codes are not projected to the player UI.
- CSA lifecycle, turn idempotency/recovery, action state, DB schema, and bounded
  numeric relationship metrics remain finite system states.
- A rejected physical field produces a warning and carries prior state; it does
  not fail Story or Commit.

## Deployment handoff

No migration and no game reset are required. After this PR has a verified final
SHA, the deploy-only operator must check out that exact SHA and run, in order:

```bash
npm test
npx wrangler deploy --config wrangler.api.jsonc
npx wrangler deploy --config wrangler.frontend.jsonc
```

Report the exact checked-out SHA plus both Worker version IDs. Do not make feature
edits during deployment; only a minimal deployment-blocker fix is allowed and it
must produce a new SHA that is re-tested before either Worker is deployed.
