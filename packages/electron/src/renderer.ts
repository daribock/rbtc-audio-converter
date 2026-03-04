/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * Simple vanilla JavaScript implementation for the audio converter UI.
 */

import "./index.css";

// File management
let selectedFiles: Array<{ path: string; name: string; size: number }> = [];

// DOM elements
const selectFilesBtn = document.getElementById("selectFilesBtn") as HTMLButtonElement;
const fileList = document.getElementById("fileList") as HTMLDivElement;
const subjectInput = document.getElementById("subjectInput") as HTMLInputElement;
const cityInput = document.getElementById("cityInput") as HTMLInputElement;
const teacherInput = document.getElementById("teacherInput") as HTMLInputElement;
const convertBtn = document.getElementById("convertBtn") as HTMLButtonElement;

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Render file list
function renderFileList(): void {
  if (selectedFiles.length === 0) {
    fileList.innerHTML = '<p style="color: #718096; margin-top: 10px;">No files selected</p>';
    return;
  }

  fileList.innerHTML = selectedFiles
    .map(
      (file, index) => `
      <div class="file-item">
        <div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="remove-btn" data-index="${index}">Remove</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeButtons = fileList.querySelectorAll(".remove-btn");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt((e.target as HTMLButtonElement).getAttribute("data-index") || "0");
      selectedFiles.splice(index, 1);
      renderFileList();
      updateConvertButton();
    });
  });
}

// Update convert button state
function updateConvertButton(): void {
  const hasFiles = selectedFiles.length > 0;
  const hasSubject = subjectInput.value.trim() !== "";
  const hasCity = cityInput.value.trim() !== "";
  const hasTeacher = teacherInput.value.trim() !== "";

  convertBtn.disabled = !(hasFiles && hasSubject && hasCity && hasTeacher);
}

// Select files handler
selectFilesBtn.addEventListener("click", async () => {
  try {
    const files = await window.electronAPI.selectAudioFiles();
    if (files.length > 0) {
      selectedFiles = [...selectedFiles, ...files];
      renderFileList();
      updateConvertButton();
    }
  } catch (error) {
    console.error("Error selecting files:", error);
    alert("Error selecting files. Please try again.");
  }
});

// Input change handlers
subjectInput.addEventListener("input", updateConvertButton);
cityInput.addEventListener("input", updateConvertButton);
teacherInput.addEventListener("input", updateConvertButton);

// Convert button handler (placeholder)
convertBtn.addEventListener("click", () => {
  alert("Conversion functionality will be implemented in the future!");
});

// Initial render
renderFileList();
updateConvertButton();
