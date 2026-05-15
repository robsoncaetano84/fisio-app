import { useEffect, type Dispatch, type SetStateAction } from "react";

type PaginationEffectsParams = {
  query: string;
  profActiveFilter: unknown;
  profAccountStatusFilter: unknown;
  profEmotionalConcentrationFilter: unknown;
  profEspecialidadeFilter: string;
  profSort: unknown;
  pacLinkFilter: unknown;
  pacStatusFilter: unknown;
  pacEmotionalFilter: unknown;
  pacCidadeFilter: string;
  pacUfFilter: string;
  pacSort: unknown;
  profPage: number;
  pacPage: number;
  profTotalPages: number;
  pacTotalPages: number;
  setProfPage: Dispatch<SetStateAction<number>>;
  setPacPage: Dispatch<SetStateAction<number>>;
};

export function useAdminCrmPaginationEffects({
  query,
  profActiveFilter,
  profAccountStatusFilter,
  profEmotionalConcentrationFilter,
  profEspecialidadeFilter,
  profSort,
  pacLinkFilter,
  pacStatusFilter,
  pacEmotionalFilter,
  pacCidadeFilter,
  pacUfFilter,
  pacSort,
  profPage,
  pacPage,
  profTotalPages,
  pacTotalPages,
  setProfPage,
  setPacPage,
}: PaginationEffectsParams) {
  useEffect(() => {
    setProfPage(1);
    setPacPage(1);
  }, [query, setPacPage, setProfPage]);

  useEffect(() => {
    setProfPage(1);
  }, [
    profAccountStatusFilter,
    profActiveFilter,
    profEmotionalConcentrationFilter,
    profEspecialidadeFilter,
    profSort,
    setProfPage,
  ]);

  useEffect(() => {
    setPacPage(1);
  }, [
    pacCidadeFilter,
    pacEmotionalFilter,
    pacLinkFilter,
    pacSort,
    pacStatusFilter,
    pacUfFilter,
    setPacPage,
  ]);

  useEffect(() => {
    if (profPage > profTotalPages) setProfPage(profTotalPages);
  }, [profPage, profTotalPages, setProfPage]);

  useEffect(() => {
    if (pacPage > pacTotalPages) setPacPage(pacTotalPages);
  }, [pacPage, pacTotalPages, setPacPage]);
}
