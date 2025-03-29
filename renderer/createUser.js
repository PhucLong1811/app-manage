const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "data/user.json");

// Hàm thêm người dùng mới với mật khẩu mã hóa
function addUser(username, password, role = "user") {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(rawData) || [];

    // Mã hóa mật khẩu
    const hashedPassword = bcrypt.hashSync(password, 10);

    users.push({ username, password: hashedPassword, role });

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log("✅ Người dùng mới đã được thêm!");
}

// Ví dụ: thêm người dùng mới
addUser("admin", "123456", "admin");
