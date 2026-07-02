const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  convertBatch: (items, sharedTags, parallelWorkers) => {
    if (!Array.isArray(items)) {
      throw new Error("convertBatch requires an array of items.");
    }

    const payload = items.map((item) => {
      if (!item || !item.file) {
        throw new Error("Each batch item requires a file.");
      }

      const filePath = webUtils.getPathForFile(item.file);
      return {
        filePath,
        fileName: item.file.name,
        lesson: item.lesson,
      };
    });

    return ipcRenderer.invoke("convert-batch", payload, sharedTags, parallelWorkers);
  },
  onConvertProgress: (callback) => {
    if (typeof callback !== "function") {
      throw new Error("onConvertProgress requires a function callback.");
    }

    const listener = (_event, progressPayload) => callback(progressPayload);
    ipcRenderer.on("convert-progress", listener);

    return () => {
      ipcRenderer.removeListener("convert-progress", listener);
    };
  },
});
