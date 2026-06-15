const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('myButton');

    button.addEventListener('click', () => {
        const inputValue = document.getElementById('myInput').value;

        ipcRenderer.send('saveText', inputValue);
    });
});