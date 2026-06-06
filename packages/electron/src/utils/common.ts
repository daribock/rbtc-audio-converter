import * as fs from 'fs';

/**
 * Scans a WAV file and repairs its RIFF and data chunk sizes based on the true file size.
 * Perfect for fixing Zoom PodTrak files.
 *
 * @deprecated This function is no longer needed since we switched to a streaming conversion approach that doesn't load the entire file into memory. However, it can still be useful for debugging or for users who want to manually fix their WAV files before conversion.
 */
export function fixZoomWavHeader(absoluteFilePath: string): boolean {
  try {
    const stats = fs.statSync(absoluteFilePath);
    const actualFileSize = stats.size;

    // Open the file for reading and writing ('r+')
    const fd = fs.openSync(absoluteFilePath, 'r+');

    // Read the first 1000 bytes (headers) into a tiny buffer
    const headerBuffer = Buffer.alloc(1000);
    fs.readSync(fd, headerBuffer, 0, 1000, 0);

    // 1. Verify it's actually a WAV file
    if (headerBuffer.toString('utf8', 0, 4) !== 'RIFF') {
      console.error("Not a valid RIFF file.");
      fs.closeSync(fd);
      return false;
    }

    // 2. Fix the main RIFF chunk size (Total File Size - 8 bytes)
    const riffSizeBuffer = Buffer.alloc(4);
    riffSizeBuffer.writeUInt32LE(actualFileSize - 8, 0);
    fs.writeSync(fd, riffSizeBuffer, 0, 4, 4); // Write at byte offset 4

    // 3. Scan through the chunks to find the 'data' chunk
    let offset = 12; // Start after 'RIFF' (4), size (4), and 'WAVE' (4)
    let fixed = false;

    while (offset < headerBuffer.length - 8) {
      const chunkId = headerBuffer.toString('utf8', offset, offset + 4);

      if (chunkId === 'data') {
        // We found the audio data! Let's fix its size declaration.
        // Data size = Total file size - offset of the data chunk - 8 bytes for the chunk header
        const dataSizeBuffer = Buffer.alloc(4);
        dataSizeBuffer.writeUInt32LE(actualFileSize - offset - 8, 0);
        fs.writeSync(fd, dataSizeBuffer, 0, 4, offset + 4);

        console.log(`Successfully repaired 'data' chunk at offset ${offset}`);
        fixed = true;
        break;
      }

      // If it's not the data chunk (e.g., 'fmt ', 'bext'), read its size and skip past it
      const chunkSize = headerBuffer.readUInt32LE(offset + 4);
      offset += 8 + chunkSize;
    }

    fs.closeSync(fd);
    return fixed;

  } catch (error) {
    console.error("Failed to fix WAV header:", error);
    return false;
  }
}

/**
 * Converts a browser File object into an ArrayBuffer.
 *
 * @param file The input file selected in the renderer process.
 * @returns The file data as an ArrayBuffer, or undefined if conversion fails.
 */
export async function convertFileToArrayBuffer(file: File) {
  console.log('convertFileToArrayBuffer', file);

  try {
    // 1. Await the built-in method
    const arrayBuffer = await file.arrayBuffer();

    console.log("Conversion successful!", arrayBuffer);
    return arrayBuffer;

  } catch (error) {
    console.error("Failed to convert file to ArrayBuffer:", error);
  }
}

/**
 * Identifies the true file format by analyzing the file's magic bytes (header signature).
 *
 * Reads the first 16 bytes of a file and displays hexadecimal and ASCII representations
 * to help determine the actual file format. Useful for detecting files with incorrect
 * extensions or corrupted headers (e.g., Zoom recorder artifacts).
 *
 * @param absoluteFilePath - Full file path to analyze
 *
 * @returns void - Logs detection results and diagnostic info to console
 *
 * @example
 * identifyTrueFileFormat('/path/to/audio.wav');
 * // --- DATEI DETEKTIV ---
 * // Pfad: /path/to/audio.wav
 * // HEX-Werte: 52 49 46 46 ...
 * // ASCII-Text: RIFF ...
 * // Ergebnis: Es IST eine WAV/AVI-Datei (RIFF Header gefunden).
 */
export function identifyTrueFileFormat(absoluteFilePath: string) {
  try {
    // 1. Datei nur zum Lesen öffnen
    const fd = fs.openSync(absoluteFilePath, 'r');

    // 2. Wir lesen nur die ersten 16 Bytes
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // 3. Wir wandeln die Bytes in lesbaren Text (ASCII) und Hexadezimal-Zahlen um
    const hex = buffer.toString('hex').toUpperCase();
    // Ersetzt nicht-lesbare Zeichen durch einen Punkt, damit die Konsole nicht verrückt spielt
    const ascii = buffer.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

    console.log("--- DATEI DETEKTIV ---");
    console.log(`Pfad: ${absoluteFilePath}`);
    console.log(`HEX-Werte: ${hex.match(/.{1,2}/g)?.join(' ')}`);
    console.log(`ASCII-Text: ${ascii}`);

    // 4. Automatische Erkennung der häufigsten Formate
    if (ascii.startsWith('RIFF')) {
      console.log("Ergebnis: Es IST eine WAV/AVI-Datei (RIFF Header gefunden).");
    } else if (ascii.startsWith('ID3') || hex.startsWith('FFF')) {
      console.log("Ergebnis: Es ist eigentlich eine MP3-Datei!");
    } else if (ascii.includes('ftyp')) {
      console.log("Ergebnis: Es ist eigentlich eine MP4/M4A/MOV-Datei!");
    } else if (ascii.startsWith('OggS')) {
      console.log("Ergebnis: Es ist eigentlich eine OGG-Datei!");
    } else if (hex.startsWith('0000000000000000')) {
      console.log("Ergebnis: ACHTUNG! Die Datei besteht aus Nullen. Sie ist wahrscheinlich korrupt/beschädigt (z.B. Fehler auf der SD-Karte des Zoom P4).");
    } else {
      console.log("Ergebnis: Unbekanntes Format. Bitte überprüfe die HEX/ASCII-Werte oben.");
    }
    console.log("----------------------");

  } catch (error) {
    console.error("Fehler beim Lesen der Datei:", error);
  }
}


