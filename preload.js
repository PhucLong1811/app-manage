const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    readFile: (filePath, callback) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            callback(err, data);
        });
    },
    writeFile: (filePath, data, callback) => {
        fs.writeFile(filePath, data, 'utf8', callback);
    }
});
