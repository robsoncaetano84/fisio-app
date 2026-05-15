import { useEffect, type Dispatch, type SetStateAction } from "react";
import type {
  CrmAdminPatient,
  CrmAdminProfessional,
} from "../../services/crm";
import {
  createPatientEditForm,
  createProfessionalEditForm,
} from "./AdminCrmScreen.constants";
import type { PacRow, ProfRow } from "./AdminCrmScreen.utils";

type SelectionEffectsParams = {
  leads: Array<{ id: string }>;
  profs: ProfRow[];
  pacs: PacRow[];
  selectedLeadId: string;
  selectedProfId: string;
  selectedPacId: string;
  setSelectedLeadId: Dispatch<SetStateAction<string>>;
  setSelectedProfId: Dispatch<SetStateAction<string>>;
  setSelectedPacId: Dispatch<SetStateAction<string>>;
  crmProfessionals: CrmAdminProfessional[];
  crmPatients: CrmAdminPatient[];
  setProfEditForm: Dispatch<
    SetStateAction<ReturnType<typeof createProfessionalEditForm>>
  >;
  setPacEditForm: Dispatch<
    SetStateAction<ReturnType<typeof createPatientEditForm>>
  >;
};

export function useAdminCrmSelectionEffects({
  leads,
  profs,
  pacs,
  selectedLeadId,
  selectedProfId,
  selectedPacId,
  setSelectedLeadId,
  setSelectedProfId,
  setSelectedPacId,
  crmProfessionals,
  crmPatients,
  setProfEditForm,
  setPacEditForm,
}: SelectionEffectsParams) {
  useEffect(() => {
    if (!selectedLeadId && leads[0]) setSelectedLeadId(leads[0].id);
  }, [leads, selectedLeadId, setSelectedLeadId]);

  useEffect(() => {
    if (!selectedProfId && profs[0]) setSelectedProfId(profs[0].id);
  }, [profs, selectedProfId, setSelectedProfId]);

  useEffect(() => {
    if (!selectedPacId && pacs[0]) setSelectedPacId(pacs[0].id);
  }, [pacs, selectedPacId, setSelectedPacId]);

  useEffect(() => {
    const profRaw = crmProfessionals.find(
      (professional) => professional.id === selectedProfId,
    );
    if (!profRaw) return;
    setProfEditForm(createProfessionalEditForm(profRaw));
  }, [crmProfessionals, selectedProfId, setProfEditForm]);

  useEffect(() => {
    const pacRaw = crmPatients.find((patient) => patient.id === selectedPacId);
    if (!pacRaw) return;
    setPacEditForm(createPatientEditForm(pacRaw));
  }, [crmPatients, selectedPacId, setPacEditForm]);
}
