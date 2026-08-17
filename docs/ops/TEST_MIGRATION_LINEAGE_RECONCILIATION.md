# TEST migration lineage reconciliation — v2

## Scope and safety

This is a read-only forensic report for `test-migration-lineage-forensics-v2`.
The TEST project was `fmcrspgxstsmxxsmkeee`. The query read
`supabase_migrations.schema_migrations.version`, `name`, and the stored
`statements` payload. No repair, apply, DDL/DML write, deployment, fixture
mutation, live turn, or Production access was performed.

The stored statement digest below is MD5 of the UTF-8 text formed by joining
the row's `statements` array with one LF. It is an evidence locator, not a
cryptographic approval of a migration operation. Git blob SHAs identify the
repository evidence used for exact matches.

## Snapshot stability

The canonical snapshot input was sorted
`version|name|statement_count|statements_bytes|statements_md5`, joined by LF,
then SHA-256 hashed.

| snapshot | rows | snapshot SHA-256 | result |
|---|---:|---|---|
| A (fresh freeze) | 27 | `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d` | baseline |
| B (terminal recheck) | 27 | `e35e88200ea72671518f0f7ad2bf340de55511023b370518003d64544354168d` | identical to A |

Final stable remote set: 27 applied rows. Dynamic comparison with current
local filenames found 22 remote-only versions and 25 local-only versions.
The earlier v1 21-row list was not used as an invariant.

## Remote-only provenance table

`PROVEN_EXACT` means the stored SQL text matched a Git historical blob after
line-ending normalization. `PARTIAL` means the remote name/function shape and
repository candidate are strong evidence, but the stored payload did not
match an available Git blob exactly. `UNKNOWN` means no safe repository source
was found.

| remote version / name | stored statements evidence | Git historical source / current candidate | class | rationale |
|---|---|---|---|---|
| `20260803043354` / `company_v1_core_schema` | 1 stmt, 9513 bytes, `4edcf15a9e173c4acd37eaab60f22a1b` | `20260803000100_company_v1_core_schema.sql`; commit `18d63ce5716a9dd4f4c19762fa06ef8fb6f2445c`; blob `a8bbd3c6cff954cbca4e0ff11229994f9fe8a52f` | PARTIAL | Same canonical migration name and initial schema source path, but stored SQL differs from available Git blob. |
| `20260803043423` / `company_v1_turn_rpcs` | 1, 12011, `b73372d2d1db1199d49ae1bc5a3dd906` | `20260803000200_company_v1_turn_rpcs.sql`; commit `18d63ce5716a9dd4f4c19762fa06ef8fb6f2445c`; blob `dc80281d124334075b7aa3032c7456ec36c394cf` | PARTIAL | Same named RPC package and initial source path; exact stored payload not present in Git blobs checked. |
| `20260803043444` / `company_v1_feedback_and_reset_rpcs` | 1, 8706, `3d88f7cbca1af3c3b59f6332c7887a34` | `20260803000300_company_v1_feedback_and_reset_rpcs.sql`; commit `18d63ce5716a9dd4f4c19762fa06ef8fb6f2445c`; blob `3c0e5f4c8784424b0a09087be846dd6a9a629cdf` | PARTIAL | Same package/source path, but stored payload differs from available Git blobs. |
| `20260803043638` / `company_v1_lock_down_rpc_access` | 1, 2325, `b96817199d5d4858192bbbab8c04f04e` | `20260803000400_company_v1_lock_down_rpc_access.sql`; commit `19ffdfbd962cd883330466ba826025f625fd6b0b`; blob `971d79aebddfefaed008fb63114bf91c33b6c7cb` | PARTIAL | Same lock-down source path and name; exact payload identity not proven. |
| `20260803124757` / `add_company_player_setup_opening_rpcs` | 1, 15178, `6afe60cf5ad6f999ea4adbe02ac8c9e7` | `20260803000500_company_v1_player_setup_and_opening_rpcs.sql`; commit `a79b42f64d117a5823413380b688a98fc28e8a5e`; blob `3fd1e2eb6b9b3b5ae16ee9ec76a79929437296e8` | PARTIAL | Stored functions align with the setup/opening source family, but the applied payload and current candidate differ. |
| `20260803215756` / `lock_down_company_player_setup_opening_rpc_access` | 1, 454, `978d2ca4bb7577a4e74f44b798637356` | No matching historical filename/blob; stored SQL names `reserve_company_player_setup` and `commit_company_opening` | UNKNOWN | The remote row is concrete, but no exact repository source or safe transformed lineage was found. |
| `20260804102357` / `company_v1_history_structured_action` | 1, 19239, `e6f2bd94e928f33aed6e7b3d4edc1d08` | `20260804000100_company_v1_history_structured_action.sql`; commit `749b9e5cd1367572e347d68d7721732fa6e32548`; blob `6321d1f8499b85df1e75c5ee3e6bd3d2981cc792` | PROVEN_EXACT | Stored payload matches the historical Git blob after LF normalization; remote timestamp is a renamed/applied identity. |
| `20260810022340` / `company_v1_initial_clothing_v2` | 1, 4678, `70084825c3401ef4387779ab1039bff0` | `20260809000100_company_v1_initial_clothing_v2.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `1b0ccf1c8e172745623c944fae3c12553c6debe3` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260810022427` / `company_v1_canonical_opening_bootstrap` | 1, 9640, `edc1036254c9922efdf0aca1c660a5c1` | `20260810000100_company_v1_canonical_opening_bootstrap.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `dd140b00dae75ce09e91ba289b4e2d418a2e6f4f` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260810024638` / `company_v1_clothing_null_hotfix` | 1, 2102, `71dff166f620875f33cb19acc99ca670` | `20260810024000_company_v1_clothing_null_hotfix.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `94f70b7dbe19c6e0d8cc3931561031c7a73195cd` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260810091948` / `company_v1_commit_strict_validation` | 1, 3550, `a097c7e8c12bbe46917809016cc5415c` | `20260810090831_company_v1_commit_strict_validation.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `ace28c4c58efaf41920d1bbc43b1dec7aaf0017a` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260810095457` / `company_v1_runtime_authority_consolidation` | 1, 15455, `66401894fc0dc4c6e57cd7dce57ee625` | `20260810103000_company_v1_runtime_authority_consolidation.sql`; commit `38c09133b26c36636204cdf06077db44b16c8a57`; blob `4b5a9ef0c1acde88277b0de6b3d589ee05142bfb` | PARTIAL | Same canonical runtime-authority source and SQL prefix, but stored payload digest differs. |
| `20260810095904` / `company_v1_setup_weekday_validation` | 1, 9209, `63447b4fc95dfbd142720935618e0de9` | `20260810103100_company_v1_setup_weekday_validation.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `c5a25ec1c2266eb3f90a35091e805144591009dc` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260812071904` / `company_v1_preapply_csa_transaction` | 1, 3010, `efb3dec6787b70e7510933aa0e025dbd` | `20260812000100_company_v1_preapply_csa_transaction.sql`; commit `22a9897b03d1b4f8df9298c972399f4a43687840`; blob `c0b0f77f415dd4f539c2f852d94ef53995ccec92` | PARTIAL | Same function/source family and historical commit, but stored payload differs from available Git blob. |
| `20260814023308` / `company_v1_action_ownership_closure_stage_a` | 1, 21851, `b64cbe7c79f025c17d620cc61df87780` | `20260814000300_company_v1_action_ownership_closure_stage_a.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `a166a1e57b1d26cc2a4e5ebd3af9d95d9597aad4` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260814051254` / `company_v1_authority_enforcement_stage_b` | 1, 2278, `7829d74b920baac28577040ef0e4a69e` | `20260814000400_company_v1_authority_enforcement_stage_b.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `2bfe97eb84859ae925ac5d789122063767a4d8d5` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260814091536` / `company_v1_scene_authority_stage_a` | 1, 10618, `30a234e3ba78cb5b8260adfead6914a8` | `20260814000500_company_v1_scene_authority_stage_a.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `82e854ccb33a6c53f037d3c05e3f2954a0f31154` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260814093123` / `company_v1_scene_authority_stage_a_acl_closure` | 1, 236, `1d1971151c68ddbced2dd71279f46708` | `20260814000550_company_v1_scene_authority_stage_a_acl_closure.sql`; commit `ce23612741599493921ae7c68b9ab58d6e23bcc6`; blob `86673cd2bb56af16aacfaabd4e9eb7586bb24cd0` | PARTIAL | Same ACL-closure source family, but stored payload is smaller than the available Git blob and exact historical content was not found. |
| `20260816011104` / `company_v1_legacy_save_residue_cleanup` | 1, 8811, `771818f65a603f28ed88ae3acd89929f` | `20260816000200_company_v1_legacy_save_residue_cleanup.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `46928967870640b1337fbf9d247b4b356c788600` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260816013408` / `company_v1_reset_canonicalization_closure` | 1, 2094, `a87139597a656bc46fdbfef93feb5048` | `20260816020000_company_v1_reset_canonicalization_closure.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `eb3ee6f1876e4c0565d57e78c40b6ef6738aed16` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260816021437` / `company_v1_scene_mirror_residue_closure` | 1, 9324, `64903dfa9036fc6e465cb99db7de1b6c` | `20260816030000_company_v1_scene_mirror_residue_closure.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `56721ad959f2219fcc3c52763cd3d9284721d09f` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |
| `20260816045221` / `company_v1_setup_opening_world_authority` | 1, 13582, `363166fe521a41111dd3fc363f74a0b8` | `20260816040000_company_v1_setup_opening_world_authority.sql`; commit `7b4964d647550f658bb47bb4b5eea35b63ee50db`; blob `c0f6e396447b90007e4cbfd4500662eebd593ef4` | PROVEN_EXACT | Stored payload matches the Git historical/current candidate after LF normalization. |

Totals across the final stable remote-only set: `PROVEN_EXACT=13`,
`PROVEN_TRANSFORMED_LINEAGE=0`, `PARTIAL=8`, `UNKNOWN=1`.

## Local-only inventory

The hash is the current local Git blob hash. A `REPLAY_RISK` row is a current
filename candidate for an already applied remote migration with a different
timestamp; it must not be pushed or repaired by adding a second old file.

| local version | current file blob | relation / replay risk |
|---|---|---|
| `20260803000100` | `a8bbd3c6cff954cbca4e0ff11229994f9fe8a52f` | `PARTIAL_REMOTE_CANDIDATE` for `20260803043354`; replay risk unresolved |
| `20260803000200` | `dc80281d124334075b7aa3032c7456ec36c394cf` | `PARTIAL_REMOTE_CANDIDATE` for `20260803043423`; replay risk unresolved |
| `20260803000300` | `3c0e5f4c8784424b0a09087be846dd6a9a629cdf` | `PARTIAL_REMOTE_CANDIDATE` for `20260803043444`; replay risk unresolved |
| `20260803000400` | `971d79aebddfefaed008fb63114bf91c33b6c7cb` | `PARTIAL_REMOTE_CANDIDATE` for `20260803043638`; replay risk unresolved |
| `20260803000500` | `99dc1555617db73eed2475447fd2a7dd953c5f43` | `PARTIAL_REMOTE_CANDIDATE` for `20260803124757`; replay risk unresolved |
| `20260804000100` | `0a8021416cb54271904fe94acb04948b5675bfe2` | `PROVEN_REMOTE_EQUIVALENT` for `20260804102357`; duplicate replay risk |
| `20260807000100` | `297f449410eebe3bb5a781490ef219a3b85a4c17` | No remote version; local unapplied/superseded status requires separate proof |
| `20260807000200` | `9d1bf7f0a606415de2687272e5b726730aeb6a9d` | No remote version; local unapplied/superseded status requires separate proof |
| `20260808000100` | `9d4cd1742701ff4b81e16832490bcf7901590804` | No remote version; local unapplied/superseded status requires separate proof |
| `20260809000100` | `1b0ccf1c8e172745623c944fae3c12553c6debe3` | `PROVEN_REMOTE_EQUIVALENT` for `20260810022340`; duplicate replay risk |
| `20260810000100` | `dd140b00dae75ce09e91ba289b4e2d418a2e6f4f` | `PROVEN_REMOTE_EQUIVALENT` for `20260810022427`; duplicate replay risk |
| `20260810024000` | `94f70b7dbe19c6e0d8cc3931561031c7a73195cd` | `PROVEN_REMOTE_EQUIVALENT` for `20260810024638`; duplicate replay risk |
| `20260810090831` | `ace28c4c58efaf41920d1bbc43b1dec7aaf0017a` | `PROVEN_REMOTE_EQUIVALENT` for `20260810091948`; duplicate replay risk |
| `20260810103000` | `4b5a9ef0c1acde88277b0de6b3d589ee05142bfb` | `PARTIAL_REMOTE_CANDIDATE` for `20260810095457`; replay risk unresolved |
| `20260810103100` | `c5a25ec1c2266eb3f90a35091e805144591009dc` | `PROVEN_REMOTE_EQUIVALENT` for `20260810095904`; duplicate replay risk |
| `20260812000100` | `c0b0f77f415dd4f539c2f852d94ef53995ccec92` | `PARTIAL_REMOTE_CANDIDATE` for `20260812071904`; replay risk unresolved |
| `20260814000300` | `a166a1e57b1d26cc2a4e5ebd3af9d95d9597aad4` | `PROVEN_REMOTE_EQUIVALENT` for `20260814023308`; duplicate replay risk |
| `20260814000400` | `2bfe97eb84859ae925ac5d789122063767a4d8d5` | `PROVEN_REMOTE_EQUIVALENT` for `20260814051254`; duplicate replay risk |
| `20260814000500` | `82e854ccb33a6c53f037d3c05e3f2954a0f31154` | `PROVEN_REMOTE_EQUIVALENT` for `20260814091536`; duplicate replay risk |
| `20260814000550` | `86673cd2bb56af16aacfaabd4e9eb7586bb24cd0` | `PARTIAL_REMOTE_CANDIDATE` for `20260814093123`; replay risk unresolved |
| `20260816000200` | `46928967870640b1337fbf9d247b4b356c788600` | `PROVEN_REMOTE_EQUIVALENT` for `20260816011104`; duplicate replay risk |
| `20260816020000` | `eb3ee6f1876e4c0565d57e78c40b6ef6738aed16` | `PROVEN_REMOTE_EQUIVALENT` for `20260816013408`; duplicate replay risk |
| `20260816030000` | `56721ad959f2219fcc3c52763cd3d9284721d09f` | `PROVEN_REMOTE_EQUIVALENT` for `20260816021437`; duplicate replay risk |
| `20260816040000` | `c0f6e396447b90007e4cbfd4500662eebd593ef4` | `PROVEN_REMOTE_EQUIVALENT` for `20260816045221`; duplicate replay risk |
| `20260817000200` | `fd99a4aa8de5781c1b62ac7dba8e5ec3e3134254` | Current landed-main additive candidate; not applied and not executed here |

## Remediation analysis

Adding old timestamp SQL files locally is unsafe: the CLI would see a new
pending filename even when the database already records equivalent SQL under a
different timestamp. That can replay DDL/DML or produce a false pending set.

Remote history repair is not yet proven safe because eight rows are only
`PARTIAL` and one row is `UNKNOWN`; the exact old-to-current operation sequence
and transformed payloads cannot be derived for every row. A direct
`supabase migration repair` is therefore not authorized.

The only current-main migration after the final remote row that is identifiable
as a current additive candidate is
`20260817000200_company_v1_gameplay_core_simplification.sql`. It was not
applied; older local-only rows are not asserted as separately required because
their lineage is already represented or remains unresolved. A future rollout
must resolve the remaining partial/unknown rows before deciding whether an
additive bridge is safe.

Recommended classification: `LINEAGE_REMAINS_AMBIGUOUS`.

## Validation and immutable boundaries

- `git diff --check`: required after the two-doc update.
- Only `docs/ops/TEST_MIGRATION_LINEAGE_RECONCILIATION.md` and the lifecycle
  section of `docs/ops/CURRENT_TASK.md` are authorized to change.
- Migration SQL files were not created, renamed, deleted, or edited.
- DB/schema/migration-history writes: 0.
- Migration apply / non-dry-run push: 0.
- Worker deploy: 0.
- TEST fixture/game mutation and live turns: 0.
- Production access/change: 0.
