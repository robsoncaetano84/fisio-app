import { AppLanguage } from "../i18n/translations";
import {
  Exercicio,
  ExerciseTranslationFields,
  ExerciseTranslations,
} from "../types";

type ExerciseLike = Pick<
  Exercicio,
  | "nome"
  | "objetivo"
  | "descricao"
  | "instrucoesPadrao"
  | "cuidados"
  | "contraindicacoes"
  | "slug"
  | "regiaoCorporal"
  | "categoria"
  | "nivel"
  | "tags"
> & {
  translations?: ExerciseTranslations | null;
};

export type LocalizedExerciseText = Required<ExerciseTranslationFields>;

const normalizeLanguage = (language: AppLanguage): AppLanguage => {
  return language === "en" || language === "es" ? language : "pt";
};

const pickLocalizedFields = (
  translations: ExerciseTranslations | null | undefined,
  language: AppLanguage,
): ExerciseTranslationFields => {
  const normalizedLanguage = normalizeLanguage(language);
  return translations?.[normalizedLanguage] || translations?.pt || {};
};

export function getLocalizedExerciseText(
  exercicio: ExerciseLike,
  language: AppLanguage,
): LocalizedExerciseText {
  const fields = pickLocalizedFields(exercicio.translations, language);

  return {
    nome: fields.nome || exercicio.nome || "",
    objetivo: fields.objetivo || exercicio.objetivo || "",
    descricao: fields.descricao || exercicio.descricao || "",
    instrucoesPadrao:
      fields.instrucoesPadrao || exercicio.instrucoesPadrao || "",
    cuidados: fields.cuidados || exercicio.cuidados || "",
    contraindicacoes:
      fields.contraindicacoes || exercicio.contraindicacoes || "",
  };
}

export function getLocalizedExerciseSearchText(
  exercicio: ExerciseLike,
  language: AppLanguage,
): string {
  const localized = getLocalizedExerciseText(exercicio, language);
  return [
    localized.nome,
    localized.objetivo,
    localized.descricao,
    localized.instrucoesPadrao,
    localized.cuidados,
    localized.contraindicacoes,
    exercicio.nome,
    exercicio.objetivo,
    exercicio.descricao,
    exercicio.instrucoesPadrao,
    exercicio.cuidados,
    exercicio.contraindicacoes,
    exercicio.slug,
    exercicio.regiaoCorporal,
    exercicio.categoria,
    exercicio.nivel,
    JSON.stringify(exercicio.translations || {}),
    ...(exercicio.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
