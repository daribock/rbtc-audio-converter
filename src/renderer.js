import { config } from "./utils/config.js";

document.addEventListener("DOMContentLoaded", () => {
  const { electronAPI } = window;
  const form = document.getElementById("audioForm");
  const fileInput = document.getElementById("wavFile");
  const fileListContainer = document.getElementById("fileListContainer");
  const fileList = document.getElementById("fileList");
  const teacherInput = document.getElementById("teacherAbbr");
  const teacherNameInput = document.getElementById("teacherName");
  const cityInput = document.getElementById("city");
  const cityNameInput = document.getElementById("cityName");
  const subjectInput = document.getElementById("subject");
  const subjectNameInput = document.getElementById("subjectName");
  const parallelWorkersInput = document.getElementById("parallelWorkers");
  const statusMessage = document.getElementById("statusMessage");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = loadingOverlay.querySelector(".loading-text");
  const loadingStatusList = document.getElementById("loadingStatusList");
  const loadingSummary = document.getElementById("loadingSummary");
  const defaultLoadingText = "Converting audio... Please wait.";
  const maxFileCount = config.MAX_FILE_COUNT;
  let loadingLineStates = [];

  const renderLoadingLines = () => {
    if (!loadingStatusList) {
      return;
    }

    loadingStatusList.innerHTML = "";

    loadingLineStates.forEach((lineState) => {
      const row = document.createElement("p");
      row.className = "loading-status-line";

      if (lineState.done) {
        row.textContent = `${lineState.fileName} done`;
      } else {
        row.textContent = `${lineState.fileName} ${lineState.progress}%`;
      }

      loadingStatusList.append(row);
    });
  };

  const resetLoadingLines = () => {
    loadingLineStates = [];
    renderLoadingLines();
    if (loadingSummary) {
      loadingSummary.textContent = "";
    }
  };

  const showStatus = (message, type = "") => {
    statusMessage.textContent = message;
    statusMessage.className = "status";

    if (type) {
      statusMessage.classList.add(type);
    }
  };

  const setLoading = (isLoading) => {
    const controls = form.querySelectorAll("input, button, textarea, select");

    controls.forEach((control) => {
      control.disabled = isLoading;
    });

    if (!isLoading && loadingText) {
      loadingText.textContent = defaultLoadingText;
    }

    if (!isLoading) {
      resetLoadingLines();
    }

    document.body.classList.toggle("is-loading", isLoading);
    loadingOverlay.classList.toggle("hidden", !isLoading);
    loadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  };

  const createDefaultLesson = (index) => String(index + 1);

  const renderFileList = () => {
    const files = Array.from(fileInput.files || []);

    if (files.length === 0) {
      fileList.innerHTML = "";
      fileListContainer.classList.add("hidden");
      return;
    }

    fileListContainer.classList.remove("hidden");
    fileList.innerHTML = "";

    files.forEach((file, index) => {
      const row = document.createElement("div");
      row.className = "file-list-item";

      const fileName = document.createElement("div");
      fileName.className = "file-name";
      fileName.textContent = file.name;
      fileName.title = file.name;

      const lessonField = document.createElement("div");
      lessonField.className = "lesson-field";

      const lessonLabel = document.createElement("label");
      lessonLabel.setAttribute("for", `lesson-${index}`);
      lessonLabel.textContent = "Lesson";

      const lessonInput = document.createElement("input");
      lessonInput.id = `lesson-${index}`;
      lessonInput.type = "number";
      lessonInput.min = "1";
      lessonInput.step = "1";
      lessonInput.required = true;
      lessonInput.className = "lesson-input";
      lessonInput.dataset.fileIndex = String(index);
      lessonInput.value = createDefaultLesson(index);

      lessonField.append(lessonLabel, lessonInput);
      row.append(fileName, lessonField);
      fileList.append(row);
    });
  };

  const getBatchItems = () => {
    const files = Array.from(fileInput.files || []);
    const lessonInputs = Array.from(
      fileList.querySelectorAll(".lesson-input"),
    ).sort((a, b) => Number(a.dataset.fileIndex) - Number(b.dataset.fileIndex));

    const lessons = lessonInputs.map((input) => input.value.trim());

    if (files.length === 0) {
      return { error: "Please choose at least one .wav file." };
    }

    if (files.length > maxFileCount) {
      return { error: `You can upload up to ${maxFileCount} files.` };
    }

    if (files.some((file) => !file.name.toLowerCase().endsWith(".wav"))) {
      return { error: "Only .wav files are allowed." };
    }

    if (lessonInputs.length !== files.length) {
      return { error: "Please provide a lesson value for each selected file." };
    }

    const parsedLessons = lessons.map((lessonValue) =>
      Number.parseInt(lessonValue, 10),
    );

    if (
      parsedLessons.some(
        (lesson) =>
          Number.isNaN(lesson) || lesson <= 0 || !Number.isInteger(lesson),
      )
    ) {
      return { error: "Lesson values must be positive whole numbers." };
    }

    const uniqueLessonCount = new Set(parsedLessons).size;
    if (uniqueLessonCount !== parsedLessons.length) {
      return { error: "Lesson values must be unique across all files." };
    }

    const items = files.map((file, index) => ({
      fileIndex: index,
      file,
      lesson: String(parsedLessons[index]),
    }));

    return { items };
  };

  fileInput.addEventListener("change", () => {
    renderFileList();

    if ((fileInput.files || []).length > maxFileCount) {
      showStatus(`You can upload up to ${maxFileCount} files.`, "error");
      return;
    }

    showStatus("");
  });

  electronAPI.onConvertProgress((payload) => {
    const totalFiles = Number(payload?.totalFiles) || 0;
    const fileIndex = Number(payload?.fileIndex) || 0;
    const completedCount = Number(payload?.completedCount) || 0;
    const failedCount = Number(payload?.failedCount) || 0;
    const fileProgress = Math.round(
      Math.max(0, Math.min(100, Number(payload?.fileProgress) || 0)),
    );
    const lineIndex = loadingLineStates.findIndex(
      (lineState) => lineState.fileIndex === fileIndex,
    );

    if (lineIndex >= 0) {
      loadingLineStates[lineIndex].progress = fileProgress;
      loadingLineStates[lineIndex].done = fileProgress >= 100;
    }

    renderLoadingLines();

    const allFinished =
      totalFiles > 0 && completedCount + failedCount === totalFiles;
    const summaryLine = `Done: ${completedCount}/${totalFiles}${failedCount ? `, Failed: ${failedCount}` : ""}`;

    if (loadingText) {
      loadingText.textContent = `Converting ${totalFiles} file${totalFiles === 1 ? "" : "s"}...`;
    }

    if (loadingSummary) {
      loadingSummary.textContent = allFinished ? summaryLine : "";
    }

    showStatus(allFinished ? summaryLine : "Converting files...");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { items, error: batchError } = getBatchItems();
    const teacherAbbr = teacherInput.value.trim();
    const teacherName = teacherNameInput.value.trim();
    const city = cityInput.value.trim();
    const cityName = cityNameInput.value.trim();
    const subject = subjectInput.value.trim();
    const subjectName = subjectNameInput.value.trim();
    const parallelWorkers = Math.max(
      1,
      Math.min(
        10,
        Number.parseInt(parallelWorkersInput.value, 10) ||
          config.MINIMUM_PARALLEL_WORKERS,
      ),
    );

    if (batchError) {
      showStatus(batchError, "error");
      return;
    }

    if (
      !teacherAbbr ||
      !teacherName ||
      !city ||
      !cityName ||
      !subject ||
      !subjectName
    ) {
      showStatus("Please fill all input fields.", "error");
      return;
    }

    try {
      setLoading(true);
      console.log("[Renderer] Starting conversion");
      loadingLineStates = items.map((item) => ({
        fileIndex: Number(item.fileIndex),
        fileName: item.file.name,
        progress: 0,
        done: false,
      }));
      renderLoadingLines();
      if (loadingText) {
        loadingText.textContent = `Converting ${items.length} file${items.length === 1 ? "" : "s"}...`;
      }
      if (loadingSummary) {
        loadingSummary.textContent = "";
      }
      showStatus("Converting files...");

      const response = await electronAPI.convertBatch(
        items,
        {
          teacher: teacherAbbr,
          teacherName,
          city,
          cityName,
          subject,
          subjectName,
        },
        parallelWorkers,
      );

      console.log(
        "[Renderer.js] Received response from main process:",
        response,
      );

      if (!response || response.hasErrors) {
        showStatus(
          `Error: ${response?.error || "Batch conversion failed."}`,
          "error",
        );
        return;
      }

      const convertedCount = (response.converted || []).length;
      const failedCount = (response.failed || []).length;

      if (failedCount > 0) {
        const failedNames = response.failed
          .map((item) => `${item.fileName}: ${item.error}`)
          .join(" | ");
        showStatus(
          `Converted ${convertedCount}/${items.length} files in ${response.timeTaken} seconds. Failed ${failedCount}: ${failedNames}`,
          "error",
        );
        return;
      }

      showStatus(
        `Conversion successful: ${convertedCount}/${items.length} files in ${response.timeTaken} seconds!`,
        "success",
      );
    } catch (error) {
      showStatus(
        `Error: ${error.message || "Unexpected conversion error."}`,
        "error",
      );
    } finally {
      setLoading(false);
      console.log("[Renderer] Conversion finished");
    }
  });
});
