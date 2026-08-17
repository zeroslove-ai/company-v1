# Single-statement TEST bridge audit

Task: test-additive-schema-bridge-single-statement-v1
Registration: 4cffae459d6e86260dba66fc87a387c9b3d82ffa
Registration CURRENT_TASK blob: eca5089db0ff646318ed9d70732bb22a4e479dc5
Expected branch: company/test-additive-schema-bridge-single-statement-v1
TEST project: fmcrspgxstsmxxsmkeee

## Frozen inputs

- Reviewed bridge blob: cf3158db1960a52053a8b31fda1c4473ed05486d
- Reviewed bridge SHA-256: 6d0593b22d50c36a4c68c8c71407be7a25f03f8542ae73aee1083e9b102031f9
- The reviewed bridge and plan are unchanged.
- No wrapper was submitted or applied.

## Mechanical wrapper proof

The source was scanned with quote-aware PostgreSQL lexical states for line/block comments, single/double quoted strings, and dollar-quoted bodies. Semicolons were split only in the normal state. Comments were excluded from the executable payload stream; each payload was trimmed only at its outer boundaries. The resulting payload bytes were embedded unchanged inside unique dollar-quoted dynamic strings.

- Original executable top-level statements: 8
- Wrapper executable top-level statements: 1 (DO $company_single_statement_wrapper$)
- Dynamic EXECUTE payloads inside wrapper: 8
- Original-to-wrapper order/content comparison: PASS
- Dynamic tags collide with payload: NO
- Persistent writes performed by wrapper: 0 (wrapper was not submitted)
- Wrapper SHA-256: 8a5e438919d25fae4a618348c0b32473dcef1adc9f6baa10c09700cc886495f2
- Ordered payload SHA-256 (payloads joined by LF): 54fde93e424e3a34b730a2c48eb09c828c783e03b14b0efa0e3e1b950452848b

### Ordered payload inventory

1. company_apply_opening_scene_v1 - 1809 chars - 7c72b9e28ea3465115a2d7cf899613bb64c1c445eddc9b4c6e0bdc62e30ea7ac
2. company_minimalize_save_v1 - 484 chars - ecf4d8868ecd5d019c45182d7bd693178f75a6c48f511d80d44df1f9ff987eea
3. company_validate_scene_v1 - 1212 chars - e60b14f795737831f5e5d684f65d0882f14383f6a2c4ead3f4f116dfd9313cbe
4. validate_company_save_v1 - 1368 chars - aa76c7e376aae1ab6b943ccc50f3595ed3d8561e860b27b7d5853a16130316d5
5. revoke minimalize ACL - 110 chars - fbb81ba8f013897474020e519b3a521909a95b455ed25c0da8b29f07718ef0eb
6. revoke validate ACL - 94 chars - fa1840b2b1a7854b4c88e76113bc8d70500dea4bc03881cdf77ed5edf7e1d4ca
7. grant validate ACL - 80 chars - 33c61f84babd7ddf9518115488f70e1beda7e3a9d2848e9a5ca563da79507ae7
8. reserve_company_player_setup - 2722 chars - 1d1edb9cb7c95171b5be33db9f53ceb8a8713ca04ce2395a71b49048bec9bd0f

Every wrapper payload hash equals its corresponding original payload hash.

## Atomicity reasoning

The generated file has one top-level DO statement. Each original bridge statement is executed synchronously by one dynamic EXECUTE inside that DO block. There is no exception handler, no transaction-control command, and no autonomous transaction mechanism. If any inner command fails, the error escapes the block and the single submitted statement fails; earlier inner effects are not independently committed by this wrapper.

## Harmless TEST channel probes

Execution channel: Supabase CLI 2.114.0, db query, direct encoded TEST DB URL from the verified project environment. The wrapper was not passed to the CLI.

- Success probe: one DO statement, DO returned; exit code 0.
- Failure probe: one DO statement with PERFORM 1 followed by a deliberate exception; exit code 1 with LegacyDbQueryExecError and message single_statement_bridge_failure_probe.
- Error propagation: PASS.
- Persistent/schema/migration-history writes: 0.

## Migration snapshot

The exact accepted read-only snapshot query was rerun against TEST after the probes:
count = 27
canonical SHA-256 = 6fc2d673ca6bbcc406d8f6b312cacadbed208057a379948c0969cc7bc412dadc
target row 20260817000200 present = false

This equals the frozen accepted snapshot. No mutation was performed.

## Terminal safety counts

- Bridge/wrapper application: 0
- DB/schema/migration-history writes: 0
- Migration applies, push, or repair: 0
- TEST gameplay/save/fixture writes or live turns: 0
- Worker deploy: 0
- Production access/change: 0
