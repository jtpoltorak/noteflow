/**
 * Validate uploaded files by inspecting magic bytes (file signatures),
 * not just the client-reported MIME type which is trivially spoofable.
 */

// ── Image magic bytes ────────────────────────────────────────

const IMAGE_SIGNATURES: { mime: string; ext: string; magic: number[]; offset?: number }[] = [
  { mime: "image/png",  ext: ".png",  magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", ext: ".jpg",  magic: [0xff, 0xd8, 0xff] },
  { mime: "image/gif",  ext: ".gif",  magic: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: "image/webp", ext: ".webp", magic: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" at offset 8
];

// ── Audio magic bytes ────────────────────────────────────────

const AUDIO_SIGNATURES: { mime: string; ext: string; magic: number[]; offset?: number }[] = [
  { mime: "audio/mpeg", ext: ".mp3",  magic: [0xff, 0xfb] },          // MP3 frame sync
  { mime: "audio/mpeg", ext: ".mp3",  magic: [0xff, 0xf3] },          // MP3 frame sync variant
  { mime: "audio/mpeg", ext: ".mp3",  magic: [0xff, 0xf2] },          // MP3 frame sync variant
  { mime: "audio/mpeg", ext: ".mp3",  magic: [0x49, 0x44, 0x33] },    // ID3 tag header
  { mime: "audio/wav",  ext: ".wav",  magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  { mime: "audio/ogg",  ext: ".ogg",  magic: [0x4f, 0x67, 0x67, 0x53] }, // OggS
  { mime: "audio/webm", ext: ".webm", magic: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML (Matroska/WebM)
  { mime: "audio/mp4",  ext: ".m4a",  magic: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
];

interface ValidationResult {
  valid: true;
  mime: string;
  ext: string;
}

interface ValidationFailure {
  valid: false;
}

function matchSignatures(
  buffer: Buffer,
  signatures: { mime: string; ext: string; magic: number[]; offset?: number }[]
): ValidationResult | ValidationFailure {
  for (const sig of signatures) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.magic.length) continue;

    const match = sig.magic.every((byte, i) => buffer[offset + i] === byte);
    if (match) {
      return { valid: true, mime: sig.mime, ext: sig.ext };
    }
  }
  return { valid: false };
}

/**
 * Validate an image file by checking its magic bytes.
 * Returns the verified MIME type and safe extension, or throws.
 */
export function validateImageMagicBytes(buffer: Buffer): { mime: string; ext: string } {
  const result = matchSignatures(buffer, IMAGE_SIGNATURES);
  if (!result.valid) {
    throw new Error("File content does not match any allowed image format");
  }
  return { mime: result.mime, ext: result.ext };
}

/**
 * Validate an audio file by checking its magic bytes.
 * Returns the verified MIME type and safe extension, or throws.
 */
export function validateAudioMagicBytes(buffer: Buffer): { mime: string; ext: string } {
  const result = matchSignatures(buffer, AUDIO_SIGNATURES);
  if (!result.valid) {
    throw new Error("File content does not match any allowed audio format");
  }
  return { mime: result.mime, ext: result.ext };
}

/**
 * Sanitize an original filename for safe storage in the database.
 * Strips path separators, null bytes, and control characters.
 */
export function sanitizeOriginalName(name: string): string {
  return name
    .replace(/[\x00-\x1f]/g, "")   // control characters
    .replace(/[/\\:*?"<>|]/g, "_")  // path separators and shell-special chars
    .slice(0, 255);                  // reasonable length limit
}
