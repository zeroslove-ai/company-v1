export { GameCoreError } from './errors.js';
export { createEditionAdapter, validateEditionAdapter } from './edition.js';
export { buildStoryPrompt } from './story-prompt.js';
export { buildExtractPrompt } from './extract-prompt.js';
export { parseNarrative } from './narrative-parser.js';
export { normalizeExtractEnvelope } from './extract-envelope.js';
export { applyGuardedStateDelta } from './guarded-merge.js';
export { deriveRecoverableStep } from './turn-state.js';
export {
  normalizeMindMonitor,
  normalizeGameplayExtractEnvelope,
  normalizeElapsedMinutes,
  advanceGameTime,
  formatGameTime,
  reducePlayerSexualState,
  deriveTurnChanges,
  migrateCompanySave,
  hydrateGameplayState,
  validateCsaRuntimeStatePatch,
  buildDegradedExtractEnvelope,
  buildDegradedTurnSummary,
  buildStableNpcIdSet,
  selectActiveCharacterIds,
  buildActiveCharacterCanon,
  buildSceneContextCore,
  CSA_LIFECYCLE,
  CSA_APPLICABILITY,
  CSA_EXECUTION_STATE
} from './gameplay-state.js';
export {
  validatePlayerSetupInput,
  canonicalCatalogName,
  resolvePlayerCanonicalNames,
  buildOpeningPlan,
  buildPlayerPromptProjection,
  buildOpeningPlayerProjection,
  buildOpeningNextSave
} from './player-setup.js';
export { buildOpeningPrompt, splitOpeningSections } from './opening-prompt.js';
