module.exports = (ipcMain, mainWindow, navigateTo) => {
    ipcMain.on("open-list", () => navigateTo("views/criminals/list.html"));
    ipcMain.on("open-create", () => navigateTo("views/criminals/create.html"));
    ipcMain.on("open-filter-export-excel", () => navigateTo("views/criminals/filter-export-excel.html"));

    ipcMain.on("open-edit", (event, item) => {
        navigateTo("views/criminals/edit.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("edit-item", item);
        });
    });

    ipcMain.on("open-detail", (event, item) => {
        navigateTo("views/criminals/detail.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("load-detail", item);
        });
    });
};
