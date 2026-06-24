document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("audioForm");
  const fileInput = document.getElementById("wavFile");
  const teacherInput = document.getElementById("teacherAbbr");
  const cityInput = document.getElementById("city");
  const subjectInput = document.getElementById("subject");
  const statusMessage = document.getElementById("statusMessage");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = loadingOverlay.querySelector(".loading-text");
  const defaultLoadingText = "Converting audio... Please wait.";

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

    document.body.classList.toggle("is-loading", isLoading);
    loadingOverlay.classList.toggle("hidden", !isLoading);
    loadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  };

  electronAPI.onConvertProgress((progress) => {
    const roundedProgress = Math.round(
      Math.max(0, Math.min(100, Number(progress) || 0)),
    );

    if (loadingText) {
      loadingText.textContent = `Converting audio... ${roundedProgress}%`;
    }

    showStatus(`Converting... ${roundedProgress}%`);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedFile = fileInput.files && fileInput.files[0];
    const teacherAbbr = teacherInput.value.trim();
    const city = cityInput.value.trim();
    const subject = subjectInput.value.trim();

    if (!selectedFile) {
      showStatus("Please choose a .wav file.", "error");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".wav")) {
      showStatus("Only .wav files are allowed.", "error");
      fileInput.value = "";
      return;
    }

    if (!teacherAbbr || !city || !subject) {
      showStatus("Please fill all input fields.", "error");
      return;
    }

    try {
      setLoading(true);
      console.log("[Renderer] Starting conversion");
      if (loadingText) {
        loadingText.textContent = "Converting audio... 0%";
      }
      showStatus("Converting... 0%");

      const response = await electronAPI.convert(selectedFile, {
        teacher: teacherAbbr,
        city,
        subject,
      });

      console.log(
        "[Renderer.js] Received response from main process:",
        response,
      );

      if (!response || response.hasErrors) {
        showStatus(
          `Error: ${response?.error || "Conversion failed."}`,
          "error",
        );
        return;
      }

      showStatus(
        `Conversion successful in ${response.timeTaken} seconds! Your file has been downloaded: ${response.filePath}`,
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
