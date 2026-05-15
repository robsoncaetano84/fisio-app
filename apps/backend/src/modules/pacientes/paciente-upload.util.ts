import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export const MAX_EXAME_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_CLINICAL_PHOTO_SIZE_BYTES = 12 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export type UploadedPacienteFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;
type FileFilterCandidate = {
  originalname?: string;
  mimetype?: string;
};

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  if (!buffer || buffer.length < bytes.length) return false;
  return bytes.every((value, index) => buffer[index] === value);
}

function hasAsciiAt(buffer: Buffer, offset: number, value: string): boolean {
  if (!buffer || buffer.length < offset + value.length) return false;
  return (
    buffer.subarray(offset, offset + value.length).toString('ascii') === value
  );
}

function isValidBySignature(extension: string, buffer: Buffer): boolean {
  switch (extension) {
    case '.pdf':
      return hasAsciiAt(buffer, 0, '%PDF-');
    case '.png':
      return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47]);
    case '.jpg':
    case '.jpeg':
      return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
    case '.webp':
      return hasAsciiAt(buffer, 0, 'RIFF') && hasAsciiAt(buffer, 8, 'WEBP');
    case '.heic':
      return (
        hasAsciiAt(buffer, 4, 'ftypheic') || hasAsciiAt(buffer, 4, 'ftypmif1')
      );
    case '.heif':
      return (
        hasAsciiAt(buffer, 4, 'ftypheif') || hasAsciiAt(buffer, 4, 'ftypmif1')
      );
    default:
      return false;
  }
}

export function exameFileFilter(
  _req: unknown,
  file: FileFilterCandidate,
  cb: FileFilterCallback,
) {
  const mimeType = String(file.mimetype || '').toLowerCase();
  const extension = extname(file.originalname || '').toLowerCase();
  const expectedMime = MIME_BY_EXTENSION[extension];
  const isMimeAllowed =
    ALLOWED_MIME_TYPES.has(mimeType) &&
    (!expectedMime || mimeType === expectedMime);
  const isExtensionAllowed = ALLOWED_EXTENSIONS.has(extension);
  if (!isMimeAllowed && !isExtensionAllowed) {
    return cb(
      new BadRequestException(
        'Tipo de arquivo nao suportado',
      ) as unknown as Error,
      false,
    );
  }
  cb(null, true);
}

export function clinicalPhotoFileFilter(
  _req: unknown,
  file: FileFilterCandidate,
  cb: FileFilterCallback,
) {
  const mimeType = String(file.mimetype || '').toLowerCase();
  const extension = extname(file.originalname || '').toLowerCase();
  const expectedMime = MIME_BY_EXTENSION[extension];
  const isImageExtensionAllowed =
    ALLOWED_EXTENSIONS.has(extension) && extension !== '.pdf';
  const isMimeAllowed =
    mimeType.startsWith('image/') &&
    ALLOWED_MIME_TYPES.has(mimeType) &&
    (!expectedMime || mimeType === expectedMime);
  if (!isImageExtensionAllowed || !isMimeAllowed) {
    return cb(
      new BadRequestException(
        'Envie apenas imagem clinica',
      ) as unknown as Error,
      false,
    );
  }
  cb(null, true);
}

export function assertUploadedFile(
  file: UploadedPacienteFile | undefined,
  message: string,
): asserts file is UploadedPacienteFile {
  if (!file) {
    throw new BadRequestException(message);
  }
}

export function assertValidUploadedExameFile(
  file: UploadedPacienteFile,
): string {
  const detectedExtension = extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(detectedExtension)) {
    throw new BadRequestException('Extensao de arquivo nao suportada');
  }
  if (!isValidBySignature(detectedExtension, file.buffer)) {
    throw new BadRequestException(
      'Assinatura de arquivo invalida para a extensao informada',
    );
  }
  return detectedExtension;
}

export function assertValidUploadedClinicalPhotoFile(
  file: UploadedPacienteFile,
): string {
  const detectedExtension = extname(file.originalname || '').toLowerCase();
  if (
    !ALLOWED_EXTENSIONS.has(detectedExtension) ||
    detectedExtension === '.pdf'
  ) {
    throw new BadRequestException('Extensao de imagem nao suportada');
  }
  if (!isValidBySignature(detectedExtension, file.buffer)) {
    throw new BadRequestException(
      'Assinatura de imagem invalida para a extensao informada',
    );
  }
  return detectedExtension;
}

export function resolveSafeMimeType(
  extension: string,
  reportedMimeType: string,
): string {
  return (
    MIME_BY_EXTENSION[extension] ||
    (ALLOWED_MIME_TYPES.has(String(reportedMimeType || '').toLowerCase())
      ? reportedMimeType
      : 'application/octet-stream')
  );
}

export function parseOptionalDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Data da foto invalida');
  }
  return parsed;
}

export function parseOptionalPainIntensity(
  value?: number | string,
): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
    throw new BadRequestException('Intensidade da dor deve estar entre 0 e 10');
  }
  return Math.round(parsed);
}
