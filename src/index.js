import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import squirrelStartup from "electron-squirrel-startup";
import { registerMp3Encoder } from "@mediabunny/mp3-encoder";
import {
  createBlobFromFilePath,
  processAudioFile,
} from "./utils/audio-utils.js";
import { normalizeLesson, resolveUniqueFilePath } from "./utils/file-utils.js";
import { runParallelBatch } from "./utils/async-utils.js";
import { validateBatchRequest } from "./utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsPath = app.getPath("downloads");
const logoPath = path.resolve(__dirname, "./assets/logo.jpg");

const MAX_PARALLEL_WORKERS = 2;

registerMp3Encoder();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelStartup) {
  app.quit();
}

/**
 * Creates the main Electron browser window and loads the renderer entry file.
 *
 * @returns {void}
 */
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: logoPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
};

/**
 * Returns a safe creation date for a source file.
 *
 * @param {string} filePath - Absolute source file path.
 * @returns {Date} File birthtime when available, otherwise current date.
 */
const getSafeCreatedAt = (filePath) => {
  const { birthtime } = fs.statSync(filePath) || {};
  return birthtime instanceof Date ? birthtime : new Date();
};

/**
 * Emits structured single-file progress updates to the renderer process.
 *
 * @param {Electron.IpcMainInvokeEvent} event - IPC event sender.
 * @param {string} fileName - Source file name shown in UI.
 * @param {number} progress - Current file progress in percent.
 * @param {number} completedCount - Completed file count.
 * @param {number} failedCount - Failed file count.
 * @returns {void}
 */
const emitSingleConvertProgress = (
  event,
  fileName,
  progress,
  completedCount,
  failedCount,
) => {
  event.sender.send("convert-progress", {
    totalFiles: 1,
    fileIndex: 0,
    fileName,
    fileProgress: progress,
    completedCount,
    failedCount,
  });
};

/**
 * Converts one file using shared metadata and reports progress.
 *
 * @param {Electron.IpcMainInvokeEvent} event - IPC invoke event.
 * @param {string} filePath - Absolute source WAV path.
 * @param {{teacher: string, city: string, subject: string, lesson: string|number}} tags - User metadata.
 * @returns {Promise<{hasErrors: boolean, error?: string, filePath?: string, timeTaken?: string}>} Single conversion result.
 */
const handleConvert = async (event, filePath, tags) => {
  const teacher = String(tags?.teacher || "").trim();
  const city = String(tags?.city || "").trim();
  const subject = String(tags?.subject || "").trim();
  const formattedLesson = normalizeLesson(tags?.lesson);

  console.log(
    "[index.js] Received single convert request:",
    filePath,
    teacher,
    city,
    subject,
    formattedLesson,
  );

  try {
    const fileBlob = await createBlobFromFilePath(filePath);
    const fileName = path.basename(filePath);

    /**
     * Forwards conversion progress to the renderer.
     *
     * @param {number} progress - Conversion progress value from 0 to 100.
     * @returns {void}
     */
    const forwardProgress = (progress) => {
      emitSingleConvertProgress(event, fileName, progress, 0, 0);
    };

    const result = await processAudioFile({
      blobFile: fileBlob,
      tags: {
        teacherAbbr: teacher,
        city,
        subject,
        formattedLesson,
      },
      onProgress: forwardProgress,
      createdAt: getSafeCreatedAt(filePath),
      logoPath,
    });

    if (result.hasErrors) {
      return { hasErrors: true, error: result.error };
    }

    const outputFilePath = await resolveUniqueFilePath(
      path.join(downloadsPath, result.fileName),
    );

    await fs.promises.writeFile(outputFilePath, Buffer.from(result.fileBuffer));
    emitSingleConvertProgress(event, fileName, 100, 1, 0);

    console.log("Converted file saved successfully:", outputFilePath);
    return {
      hasErrors: false,
      filePath: outputFilePath,
      timeTaken: result.timeTaken,
    };
  } catch (error) {
    console.error("Error during conversion:", error);
    return { hasErrors: true, error: error.message };
  }
};

/**
 * Converts multiple files and streams structured progress updates.
 *
 * @param {Electron.IpcMainInvokeEvent} event - IPC invoke event.
 * @param {Array<{filePath: string, fileName?: string, lesson: string|number}>} batchItems - Files with lesson mapping.
 * @param {{teacher?: string, city?: string, subject?: string}} sharedTags - Shared metadata.
 * @param {number} [parallelWorkers] - Requested parallel worker count (clamped to 1–10).
 * @returns {Promise<{hasErrors: boolean, error?: string, converted?: Array<{sourceFileName: string, outputFilePath: string, timeTaken: string}>, failed?: Array<{fileName: string, error: string}>, usedSequentialFallback?: boolean, timeTaken?: string}>} Batch conversion result.
 */
const handleConvertBatch = async (event, batchItems, sharedTags, parallelWorkers) => {
  const startedAt = performance.now();
  const clampedWorkers = Math.max(
    1,
    Math.min(10, Number.parseInt(String(parallelWorkers), 10) || MAX_PARALLEL_WORKERS),
  );

  try {
    const validation = validateBatchRequest(batchItems, sharedTags);
    if (validation.error) {
      return { hasErrors: true, error: validation.error };
    }

    const { normalizedItems, teacher, city, subject } = validation;
    const converted = [];
    const failed = [];
    const processedIndices = new Set();
    const totalFiles = normalizedItems.length;

    /**
     * Emits a structured batch progress payload to the renderer.
     *
     * @param {{fileIndex: number, fileName: string, fileProgress: number}} payload - File-level progress payload.
     * @returns {void}
     */
    const sendProgress = (payload) => {
      event.sender.send("convert-progress", {
        totalFiles,
        completedCount: converted.length,
        failedCount: failed.length,
        ...payload,
      });
    };

    /**
     * Converts a single batch item and records success or failure.
     *
     * @param {{filePath: string, fileName: string, lesson: string, index: number}} item - One normalized batch item.
     * @returns {Promise<void>}
     */
    const convertOne = async (item) => {
      try {
        if (!item.filePath || !item.fileName) {
          throw new Error("Invalid file payload received.");
        }

        if (!item.fileName.toLowerCase().endsWith(".wav")) {
          throw new Error("Only .wav files are allowed.");
        }

        const fileBlob = await createBlobFromFilePath(item.filePath);

        sendProgress({
          fileIndex: item.index,
          fileName: item.fileName,
          fileProgress: 0,
        });

        const result = await processAudioFile({
          blobFile: fileBlob,
          tags: {
            teacherAbbr: teacher,
            city,
            subject,
            formattedLesson: item.lesson,
          },
          onProgress: (progress) => {
            sendProgress({
              fileIndex: item.index,
              fileName: item.fileName,
              fileProgress: progress,
            });
          },
          createdAt: getSafeCreatedAt(item.filePath),
          logoPath,
        });

        if (result.hasErrors) {
          failed.push({
            fileName: item.fileName,
            error: result.error || "Conversion failed.",
          });
          sendProgress({
            fileIndex: item.index,
            fileName: item.fileName,
            fileProgress: 100,
          });
          return;
        }

        const outputFilePath = await resolveUniqueFilePath(
          path.join(downloadsPath, result.fileName),
        );

        await fs.promises.writeFile(outputFilePath, Buffer.from(result.fileBuffer));

        converted.push({
          sourceFileName: item.fileName,
          outputFilePath,
          timeTaken: result.timeTaken,
        });

        sendProgress({
          fileIndex: item.index,
          fileName: item.fileName,
          fileProgress: 100,
        });
      } catch (error) {
        failed.push({
          fileName: item.fileName,
          error: error.message || "Unexpected conversion error.",
        });
        sendProgress({
          fileIndex: item.index,
          fileName: item.fileName,
          fileProgress: 100,
        });
      } finally {
        processedIndices.add(item.index);
      }
    };

    let usedSequentialFallback = false;

    try {
      await runParallelBatch(clampedWorkers, normalizedItems, convertOne);
    } catch (parallelError) {
      console.error(
        "Batch parallel conversion failed, falling back to sequential:",
        parallelError,
      );
      usedSequentialFallback = true;

      for (const item of normalizedItems) {
        if (!processedIndices.has(item.index)) {
          await convertOne(item);
        }
      }
    }

    const finishedAt = performance.now();
    return {
      hasErrors: false,
      converted,
      failed,
      usedSequentialFallback,
      timeTaken: ((finishedAt - startedAt) / 1000).toFixed(2),
    };
  } catch (error) {
    console.error("Error during batch conversion:", error);
    return { hasErrors: true, error: error.message };
  }
};

/**
 * Re-creates a window when the dock icon is activated without open windows.
 *
 * @returns {void}
 */
const handleActivate = () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
};

/**
 * Initializes app window and IPC handlers after Electron is ready.
 *
 * @returns {void}
 */
const onAppReady = () => {
  createWindow();

  ipcMain.handle("convert-batch", handleConvertBatch);
  app.on("activate", handleActivate);
};

/**
 * Quits the app when all windows are closed on non-macOS platforms.
 *
 * @returns {void}
 */
const handleWindowAllClosed = () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
};

app.whenReady().then(onAppReady);
app.on("window-all-closed", handleWindowAllClosed);
