// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

export interface FileInfo {
  path: string;
  name: string;
  size?: number;
}

export interface ConversionProgress {
  currentFile: number;
  totalFiles: number;
  fileName: string;
  status: "converting" | "adding-metadata";
  fileProgress: number;
}

export interface ConversionResult {
  success: boolean;
  inputFile: string;
  outputFile?: string;
  error?: string;
}

export interface ConversionComplete {
  results: ConversionResult[];
  outputFolder: string;
}

export interface ConversionOptions {
  files: FileInfo[];
  subject: string;
  city: string;
  teacher: string;
  outputFolder: string;
  coverArtPath?: string;
}

const electronAPI = {
  selectWavFiles: (): Promise<FileInfo[]> =>
    ipcRenderer.invoke("select-wav-files"),
  selectCoverArt: (): Promise<FileInfo | null> =>
    ipcRenderer.invoke("select-cover-art"),
  selectOutputFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("select-output-folder"),
  convertFiles: (options: ConversionOptions): Promise<ConversionResult[]> =>
    ipcRenderer.invoke("convert-files", options),
  onConversionProgress: (callback: (progress: ConversionProgress) => void) => {
    const subscription = (
      _event: IpcRendererEvent,
      progress: ConversionProgress,
    ) => callback(progress);
    ipcRenderer.on("conversion-progress", subscription);
    return () =>
      ipcRenderer.removeListener("conversion-progress", subscription);
  },
  onConversionComplete: (callback: (data: ConversionComplete) => void) => {
    const subscription = (_event: IpcRendererEvent, data: ConversionComplete) =>
      callback(data);
    ipcRenderer.on("conversion-complete", subscription);
    return () =>
      ipcRenderer.removeListener("conversion-complete", subscription);
  },
  openFolder: (folderPath: string): Promise<void> =>
    ipcRenderer.invoke("open-folder", folderPath),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
