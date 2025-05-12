const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const setupRoutes = require('./router');
const dataPath = path.join(app.getPath('userData'), 'data');
let mainWindow;
let historyStack = [];

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
    const userDataPath = app.getPath('userData');
    console.log('📁 userData path:', userDataPath);
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