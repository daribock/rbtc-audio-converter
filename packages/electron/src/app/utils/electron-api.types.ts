/**
 * TypeScript definitions for the secure Electron API bridge exposed via preload.
 * Extends the global Window interface to provide type-safe access to main process IPC handlers.
 */
declare global {
  interface Window {
    electronAPI: {
      /**
       * Processes audio file (WAV to MP3 conversion with ID3 tags).
       * @param filePath - Path to the temporary audio file to process
       * @param tags - Metadata tags to inject (title, artist)
       * @returns Promise with conversion result containing buffer and filename
       */
      processAudio: (
        filePath: string,
        tags: { title: string; artist: string },
      ) => Promise<{
        hasErrors: boolean;
        fileBuffer?: ArrayBuffer;
        fileName?: string;
        error?: string;
      }>;

      /**
       * Saves a file to the system temporary directory.
       * @param file - File object to save
       * @returns Promise resolving to the temporary file path
       */
      saveTempFile: (file: File) => Promise<string>;

      /**
       * Deletes a temporary file.
       * @param filePath - Path to the temporary file to delete
       * @returns Promise that resolves when file is deleted
       */
      deleteTempFile: (filePath: string) => Promise<void>;

      /**
       * Saves a file buffer to the Downloads folder and opens the containing folder.
       * @param fileBuffer - ArrayBuffer containing the file data
       * @param fileName - Name for the saved file
       * @returns Promise with operation result
       */
      saveAndOpen: (
        fileBuffer: ArrayBuffer,
        fileName: string,
      ) => Promise<{ hasErrors: boolean; error?: string }>;
    };
  }
}

export {};
