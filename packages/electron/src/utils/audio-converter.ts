import fs from 'fs';
import path from 'path';
import {
  Input,
  Output,
  BufferTarget,
  Conversion,
  BlobSource,
  Mp3OutputFormat,
  ALL_FORMATS,
  canEncodeAudio,
} from 'mediabunny';
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';
import logoAssetPath from '../assets/logo.jpg';

/**
 * Converts an audio file to MP3 format with ID3 tags.
 *
 * @param filePath - Absolute path to the input audio file
 * @param tags - Metadata tags to embed in the MP3 (title, artist)
 * @returns Promise resolving to an object with the converted MP3 buffer and output filename
 * @throws Error if the file cannot be read, conversion is invalid, or conversion fails
 *
 * @example
 * const result = await convertAudioToMp3('/path/to/file.wav', {
 *   title: 'My Song',
 *   artist: 'My Artist'
 * });
 * // { buffer: ArrayBuffer, fileName: 'My Song.mp3' }
 */
export async function convertAudioToMp3(
  filePath: string,
  tags: { title: string; artist: string }
): Promise<{ buffer: ArrayBuffer | null; fileName: string }> {
  // Ensure MP3 encoder is available
  if (!(await canEncodeAudio('mp3'))) {
    registerMp3Encoder();
  }

  // Read the file from disk
  const bytes = await fs.promises.readFile(filePath);
  const resolvedLogoPath = path.isAbsolute(logoAssetPath)
    ? logoAssetPath
    : path.resolve(__dirname, logoAssetPath);
  const logoBytes = await fs.promises.readFile(resolvedLogoPath);
  const source = new BlobSource(new Blob([bytes]));

  // Configure input with auto-format detection
  const input = new Input({
    source,
    formats: ALL_FORMATS,
  });

  // Configure output as MP3
  const output = new Output({
    target: new BufferTarget(),
    format: new Mp3OutputFormat(),
  });

  // Initialize the conversion with tags
  const conversion = await Conversion.init({
    input,
    output,
    tags: {
      title: tags.title,
      artist: tags.artist,
      images: [{
        data: new Uint8Array(logoBytes),
        mimeType: 'image/jpeg',
        kind: 'coverFront',
        name: 'rbtc-logo',
        description: 'RBTC Logo'
      }]
    },
  });

  // Validate conversion
  if (!conversion.isValid) {
    console.info('Discarded tracks:', conversion.discardedTracks);
    throw new Error(
      'Conversion is invalid and cannot be executed; see the console for more.'
    );
  }

  // Log progress
  conversion.onProgress = (progress: number) => {
    console.log(`Conversion progress: ${progress}%`);
  };

  const startTime = performance.now();


  // Execute the conversion
  await conversion.execute();

  const endTime = performance.now();
  const timeSpent = (endTime - startTime).toFixed(2); // in milliseconds

  console.log(`Conversion took ${timeSpent} milliseconds`);

  // Derive output filename from input file
  const originalName = path.basename(filePath) || 'output';
  const outputFileName = `${path.parse(originalName).name}.mp3`;


  return {
    buffer: output.target.buffer,
    fileName: outputFileName,
  };
}
