const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const setupRoutes = require('./router');
const dataPath = path.join(app.getPath('userData'), 'data');
let mainWindow;
let historyStack = [];

function copyDataFilesIfNeeded() {
    const sourceDir = path.join(__dirname, 'data');
    const destDir = path.join(app.getPath('userData'), 'data');
  
    // Tạo thư mục đích nếu chưa tồn tại
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
  
    // Danh sách các file cần sao chép
    const filesToCopy = ['data.json', 'procedure.json', 'report.json', 'user.json'];
  
    filesToCopy.forEach(fileName => {
      const sourcePath = path.join(sourceDir, fileName);
      const destPath = path.join(destDir, fileName);
  
      // Nếu file chưa tồn tại ở userData thì sao chép
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Đã sao chép ${fileName} vào userData`);
      } else {
        console.log(`ℹ️ File ${fileName} đã tồn tại trong userData, không sao chép`);
      }
    });
}
app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        icon: "",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    copyDataFilesIfNeeded();
    const userDataPath = app.getPath('userData');
    app.commandLine.appendSwitch('lang', 'vi');
    mainWindow.loadFile("views/login.html");
    mainWindow.maximize();
    mainWindow.on('close', (e) => {
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['Không', 'Có'], // Đảo thứ tự nút
            defaultId: 0,              // Mặc định chọn 'Không'
            cancelId: 0,               // Cancel khi bấm ESC hoặc đóng dialog
            title: 'Xác nhận',
            message: 'Bạn có chắc chắn muốn thoát ứng dụng?',
            icon: path.join(__dirname, 'assets/images/common/logo-data.png'),
            noLink: true               // Ẩn biểu tượng link và logo
        });

        if (choice === 0) {
            // Người dùng chọn 'Không' => huỷ đóng
            e.preventDefault();
        }
    });
    const navigateTo = (filePath) => {
        historyStack.push(filePath);
        mainWindow.loadFile(filePath);
    };

    setupRoutes(ipcMain, mainWindow, navigateTo, historyStack);
    function getDataFilePath(fileName) {
        return path.join(dataPath, fileName);
      }
      
    // Gửi đường dẫn tới renderer khi yêu cầu
    ipcMain.handle('get-data-file-path', (event, fileName) => {
    return getDataFilePath(fileName);
    });
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
});