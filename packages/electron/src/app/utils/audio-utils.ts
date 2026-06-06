/**
 * Cleans audio files by removing garbage bytes at the beginning (e.g., from Zoom recorders).
 * Identifies the position of the RIFF header and removes any data before it.
 *
 * @param file - The File object to clean
 * @returns A cleaned File object with garbage bytes removed, or the original if already clean
 * @throws Error if no RIFF header is found (not a valid WAV file)
 *
 * @example
 * const cleanFile = await cleanZoomAudioFile(originalFile);
 * // Returns a new File with any leading garbage bytes removed
 */
export async function cleanZoomAudioFile(file: File): Promise<File> {
  // 1. Read only the first 1024 bytes of the file into memory.
  // This takes milliseconds and keeps RAM usage low (whether the file is 5 MB or 5 GB).
  const headerSlice = file.slice(0, 1024);
  const buffer = await headerSlice.arrayBuffer();

  // 2. Convert bytes to text.
  const text = new TextDecoder("ascii").decode(buffer);

  // 3. Find the exact position where "RIFF" starts.
  const riffIndex = text.indexOf("RIFF");

  if (riffIndex === -1) {
    throw new Error("Das ist absolut keine WAV-Datei (Kein RIFF gefunden).");
  }

  if (riffIndex === 0) {
    console.log("Datei ist bereits sauber!");
    return file; // File is already clean; return the original file.
  }

  console.log(
    `Zoom-Fehler erkannt! 'RIFF' startet erst bei Byte ${riffIndex}. Schneide Müll ab...`,
  );

  // 4. Create a new Blob starting exactly at the RIFF header.
  // This is memory-efficient because it behaves like a slice reference.
  const cleanBlob = file.slice(riffIndex, file.size, "audio/wav");

  return new File([cleanBlob], file.name, {
    type: file.type || "audio/wav",
    lastModified: file.lastModified,
  });
}
