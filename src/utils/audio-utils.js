import fs from "node:fs";
import path from "node:path";
import {
  Input,
  Output,
  BufferTarget,
  Conversion,
  BlobSource,
  Mp3OutputFormat,
  ALL_FORMATS,
  canEncodeAudio,
} from "mediabunny";
import { config } from "./config.js";

/**
 * Creates a normalized audio title using date and metadata.
 *
 * @param {string} teacherAbbr - Teacher abbreviation.
 * @param {string} city - City abbreviation.
 * @param {string} subject - Subject abbreviation.
 * @param {string} formattedLesson - Zero-padded lesson value.
 * @param {Date} createdAt - Original source creation date.
 * @returns {string} The generated title used for output file naming and tags.
 */
export const createTitle = (
  teacherAbbr,
  city,
  subject,
  formattedLesson,
  createdAt,
) => {
  return `${createdAt.getFullYear().toString().slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")} ${subject} ${formattedLesson} ${city} ${teacherAbbr}`;
};

/**
 * Removes invalid prefixes from malformed WAV files by locating RIFF....WAVE.
 *
 * @param {Blob} blobFile - Input audio blob.
 * @returns {Promise<Blob>} A cleaned WAV blob starting at the RIFF header.
 */
export const cleanZoomAudioFile = async (blobFile) => {
  const scanLimit = Math.min(blobFile.size, 128 * 1024);
  const headerSlice = blobFile.slice(0, scanLimit);
  const bytes = new Uint8Array(await headerSlice.arrayBuffer());

  /**
   * Checks if a valid RIFF....WAVE signature starts at a given offset.
   *
   * @param {number} offset - Byte offset inside the header buffer.
   * @returns {boolean} True when a WAV signature starts at the offset.
   */
  const hasRiffWaveAt = (offset) => {
    if (offset + 12 > bytes.length) {
      return false;
    }

    return (
      bytes[offset] === 0x52 &&
      bytes[offset + 1] === 0x49 &&
      bytes[offset + 2] === 0x46 &&
      bytes[offset + 3] === 0x46 &&
      bytes[offset + 8] === 0x57 &&
      bytes[offset + 9] === 0x41 &&
      bytes[offset + 10] === 0x56 &&
      bytes[offset + 11] === 0x45
    );
  };

  let riffIndex = -1;

  for (let i = 0; i <= bytes.length - 12; i += 1) {
    if (hasRiffWaveAt(i)) {
      riffIndex = i;
      break;
    }
  }

  if (riffIndex === -1) {
    throw new Error(
      "Keine gueltige WAV-Signatur gefunden (RIFF....WAVE). Datei kann nicht repariert werden.",
    );
  }

  if (riffIndex === 0) {
    console.log("Datei ist bereits sauber (WAV Header bei Byte 0).");
    return blobFile;
  }

  console.log(
    `Zoom-Header-Fehler erkannt: WAV Header startet bei Byte ${riffIndex}. Schneide Praefix ab...`,
  );

  return blobFile.slice(riffIndex, blobFile.size, "audio/wav");
};

/**
 * Loads a file from disk and wraps it as Blob for MediaBunny source usage.
 *
 * @param {string} filePath - Absolute source file path.
 * @returns {Promise<Blob>} Blob containing source bytes.
 */
export const createBlobFromFilePath = async (filePath) => {
  const bytes = await fs.promises.readFile(filePath);
  return new Blob([bytes]);
};

const logoCache = new Map();

/**
 * Converts one cleaned WAV blob into MP3 with metadata and cover image.
 *
 * @param {object} params - Function parameters.
 * @param {Blob} params.blobFile - Source audio blob.
 * @param {object} params.tags - Metadata tags.
 * @param {string} params.tags.teacherAbbr - Teacher abbreviation.
 * @param {string} params.tags.teacherName - Teacher full name.
 * @param {string} params.tags.city - City abbreviation.
 * @param {string} params.tags.cityName - City full name.
 * @param {string} params.tags.subject - Subject abbreviation.
 * @param {string} params.tags.subjectName - Subject full name.
 * @param {string} params.tags.formattedLesson - Zero-padded lesson value.
 * @param {(progress: number) => void} [params.onProgress] - Progress callback receiving 0-100.
 * @param {Date} params.createdAt - Source creation timestamp.
 * @param {string} params.logoPath - Absolute path to cover image.
 * @returns {Promise<{hasErrors: false, fileBuffer: Uint8Array, fileName: string, timeTaken: string} | {hasErrors: true, error: string}>} Conversion result.
 */
export const processAudioFile = async ({
  blobFile,
  tags,
  onProgress,
  createdAt,
  logoPath,
}) => {
  let currentConversion;
  const title = createTitle(
    tags.teacherAbbr,
    tags.city,
    tags.subject,
    tags.formattedLesson,
    createdAt,
  );
  const metaTitle = createTitle(
    tags.teacherName,
    tags.cityName,
    tags.subjectName,
    tags.formattedLesson,
    createdAt,
  );
  const resolvedLogoPath = path.resolve(logoPath);

  try {
    const cleanBlob = await cleanZoomAudioFile(blobFile);
    let logoBytes = logoCache.get(resolvedLogoPath);
    if (!logoBytes) {
      logoBytes = await fs.promises.readFile(resolvedLogoPath);
      logoCache.set(resolvedLogoPath, logoBytes);
    }

    const source = new BlobSource(cleanBlob);

    if (!(await canEncodeAudio("mp3"))) {
      console.warn(
        "[audio-utils.js] Warnung: MP3 kann in diesem System scheinbar immer noch nicht encodiert werden.",
      );
    }

    const input = new Input({
      formats: ALL_FORMATS,
      source,
    });

    input.getFormat().then((format) => {
      console.log(
        `[audio-utils.js] Eingangsformat erkannt: ${format.name} (${format.mimeType})`,
      );
    });

    const output = new Output({
      format: new Mp3OutputFormat(),
      target: new BufferTarget(),
    });

    currentConversion = await Conversion.init({
      input,
      output,
      tags: {
        title: metaTitle,
        artist: tags.teacherName,
        album: tags.subjectName,
        albumArtist: config.ALBUM_ARTISTS,
        genre: "Christian Teaching",
        date: createdAt,
        trackNumber: Number.parseInt(tags.formattedLesson, 10),
        images: [
          {
            data: new Uint8Array(logoBytes),
            mimeType: "image/jpeg",
            kind: "coverFront",
            name: "rbtc-logo",
            description: "RBTC Logo",
          },
        ],
      },
    });

    if (!currentConversion.isValid) {
      console.error(currentConversion.discardedTracks);
      throw new Error(
        "Conversion is invalid and cannot be executed; see the console for more.",
      );
    }

    currentConversion.onProgress = (progress) => {
      let normalizedProgress = Number(progress) || 0;
      if (normalizedProgress <= 1) {
        normalizedProgress = normalizedProgress * 100;
      }
      normalizedProgress = Math.max(0, Math.min(100, normalizedProgress));

      if (onProgress) {
        onProgress(normalizedProgress);
      }
    };

    const startTime = performance.now();
    await currentConversion.execute();
    const endTime = performance.now();

    return {
      hasErrors: false,
      fileBuffer: output.target.buffer,
      fileName: `${title}.mp3`,
      timeTaken: ((endTime - startTime) / 1000).toFixed(2),
    };
  } catch (error) {
    console.error(error);
    await currentConversion?.cancel();
    return { hasErrors: true, error: error.message };
  }
};
