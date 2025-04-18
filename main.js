const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const setupRoutes = require('./router');

let mainWindow;
let historyStack = [];

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile("views/login.html");
    mainWindow.maximize();

    const navigateTo = (filePath) => {
        historyStack.push(filePath);
        mainWindow.loadFile(filePath);
    };

    setupRoutes(ipcMain, mainWindow, navigateTo, historyStack);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
});
