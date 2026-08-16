export { GameCoreError } from './errors.js';
export { createEditionAdapter, validateEditionAdapter } from './edition.js';
export { buildStoryPrompt, buildRegenerationFeedbackSection } from './story-prompt.js';
export { buildStoryWorldProjection } from './csa/story-projection.js';
export {
  buildInstitutionalSegments,
  composeCanonicalStory,
  attachEngineEnactments
} from './csa/mandatory-enactment.js';
export { buildExtractPrompt, buildExtractRelevantNpcIds, buildMindMonitorTargetIds } from './extract-prompt.js';
export { parseFreshNarrativeV2 } from './fresh-narrative-parser.js';
export { createStoryStreamDecoder, parseStoryControlMarker, buildStoryIdentityDirectory } from './story-wire-protocol.js';
export { readCanonicalSceneV1, hydrateLegacySceneV1, reduceCanonicalScene } from './runtime-core/scene-reducer.js';
export { assertCanonicalSceneInvariants } from './runtime-core/invariants.js';
export { normalizeFreshExtractObservationV2, buildDegradedExtractObservation, assertExtractObservationContract } from './runtime-core/extract-observation.js';
export { normalizePersistedExtractObservation } from './runtime-core/persisted-extract-observation.js';
export { reduceGameplayCommit } from './runtime-core/commit-reducer.js';
export { reduceCsaCommitState } from './runtime-core/csa-commit-reducer.js';
export {
  reducePlayerPhysicalObservation, reduceNpcPhysicalObservation,
  reducePlayerSexualObservation,
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
  buildStableNpcIdSet,
  selectActiveCharacterIds,
  buildActiveCharacterCanon,
  buildSceneContextCore,
  projectGlobalCsa,
} from './gameplay-state.js';
export {
  COMPANY_PLAYER_CANONICAL_PROFILE,
  canonicalCompanyPlayerProfile,
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
export {
  buildCsaApplicationCheckSection, buildCsaRuntimeExtractContractSection,
  buildMindEffectExtractFirewallSection
} from './csa/prompt-sections.js';
export {
  CSA_AUTHORITY_POLICY, authorityPolicyFor,
  authorityPolicyPayload, matchesCsaSubjectScope,
  phaseFor, phaseForRule, profileSex, subjectScopeForRule
} from './csa/authority-policy.js';
export {
  normalizeExecutionMetadata,
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
