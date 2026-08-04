# Company v1 CSA activation hotfix

Deployment head: `477e984311f9b04a198e4084a3658dcc697f13c4`
Functional fix head: `95092247dce6a34afb93d76ac5232f7d7a19be14`

## Production symptom

The deployed `81168a9ac22092d9ad7ee635bd9b0fec1ce8e650` build loads, but the core 상식개변 flow is blocked or does not recognize the existing save's rules.

## Root causes fixed

1. New preset drafts were edited through flat UI fields, while final completeness validation inspected `item.preset`. The two shapes were never synchronized, so a complete preset was rejected as incomplete.
2. The existing Company save stores active IDs in `csa_active` and legacy rule bodies in `csa_rules` without the later `active`, `content`, and `source_type` fields. The port incorrectly required `active === true`, so those rules were invisible to the app/runtime.

## Fix

- Materialize and synchronize the server preset payload from the current flat draft fields when operations are produced.
- At the existing Company CSA read boundary, treat membership in `csa_active` as active unless the rule explicitly says `active:false`.
- Fall back from missing `content` to legacy `required_action` and from missing `source_type` to `custom`.
- No DB migration, reset, manual save edit, alternate turn path, or duplicate CSA store was added.

## Verification

GitHub Actions run `30904001774` on the functional fix:

- `319/319` tests passed
- API Worker Wrangler `4.118.0` dry-run passed
- Frontend Worker Wrangler `4.118.0` dry-run passed

The public Workers still serve the older deployed SHA until the deployment head is redeployed.
