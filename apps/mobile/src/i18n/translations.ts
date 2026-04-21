// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// TRANSLATIONS
// ==========================================
export type AppLanguage = "pt" | "en" | "es";

type TranslationMap = Record<string, string>;
import { ptCommon, enCommon, esCommon } from "./locales/common";
import { ptAuth, enAuth, esAuth } from "./locales/auth";
import { ptErrors, enErrors, esErrors } from "./locales/errors";
import { ptNavigation, enNavigation, esNavigation } from "./locales/navigation";
import { ptHome, enHome, esHome } from "./locales/home";
import { ptPatient, enPatient, esPatient } from "./locales/patient";
import { ptClinical, enClinical, esClinical } from "./locales/clinical";
import { ptCrm, enCrm, esCrm } from "./locales/crm";
import { ptPatients, enPatients, esPatients } from "./locales/patients";
import {
  ptPatientForm,
  enPatientForm,
  esPatientForm,
} from "./locales/patientForm";
import {
  ptPatientDetails,
  enPatientDetails,
  esPatientDetails,
} from "./locales/patientDetails";

const pt: TranslationMap = {
  ...ptCommon,
  ...ptNavigation,
  ...ptHome,
  ...ptPatient,
  ...ptClinical,
  ...ptCrm,
  ...ptPatients,
  ...ptPatientForm,
  ...ptPatientDetails,
  ...ptAuth,
  ...ptErrors,
};

const en: TranslationMap = {
  ...enCommon,
  ...enNavigation,
  ...enHome,
  ...enPatient,
  ...enClinical,
  ...enCrm,
  ...enPatients,
  ...enPatientForm,
  ...enPatientDetails,
  ...enAuth,
  ...enErrors,
};

const es: TranslationMap = {
  ...esCommon,
  ...esNavigation,
  ...esHome,
  ...esPatient,
  ...esClinical,
  ...esCrm,
  ...esPatients,
  ...esPatientForm,
  ...esPatientDetails,
  ...esAuth,
  ...esErrors,
};

const tables: Record<AppLanguage, TranslationMap> = { pt, en, es };

export function translate(
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
) {
  const template = tables[language][key] || tables.pt[key] || key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
