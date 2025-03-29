const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
require("jquery-validation");
const moment = require('moment');
const Swal = require('sweetalert2');
const user = JSON.parse(sessionStorage.getItem("user"));

const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');

$(document).ready(function () {
    $.validator.addMethod("validAge", function (value, element) {
        var birthDate = new Date(value); // Chuyển đổi input thành ngày tháng
        var today = new Date();
        var age = today.getFullYear() - birthDate.getFullYear(); // Tính số năm

        // Kiểm tra nếu chưa đủ 16 tuổi
        if (today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            age--; // Nếu chưa tới ngày sinh nhật trong năm hiện tại thì giảm 1 tuổi
        }

        return this.optional(element) || age >= 16;
    }, "Người dùng phải ít nhất 16 tuổi");
    $.validator.addMethod("validDate", function (value, element) {
        var inputDate = new Date(value); // Chuyển đổi input thành ngày tháng
        var today = new Date();

        // Kiểm tra nếu inputDate lớn hơn ngày hôm nay thì không hợp lệ
        return this.optional(element) || inputDate <= today;
    }, "Ngày không được vượt quá ngày hiện tại");

    $("#createForm").validate({
        rules: {
            full_name: {
                required: true,
                minlength: 3
            },
            gender: {
                required: true
            },
            birthdate: {
                required: true,
                validAge: true
            },
            hometown: {
                required: true
            },
            permanent_address: {
                required: true
            },
            zone: {
                required: true
            },
            cell: {
                required: true
            },
            visit: {
                required: true
            },
            no_visit: {
                required: true
            },
            send: {
                required: true
            },
            arrest_warrant: {
                required: true
            },
            arrest_date: {
                required: true,
                validDate: true
            },
            prison_entry: {
                required: true,
                validDate: true
            },
        },
        messages: {
            full_name: {
                required: "Họ và Tên không được để trống",
                minlength: "Tên phải có ít nhất 3 ký tự"
            },
            gender: "Vui lòng chọn giới tính",
            birthdate: {
                required: "Vui lòng chọn ngày sinh",
                validAge: "Người dùng phải ít nhất 16 tuổi" // Hiển thị thông báo lỗi khi không đủ tuổi
            },
            hometown: "Quê quán không được để trống",
            permanent_address: "Hộ khẩu thường trú không được để trống",
            zone: "Khu không được để trống",
            cell: "Buồng không được để trống",
            visit: "Vui lòng chọn ngày gặp",
            send: "Vui lòng chọn ngày gửi",
            arrest_warrant: {
                required: "Vui lòng chọn ngày lệnh bắt",
            },
            arrest_date: {
                required: "Vui lòng chọn ngày bắt",
                validDate: "Ngày bắt không được vượt quá ngày hiện tại"
            },
            prison_entry: {
                required: "Vui lòng chọn ngày nhập trại",
                validDate: "Ngày nhập trại không được vượt quá ngày hiện tại"
            }
        },
        submitHandler: function (form) {
            const newItem = {
                id: Date.now(),
                full_name: $('#full_name').val(),
                gender: $('#gender').val(),
                birthdate: $('#birthdate').val(),
                hometown: $('#hometown').val(),
                permanent_address: $('#permanent_address').val(),
                zone: $('#zone').val(),
                cell: $('#cell').val(),
                visit: $('#visit').val(),
                no_visit: $('#no_visit').val(),
                send: $('#send').val(),
                arrest_warrant: $('#arrest_warrant').val(),
                arrest_date: $('#arrest_date').val(),
                prison_entry: $('#prison_entry').val(),
                comment: $('#comment').val(),
                note: $('#note').val(),
                created_by_user: user ? user.id : "",
                created_at: Date.now(),
                updated_by_user: "",
                updated_at: ""
            };
            fs.readFile(dataFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Lỗi khi đọc file JSON:', err);
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);
                    jsonData.push(newItem);

                    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                        if (err) {
                            console.error('Lỗi khi ghi file JSON:', err);
                            return;
                        }
                        Swal.fire({
                            icon: 'success',
                            title: 'Thêm mới thành công!',
                            timer: 2000,  // Tự đóng sau 2 giây
                            showConfirmButton: false
                        }).then(() => {
                            ipcRenderer.send('open-list');
                        });
                    });
                } catch (parseError) {
                    console.error('Lỗi khi parse JSON:', parseError);
                }
            });
        }
    });

    $(".btnBack").click(function () {
        ipcRenderer.send('open-list');
    });
});
