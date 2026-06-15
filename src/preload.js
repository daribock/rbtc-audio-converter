const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  convert: (file, tags) => {
    console.log("[Preload.js] Received file for conversion:", file);
    console.log("[Preload.js] Received tags:", tags);
    const filePath = webUtils.getPathForFile(file);

    return ipcRenderer.invoke("convert", filePath, tags);
  },
});
