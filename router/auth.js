const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

module.exports = (ipcMain, mainWindow, navigateTo, historyStack) => {
    ipcMain.on("login-attempt", (event, { username, password }) => {
        try {
            const filePath = path.join(__dirname, "../data/user.json");
            const rawData = fs.readFileSync(filePath, "utf-8");
            const users = JSON.parse(rawData);

            const user = users.find(user => user.username === username);
            if (!user) {
                event.reply("login-response", { success: false, message: "Tài khoản không tồn tại!" });
                return;
            }

            if (!bcrypt.compareSync(password, user.password)) {
                event.reply("login-response", { success: false, message: "Sai mật khẩu!" });
                return;
            }

            event.reply("login-response", { success: true, user: user });
        } catch (error) {
            event.reply("login-response", { success: false, message: "Lỗi hệ thống!" });
        }
    });

    ipcMain.on("logout", () => {
        historyStack.length = 0;
        mainWindow.loadFile("views/login.html");
    });
};
