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

const processAudioFile = async (
  blobFile,
  tags,
  fileName,
  onProgress,
  createdAt,
) => {
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
    const fileName = path.basename(filePath);

    try {
      const fileBlob = await createBlobFromFilePath(filePath);

      const result = await processAudioFile(
        fileBlob,
        {
          teacherAbbr: teacher,
          city,
          subject,
          formattedLesson,
        },
        fileName,
        (progress) => {
          console.log(`[IPC send] Sending convert-progress: ${progress}%`);
          event.sender.send("convert-progress", progress);
        },
        createdAt,
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
        event.sender.send("convert-progress", 100);
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
