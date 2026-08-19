# Company v2 — CURRENT TASK

Status: READY
Task ID: company-v2-product-canon-gap-matrix-review-correction-v1
Mode: DOCS / PRODUCT-AUTHORITY REVIEW CORRECTION ONLY
Updated: 2026-08-20
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Review result being corrected

Prior task:

`company-v2-product-canon-and-gap-matrix-v1`

Prior terminal:

- Issue #68 terminal `5349040355`
- Final SHA `7274cd7c6496542ef3abacfdfcf2998a4351346a`
- Draft PR #94

Operator review is **CHANGES_REQUIRED**, recorded in Issue #68 comment `5349079991` and PR #94 conversation comment `5349075777`.

The audit direction is accepted, but the candidate canon/gap matrix are not yet binding product authority because they freeze the wrong UI donor snapshot, omit part of the established Setup contract, and contain phase/UI classification contradictions.

Do not start product implementation until this correction is reviewed and accepted.

## 1. Execution boundary

This is a **docs-only correction of PR #94**.

Continue the existing branch/PR:

- branch: `company/v2-product-canon-gap-matrix-v1`
- Draft PR: #94

Do not create another PR or another source branch unless the existing branch is technically unusable. Do not create any ops branch.

Before editing, fetch current `main` and incorporate the new docs-only task-registration commit safely. Do not overwrite unrelated branch work.

Allowed changes:

1. `docs/COMPANY_V2_PRODUCT_CANON_2026-08-20.md`
2. `docs/COMPANY_V2_PRODUCT_GAP_MATRIX_2026-08-20.md`
3. `docs/ops/CURRENT_TASK.md` only for runner lifecycle bookkeeping if required.

Forbidden:

- no `runtime-v2/` edits;
- no `frontend-v2/` edits;
- no `src/` implementation edits;
- no SQL/migration edits;
- no DB writes/migration apply;
- no Worker deploy;
- no TEST game creation/gameplay;
- no Production/hospital access;
- no provider/model/config/secret changes;
- no merge or Ready-for-review transition;
- no reuse/cherry-pick of closed PR #93 source.

## 2. Binding UI donor correction

The previous candidate incorrectly froze historical commit:

`f4b228f14d3a0e4446b0ae62e441ed659d3609ca`

as the exact UI donor.

Direct inspection proves that commit contains an **older reduced shell**. It does not contain the full already-built Company product presentation now present in the repository.

For this canon, freeze the complete current Company UI snapshot from the audit registration main:

`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

Primary donor tree:

`src/frontend/pages/*`

At minimum inventory the exact files/components needed to reproduce the visible product shell from that snapshot, including the current `index.html` and all presentation CSS/modules it references.

The complete snapshot visibly contains at least:

- title/day/time/turn/connectivity header;
- Story/history/current streaming turn;
- media/current-scene surface;
- TTS controls;
- Mind Monitor;
- character/current-state panel;
- player-state panel;
- company map panel;
- `상식개변` entry panel and app overlay;
- free-form action area;
- history presentation/download affordance;
- feedback presentation;
- reset control;
- full player Setup overlay;
- responsive/parity CSS layers.

Historical `f4b228f...` may remain documented as provenance/evolution evidence only. It must not be the binding parity snapshot.

### UI parity law

“Bring the existing UI” means:

- transplant/copy the completed Company presentation/layout/components at high parity;
- replace only old controller/API/turn-authority behavior with the thin v2 client;
- do not redesign the shell merely because runtime authority changed;
- do not use Phase deferral as a blanket reason to delete already-visible presentation;
- Story streaming remains visible and no blocking loading overlay may cover it.

For every donor surface classify both dimensions explicitly:

1. **presentation status**: `VISIBLE_ACTIVE`, `VISIBLE_DISABLED_LOCKED`, `HIDDEN_BY_EXPLICIT_DECISION`, or `REMOVED_BY_EXPLICIT_DECISION`;
2. **runtime feature status**: `ACTIVE_PHASE1` or `DEFERRED_RUNTIME`.

Do not collapse these two dimensions into one ambiguous `DEFER` label.

## 3. Player Setup/profile correction

The previous candidate table omitted an established field.

The complete UI snapshot at `5ec1a76...` contains these Setup inputs:

- name;
- department;
- position;
- age;
- height;
- weight;
- **penis length / `음경 길이(cm)`**;
- body type;
- speech style.

Audit the exact current source/payload/validation ownership for every Setup field, including the penis-length field. Freeze the exact canonical field name/type/range/persistence/prompt/UI policy.

If any established field should be removed from v2, that requires a later explicit owner decision or already-existing later owner decision cited precisely. Do not silently omit it because current `company_v2_state` is minimal.

Update the DB sufficiency verdict accordingly. The future integrated source task may require an additive v2 profile/RPC migration; do not author SQL in this task.

## 4. Resolve canon/matrix contradictions

Correct both documents so one implementer cannot choose the less demanding interpretation.

### 4.1 `상식개변` app/tool presentation

The completed Company UI contains a visible `상식개변` entry and full app overlay.

For Phase 1:

- presentation must remain part of the transplanted UI at parity;
- mutation/runtime authority remains deferred until the later CSA phase;
- controls that would mutate CSA must be disabled/locked and must not claim success;
- the gap matrix must therefore not classify the entire app UI out of the integrated UI cut as generic `DEFER`.

Separate `app presentation` from `CSA mutation runtime`.

### 4.2 Reset versus feedback

Do not bundle them into one matrix row/classification.

- `reset`: the completed UI has an explicit reset control and the candidate canon currently marks it ACTIVE NOW. Decide and document the exact v2-native reset owner required for active Phase 1. If active, classify the missing implementation as `REBUILD/REWIRE`, not `DEFER`.
- `feedback revision`: runtime behavior remains deferred unless a later explicit owner decision activates it. Preserve visible donor presentation disabled/locked if required for parity, without implementing feedback regeneration in this cut.

### 4.3 NPC find/search

Latest explicit owner decision removed the useless NPC-find/search feature. The current completed toolbar no longer contains the old NPC-find control.

Binding result:

- standalone NPC find/search = `REMOVED_BY_OWNER_DECISION` / `DELETE`;
- do not describe it as a default future deferred feature;
- do not confuse it with the `NPC 정보` tab inside the `상식개변` app, which is a different presentation/domain.

## 5. Re-audit all donor affordance phase statuses

Using the complete `5ec1a76...` UI snapshot plus latest owner decisions, re-check at minimum:

- media/image surface;
- TTS controls;
- Mind Monitor;
- character state;
- player state;
- company map;
- `상식개변` entry/app overlay;
- history;
- feedback presentation;
- reset;
- player Setup overlay;
- choice surface versus latest no-active-choices decision;
- player inner-thought surface;
- mobile/desktop information order.

For each, make presentation status and runtime status explicit.

A deferred runtime may still have a visible disabled/locked donor control. Hidden/removed presentation requires an explicit owner/product decision, not implementation convenience.

## 6. Preserve already-correct audit findings

Do not regress these accepted findings from prior SHA `7274cd7...`:

- product identity `상식개변: 회사편`;
- company-life interactive fiction, not assistant/chatbot;
- literal player agency;
- rich visible Story streaming;
- canonical five heroines;
- canonical eight general NPCs;
- canonical 24-location map;
- repository `content/*.json` as sole semantic catalog authority;
- no fabricated runtime/frontend/SQL shadow semantic lists;
- Story receives bounded relevant actor/location/player/company canon;
- post-Story observation remains small/evidence-bound;
- current isolated v2 persistence is insufficient for full approved Setup/profile parity;
- clean server-owned turn/SSE/job/fencing/commit spine remains KEEP;
- no active choices in current Phase 1;
- no old frontend Story→Extract→Commit coordinator authority.

## 7. Gap matrix output requirement

Update the matrix so its next integrated implementation cut is executable without interpretation gaps.

At minimum split these domains independently:

- full UI presentation transplant;
- player Setup/profile;
- app presentation;
- CSA mutation runtime;
- map presentation/navigation runtime;
- reset runtime;
- feedback presentation/runtime;
- NPC find removal;
- media presentation/image runtime;
- TTS presentation/runtime.

Recompute `KEEP / REWIRE / REBUILD / DELETE / DEFER` totals after the split.

The matrix must explicitly say that the next integrated product-layer rebuild starts from the **current completed Company UI donor snapshot**, not from `frontend-v2` and not from historical `f4b...`.

## 8. Validation

Before terminal:

- changed paths remain docs-only;
- exact current completed UI donor SHA/path inventory is recorded;
- exact Setup input inventory is recorded and includes the established penis-length field unless proven superseded;
- app presentation vs CSA runtime are separated;
- reset vs feedback are separated;
- NPC find/search is recorded as owner-removed;
- no canon/matrix status contradiction remains;
- classification totals are recomputed;
- PR #94 remains Draft and unmerged;
- DB writes=0, migrations=0, deploys=0, gameplay=0.

## 9. Terminal / stop boundary

Post one new Issue #68 terminal report:

`COMPANY_V2_PRODUCT_CANON_GAP_MATRIX_CORRECTION_READY_FOR_REVIEW`

Include:

- `TASK_ID: company-v2-product-canon-gap-matrix-review-correction-v1`;
- previous reviewed SHA `7274cd7c6496542ef3abacfdfcf2998a4351346a`;
- new `FINAL_SHA`;
- PR #94 current head;
- changed paths;
- corrected binding UI donor SHA;
- complete Setup field list;
- resolved app/reset/feedback/NPC-find classifications;
- recomputed gap totals;
- confirmation of zero runtime/frontend/SQL/DB/deploy/gameplay changes.

Then STOP `WAITING_REVIEW` for operator review. Do not merge and do not register the integrated implementation task automatically.
