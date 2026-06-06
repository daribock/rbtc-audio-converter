import React, { useState } from "react";
import { cleanZoomAudioFile } from "../utils/audioUtils";
import "../utils/electronAPI.types";

export default function Form() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [convertedFileBuffer, setConvertedFileBuffer] =
    useState<ArrayBuffer | null>(null); // Stores the converted file buffer
  const [convertedFileName, setConvertedFileName] = useState<string | null>(
    null,
  ); // Stores the converted file name

  console.log(file);

  const handleConversion = async () => {
    if (!file) {
      setStatusMsg("Please select a valid WAV file first.");
      return;
    }

    setStatusMsg("Processing... Converting WAV to MP3 and writing ID3 tags.");
    setConvertedFileBuffer(null); // Reset previous buffer

    let tempFilePath: string | null = null;

    try {
      console.log("Prüfe und bereinige Datei...");
      // 1. Clean the file (strips garbage bytes from Zoom recorders)
      const cleanAudioFile = await cleanZoomAudioFile(file);

      if (!(cleanAudioFile instanceof File)) {
        setStatusMsg("Not instance of File. Please select a valid file.");
        return;
      }

      // 2. Save the cleaned file to a temp folder so main can read it from disk
      tempFilePath = await window.electronAPI.saveTempFile(cleanAudioFile);

      // 3. Convert
      const response = await window.electronAPI.processAudio(tempFilePath, {
        title,
        artist,
      });

      if (response.hasErrors) {
        setStatusMsg(`Error: ${response.error}`);
      } else {
        setStatusMsg("Conversion finished successfully!");
        setConvertedFileBuffer(response.fileBuffer || null);
        setConvertedFileName(response.fileName || null);
      }
    } catch (error: any) {
      console.error("Conversion failed:", error);
      setStatusMsg(`Conversion failed: ${error.message}`);
    } finally {
      // 4. Always clean up the temp file
      if (tempFilePath) {
        await window.electronAPI.deleteTempFile(tempFilePath);
      }
    }
  };

  const handleOpenFolder = async () => {
    if (convertedFileBuffer && convertedFileName) {
      const result = await window.electronAPI.saveAndOpen(
        convertedFileBuffer,
        convertedFileName,
      );

      if (result.hasErrors) {
        alert(`Could not open folder: ${result.error}`);
      }
    } else {
      alert("No converted file available to save.");
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "#e3e5e8",
        backgroundColor: "#2f3136",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#fff", marginBottom: "5px" }}>
        🎵 Audio Converter Studio
      </h1>
      <p style={{ color: "#b9bbbe", marginTop: "0", marginBottom: "25px" }}>
        Convert WAV files to 320kbps MP3 and inject custom ID3 metadata.
      </p>

      {/* File Upload Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          Choose Input Audio File:
        </label>
        <input
          type="file"
          accept=".wav"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ color: "#fff" }}
        />
      </div>

      {/* Metadata Form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "350px",
          marginBottom: "20px",
        }}
      >
        <div>
          <label
            style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}
          >
            Song Title
          </label>
          <input
            type="text"
            placeholder="e.g., Moonlight Sonata"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #202225",
              backgroundColor: "#40444b",
              color: "#fff",
            }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}
          >
            Artist Name
          </label>
          <input
            type="text"
            placeholder="e.g., Beethoven"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #202225",
              backgroundColor: "#40444b",
              color: "#fff",
            }}
          />
        </div>

        <button
          onClick={handleConversion}
          style={{
            marginTop: "10px",
            padding: "12px",
            backgroundColor: "#5865f2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          Convert & Apply Tags
        </button>
      </div>

      {/* Log Status Messages */}
      {statusMsg && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#202225",
            borderRadius: "4px",
            maxWidth: "500px",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              color: "#3ba55d",
              fontWeight: "bold",
            }}
          >
            {statusMsg}
          </p>

          {/* Conditional "Open Folder" Link Trigger */}
          {convertedFileBuffer && convertedFileName && (
            <button
              onClick={handleOpenFolder}
              style={{
                background: "none",
                border: "none",
                color: "#00aff4",
                textDecoration: "underline",
                padding: "0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              📂 Click here to open the folder containing your converted file
            </button>
          )}
        </div>
      )}
    </div>
  );
}
