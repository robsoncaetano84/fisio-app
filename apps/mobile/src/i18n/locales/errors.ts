// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ERRORS
// ==========================================
type TranslationMap = Record<string, string>;

export const ptErrors: TranslationMap = {
  "errors.required": "Campo obrigatório",
  "errors.invalid": "Valor inválido",
  "errors.invalidDate": "Data inválida",
  "errors.invalidEmail": "E-mail inválido",
  "errors.invalidFormat": "Formato inválido",
  "errors.network": "Falha de conexão. Verifique sua internet.",
  "errors.loadFailed": "Não foi possível carregar os dados",
  "errors.saveFailed": "Não foi possível salvar",
  "errors.deleteFailed": "Não foi possível excluir",
  "errors.tryAgain": "Tente novamente",
  "errors.unexpected": "Ocorreu um erro inesperado",
  "errors.permissionDenied": "Você não tem permissão para esta ação",
};

export const enErrors: TranslationMap = {
  "errors.required": "Required field",
  "errors.invalid": "Invalid value",
  "errors.invalidDate": "Invalid date",
  "errors.invalidEmail": "Invalid email",
  "errors.invalidFormat": "Invalid format",
  "errors.network": "Connection failed. Check your internet.",
  "errors.loadFailed": "Could not load data",
  "errors.saveFailed": "Could not save",
  "errors.deleteFailed": "Could not delete",
  "errors.tryAgain": "Try again",
  "errors.unexpected": "An unexpected error occurred",
  "errors.permissionDenied": "You do not have permission for this action",
};

export const esErrors: TranslationMap = {
  "errors.required": "Campo obligatorio",
  "errors.invalid": "Valor inválido",
  "errors.invalidDate": "Fecha inválida",
  "errors.invalidEmail": "Correo inválido",
  "errors.invalidFormat": "Formato inválido",
  "errors.network": "Fallo de conexión. Verifica tu internet.",
  "errors.loadFailed": "No fue posible cargar los datos",
  "errors.saveFailed": "No fue posible guardar",
  "errors.deleteFailed": "No fue posible eliminar",
  "errors.tryAgain": "Inténtalo de nuevo",
  "errors.unexpected": "Ocurrió un error inesperado",
  "errors.permissionDenied": "No tienes permiso para realizar esta acción",
};
