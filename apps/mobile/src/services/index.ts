// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// I ND EX
// ==========================================
export {
  api,
  setOnSessionExpired,
  setOnTokenRefreshed,
  setIsLoggingOut,
  getCorrelationId,
  rotateCorrelationId,
} from "./api";
export {
  trackEvent,
  getClinicalFlowSummary,
  getPatientCheckEngagementSummary,
} from "./analytics";
export { registerPushTokenIfNeeded, ensurePatientDailyReminder } from "./pushNotifications";
export { getGamificationState, getBadgeLabel, registerConcludedCheckin } from "./gamification";
export {
  enqueueOfflineCheckin,
  getOfflineCheckinQueueCount,
  getOfflineCheckinQueueStats,
  syncOfflineCheckins,
} from "./offlineCheckinQueue";
export {
  getAuditEntries,
  getAuditSummary,
  recordAuditAction,
  toAuditRef,
  type AuditEntry,
  type AuditActionType,
} from "./auditTrail";
export { getOpsHealthSummary, recordApiMetric, recordSyncMetric } from "./opsMetrics";
export { getRuntimeFeatureFlags } from "./featureFlags";
export {
  getCrmAdminProfessionals,
  getCrmAdminPatients,
  getCrmAdminProfessionalsPaged,
  getCrmAdminPatientsPaged,
  getCrmLeads,
  getCrmPipelineSummary,
  getCrmTasks,
  createCrmLead,
  updateCrmLead,
  deleteCrmLead,
  createCrmTask,
  updateCrmTask,
  deleteCrmTask,
  getCrmInteractions,
  createCrmInteraction,
  updateCrmInteraction,
  deleteCrmInteraction,
} from "./crm";



export { openQuickActionSelection, navigateByQuickAction, quickActionIcon } from './quickActions';
export {
  clinicalFlowReadinessCopyKeys,
  getClinicalFlowGuard,
  getClinicalFlowNextStep,
  getClinicalFlowStageStatus,
  isClinicalFlowActionReady,
  type ClinicalFlowAction,
  type ClinicalFlowBlockReason,
  type ClinicalFlowGuard,
  type ClinicalFlowNextStep,
  type ClinicalFlowReadinessState,
  type ClinicalFlowStageStatus,
} from "./clinicalFlowReadiness";
export {
  buildCareTimeline,
  type CareTimelineAction,
  type CareTimelineAudience,
  type CareTimelineInput,
  type CareTimelineModel,
  type CareTimelineModelItem,
  type CareTimelineStage,
  type CareTimelineStatus,
} from "./careTimeline";
export { getLaudoAiSuggestion, buildPhysicalExamTemplateFromAnamnese } from './laudoAi';
export {
  buildStructuredExameFromAnamnese,
  enrichStructuredExameWithClinicalLogic,
  updateRedFlagAnswer,
  parseStructuredExame,
  renderStructuredExameToText,
  serializeStructuredExame,
} from './physicalExamModel';
export {
  getClinicalOrchestratorNextAction,
  getEvolucaoSoapSuggestion,
  getExameFisicoDorSuggestion,
  logClinicalAiSuggestion,
  type EvolucaoSoapSuggestionResponse,
  type ExameFisicoDorSuggestionResponse,
  type LogAiSuggestionPayload,
  type ClinicalOrchestratorNextActionResponse,
} from "./clinicalOrchestrator";
export {
  analyzeClinicalPhoto,
  compareClinicalPhotos,
  listClinicalPhotoComparisons,
  listClinicalPhotos,
  uploadClinicalPhoto,
  type ClinicalPhotoComparisonItem,
  type ClinicalPhotoItem,
  type ClinicalPhotoType,
  type ClinicalPhotoUploadAsset,
  type ClinicalPhotoUploadMetadata,
  type ClinicalPhotoView,
} from "./clinicalPhotos";
export { cachedGet, invalidateCachedGet } from "./requestCache";
