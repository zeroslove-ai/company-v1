export { GameCoreError } from './errors.js';
export { createEditionAdapter, validateEditionAdapter } from './edition.js';
export { buildStoryPrompt, buildRegenerationFeedbackSection } from './story-prompt.js';
export { buildStoryWorldProjection } from './csa/story-projection.js';
export { buildExtractPrompt, buildExtractRelevantNpcIds, buildMindMonitorTargetIds } from './extract-prompt.js';
export { parseFreshNarrativeV2 } from './fresh-narrative-parser.js';
export { createStoryStreamDecoder, parseStoryControlMarker, buildStoryIdentityDirectory } from './story-wire-protocol.js';
export { parsePersistedNarrative } from './persisted-narrative-parser.js';
export { hydrateCanonicalScene, reduceCanonicalScene } from './runtime-core/scene-reducer.js';
export { projectCanonicalSceneToLegacy } from './runtime-core/projections.js';
export { assertCanonicalSceneInvariants } from './runtime-core/invariants.js';
export { normalizeFreshExtractObservationV2, assertExtractObservationContract } from './runtime-core/extract-observation.js';
export { normalizePersistedExtractObservation } from './runtime-core/persisted-extract-observation.js';
export { reduceGameplayCommit } from './runtime-core/commit-reducer.js';
export { reduceCsaCommitState } from './runtime-core/csa-commit-reducer.js';
export {
  reducePlayerPhysicalObservation, reduceNpcPhysicalObservation,
  reducePlayerSexualObservation, reduceNpcStatObservation,
  reduceNpcEmotionObservation, reduceNpcRelationshipObservation,
  reduceNpcWorkObservation, reduceCsaAttitudeObservation,
  reduceGeneralEventObservations, reduceSexualEventObservations,
  reduceElapsedTimeObservation, reduceStoryChoiceProjection,
  reduceObservationDomains
} from './runtime-core/observation-reducers.js';
export { deriveRecoverableStep } from './turn-state.js';
export {
  normalizeElapsedMinutes,
  advanceGameTime,
  formatGameTime,
  reducePlayerSexualState,
  deriveTurnChanges,
  migrateCompanySave,
  hydrateGameplayState,
  validateCsaRuntimeStatePatch,
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
  buildOpeningPlayerProjection
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
export {
  buildCsaPlannerInputSnapshot, buildCsaPlannerInputDigest,
  buildTransactionResolution, buildTransactionResolutionDigest,
  signTransactionValidationProof, verifyTransactionValidationProof,
  verifySignedTransactionResolution
} from './csa/transaction-authority.js';
export { buildCsaRuntimeStatePatch as buildCsaSceneRuntimeStatePatch, buildCsaAftereffectPatch } from './csa/reducer.js';
export {
  buildCsaApplicationCheckSection, buildCsaRuntimeExtractContractSection,
  buildMindEffectExtractFirewallSection
} from './csa/prompt-sections.js';
export {
  CSA_AUTHORITY_POLICY, CSA_ENACTMENT_BY_PHASE, authorityPolicyFor,
  authorityPolicyPayload, enactmentForPhase, matchesCsaSubjectScope,
  phaseFor, phaseForRule, profileSex, subjectScopeForRule
} from './csa/authority-policy.js';
export {
  EXECUTION_KINDS, EXECUTION_ACTIONS, EXECUTION_TRIGGER_KINDS,
  deriveExecutionMetadata, normalizeExecutionMetadata, validateExecutionMetadata,
  executionMetadataForRule
} from './csa/execution-policy.js';
export { buildAppManualPayload, buildAppStatePayload } from './csa/payloads.js';

export { listGeneralNpcs, getGeneralNpc, isGeneralNpcId } from './npc/catalog.js';
export { resolveGeneralNpcForGroup } from './npc/resolver.js';
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
