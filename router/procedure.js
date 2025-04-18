const path = require('path');
module.exports = (ipcMain, mainWindow, navigateTo) => {
    // ipcMain.on("open-procedure", (event, item) => {
    //     navigateTo("views/procedure.html");
    //     mainWindow.webContents.once("did-finish-load", () => {
    //         mainWindow.webContents.send("user-procedure", item);
    //     });
    // });

    ipcMain.on("procedure-list", () => navigateTo("views/procedure/list.html"));

    ipcMain.on("procedure-detail", (event, item) => {
        navigateTo("views/procedure/detail.html");
        mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("view-procedure-data", item);
        });
    });
    ipcMain.on("navigate-to-procedure", (event, fileName) => {
        const filePath = `views/procedure/${fileName}.html`;
        navigateTo(filePath)
    });
};
