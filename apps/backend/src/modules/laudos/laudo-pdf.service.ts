import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Laudo, LaudoStatus } from './entities/laudo.entity';
import { formatExameFisicoForDisplay } from './laudo-exame-fisico-structured.util';
import { normalizeProfessionalCouncilFields } from '../usuarios/professional-council.util';

type LaudoPdfTipo = 'laudo' | 'plano';
type LaudoPdfAudience = 'professional' | 'patient';

type ProfissionalPdf = {
  nome: string;
  conselhoProf?: string | null;
  conselhoSigla?: string | null;
  conselhoUf?: string | null;
  registroProf?: string | null;
  especialidade?: string | null;
};

type BuildLaudoPdfParams = {
  laudo: Laudo;
  pacienteNome: string;
  profissional: ProfissionalPdf;
  tipo: LaudoPdfTipo;
  audience: LaudoPdfAudience;
};

type PdfTheme = {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  text: string;
  muted: string;
  line: string;
  surface: string;
  warning: string;
};

type TextSection = {
  title: string;
  value?: string | null;
  helper?: string;
  accent?: string;
};

@Injectable()
export class LaudoPdfService {
  private readonly pageTop = 42;
  private readonly pageBottom = 768;
  private readonly contentX = 42;
  private readonly contentWidth = 511;
  private readonly contentInsetX = 58;
  private readonly contentTextWidth = 480;

  private readonly theme: PdfTheme = {
    primary: '#2F855A',
    primaryDark: '#14532D',
    primarySoft: '#E8F5EE',
    text: '#111827',
    muted: '#4B5563',
    line: '#D1D5DB',
    surface: '#F9FAFB',
    warning: '#92400E',
  };

  async buildPdfBuffer(params: BuildLaudoPdfParams): Promise<Buffer> {
    const { laudo, pacienteNome, profissional, tipo, audience } = params;
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      compress: false,
      bufferPages: true,
      info: {
        Title: this.getTitle(tipo, audience),
        Author: profissional.nome,
        Subject: `Documento clinico de ${pacienteNome} | ${this.formatProfessionalRegistration(profissional)}`,
      },
    });
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
    this.addExecutiveSummary(doc, laudo, tipo, audience);
    this.addBody(doc, laudo, tipo, audience);
    this.addProfessionalSignature(doc, profissional, laudo);
    this.addFooter(doc);

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
    const statusText =
      params.status === LaudoStatus.VALIDADO_PROFISSIONAL
        ? 'Validado pelo profissional'
        : 'Rascunho para revisao profissional';
    const professionalLabel = this.formatProfessionalLabel(params.profissional);

    doc.save();
    doc.rect(0, 0, 595.28, 118).fill(this.theme.primaryDark);
    doc.rect(0, 118, 595.28, 6).fill(this.theme.primary);
    doc.restore();

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Synap', 42, 36);
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#DCFCE7')
      .text('Fisioterapia baseada em dados clinicos', 42, 63);
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#FFFFFF')
      .text(this.getTitle(params.tipo, params.audience), 280, 34, {
        width: 270,
        align: 'right',
      });
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#DCFCE7')
      .text(statusText, 280, 61, { width: 270, align: 'right' });

    doc.y = 144;
    this.addInfoGrid(doc, [
      { label: 'Paciente', value: params.pacienteNome },
      {
        label: 'Emissao',
        value: params.emittedAt.toLocaleDateString('pt-BR'),
      },
      { label: 'Profissional', value: professionalLabel },
      {
        label: 'Registro',
        value: this.formatProfessionalRegistration(params.profissional),
      },
    ]);

    if (params.audience === 'patient') {
      this.addPatientIntro(doc, params.tipo);
    }
  }

  private addInfoGrid(
    doc: PDFKit.PDFDocument,
    items: Array<{ label: string; value: string }>,
  ) {
    const startX = 42;
    const startY = doc.y;
    const gap = 12;
    const cardW = (511 - gap) / 2;
    const cardH = 48;

    items.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + 10);
      this.addInfoCard(doc, x, y, cardW, cardH, item.label, item.value);
    });

    doc.y = startY + 2 * cardH + 26;
  }

  private addInfoCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
  ) {
    doc.save();
    doc
      .roundedRect(x, y, width, height, 7)
      .fillAndStroke(this.theme.surface, '#E5E7EB');
    doc.restore();
    doc
      .fillColor(this.theme.muted)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(label.toUpperCase(), x + 12, y + 10, { width: width - 24 });
    doc
      .fillColor(this.theme.text)
      .font('Helvetica')
      .fontSize(10.5)
      .text(value || 'Nao informado', x + 12, y + 25, {
        width: width - 24,
        lineGap: 1,
      });
  }

  private addPatientIntro(doc: PDFKit.PDFDocument, tipo: LaudoPdfTipo) {
    this.ensureSpace(doc, 72);
    const text =
      tipo === 'laudo'
        ? 'Este documento resume a avaliacao funcional, os objetivos e os criterios que ajudam voce e seu fisioterapeuta a acompanhar a evolucao.'
        : 'Este plano organiza as condutas, a frequencia sugerida e os criterios para progredir com seguranca durante o tratamento.';
    this.addCallout(doc, 'Para entender seu documento', text);
  }

  private addExecutiveSummary(
    doc: PDFKit.PDFDocument,
    laudo: Laudo,
    tipo: LaudoPdfTipo,
    audience: LaudoPdfAudience,
  ) {
    const items =
      tipo === 'laudo'
        ? [
            this.firstSentence(laudo.diagnosticoFuncional),
            this.firstSentence(laudo.objetivosCurtoPrazo),
            this.firstSentence(laudo.criteriosAlta),
          ]
        : [
            this.firstSentence(laudo.condutas),
            this.firstSentence(laudo.planoTratamentoIA),
            this.formatFrequencyDuration(laudo),
          ];
    const filtered = items.filter(Boolean);
    if (!filtered.length) return;

    this.ensureSpace(doc, 106);
    this.addSectionTitle(
      doc,
      audience === 'patient' ? 'Resumo em linguagem simples' : 'Resumo clinico',
    );

    const boxY = doc.y;
    const boxH = 28 + filtered.length * 20;
    doc.save();
    doc
      .roundedRect(42, boxY, 511, boxH, 8)
      .fillAndStroke(this.theme.primarySoft, '#B7E4C7');
    doc.restore();

    doc.y = boxY + 14;
    filtered.forEach((item) => {
      doc
        .fillColor(this.theme.text)
        .font('Helvetica')
        .fontSize(10.5)
        .text(`- ${item}`, 60, doc.y, { width: 470, lineGap: 2 });
      doc.moveDown(0.35);
    });
    doc.y = boxY + boxH + 18;
  }

  private addBody(
    doc: PDFKit.PDFDocument,
    laudo: Laudo,
    tipo: LaudoPdfTipo,
    audience: LaudoPdfAudience,
  ) {
    if (tipo === 'laudo') {
      this.addSections(doc, [
        {
          title:
            audience === 'patient'
              ? 'O que encontramos na avaliacao'
              : 'Diagnostico Funcional',
          value: laudo.diagnosticoFuncional,
          helper:
            audience === 'patient'
              ? 'Explicacao funcional do problema, relacionando dor, movimento e atividades do dia a dia.'
              : 'Hipotese funcional e correlacao dos achados clinicos.',
        },
        ...(laudo.exameFisico
          ? [
              {
                title:
                  audience === 'patient'
                    ? 'Achados do exame fisico'
                    : 'Exame Fisico',
                value: formatExameFisicoForDisplay(laudo.exameFisico),
                helper:
                  'Dados observados pelo profissional durante a avaliacao.',
              },
            ]
          : []),
        ...(laudo.rascunhoProfissional
          ? [
              {
                title: 'Observacoes do profissional',
                value: laudo.rascunhoProfissional,
                helper:
                  'Notas clinicas adicionadas pelo profissional responsavel.',
              },
            ]
          : []),
        {
          title: 'Objetivos iniciais',
          value: laudo.objetivosCurtoPrazo,
          helper:
            'Metas esperadas nas primeiras sessoes ou na fase inicial do cuidado.',
        },
        {
          title: 'Objetivos de evolucao',
          value: laudo.objetivosMedioPrazo,
          helper:
            'Metas funcionais para recuperar tolerancia, movimento e autonomia.',
        },
        {
          title: 'Frequencia e duracao previstas',
          value: this.formatFrequencyDuration(laudo),
          helper:
            'A frequencia pode mudar conforme resposta, seguranca e reavaliacao.',
          accent: this.theme.primarySoft,
        },
        {
          title: 'Quando considerar alta ou nova reavaliacao',
          value: laudo.criteriosAlta,
          helper:
            'Criterios usados para avaliar melhora, seguranca e autonomia.',
        },
      ]);
      this.addObservation(doc, laudo, audience);
      return;
    }

    this.addSections(doc, [
      {
        title:
          audience === 'patient'
            ? 'O que sera feito nas sessoes'
            : 'Condutas Terapeuticas',
        value: laudo.condutas,
        helper: 'Condutas propostas e o motivo clinico para cada uma delas.',
      },
      {
        title:
          audience === 'patient'
            ? 'Como o tratamento deve progredir'
            : 'Plano de Tratamento',
        value: laudo.planoTratamentoIA,
        helper: 'Plano por fases, com criterios para avancar com seguranca.',
      },
      {
        title: 'Frequencia sugerida',
        value: `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana`,
        helper: 'Quantidade inicial estimada de encontros por semana.',
        accent: this.theme.primarySoft,
      },
      {
        title: 'Duracao sugerida',
        value: `${laudo.duracaoSemanas ?? '-'} semana(s)`,
        helper: 'Estimativa inicial sujeita a resposta clinica e reavaliacao.',
        accent: this.theme.primarySoft,
      },
      {
        title: 'Criterios para evoluir ou receber alta',
        value: laudo.criteriosAlta,
        helper:
          'Sinais usados para acompanhar progresso, autonomia e seguranca.',
      },
    ]);
    this.addObservation(doc, laudo, audience);
  }

  private addSections(doc: PDFKit.PDFDocument, sections: TextSection[]) {
    sections.forEach((section) => this.addSection(doc, section));
  }

  private addSection(doc: PDFKit.PDFDocument, section: TextSection) {
    const value = this.normalizeText(section.value) || 'Nao informado';
    const headerHeight = section.helper ? 58 : 42;
    this.ensureSpace(doc, headerHeight + 30);

    const y = doc.y;
    doc.save();
    doc
      .roundedRect(this.contentX, y, this.contentWidth, headerHeight, 8)
      .fillAndStroke(section.accent || '#FFFFFF', '#E5E7EB');
    doc.restore();

    doc
      .font('Helvetica-Bold')
      .fontSize(12.5)
      .fillColor(this.theme.primaryDark)
      .text(section.title, this.contentInsetX, y + 13, {
        width: this.contentTextWidth,
      });

    if (section.helper) {
      doc
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor(this.theme.muted)
        .text(section.helper, this.contentInsetX, doc.y + 3, {
          width: this.contentTextWidth,
          lineGap: 1,
        });
    }

    doc.y = y + headerHeight + 8;
    this.writeRichText(
      doc,
      value,
      this.contentInsetX,
      doc.y,
      this.contentTextWidth,
    );
    doc.y += 12;
  }

  private writeRichText(
    doc: PDFKit.PDFDocument,
    value: string,
    x: number,
    y: number,
    width: number,
  ) {
    const lines = this.normalizeText(value)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    doc.x = x;
    doc.y = y;

    if (!lines.length) {
      doc.font('Helvetica').fontSize(10.3).fillColor(this.theme.text);
      doc.text('Nao informado', x, y, { width, lineGap: 2 });
      return;
    }

    for (const line of lines) {
      const isBullet = /^[-*]\s+/.test(line);
      const isPhase = /^fase\s+\d+/i.test(line);
      const prefix = isBullet || isPhase ? '- ' : '';
      const cleanLine = line.replace(/^[-*]\s+/, '');
      const renderedLine = `${prefix}${cleanLine}`;
      const estimatedHeight = doc.heightOfString(renderedLine, {
        width,
        lineGap: 2.2,
      });
      this.ensureSpace(doc, Math.min(estimatedHeight + 8, this.usableHeight()));
      doc
        .font(isPhase ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10.3)
        .fillColor(this.theme.text)
        .text(renderedLine, x, doc.y, {
          width,
          lineGap: 2.2,
        });
      doc.moveDown(0.25);
    }
  }

  private addObservation(
    doc: PDFKit.PDFDocument,
    laudo: Laudo,
    audience: LaudoPdfAudience,
  ) {
    const fallback =
      audience === 'patient'
        ? 'Este documento orienta seu acompanhamento, mas nao substitui conversa com o profissional responsavel. Procure atendimento se houver piora importante, sintomas novos ou sinais de alerta.'
        : 'Documento para uso clinico profissional. Reavaliar periodicamente.';
    const observation =
      audience === 'patient' ? fallback : laudo.observacoes || fallback;

    this.addCallout(doc, 'Observacao importante', observation);
  }

  private addCallout(doc: PDFKit.PDFDocument, title: string, value: string) {
    const normalized = this.normalizeText(value);
    const textHeight = this.estimateTextHeight(doc, normalized);
    const height = Math.max(58, 42 + textHeight);

    if (height > this.usableHeight()) {
      this.ensureSpace(doc, 58);
      const y = doc.y;
      doc.save();
      doc
        .roundedRect(this.contentX, y, this.contentWidth, 42, 8)
        .fillAndStroke('#FFF7ED', '#FDBA74');
      doc.restore();
      doc
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .fillColor(this.theme.warning)
        .text(title, this.contentInsetX, y + 13, {
          width: this.contentTextWidth,
        });
      doc.y = y + 50;
      this.writeRichText(
        doc,
        normalized,
        this.contentInsetX,
        doc.y,
        this.contentTextWidth,
      );
      doc.y += 16;
      return;
    }

    this.ensureSpace(doc, height + 8);
    const y = doc.y;
    doc.save();
    doc
      .roundedRect(this.contentX, y, this.contentWidth, height, 8)
      .fillAndStroke('#FFF7ED', '#FDBA74');
    doc.restore();
    doc
      .font('Helvetica-Bold')
      .fontSize(11.5)
      .fillColor(this.theme.warning)
      .text(title, this.contentInsetX, y + 13, {
        width: this.contentTextWidth,
      });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(this.theme.text)
      .text(normalized, this.contentInsetX, y + 31, {
        width: this.contentTextWidth,
        lineGap: 2,
      });
    doc.y = y + height + 16;
  }

  private addProfessionalSignature(
    doc: PDFKit.PDFDocument,
    profissional: ProfissionalPdf,
    laudo: Laudo,
  ) {
    this.ensureSpace(doc, 124);
    const y = doc.y + 8;
    doc
      .strokeColor(this.theme.line)
      .lineWidth(0.8)
      .moveTo(335, y + 34)
      .lineTo(540, y + 34)
      .stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(this.theme.text)
      .text(profissional.nome || 'Profissional responsavel', 335, y + 42, {
        width: 205,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(9.2)
      .fillColor(this.theme.muted)
      .text(this.formatProfessionalRegistration(profissional), 335, y + 58, {
        width: 205,
        align: 'center',
      });
    if (profissional.especialidade) {
      doc.text(profissional.especialidade, 335, y + 72, {
        width: 205,
        align: 'center',
      });
    }

    const validationText =
      laudo.status === LaudoStatus.VALIDADO_PROFISSIONAL && laudo.validadoEm
        ? `Validado em ${laudo.validadoEm.toLocaleDateString('pt-BR')}`
        : 'Pendente de validacao profissional';
    doc
      .font('Helvetica')
      .fontSize(8.8)
      .fillColor(this.theme.muted)
      .text(validationText, 42, y + 52, { width: 250 });
    doc.y = y + 100;
  }

  private addFooter(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();
    const footerLineY = 776;
    const footerTextY = 784;
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(42, footerLineY)
        .lineTo(553, footerLineY)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(this.theme.muted)
        .text(
          'Synap | Documento clinico para acompanhamento fisioterapeutico',
          42,
          footerTextY,
          { width: 360, height: 10, lineBreak: false },
        )
        .text(
          `Pagina ${i - range.start + 1} de ${range.count}`,
          470,
          footerTextY,
          {
            width: 83,
            height: 10,
            align: 'right',
            lineBreak: false,
          },
        );
    }
  }

  private addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    this.ensureSpace(doc, 32);
    doc
      .font('Helvetica-Bold')
      .fontSize(13.5)
      .fillColor(this.theme.primaryDark)
      .text(title, 42, doc.y);
    doc.moveDown(0.45);
  }

  private ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
    if (doc.y <= this.pageTop + 1) return;
    if (doc.y + requiredHeight > this.pageBottom) {
      doc.addPage();
      doc.y = this.pageTop;
    }
  }

  private usableHeight(): number {
    return this.pageBottom - this.pageTop;
  }

  private estimateTextHeight(doc: PDFKit.PDFDocument, value: string): number {
    return doc.heightOfString(value || 'Nao informado', {
      width: 480,
      lineGap: 2,
    });
  }

  private firstSentence(value?: string | null): string {
    const normalized = this.normalizeText(value);
    if (!normalized) return '';
    const [first] = normalized.split(/(?<=[.!?])\s+/);
    return this.truncate(first || normalized, 150);
  }

  private formatFrequencyDuration(laudo: Laudo): string {
    return `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana por ${
      laudo.duracaoSemanas ?? '-'
    } semana(s)`;
  }

  private formatProfessionalLabel(profissional: ProfissionalPdf): string {
    const parts = [profissional.nome, profissional.especialidade].filter(
      (part) => this.normalizeText(part),
    );
    return parts.join(' | ') || 'Nao informado';
  }

  private formatProfessionalRegistration(
    profissional: ProfissionalPdf,
  ): string {
    const council = this.formatProfessionalCouncil(profissional);
    const registration = this.normalizeText(profissional.registroProf);
    if (council && registration) return `${council} ${registration}`;
    return registration || council || 'Registro profissional nao informado';
  }

  private formatProfessionalCouncil(profissional: ProfissionalPdf): string {
    const normalized = normalizeProfessionalCouncilFields({
      conselhoSigla: profissional.conselhoSigla,
      conselhoUf: profissional.conselhoUf,
      conselhoProf: profissional.conselhoProf,
    });
    if (normalized.conselhoProf) return normalized.conselhoProf;

    return (
      this.normalizeText(profissional.conselhoProf) ||
      (profissional.conselhoSigla && profissional.conselhoUf
        ? `${profissional.conselhoSigla}-${profissional.conselhoUf}`
        : '')
    );
  }

  private normalizeText(value?: string | null): string {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private truncate(value: string, maxLen: number): string {
    return value.length > maxLen ? `${value.slice(0, maxLen - 3)}...` : value;
  }

  private getTitle(tipo: LaudoPdfTipo, audience: LaudoPdfAudience): string {
    if (audience === 'patient') {
      return tipo === 'laudo' ? 'Meu Laudo Clinico' : 'Meu Plano de Tratamento';
    }
    return tipo === 'laudo' ? 'Laudo Clinico' : 'Plano de Tratamento';
  }
}
