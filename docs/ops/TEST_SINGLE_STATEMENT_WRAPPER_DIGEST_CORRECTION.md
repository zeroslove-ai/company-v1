# Wrapper digest correction evidence

Task: `test-single-statement-wrapper-digest-correction-v1`  
Registration: `2e38deb0b424afdd6a956629e989a102e353db3a`  
CURRENT_TASK blob: `dd6a436eede2da957347f6cf1bd782f1e0cf9078`  
Expected branch: `company/test-single-statement-wrapper-digest-correction-v1`  
Starting SHA: `2e38deb0b424afdd6a956629e989a102e353db3a`  
Expected main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`  
Previous blocked SHA: `a7ff80e60eff8b0a4c72bf225a992369f41a6bc6`

## Immutable wrapper bytes

Wrapper path: `docs/ops/TEST_ADDITIVE_SCHEMA_BRIDGE_SINGLE_STATEMENT.sql`  
Wrapper blob: `1f959e140eacd88e281f3217cc1bf990f15dc41c`

Two independent byte-preserving reads agreed exactly:

- Path A: `git cat-file blob 1f959e140eacd88e281f3217cc1bf990f15dc41c`; 8691 bytes; SHA-256 `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`.
- Path B: GitHub `git/blobs/1f959e140eacd88e281f3217cc1bf990f15dc41c` API base64 decoded to raw bytes; 8691 bytes; SHA-256 `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`.
- Raw bytes: identical.
- Final bytes: hex `6170706572243b0a` (`apper$;\n`). The blob ends with LF (`0a`), not CRLF (`0d0a`), and not neither.

The independently computed `SHA256(B)` is therefore `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`. Diagnostic `SHA256(B || 0a)` is exactly `8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2`, the historical frozen value. The discrepancy is exactly one additional trailing LF in the historical hash input. The canonical future execution digest is the exact blob-byte digest `433b8f2352b97536932350fcba5b1a3a4610a59546c5dc40b0a58e2459b2c3e0`.

## Wrapper equivalence revalidation

The immutable bridge blob `cf3158db1960a52053a8b31fda1c4473ed05486d` was scanned with quote-aware PostgreSQL lexical states for comments, quoted strings, and dollar-quoted bodies. The immutable wrapper was scanned with the same semicolon rules and its dynamic `EXECUTE` payloads were compared after only outer-boundary trimming and removal of source comments from the bridge stream.

- Original executable top-level statements: 8.
- Wrapper top-level statements: 1.
- Dynamic `EXECUTE` payloads: 8.
- Exact order/content comparison: PASS for all 8 statements.
- Ordered payload SHA-256 (payloads joined by LF): `54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b`.
- Original bridge SHA-256: `6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9`.

No wrapper or bridge was edited or executed.

## TEST read-only snapshot and stop condition

The exact accepted migration-history query was run twice read-only against TEST project `fmcrspgxstsmxxsmkeee`. Both reads returned:

- row count: 27;
- target `20260817000200`: absent;
- canonical SHA-256: `240c423e5b8e6dc19096b3d8914f4c29cc648580659a3e30b5b928b035659d3e`.

The required frozen canonical SHA-256 is `6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc`. The repeated mismatch means the mandatory start freeze was not satisfied. This task is classified `WRAPPER_DIGEST_CORRECTION_BLOCKED` and stops without retrying or applying anything.

Safety counts: wrapper execution 0; bridge execution 0; DB/schema/data/history writes 0; migration apply/push/repair 0; TEST gameplay/live turns 0; deploy 0; Production access/change 0.
