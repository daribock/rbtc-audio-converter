import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import squirrelStartup from "electron-squirrel-startup";
import { registerMp3Encoder } from "@mediabunny/mp3-encoder";
import {
  Input,
  Output,
  BufferTarget,
  Conversion,
  BlobSource,
  Mp3OutputFormat,
  ALL_FORMATS,
  canEncodeAudio,
} from "mediabunny";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsPath = app.getPath("downloads");
const tempDir = app.getPath("temp");

const MAX_PARALLEL_WORKERS = 2;

registerMp3Encoder();

const cleanZoomAudioFile = async (blobFile) => {
  // Wir prüfen nur den Dateianfang (schnell & speicherschonend), suchen aber robust
  // nach einer echten WAV-Signatur: RIFF....WAVE (nicht nur nach "RIFF" als Text).
  const scanLimit = Math.min(blobFile.size, 128 * 1024);
  const headerSlice = blobFile.slice(0, scanLimit);
  const bytes = new Uint8Array(await headerSlice.arrayBuffer());

  const hasRiffWaveAt = (offset) => {
    if (offset + 12 > bytes.length) {
      return false;
    }

    return (
      bytes[offset] === 0x52 && // R
      bytes[offset + 1] === 0x49 && // I
      bytes[offset + 2] === 0x46 && // F
      bytes[offset + 3] === 0x46 && // F
      bytes[offset + 8] === 0x57 && // W
      bytes[offset + 9] === 0x41 && // A
      bytes[offset + 10] === 0x56 && // V
      bytes[offset + 11] === 0x45 // E
    );
  };

  let riffIndex = -1;

  for (let i = 0; i <= bytes.length - 12; i += 1) {
    if (hasRiffWaveAt(i)) {
      riffIndex = i;
      break;
    }
  }

  if (riffIndex === -1) {
    throw new Error(
      "Keine gueltige WAV-Signatur gefunden (RIFF....WAVE). Datei kann nicht repariert werden.",
    );
  }

  if (riffIndex === 0) {
    console.log("Datei ist bereits sauber (WAV Header bei Byte 0).");
    return blobFile;
  }

  console.log(
    `Zoom-Header-Fehler erkannt: WAV Header startet bei Byte ${riffIndex}. Schneide Praefix ab...`,
  );

  // Blob.slice ist lazy: keine komplette Dateikopie im RAM.
  return blobFile.slice(riffIndex, blobFile.size, "audio/wav");
};

const createBlobFromFilePath = async (filePath) => {
  const bytes = await fs.promises.readFile(filePath);

  return new Blob([bytes]);
};

const createTitle = (
  teacherAbbr,
  city,
  subject,
  formattedLesson,
  createdAt,
) => {
  return `${createdAt.getFullYear().toString().slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")} ${subject} ${formattedLesson} ${city} ${teacherAbbr}`;
};

const normalizeLesson = (lessonValue) => {
  const parsedLesson = Number.parseInt(String(lessonValue), 10);

  if (!Number.isInteger(parsedLesson) || parsedLesson <= 0) {
    throw new Error("Lesson values must be positive whole numbers.");
  }

  return String(parsedLesson).padStart(2, "0");
};

const resolveUniqueFilePath = async (candidatePath) => {
  const parsedPath = path.parse(candidatePath);
  let attempt = 0;
  let currentPath = candidatePath;

  while (true) {
    try {
      await fs.promises.access(currentPath);
      attempt += 1;
      currentPath = path.join(
        parsedPath.dir,
        `${parsedPath.name} (${attempt})${parsedPath.ext}`,
      );
    } catch {
      return currentPath;
    }
  }
};

const processAudioFile = async (blobFile, tags, onProgress, createdAt) => {
  let currentConversion;
  const title = createTitle(
    tags.teacherAbbr,
    tags.city,
    tags.subject,
    tags.formattedLesson,
    createdAt,
  );
  const resolvedLogoPath = path.isAbsolute("./assets/logo.jpg")
    ? "./assets/logo.jpg"
    : path.resolve(__dirname, "./assets/logo.jpg");

  try {
    const cleanBlob = await cleanZoomAudioFile(blobFile);
    const logoBytes = await fs.promises.readFile(resolvedLogoPath);

    // Test: Speichert die gecleante Original-WAV-Datei zum Probehören
    // const testBuffer = Buffer.from(await cleanBlob.arrayBuffer());
    // await fs.promises.writeFile(
    //   path.join(app.getPath("downloads"), "TEST_CLEAN.wav"),
    //   testBuffer,
    // );

    const source = new BlobSource(cleanBlob);

    if (!(await canEncodeAudio("mp3"))) {
      console.warn(
        "[index.js] Warnung: MP3 kann in diesem System scheinbar immer noch nicht encodiert werden.",
      );
    }

    const input = new Input({
      formats: ALL_FORMATS,
      source,
    });

    input.getFormat().then((format) => {
      console.log(
        `[index.js] Eingangsformat erkannt: ${format.name} (${format.mimeType})`,
      );
    });

    const output = new Output({
      format: new Mp3OutputFormat(),
      target: new BufferTarget(),
    });

    currentConversion = await Conversion.init({
      input,
      output,
      tags: {
        title,
        artist: tags.teacherAbbr,
        album: tags.subject,
        trackNumber: parseInt(tags.formattedLesson, 10),
        images: [
          {
            data: new Uint8Array(logoBytes),
            mimeType: "image/jpeg",
            kind: "coverFront",
            name: "rbtc-logo",
            description: "RBTC Logo",
          },
        ],
      },
    });

    if (!currentConversion.isValid) {
      // Conversion is invalid and cannot be executed without error.
      console.error(currentConversion.discardedTracks);
      throw new Error(
        "Conversion is invalid and cannot be executed; see the console for more.",
      );
    }

    currentConversion.onProgress = (progress) => {
      let normalizedProgress = Number(progress) || 0;
      // Handle both 0-1 and 0-100 ranges
      if (normalizedProgress <= 1) {
        normalizedProgress = normalizedProgress * 100;
      }
      normalizedProgress = Math.max(0, Math.min(100, normalizedProgress));
      console.log(
        `[Conversion progress callback] Raw: ${progress}, Normalized: ${normalizedProgress}%`,
      );
      if (onProgress) {
        onProgress(normalizedProgress);
      }
    };

    const startTime = performance.now();

    await currentConversion.execute();

    const endTime = performance.now();

    const outputFileName = `${title}.mp3`;
    const timeTakenInSeconds = ((endTime - startTime) / 1000).toFixed(2);

    // Return success, the full file path, and the parent folder directory
    return {
      hasErrors: false,
      fileBuffer: output.target.buffer,
      fileName: outputFileName,
      timeTaken: timeTakenInSeconds,
    };
  } catch (error) {
    console.error(error);

    await currentConversion?.cancel();

    return { hasErrors: true, error: error.message };
  }
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelStartup) {
  app.quit();
}

const runParallelBatch = async (workers, items, convertItem) => {
  const queue = [...items];

  const runWorker = async () => {
    while (queue.length > 0) {
      const nextItem = queue.shift();
      if (!nextItem) {
        return;
      }
      await convertItem(nextItem);
    }
  };

  const workerCount = Math.max(1, Math.min(workers, items.length));
  const tasks = Array.from({ length: workerCount }, () => runWorker());
  await Promise.all(tasks);
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  // if (config.nodeEnv === "development") {
  //   mainWindow.webContents.openDevTools();
  // }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("convert", async (event, filePath, tags) => {
    const { teacher, city, subject, lesson } = tags;
    const formattedLesson = String(tags.lesson).padStart(2, "0");
    const { birthtime: createdAt } = fs.statSync(filePath) || {};
    console.log(
      "[Index.js] Received data:",
      filePath,
      teacher,
      city,
      subject,
      formattedLesson,
      createdAt,
    );

    try {
      const fileBlob = await createBlobFromFilePath(filePath);
      const safeCreatedAt = createdAt instanceof Date ? createdAt : new Date();

      const result = await processAudioFile(
        fileBlob,
        {
          teacherAbbr: teacher,
          city,
          subject,
          formattedLesson,
        },
        (progress) => {
          console.log(`[IPC send] Sending convert-progress: ${progress}%`);
          event.sender.send("convert-progress", {
            totalFiles: 1,
            fileIndex: 0,
            fileName: path.basename(filePath),
            fileProgress: progress,
            completedCount: 0,
            failedCount: 0,
          });
        },
        safeCreatedAt,
      );

      if (result.hasErrors) {
        return { hasErrors: true, error: result.error };
      } else {
        // Save the converted file to the user's downloads folder
        const outputFilePath = path.join(downloadsPath, result.fileName);

        await fs.promises.writeFile(
          outputFilePath,
          Buffer.from(result.fileBuffer),
        );
        event.sender.send("convert-progress", {
          totalFiles: 1,
          fileIndex: 0,
          fileName: path.basename(filePath),
          fileProgress: 100,
          completedCount: 1,
          failedCount: 0,
        });
        console.log("Converted file saved successfully:", outputFilePath);

        return {
          hasErrors: false,
          filePath: outputFilePath,
          timeTaken: result.timeTaken,
        };
      }
    } catch (error) {
      console.error("Error during conversion:", error);
      return { hasErrors: true, error: error.message };
    }
  });

  ipcMain.handle("convert-batch", async (event, batchItems, sharedTags) => {
    const startedAt = performance.now();

    try {
      if (!Array.isArray(batchItems) || batchItems.length === 0) {
        return {
          hasErrors: true,
          error: "Please select at least one .wav file.",
        };
      }

      if (batchItems.length > 15) {
        return { hasErrors: true, error: "You can upload up to 15 files." };
      }

      const teacher = String(sharedTags?.teacher || "").trim();
      const city = String(sharedTags?.city || "").trim();
      const subject = String(sharedTags?.subject || "").trim();

      if (!teacher || !city || !subject) {
        return {
          hasErrors: true,
          error:
            "Teacher, city, and subject are required for batch conversion.",
        };
      }

      const lessons = batchItems.map((item) => normalizeLesson(item.lesson));
      if (new Set(lessons).size !== lessons.length) {
        return {
          hasErrors: true,
          error: "Lesson values must be unique across all selected files.",
        };
      }

      const normalizedItems = batchItems.map((item, index) => ({
        filePath: item.filePath,
        fileName: item.fileName || path.basename(item.filePath || ""),
        lesson: lessons[index],
        index,
      }));

      const converted = [];
      const failed = [];
      const processedIndices = new Set();
      const totalFiles = normalizedItems.length;

      const sendProgress = (payload) => {
        event.sender.send("convert-progress", {
          totalFiles,
          completedCount: converted.length,
          failedCount: failed.length,
          ...payload,
        });
      };

      const convertOne = async (item) => {
        try {
          const filePath = item.filePath;
          if (!filePath || !item.fileName) {
            throw new Error("Invalid file payload received.");
          }

          if (!item.fileName.toLowerCase().endsWith(".wav")) {
            throw new Error("Only .wav files are allowed.");
          }

          const { birthtime: createdAt } = fs.statSync(filePath) || {};
          const safeCreatedAt =
            createdAt instanceof Date ? createdAt : new Date();
          const fileBlob = await createBlobFromFilePath(filePath);

          sendProgress({
            fileIndex: item.index,
            fileName: item.fileName,
            fileProgress: 0,
          });

          const result = await processAudioFile(
            fileBlob,
            {
              teacherAbbr: teacher,
              city,
              subject,
              formattedLesson: item.lesson,
            },
            (progress) => {
              sendProgress({
                fileIndex: item.index,
                fileName: item.fileName,
                fileProgress: progress,
              });
            },
            safeCreatedAt,
          );

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

          await fs.promises.writeFile(
            outputFilePath,
            Buffer.from(result.fileBuffer),
          );

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

      const parallelWorkers = MAX_PARALLEL_WORKERS;
      let usedSequentialFallback = false;

      try {
        await runParallelBatch(parallelWorkers, normalizedItems, convertOne);
      } catch (parallelError) {
        console.error(
          "Batch parallel conversion failed, falling back to sequential:",
          parallelError,
        );
        usedSequentialFallback = true;

        // Fallback: process remaining files sequentially.
        for (const item of normalizedItems) {
          if (!processedIndices.has(item.index)) {
            await convertOne(item);
          }
        }
      }

      const finishedAt = performance.now();
      const timeTaken = ((finishedAt - startedAt) / 1000).toFixed(2);

      return {
        hasErrors: false,
        converted,
        failed,
        usedSequentialFallback,
        timeTaken,
      };
    } catch (error) {
      console.error("Error during batch conversion:", error);
      return { hasErrors: true, error: error.message };
    }
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
