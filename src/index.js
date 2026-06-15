const { app, BrowserWindow, ipcMain, webUtils } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { registerMp3Encoder } = require("@mediabunny/mp3-encoder");
const {
  Input,
  Output,
  BufferTarget,
  Conversion,
  BlobSource,
  Mp3OutputFormat,
  ALL_FORMATS,
  canEncodeAudio,
} = require("mediabunny");

const downloadsPath = app.getPath("downloads");
const tempDir = app.getPath("temp");

async function processAudioFile(filePath, tags) {
  if (!(await canEncodeAudio("mp3"))) {
    // Only register the custom encoder if there's no native support
    registerMp3Encoder();
  }

  try {
    const bytes = await fs.promises.readFile(filePath);
    const source = new BlobSource(new Blob([bytes]));

    const input = new Input({
      source,
      formats: ALL_FORMATS,
    });
    const output = new Output({
      target: new BufferTarget(),
      format: new Mp3OutputFormat(),
    });

    currentConversion = await Conversion.init({
      input,
      output,
      tags: {
        title: tags.teacherAbbr + tags.city + tags.subject,
        artist: tags.teacherAbbr,
      },
    });

    if (!currentConversion.isValid) {
      // Conversion is invalid and cannot be executed without error.
      // This field gives reasons for why tracks were discarded:
      currentConversion.discardedTracks; // => DiscardedTrack[]

      console.info(currentConversion.discardedTracks);
      throw new Error(
        "Conversion is invalid and cannot be executed; see the console for more.",
      );
    }

    currentConversion.onProgress = (progress) => {
      console.log(`Conversion progress: ${progress}%`);
    };

    await currentConversion.execute();

    const originalName = path.basename(filePath) || "output";
    const outputFileName = `${path.parse(originalName).name}.mp3`;

    // Return success, the full file path, and the parent folder directory
    return {
      hasErrors: false,
      fileBuffer: output.target.buffer,
      fileName: outputFileName,
    };
  } catch (error) {
    console.log(error);

    await currentConversion?.cancel();

    return { hasErrors: true, error: error.message };
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("convert", async (event, filePath, tags) => {
    const { teacher, city, subject } = tags;
    console.log("[Index.js] Received data:", filePath, teacher, city, subject);

    const result = await processAudioFile(filePath, {
      teacherAbbr: teacher,
      city,
      subject,
    });

    if (result.hasErrors) {
      return { hasErrors: true, error: result.error };
    } else {
      // Save the converted file to the user's downloads folder
      const outputFilePath = path.join(downloadsPath, result.fileName);

      fs.writeFile(outputFilePath, result.fileBuffer, (err) => {
        if (err) {
          console.error("Error saving converted file:", err);
          return {
            hasErrors: true,
            error: "Failed to save converted file.",
          };
        } else {
          console.log("Converted file saved successfully:", outputFilePath);
          return { hasErrors: false, filePath: outputFilePath };
        }
      });
    }
    // return { hasErrors: false, filePath: "Mocked file path for testing" };
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
