// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  processAudio: (filePath: string, tags: { title: string; artist: string }) =>
    ipcRenderer.invoke('process-audio', { filePath, tags }),

  saveTempFile: (file: File) =>
    file.arrayBuffer().then((buffer) => ipcRenderer.invoke('save-temp-file', buffer, file.name)),

  deleteTempFile: (filePath: string) =>
    ipcRenderer.invoke('delete-temp-file', filePath),

  saveAndOpen: (convertedBuffer: ArrayBuffer, fileName: string) =>
    ipcRenderer.invoke('save-and-open', convertedBuffer, fileName)
});
