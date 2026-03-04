// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

export interface FileInfo {
  path: string;
  name: string;
  size?: number;
}

const electronAPI = {
  selectAudioFiles: (): Promise<FileInfo[]> =>
    ipcRenderer.invoke("select-audio-files"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
