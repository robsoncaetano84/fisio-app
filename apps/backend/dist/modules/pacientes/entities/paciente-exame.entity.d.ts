import { BaseEntity } from '../../../common/entities/base.entity';
export declare class PacienteExame extends BaseEntity {
    pacienteId: string;
    usuarioId: string;
    nomeOriginal: string;
    nomeArquivo: string;
    mimeType: string;
    tamanhoBytes: number;
    caminhoArquivo: string;
    tipoExame: string | null;
    observacao: string | null;
    dataExame: Date | null;
}
