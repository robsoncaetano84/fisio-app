import React from "react";
import { Text, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Action, HeadSortable, Pagination, Row } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type {
  AccountHealthScore,
  EmotionalConcentration,
  PacRow,
  PacSortKey,
  ProfRow,
  ProfSortKey,
  SortDir,
} from "./AdminCrmScreen.utils";

type ProfessionalsListPaneProps = {
  rows: ProfRow[];
  selectedId: string;
  accountScores: Map<string, AccountHealthScore>;
  emotionalConcentration: Map<string, EmotionalConcentration>;
  sort: { key: ProfSortKey; dir: SortDir };
  page: number;
  totalPages: number;
  onSortChange: (key: ProfSortKey) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onExportCurrent: () => void;
  onExportAll: () => void;
};

type PatientsListPaneProps = {
  rows: PacRow[];
  selectedId: string;
  sort: { key: PacSortKey; dir: SortDir };
  page: number;
  totalPages: number;
  onSortChange: (key: PacSortKey) => void;
  onSelect: (row: PacRow) => void;
  onPageChange: (page: number) => void;
  onExportCurrent: () => void;
  onExportAll: () => void;
};

export function ProfessionalsListPane({
  rows,
  selectedId,
  accountScores,
  emotionalConcentration,
  sort,
  page,
  totalPages,
  onSortChange,
  onSelect,
  onPageChange,
  onExportCurrent,
  onExportAll,
}: ProfessionalsListPaneProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.pane}>
      <Text style={styles.section}>{t("crm.sections.professionals")}</Text>
      <View style={styles.wrapRow}>
        <Action
          title={t("crm.actions.exportCsv")}
          secondary
          onPress={onExportCurrent}
        />
        <Action
          title={t("crm.actions.exportAllFiltered")}
          secondary
          onPress={onExportAll}
        />
      </View>
      <HeadSortable
        cols={[
          { key: "nome", label: "Nome" },
          { key: "score", label: "Score" },
          {
            key: "vulnEmocional",
            label: t("crm.labels.emotionalVulnerabilityShort"),
          },
          { key: "pacientes", label: "Pacientes" },
          { key: "ativos", label: t("crm.labels.active") },
          { key: "ultimoAcesso", label: "\u00daltimo acesso" },
        ]}
        sort={sort}
        onSortChange={onSortChange}
      />
      {rows.map((row) => {
        const emotional = emotionalConcentration.get(row.id);
        const emotionalLabel =
          emotional && emotional.total > 0
            ? `${emotional.vulneraveis}/${emotional.total} (${emotional.percentual}%)`
            : "-";
        return (
          <Row
            key={row.id}
            selected={selectedId === row.id}
            onPress={() => onSelect(row.id)}
            cols={[
              row.nome,
              String(accountScores.get(row.id)?.score ?? "-"),
              emotionalLabel,
              String(row.pacientes),
              String(row.ativos),
              row.ultimoAcesso,
            ]}
          />
        );
      })}
      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={onPageChange}
        previousLabel={t("crm.pagination.previous")}
        nextLabel={t("crm.pagination.next")}
        pageOfLabel={t("crm.pagination.pageOf", {
          page: String(page),
          total: String(totalPages),
        })}
      />
    </View>
  );
}

export function PatientsListPane({
  rows,
  selectedId,
  sort,
  page,
  totalPages,
  onSortChange,
  onSelect,
  onPageChange,
  onExportCurrent,
  onExportAll,
}: PatientsListPaneProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.pane}>
      <Text style={styles.section}>{t("crm.sections.patients")}</Text>
      <View style={styles.wrapRow}>
        <Action
          title={t("crm.actions.exportCsv")}
          secondary
          onPress={onExportCurrent}
        />
        <Action
          title={t("crm.actions.exportAllFiltered")}
          secondary
          onPress={onExportAll}
        />
      </View>
      <HeadSortable
        cols={[
          { key: "nome", label: t("crm.labels.patient") },
          { key: "profissionalNome", label: t("crm.labels.professional") },
          { key: "status", label: t("crm.labels.status") },
          { key: "ultimoCheckin", label: t("crm.labels.latestCheckin") },
        ]}
        sort={sort}
        onSortChange={onSortChange}
      />
      {rows.map((row) => (
        <Row
          key={row.id}
          selected={selectedId === row.id}
          onPress={() => onSelect(row)}
          cols={[
            row.nome,
            row.profissionalNome,
            row.emocionalVulneravel
              ? `${row.status} \u2022 Emocional`
              : row.status,
            row.ultimoCheckin,
          ]}
        />
      ))}
      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={onPageChange}
        previousLabel={t("crm.pagination.previous")}
        nextLabel={t("crm.pagination.next")}
        pageOfLabel={t("crm.pagination.pageOf", {
          page: String(page),
          total: String(totalPages),
        })}
      />
    </View>
  );
}
