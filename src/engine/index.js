export { GameCoreError } from './errors.js';
export { createEditionAdapter, validateEditionAdapter } from './edition.js';
export { buildStoryPrompt, buildRegenerationFeedbackSection } from './story-prompt.js';
export { buildExtractPrompt } from './extract-prompt.js';
export { parseNarrative } from './narrative-parser.js';
export { normalizeExtractEnvelope } from './extract-envelope.js';
export { applyGuardedStateDelta, buildFallbackTurnChoices, sanitizeMovementCommit } from './guarded-merge.js';
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
  buildStableNpcIdSet,
  selectActiveCharacterIds,
  buildActiveCharacterCanon,
  buildSceneContextCore,
  projectGlobalCsa,
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

export {
  calculateCsaCapability, getCsaLimits, appStrengthId,
  csaStrengthRank, APP_STRENGTHS, APP_STRENGTH_LABELS, APP_STRENGTH_RANK, APP_STRENGTH_UNLOCKS
} from './csa/capability.js';
export {
  getPresetCatalogItem, buildPresetCatalogPayload, renderPresetContent, normalizeCompanyCsaCatalog,
  presetModifierClause, presetModifierExceedsTemplate
} from './csa/catalog.js';
export {
  normalizeCsaScope, getCsaRules, getActiveCsaEntries, getApplicableCsaEntries,
  getAllCsaEntries, isCsaApplicable
} from './csa/applicability.js';
export {
  normalizeCsaSemanticContract, validateCustomCsaSemanticContract,
  buildCsaSemanticContract,
  STRUCTURED_SEXUAL_ACTIONS, STRUCTURED_SEXUAL_DIRECTIONS,
  CSA_CONTRACT_ACTOR_GROUPS, CSA_CONTRACT_TARGET_GROUPS,
  canonicalizeCsaGroup, canonicalizeCsaTrigger, canonicalizeCsaDuration
} from './csa/semantic-contract.js';
export {
  planCsaTransaction, validatePresetOperation, summarizeOperations, normalizeAppContent, appIssue
} from './csa/transaction-planner.js';
export {
  stableStringify, sha256Base64url, signAppValidationProof, verifyAppValidationProof,
  normalizeStructuredAction, collectSemanticStrengthCandidates, buildAppStrengthValidationPrompt,
  classifyAppOperationStrengths, semanticStrengthIssues, verifyStructuredActionValidation
} from './csa/transaction-validator.js';
export { buildCsaRuntimeStatePatch as buildCsaSceneRuntimeStatePatch, buildCsaAftereffectPatch } from './csa/reducer.js';
export {
  isAppUsageInfoRequest, buildAppUsageStorySection,
  buildCsaApplicationCheckSection, buildCsaRuntimeExtractContractSection,
  buildMindEffectExtractFirewallSection
} from './csa/prompt-sections.js';
export { buildAppManualPayload, buildAppStatePayload } from './csa/payloads.js';

export { listGeneralNpcs, getGeneralNpc, isGeneralNpcId } from './npc/catalog.js';
export { resolveGeneralNpcForGroup } from './npc/resolver.js';
export { findNpc } from './npc/location.js';
export { resolveNumberedChoiceInput } from './choice-input.js';
export { selectImage } from './media/image-selector.js';
export { resolveTtsEligibility, ttsCacheKey } from './media/tts-contract.js';
export { calculateProgress, calculateCsaProgression, expForNextLevel } from './progression.js';
export {
  resolveStoredStructuredAction,
  assertStoredActionPersistenceParity,
  applyAuthorizedRuleDefinitions,
  assertRuleDefinitionAuthority,
  StoredActionAuthorityError
} from './runtime-core/action-authority.js';
