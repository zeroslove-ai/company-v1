# Company v1 CSA activation hotfix

Deploy the current PR #19 head after confirming its history contains the CSA activation regression fix.

## Production symptom

The previously deployed build loads, but the core 상식개변 flow is blocked or does not recognize the existing save's rules.

## Root causes fixed

1. New preset drafts were edited through flat UI fields, while final completeness validation inspected `item.preset`. The two shapes were never synchronized, so a complete preset was rejected as incomplete.
2. The existing Company save stores active IDs in `csa_active` and legacy rule bodies in `csa_rules` without the later `active`, `content`, and `source_type` fields. The port incorrectly required `active === true`, so those rules were invisible to the app/runtime.

## Fix

- Materialize and synchronize the server preset payload from the current flat draft fields when operations are produced.
- At the existing Company CSA read boundary, treat membership in `csa_active` as active unless the rule explicitly says `active:false`.
- Fall back from missing `content` to legacy `required_action` and from missing `source_type` to `custom`.
- No DB migration, reset, manual save edit, alternate turn path, or duplicate CSA store was added.

## Verification

The functional fix passed:

- `319/319` tests
- API Worker Wrangler `4.118.0` dry-run
- Frontend Worker Wrangler `4.118.0` dry-run

The public Workers continue serving the older deployment until the current PR head is redeployed.
