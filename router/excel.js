const { dialog, app } = require("electron");
const path = require("path");
const XLSX = require("xlsx");

module.exports = (ipcMain, mainWindow) => {
    ipcMain.on("export-excel", (event, data) => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

            dialog.showSaveDialog({
                title: "Lưu file Excel",
                defaultPath: path.join(app.getPath("desktop"), "data.xlsx"),
                filters: [{ name: "Excel Files", extensions: ["xlsx"] }]
            }).then(file => {
                if (!file.canceled) {
                    XLSX.writeFile(workbook, file.filePath);
                    event.sender.send("export-success", "Xuất Excel thành công!");
                }
            });
        } catch (err) {
            event.sender.send("export-failed", "Xuất Excel thất bại!");
        }
    });

    ipcMain.on("import-excel", (event) => {
        dialog.showOpenDialog({
            title: "Chọn file Excel",
            filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
            properties: ["openFile"]
        }).then(file => {
            if (!file.canceled) {
                const workbook = XLSX.readFile(file.filePaths[0]);
                const sheetName = workbook.SheetNames[0];
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                event.sender.send("import-success", data);
            }
        });
    });
};
