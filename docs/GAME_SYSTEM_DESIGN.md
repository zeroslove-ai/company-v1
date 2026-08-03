# Company v1 game system design

## Current authority

Phase 0.5 uses `PHASE_0_5_GAMEPLAY_CONTRACT.md` as the canonical gameplay contract and `NARRATIVE_OUTPUT_CONTRACT.md` as the authoritative Story-output contract. This document describes their system placement and does not duplicate a competing Story format.

## Turn loop and resilience

The future vertical loop is context → one Story SSE → one Extract → one guarded Commit. Story has no repair call. Story, Extract, Commit, image, and TTS failures are classified independently: noncritical parser, Extract, image, and TTS failures are fail-open warnings; invalid input, unsupported game, conflict, and guarded-state rejection remain hard failures. Turn recovery follows `TURN_RECOVERY_CONTRACT.md`.

## State placement

Canonical save fields and forward migration rules are in `SAVE_SCHEMA_MIGRATION_CONTRACT.md`. Scene presence, focal character, last speaker, soft availability, event ledger, multi-axis relationship, `common_sense_baseline`, and per-CSA attitudes are governed by the Phase 0.5 gameplay and merge contracts. No relationship stage is a canonical state field.

## Product boundaries

General NPCs are registered profiles only. Player agency, exact mandatory scope, and graded outcomes are guarded by `GUARDED_STATE_MERGE_CONTRACT.md`. The current phase creates documentation, fixtures, and static tests only; it does not implement runtime code, SQL, Workers, or external service calls.
