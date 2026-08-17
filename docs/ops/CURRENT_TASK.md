# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: test-single-statement-wrapper-digest-correction-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This task follows terminal `5318275354` (`BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE / BLOCKED_TEST_SINGLE_STATEMENT_BRIDGE_PREFLIGHT`). The wrapper was not executed. The blocker is evidence-only: the committed wrapper blob matched, but the previously frozen SHA-256 appears to have been calculated with a different trailing-newline serialization.

This task must determine the exact SHA-256 of the immutable committed Git blob bytes and correct the audit evidence. It must not apply or edit the wrapper.

## 0. Frozen evidence

- Repository: `zeroslove-ai/company-v1`
- Expected main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous blocked final SHA: `a7ff80e60eff8b0a4c72bf225a992369f41a6bc6`
- Previous terminal: `5318275354`
- TEST project: `fmcrspgxstsmxxsmkeee`
- Original bridge path: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE.sql`
- Original bridge blob: `cf3158db1960a52053a8b31fda1c4473ed05486d`
- Original bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`
- Wrapper path: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`
- Wrapper Git blob: `1f959e140eacd88e281f3217cc1bf990f15dc41c`
- Historical frozen wrapper SHA-256: `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2`
- Blocked-run checked-out byte SHA-256: `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`
- Ordered payload SHA-256 from wrapper audit: `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`
- Accepted TEST migration snapshot: 27 rows; canonical SHA-256 `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`; `20260817000200` absent.

Do not assume either wrapper SHA-256 is correct. Recompute from raw immutable bytes.

## 1. Mandatory start freeze

Before evidence work:
1. require `origin/main == 8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
2. require this branch to be the direct descendant of `a7ff80e60eff8b0a4c72bf225a992369f41a6bc6` with only this registration added before execution;
3. require wrapper path at HEAD to resolve to blob `1f959e140eacd88e281f3217cc1bf990f15dc41c`;
4. require original bridge path/blob unchanged;
5. fresh-read TEST migration history read-only and require 27 applied rows and `20260817000200` absent. If the accepted canonical snapshot procedure is available, rerun it and require the same hash.

Any mismatch: STOP `WRAPPER_DIGEST_CORRECTION_BLOCKED`.

## 2. Two independent raw-byte reads

Read the exact wrapper blob through two independent byte-preserving paths.

### Path A — local Git object database
Use the blob SHA directly, e.g. binary-safe `git cat-file blob 1f959e140eacd88e281f3217cc1bf990f15dc41c`. Capture stdout as raw bytes with no text decoding/newline conversion and compute SHA-256.

Do not hash PowerShell text output, `Get-Content`, line arrays, or any decoded/re-serialized string.

### Path B — GitHub blob API
Fetch the exact same blob SHA from GitHub in raw/base64 form, decode to raw bytes without text normalization, and compute SHA-256.

Require:
- identical byte length;
- identical raw bytes;
- identical SHA-256;
- record exact byte length;
- record final byte(s) in hex;
- state whether the blob ends with LF (`0a`), CRLF (`0d0a`), or neither.

If Path A and B disagree, STOP.

## 3. Diagnose the historical digest discrepancy

Let the independently verified committed blob bytes be `B`.

1. Compute `SHA256(B)`.
2. If `B` does not end in LF, diagnostically compute `SHA256(B || 0x0A)`.
3. Compare against both historical values:
   - `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2`
   - `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`
4. Prove exactly whether the prior audit digest came from an extra trailing LF or another serialization difference.
5. Canonical future execution digest must be `SHA256(B)`, the exact committed Git blob bytes.

Do not modify the wrapper to make a historical digest match.

## 4. Revalidate wrapper semantics without changing it

Rerun the deterministic wrapper equivalence proof against the immutable blob:
- original executable statements = 8;
- wrapper top-level executable statements = 1 `DO`;
- dynamic EXECUTE payloads = 8;
- exact order/content equivalence;
- ordered payload SHA-256 remains `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`.

If semantic/payload evidence differs from the accepted audit, STOP.

No TEST execution-channel probe is needed unless strictly necessary to prove a byte-handling claim. Do not submit the wrapper.

## 5. Evidence artifact

Create exactly one new evidence file:
- `docs/ops/TEST_SINGLE_STATEMENT_WRAPPER_DIGEST_CORRECTION.md`

It must record:
- blob SHA;
- Path A and Path B methods;
- byte lengths and SHA-256 values;
- final byte(s);
- historical `8a5e...` and `433b...` comparison;
- trailing-LF diagnosis;
- canonical corrected wrapper SHA-256;
- wrapper semantic equivalence revalidation;
- TEST migration snapshot;
- explicit zero-write safety counts.

Do not edit the wrapper, original wrapper audit, original bridge, bridge plan, or migrations.

## 6. Repository / DB scope

Allowed repository changes only:
- `docs/ops/CURRENT_TASK.md`
- `docs/ops/TEST_SINGLE_STATEMENT_WRAPPER_DIGEST_CORRECTION.md`

Forbidden:
- wrapper edits/regeneration;
- original bridge/audit/plan edits;
- `supabase/migrations/*` edits;
- runtime/source/content/test/package/workflow changes;
- any DB/schema/data/history write;
- migration apply/push/repair;
- TEST gameplay/save/fixture mutation or live turn;
- Worker/frontend deploy;
- Production access/change;
- starting Cut 3 or unrelated work.

`git diff --check` must PASS.

## 7. Terminal classification

Choose exactly one.

### `WRAPPER_DIGEST_CORRECTION_PROVEN`
Use only if:
- both raw-byte paths agree exactly;
- canonical SHA-256 of committed blob bytes is proven;
- historical digest discrepancy is exactly explained;
- wrapper semantic/payload equivalence remains unchanged;
- TEST migration snapshot has no material drift;
- DB/schema/history/gameplay/deploy/Production writes/access = 0.

### `WRAPPER_DIGEST_CORRECTION_BLOCKED`
Use for any byte-source disagreement, unexplained digest discrepancy, wrapper semantic mismatch, Git/main drift, TEST migration-history drift, or other uncertainty.

At terminal:
1. set CURRENT_TASK to `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, both byte-source results, canonical digest, trailing-LF diagnosis, equivalence result, TEST snapshot, changed paths, and safety counts;
3. STOP. Do not apply the wrapper or create the next task.

## Execution lifecycle

- 2026-08-18: `EXECUTION: STARTED` lease posted to Issue #68 as comment `5318420903`.
- 2026-08-18: immutable blob paths agreed; wrapper digest correction proven.
- 2026-08-18: mandatory TEST migration snapshot repeated twice read-only; row count and target absence matched, but canonical SHA was `240c423e5b8e6dc19096b3d8914f4c29cc648580659a3e30b5b928b035659d3e`, not frozen `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`.
- 2026-08-18: terminal classification `WRAPPER_DIGEST_CORRECTION_BLOCKED`; stop without wrapper/bridge execution or any writes.
