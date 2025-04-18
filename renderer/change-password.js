const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const bcrypt = require('bcrypt');
require("jquery-validation");
const dataFilePath = path.join(__dirname, '..', 'data', 'user.json');
const user = JSON.parse(sessionStorage.getItem("user"));
$(document).ready(function () {
    $(".btnBack").click(function () {
        ipcRenderer.send('back-to-main');
    });
    $('.wrapInput').on('click', '.iconEye', function () {
        const self = $(this);
        let input = self.closest(".wrapInput").find("input");
        let type = input.attr("type") === "password" ? "text" : "password";
        input.attr("type", type);
    
        self.closest(".wrapInput").find(".eye, .eyeOff").toggleClass("hidden");
    });
    $.validator.addMethod("notSameAsOld", function (value, element) {
        return value !== $("#password_current").val(); // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    }, "Mật khẩu mới không được trùng với mật khẩu cũ.");

    $.validator.addMethod("passwordMatch", function (value, element) {
        return value === $("#password").val(); // Kiểm tra xác nhận mật khẩu phải giống mật khẩu mới
    }, "Xác nhận mật khẩu không khớp.");
    $("#changePassword").validate({
        rules: {
            password_current: {
                required: true,
                minlength: 6
            },
            password: {
                required: true,
                minlength: 6,
                notSameAsOld: true // Mật khẩu mới không được trùng mật khẩu cũ
            },
            password_confirm: {
                required: true,
                passwordMatch: true // Xác nhận mật khẩu phải khớp với mật khẩu mới
            },
        },
        messages: {
            password_current: {
                required: "Mật khẩu cũ không được để trống",
                minlength: "Mật khẩu phải có ít nhất 6 ký tự"
            },
            password: {
                required: "Mật khẩu mới không được để trống",
                minlength: "Mật khẩu phải có ít nhất 6 ký tự",
                notSameAsOld: "Mật khẩu mới không được trùng với mật khẩu cũ"
            },
            password_confirm: {
                required: "Xác nhận mật khẩu không được để trống",
                passwordMatch: "Xác nhận mật khẩu không khớp với mật khẩu mới"
            }
        },
        errorPlacement: function (error, element) {
            element.closest(".wrapInput").find(".error").html(error);
        },
        submitHandler: function (form) {
            const userId = user.id; // ID user đăng nhập
            const oldPassword = $('#password_current').val();
            const newPassword = $('#password').val();

            fs.readFile(dataFilePath, 'utf8', (err, data) => {
                if (err) {
                    alert("Lỗi đọc dữ liệu!");
                    return;
                }

                let users = JSON.parse(data);
                let userIndex = users.findIndex(u => u.id === parseInt(userId));

                if (userIndex === -1) {
                    alert("Không tìm thấy người dùng!");
                    return;
                }

                let storedPassword = users[userIndex].password; // Mật khẩu cũ từ file
                if (!bcrypt.compareSync(oldPassword, storedPassword)) {
                    alert("Mật khẩu cũ không đúng!");
                    return;
                }

                // Cập nhật mật khẩu mới
                users[userIndex].password = bcrypt.hashSync(newPassword, 10); // Hash mật khẩu mới

                fs.writeFile(dataFilePath, JSON.stringify(users, null, 4), (err) => {
                    if (err) {
                        alert("Lỗi cập nhật mật khẩu!");
                        return;
                    }
                    alert("Đổi mật khẩu thành công!");
                });
            });
        }
    });
})