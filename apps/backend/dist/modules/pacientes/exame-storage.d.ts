export declare const buildExameObjectKey: (usuarioId: string, pacienteId: string, originalName: string) => string;
export declare const persistExameFile: (params: {
    usuarioId: string;
    pacienteId: string;
    objectKey: string;
    mimeType: string;
    fileBuffer: Buffer;
}) => Promise<{
    nomeArquivo: string;
    caminhoArquivo: string;
}>;
export declare const readExameFile: (caminhoArquivo: string) => Promise<Buffer>;
export declare const deleteExameFile: (caminhoArquivo: string) => Promise<void>;
