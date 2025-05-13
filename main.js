const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const setupRoutes = require('./router');
const dataPath = path.join(app.getPath('userData'), 'data');
let mainWindow;
let historyStack = [];

function copyDataFilesIfNeeded() {
  const isDev = 'build';
  const sourceDir = isDev == "dev" ? path.join(__dirname, 'data') : path.join(process.resourcesPath, 'data');
  // console.log(sourceDir,'sourceDir')
  const destDir = path.join(app.getPath('userData'), 'data');
  fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), '✅ Đã chạy copyDataFilesIfNeeded\n');
  fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `SourceDir: ${sourceDir}\n`);
  fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `DestDir: ${destDir}\n`);
  // Tạo thư mục đích nếu chưa tồn tại
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Danh sách các file cần sao chép
  const filesToCopy = ['data.json', 'procedure.json', 'report.json', 'user.json'];

  filesToCopy.forEach(fileName => {
    const sourcePath = path.join(sourceDir, fileName);
    const destPath = path.join(destDir, fileName);

    try {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        fs.chmodSync(destPath, 0o666);
        fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `✅ Sao chép ${fileName}\n`);
      } else {
        fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `ℹ️ Đã tồn tại: ${fileName}\n`);
      }
    } catch (err) {
      fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `❌ Lỗi sao chép ${fileName}: ${err}\n`);
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