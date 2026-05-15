import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Laudo, LaudoStatus } from './entities/laudo.entity';
import { formatExameFisicoForDisplay } from './laudo-exame-fisico-structured.util';

type LaudoPdfTipo = 'laudo' | 'plano';
type LaudoPdfAudience = 'professional' | 'patient';

type ProfissionalPdf = {
  nome: string;
  conselhoProf?: string | null;
  conselhoSigla?: string | null;
  conselhoUf?: string | null;
  registroProf?: string | null;
};

type BuildLaudoPdfParams = {
  laudo: Laudo;
  pacienteNome: string;
  profissional: ProfissionalPdf;
  tipo: LaudoPdfTipo;
  audience: LaudoPdfAudience;
};

@Injectable()
export class LaudoPdfService {
  async buildPdfBuffer(params: BuildLaudoPdfParams): Promise<Buffer> {
    const { laudo, pacienteNome, profissional, tipo, audience } = params;
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50, compress: false });
    doc.font('Helvetica');

    doc.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.addHeader(doc, {
      audience,
      tipo,
      pacienteNome,
      profissional,
      emittedAt: new Date(),
      status: laudo.status,
    });
    this.addBody(doc, laudo, tipo);

    doc.end();
    return done;
  }

  private addHeader(
    doc: PDFKit.PDFDocument,
    params: {
      audience: LaudoPdfAudience;
      tipo: LaudoPdfTipo;
      pacienteNome: string;
      profissional: ProfissionalPdf;
      emittedAt: Date;
      status: LaudoStatus;
    },
  ) {
    const profissionalConselho =
      params.profissional.conselhoProf ||
      (params.profissional.conselhoSigla && params.profissional.conselhoUf
        ? `${params.profissional.conselhoSigla}-${params.profissional.conselhoUf}`
        : '-');
    const profissionalRegistro = params.profissional.registroProf || '-';
    const statusText =
      params.status === LaudoStatus.VALIDADO_PROFISSIONAL
        ? 'Validado pelo profissional'
        : 'Rascunho IA';

    doc.save();
    doc.lineWidth(1).strokeColor('#D1D5DB').rect(35, 35, 525, 770).stroke();
    doc.restore();

    doc.rect(35, 35, 525, 75).fill('#14532D');
    doc.fillColor('#FFFFFF').fontSize(18).text('Synap', 50, 58);
    doc
      .fontSize(10)
      .fillColor('#DCFCE7')
      .text(
        params.audience === 'patient'
          ? 'Documento do paciente'
          : 'Documento clinico',
        50,
        82,
      );

    doc
      .fillColor('#111827')
      .fontSize(17)
      .text(this.getTitle(params.tipo, params.audience), 50, 130);

    doc
      .lineWidth(0.5)
      .strokeColor('#E5E7EB')
      .moveTo(50, 155)
      .lineTo(540, 155)
      .stroke();

    doc
      .fontSize(10.5)
      .fillColor('#374151')
      .text(`Paciente: ${params.pacienteNome}`, 50, 170)
      .text(
        `Data de emissao: ${params.emittedAt.toLocaleDateString('pt-BR')}`,
        50,
        186,
      )
      .text(`Status: ${statusText}`, 300, 170)
      .text(`Profissional: ${params.profissional.nome}`, 300, 186)
      .text(`Conselho: ${profissionalConselho}`, 300, 202)
      .text(`Registro profissional: ${profissionalRegistro}`, 300, 218);

    doc.moveDown(3.2);
    doc.fillColor('#000');
  }

  private addBody(doc: PDFKit.PDFDocument, laudo: Laudo, tipo: LaudoPdfTipo) {
    if (tipo === 'laudo') {
      this.addSection(doc, 'Diagnostico Funcional', laudo.diagnosticoFuncional);
      if (laudo.exameFisico) {
        this.addSection(
          doc,
          'Exame Fisico',
          formatExameFisicoForDisplay(laudo.exameFisico),
        );
      }
      if (laudo.rascunhoProfissional) {
        this.addSection(
          doc,
          'Notas do Profissional',
          laudo.rascunhoProfissional,
        );
      }
      this.addSection(
        doc,
        'Objetivos de Curto Prazo',
        laudo.objetivosCurtoPrazo,
      );
      this.addSection(
        doc,
        'Objetivos de Medio Prazo',
        laudo.objetivosMedioPrazo,
      );
      this.addSection(
        doc,
        'Frequencia e Duracao',
        `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana por ${
          laudo.duracaoSemanas ?? '-'
        } semana(s)`,
      );
      this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
      this.addSection(
        doc,
        'Observacao',
        laudo.observacoes ||
          'Documento para uso clinico profissional. Reavaliar periodicamente.',
      );
      return;
    }

    this.addSection(doc, 'Condutas Terapeuticas', laudo.condutas);
    this.addSection(doc, 'Plano de Tratamento', laudo.planoTratamentoIA);
    this.addSection(
      doc,
      'Frequencia Sugerida',
      `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana`,
    );
    this.addSection(
      doc,
      'Duracao Sugerida',
      `${laudo.duracaoSemanas ?? '-'} semana(s)`,
    );
    this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
    this.addSection(
      doc,
      'Observacao',
      laudo.observacoes ||
        'Plano sujeito a ajuste pelo profissional responsavel.',
    );
  }

  private addSection(
    doc: PDFKit.PDFDocument,
    title: string,
    value?: string | null,
  ) {
    doc.fontSize(12).fillColor('#1b5e40').text(title);
    doc.moveDown(0.2);
    doc
      .fontSize(11)
      .fillColor('#111')
      .text(value?.trim() ? value : 'Nao informado', {
        align: 'left',
      });
    doc.moveDown(0.8);
  }

  private getTitle(tipo: LaudoPdfTipo, audience: LaudoPdfAudience): string {
    if (audience === 'patient') {
      return tipo === 'laudo' ? 'Meu Laudo' : 'Meu Plano de Tratamento';
    }
    return tipo === 'laudo' ? 'Laudo do Paciente' : 'Plano de Tratamento';
  }
}
