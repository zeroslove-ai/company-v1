# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: opening-exact-four-live-evidence-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306243288` — `opening-provider-exact-four-root-cause-v1` accepted as accurate BLOCKED evidence.
Current reviewed runtime/source lineage remains `1a221665f91b352607724912ba8a06250ac60fc5`; the root-cause task introduced no runtime/test/migration changes.
Current branch HEAD before registration: `7627dd15a50634b251acf590e9d5628cb51fd045`.
TEST migration `20260816045221 / company_v1_setup_opening_world_authority` is already applied and immutable.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven state

The repository choice path is coherent: provider authors literal choices; transport does not rewrite them; the fresh parser preserves literals; the sole server projection structurally requires exactly four non-empty unique choices; canonical Opening persistence also requires exactly four; recovery/UI preserves committed literal identity. No server-authored fallback/truncate/pad/retry path is proven.

The prior TEST failure preserved only provider-visible stream deltas and terminal `invalid_request: opening choices must contain exactly four items`; it did not preserve the raw provider Story payload or enough pre-validation choice evidence to determine the actual count/shape. Therefore no repository defect is proven and no speculative source patch is allowed.

## Objective

Close the evidence gap with one bounded dedicated TEST Opening attempt. Preserve transport-level raw provider Story evidence and the parser/choice projection before exact-four rejection, without changing gameplay semantics. If the provider produces a valid exact-four Opening, continue the same run through literal-choice/free-text/replay closure. If it does not, preserve the exact raw non-four shape and STOP BLOCKED with no retry.

## Required work

1. Freeze exact START HEAD and verify PR #67 is still base `main`, OPEN / DRAFT / UNMERGED. Verify no executable delta exists after reviewed source SHA `1a221665f91b352607724912ba8a06250ac60fc5` except previously reviewed accepted lineage/docs.
2. Use the existing canonical canary/SSE decoder and existing TEST helpers. Do not create a second gameplay protocol, parser, or semantic gateway.
3. Before any live call, prove the dedicated TEST game is not the preserved manual game and verify its current state. Only this dedicated TEST game may be reset/mutated.
4. Exact reviewed API/frontend deployment may be verified. Redeploy only if identity does not match the reviewed executable required for this acceptance; do not deploy unrelated source.
5. Perform at most ONE valid Setup -> Opening provider attempt after any required canonical reset/setup preparation. No second Opening generation attempt is authorized in this task.
6. Preserve evidence in OS TEMP, not the repository. Capture enough transport-only evidence to reconstruct the provider output that reached fresh parsing before exact-four validation:
   - HTTP status;
   - ordered SSE event sequence;
   - raw provider Story text assembled from provider deltas, or the exact raw delta sequence if assembly is the canonical transport boundary;
   - parsed block types and every provider-authored `[CHOICE]` literal observed before structural projection;
   - projected canonical choice count/values if projection succeeds;
   - terminal error payload if projection/persistence rejects.
   Do not log secrets, authorization headers, service-role keys, or unrelated personal data.
7. Do not alter provider/model/temperature/token settings, prompt wording, parser behavior, exact-four validation, persistence contract, or UI choice logic for this evidence run.
8. If the one Opening attempt yields anything other than exactly four valid provider-authored literals, STOP immediately after preserving evidence. Do not retry/regenerate, truncate/pad, synthesize fallback choices, or continue ordinary turns. Classify the exact raw shape only from captured evidence.
9. If and only if the one Opening attempt succeeds with exactly four provider-authored literal choices:
   - prove committed `opening_state.parsed_blocks` and committed literal choices preserve the same four strings;
   - select one returned literal exactly as rendered and prove that exact string becomes the next `player_action` without numbering/metadata rewrite;
   - complete Story -> Extract -> Commit for that literal-choice turn;
   - complete one subsequent ordinary free-text Story -> Extract -> Commit turn;
   - verify current-format recovery/replay reads committed `parsed_blocks` and literal identity, with replay/idempotence invariants and no duplicate durable mutation.
10. Verify removed setup/world semantic SQL allowlists and removed Scene mirrors do not reappear in save/readback. Registered-ID integrity and canonical `save.scene` must remain intact.
11. Preserve actual UI/product consumers: compact clothing, stats, CSA institutional state, progression/TEST-only Level-7 seam, Mind Monitor/TTS, relationship display where still consumed, sexual/media/image adapters. Image classification/selection must remain presentation-only and must not gate narrative facts.
12. On any deterministic repository defect discovered by this live evidence, do not hotfix in this task. Preserve evidence and STOP BLOCKED for a source task.
13. At the end, reset only the dedicated TEST game through the canonical reset path if the task reached a state where reset is safe/required. Direct DB mutation to manufacture gameplay state is forbidden.

## Architecture constraints

- One durable domain -> one canonical writer.
- Provider authors choice semantics. Server owns exact-four structural validation and literal persistence only.
- Exactly-four is presentation shape, not semantic taxonomy.
- No retry/regeneration, provider/model/config change, fuzzy repair, parser relaxation/new parser, regex semantic gate, server-authored fallback choices, truncate/pad, or arbitrary save patch.
- Repository/application owns setup/world semantic catalogs; DB owns transaction/structural/registered-ID integrity.
- `save.scene` remains sole Scene/location/presence authority.
- Story/Extract meaning remains open-ended; optional projection failure must fail open rather than erase facts.
- CSA compliance is not consent/comfort/affection/emotion.
- Media/image catalogs including sexual image families are protected presentation adapters and must not gate Story/Extract facts.
- TEST-only Level 7 acceleration seam is protected; do not alter Production progression.

## Authorized operations

Authorized:
- read-only Git/PR/source inspection;
- existing canary/SSE/harness execution;
- TEST-only canonical reset/setup/opening/gameplay/replay on dedicated game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` as bounded above;
- read-only TEST DB/function/save/history verification required for acceptance;
- exact reviewed API/frontend identity verification and redeploy only if required to restore exact reviewed identity;
- OS TEMP evidence artifacts;
- docs/audit evidence updates;
- one docs-only terminal status commit/report.

Not authorized:
- source/runtime/test/migration edits;
- new migration/DDL or direct TEST DB state mutation;
- more than one Opening provider generation attempt;
- Production access;
- any access/mutation/reset of preserved manual game;
- provider/model/temperature/token changes;
- retry/regeneration;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Acceptance

PASS only if the single bounded Opening attempt produces exactly four provider-authored literal choices and the same run proves committed Opening structured persistence, exact literal-choice player-input round-trip, one subsequent free-text turn, committed `parsed_blocks` recovery/replay, and idempotence with canonical scene/identity integrity intact.

BLOCKED is correct if the single Opening attempt is non-four/malformed or exposes another deterministic defect. The terminal report must include the exact raw provider choice shape/evidence needed for the next source decision. No retry is allowed.

## Completion

On PASS or deterministic BLOCKED evidence:
- set this file to `WAITING_REVIEW` in one docs-only completion commit;
- report START_SHA, reviewed executable/deployed identity, exact live operations, raw provider choice evidence summary, parsed/projected choices, literal-choice/free-text/replay results if reached, final dedicated TEST reset/readback, Production/manual-game operations (expected zero), and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not create the next task yourself.
