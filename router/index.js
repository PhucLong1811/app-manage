const authRouter = require('./auth');
const criminalRouter = require('./criminal');
const reportRouter = require('./report');
const procedureRouter = require('./procedure');
const excelRouter = require('./excel');

module.exports = (ipcMain, mainWindow, navigateTo, historyStack) => {
    authRouter(ipcMain, mainWindow, navigateTo, historyStack);
    criminalRouter(ipcMain, mainWindow, navigateTo);
    reportRouter(ipcMain, mainWindow, navigateTo);
    excelRouter(ipcMain, mainWindow);
    procedureRouter(ipcMain, mainWindow, navigateTo);
    // route dùng chung
    ipcMain.on("back-to-main", () => navigateTo("views/main.html"));
    ipcMain.on("open-main", () => navigateTo("views/main.html"));
    ipcMain.on("open-change-password", () => navigateTo("views/change-password.html"));
    ipcMain.on("go-back", () => {
        if (historyStack.length > 1) {
            historyStack.pop();
            mainWindow.loadFile(historyStack[historyStack.length - 1]);
        }
    });
};
