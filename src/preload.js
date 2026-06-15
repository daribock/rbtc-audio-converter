const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audioForm');
    const fileInput = document.getElementById('wavFile');
    const teacherInput = document.getElementById('teacherAbbr');
    const cityInput = document.getElementById('city');
    const subjectInput = document.getElementById('subject');
    const statusMessage = document.getElementById('statusMessage');

    const showStatus = (message, type = '') => {
        statusMessage.textContent = message;
        statusMessage.className = 'status';

        if (type) {
            statusMessage.classList.add(type);
        }
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const selectedFile = fileInput.files && fileInput.files[0];
        const teacherAbbr = teacherInput.value.trim();
        const city = cityInput.value.trim();
        const subject = subjectInput.value.trim();

        if (!selectedFile) {
            showStatus('Please choose a .wav file.', 'error');
            return;
        }

        if (!selectedFile.name.toLowerCase().endsWith('.wav')) {
            showStatus('Only .wav files are allowed.', 'error');
            fileInput.value = '';
            return;
        }

        if (!teacherAbbr || !city || !subject) {
            showStatus('Please fill all input fields.', 'error');
            return;
        }

        const payload = [
            `file=${selectedFile.path}`,
            `teacherAbbreviation=${teacherAbbr}`,
            `city=${city}`,
            `subject=${subject}`,
        ].join('\n');

        ipcRenderer.send('saveText', payload);
        showStatus('Data saved successfully.', 'success');
    });
});
