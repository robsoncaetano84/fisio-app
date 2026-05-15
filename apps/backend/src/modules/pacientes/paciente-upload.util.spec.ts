import { BadRequestException } from '@nestjs/common';
import {
  assertUploadedFile,
  assertValidUploadedClinicalPhotoFile,
  assertValidUploadedExameFile,
  clinicalPhotoFileFilter,
  exameFileFilter,
  parseOptionalDate,
  parseOptionalPainIntensity,
  resolveSafeMimeType,
  UploadedPacienteFile,
} from './paciente-upload.util';

describe('paciente-upload.util', () => {
  const makeFile = (
    overrides: Partial<UploadedPacienteFile> = {},
  ): UploadedPacienteFile => ({
    originalname: 'arquivo.pdf',
    mimetype: 'application/pdf',
    size: 10,
    buffer: Buffer.from('%PDF-1.4'),
    ...overrides,
  });

  it('accepts allowed exam file filter candidates', () => {
    const cb = jest.fn();

    exameFileFilter(
      {},
      { originalname: 'exame.pdf', mimetype: 'application/pdf' },
      cb,
    );

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects unsupported exam file filter candidates', () => {
    const cb = jest.fn();

    exameFileFilter(
      {},
      { originalname: 'script.exe', mimetype: 'text/plain' },
      cb,
    );

    expect(cb.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
    expect(cb.mock.calls[0][1]).toBe(false);
  });

  it('rejects pdf in clinical photo file filter', () => {
    const cb = jest.fn();

    clinicalPhotoFileFilter(
      {},
      { originalname: 'exame.pdf', mimetype: 'application/pdf' },
      cb,
    );

    expect(cb.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
    expect(cb.mock.calls[0][1]).toBe(false);
  });

  it('validates signatures and resolves safe mime type', () => {
    const extension = assertValidUploadedExameFile(makeFile());

    expect(extension).toBe('.pdf');
    expect(resolveSafeMimeType(extension, 'text/plain')).toBe(
      'application/pdf',
    );
  });

  it('rejects mismatched file signature', () => {
    expect(() =>
      assertValidUploadedExameFile(
        makeFile({
          originalname: 'exame.pdf',
          buffer: Buffer.from('not a pdf'),
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('validates clinical photo image signatures', () => {
    const extension = assertValidUploadedClinicalPhotoFile(
      makeFile({
        originalname: 'foto.png',
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]),
      }),
    );

    expect(extension).toBe('.png');
  });

  it('requires uploaded files', () => {
    expect(() => assertUploadedFile(undefined, 'Arquivo obrigatorio')).toThrow(
      BadRequestException,
    );
  });

  it('parses optional clinical photo form fields', () => {
    expect(parseOptionalPainIntensity('7.6')).toBe(8);
    expect(parseOptionalPainIntensity('')).toBeNull();
    expect(parseOptionalDate('2026-01-02')?.toISOString()).toContain(
      '2026-01-02',
    );
    expect(() => parseOptionalPainIntensity('11')).toThrow(BadRequestException);
    expect(() => parseOptionalDate('data invalida')).toThrow(
      BadRequestException,
    );
  });
});
