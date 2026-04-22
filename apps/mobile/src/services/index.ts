// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// I ND EX
// ==========================================
export { api, setOnSessionExpired, setIsLoggingOut, getCorrelationId, rotateCorrelationId } from "./api";
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
export { getAuditEntries, getAuditSummary, recordAuditAction, toAuditRef } from "./auditTrail";
export { getOpsHealthSummary, recordApiMetric, recordSyncMetric } from "./opsMetrics";
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
export { getLaudoAiSuggestion, buildPhysicalExamTemplateFromAnamnese } from './laudoAi';
export {
  buildStructuredExameFromAnamnese,
  enrichStructuredExameWithClinicalLogic,
  updateRedFlagAnswer,
  parseStructuredExame,
  renderStructuredExameToText,
  serializeStructuredExame,
} from './physicalExamModel';
export { cachedGet, invalidateCachedGet } from "./requestCache";


