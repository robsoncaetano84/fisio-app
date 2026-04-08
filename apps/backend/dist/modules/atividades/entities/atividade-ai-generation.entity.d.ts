import { BaseEntity } from 'typeorm';
export declare class AtividadeAiGeneration extends BaseEntity {
    id: string;
    pacienteId: string;
    generatedOn: string;
    inputHash: string;
    titulo: string;
    descricao: string;
    referencias: string[];
    source: string | null;
    model: string | null;
    createdAt: Date;
}
