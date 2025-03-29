const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
require("jquery-validation");
const moment = require('moment');
const Swal = require('sweetalert2');

const user = JSON.parse(sessionStorage.getItem("user"));
const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');

let currentId = null; // ID của item đang chỉnh sửa

/**
 * Điền dữ liệu vào form chỉnh sửa
 * @param {Object} item - Dữ liệu item được chọn để chỉnh sửa
 */
function populateEditForm(item) {
    currentId = item.id;
    sessionStorage.setItem('currentId', currentId);
    $('#full_name').val(item.full_name);
    $('#gender').val(item.gender).trigger('change'); // Đảm bảo select cập nhật giao diện
    $('#birthdate').val(item.birthdate);
    $('#hometown').val(item.hometown);
    $('#permanent_address').val(item.permanent_address);
    $('#zone').val(item.zone);
    $('#cell').val(item.cell);
    $('#visit').val(item.visit);
    $('#no_visit').val(item.no_visit);
    $('#send').val(item.send);
    $('#arrest_warrant').val(item.arrest_warrant);
    $('#arrest_date').val(item.arrest_date);
    $('#prison_entry').val(item.prison_entry);
    $('#comment').text(item.comment);
    $('#note').text(item.note);
}

/**
 * Chuyển đổi ngày từ 'DD/MM/YYYY' sang 'YYYY-MM-DD' (phù hợp với input[type=date])
 * @param {string} dateStr - Ngày dưới dạng chuỗi 'DD/MM/YYYY'
 * @returns {string} - Ngày theo định dạng 'YYYY-MM-DD'
 */
function formatDate(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}

/**
 * Chuyển đổi ngày từ 'YYYY-MM-DD' về 'DD/MM/YYYY' để lưu vào JSON
 * @param {string} dateStr - Ngày dưới dạng chuỗi 'YYYY-MM-DD'
 * @returns {string} - Ngày theo định dạng 'DD/MM/YYYY'
 */
function formatDateForSave(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

/**
 * Cập nhật dữ liệu item vào JSON
 */
function updateItemData() {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi khi đọc file JSON:', err);
            return;
        }

        try {
            let jsonData = JSON.parse(data);

            // Tìm index của item cần cập nhật
            const dataUser = jsonData.find(item => item.id === parseInt(currentId));
            const itemIndex = jsonData.findIndex(item => item.id === parseInt(currentId));
            if (itemIndex === -1) {
                console.error('Không tìm thấy item với ID:', currentId);
                return;
            }
            // Cập nhật dữ liệu
            jsonData[itemIndex] = {
                id: parseInt(currentId),
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
                created_by_user: dataUser?.user_id ?? "",
                created_at: dataUser?.created_at ?? "",
                updated_by_user: user ? user.id : "",
                updated_at: Date.now()
            };

            // Ghi đè vào file JSON
            fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Lỗi khi ghi file JSON:', err);
                    return;
                }
                sessionStorage.removeItem('currentId');
                Swal.fire({
                    icon: 'success',
                    title: 'Cập nhật thành công!',
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

// Lắng nghe sự kiện chỉnh sửa item
ipcRenderer.on('edit-item', (event, item) => {
    populateEditForm(item);
});

// Khởi tạo validate form và xử lý submit
$(document).ready(function () {
    const storedId = sessionStorage.getItem('currentId');
    if (storedId) {
        currentId = storedId;
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Lỗi khi đọc file JSON:', err);
                return;
            }
            try {
                const jsonData = JSON.parse(data);
                const item = jsonData.find(i => i.id == currentId);
                if (item) {
                    $('#full_name').val(item.full_name);
                    $('#gender').val(item.gender);
                    $('#birthdate').val(moment(item.birthdate, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                    $('#hometown').val(item.hometown);
                    $('#permanent_address').val(item.permanent_address);
                    $('#zone').val(item.zone);
                    $('#cell').val(item.cell);
                    $('#no_visit').val(item.no_visit);
                    $('#visit').val(moment(item.visit, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                    $('#send').val(moment(item.send, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                    $('#arrest_warrant').val(item.arrest_warrant);
                    $('#arrest_date').val(moment(item.arrest_date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                    $('#prison_entry').val(moment(item.prison_entry, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                    $('#comment').text(item.comment);
                    $('#note').text(item.note);
                }
            } catch (parseError) {
                console.error('Lỗi khi parse JSON:', parseError);
            }
        });
    }
    $("#editForm").validate({
        rules: {
            full_name: { required: true, minlength: 3 },
            gender: { required: true },
            birthdate: { required: true },
            hometown: { required: true },
            permanent_address: { required: true },
            zone: { required: true },
            cell: { required: true },
            visit: { required: true },
            no_visit: { required: true },
            send: { required: true },
            arrest_warrant: { required: true },
            arrest_date: { required: true },
            prison_entry: { required: true }
        },
        messages: {
            full_name: { required: "Họ và Tên không được để trống", minlength: "Tên phải có ít nhất 3 ký tự" },
            gender: "Vui lòng chọn giới tính",
            birthdate: "Vui lòng chọn ngày sinh",
            hometown: "Quê quán không được để trống",
            permanent_address: "Hộ khẩu thường trú không được để trống",
            zone: "Khu không được để trống",
            cell: "Buồng không được để trống",
            visit: "Vui lòng chọn ngày gặp",
            no_visit: "Vui lòng chọn cấm thăm",
            send: "Vui lòng chọn ngày gửi",
            arrest_warrant: "Lệnh không được để trống",
            arrest_date: "Vui lòng chọn ngày bắt",
            prison_entry: "Vui lòng chọn ngày nhập"
        },
        submitHandler: function () {
            updateItemData();
        }
    });
});

// Quay lại danh sách
$('.btnBack').on('click', () => {
    sessionStorage.removeItem('currentId');
    ipcRenderer.send('go-back')
});
