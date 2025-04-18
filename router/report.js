module.exports = (ipcMain, mainWindow, navigateTo) => {
    ipcMain.on("open-report", (event, item) => {
        navigateTo("views/report.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("user-report", item);
        });
    });

    ipcMain.on("report-list", () => navigateTo("views/report/list.html"));
    ipcMain.on("report-create", () => navigateTo("views/report/create.html"));
    ipcMain.on("report-edit", (event, item) => {
        navigateTo("views/report/edit.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("edit-report-data", item);
        });
    });

    ipcMain.on("report-detail", (event, item) => {
        navigateTo("views/report/detail.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("view-report-data", item);
        });
    });
};
