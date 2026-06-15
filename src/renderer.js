document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("audioForm");
  const fileInput = document.getElementById("wavFile");
  const teacherInput = document.getElementById("teacherAbbr");
  const cityInput = document.getElementById("city");
  const subjectInput = document.getElementById("subject");
  const statusMessage = document.getElementById("statusMessage");

  const showStatus = (message, type = "") => {
    statusMessage.textContent = message;
    statusMessage.className = "status";

    if (type) {
      statusMessage.classList.add(type);
    }
  };

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

    const response = await electronAPI.convert(selectedFile, {
      teacher: teacherAbbr,
      city,
      subject,
    });

    console.log("[Renderer.js] Received response from main process:", response);

    if (response.hasErrors) {
      showStatus(`Error: ${response.error}`, "error");
    } else {
      showStatus(
        "Conversion successful! Your file has been downloaded." +
          response.filePath,
        "success",
      );
    }
  });
});
