const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
require("jquery-validation");
const moment = require('moment');
const Swal = require('sweetalert2');
const flatpickr = require('flatpickr');
const { Vietnamese } = require('flatpickr/dist/l10n/vn.js');
const monthSelectPlugin = require("flatpickr/dist/plugins/monthSelect/index.js");

const user = JSON.parse(sessionStorage.getItem("user"));
const dataFilePath = path.join(__dirname, '../..', 'data', 'data.json');

let currentId = null; // ID của item đang chỉnh sửa
let noVisitDate = null;
/**
 * Điền dữ liệu vào form chỉnh sửa
 * @param {Object} item - Dữ liệu item được chọn để chỉnh sửa
 */
function populateEditForm(item) {
    const no_visit_date = $('#no_visit_date').closest('.form-group');
    currentId = item.id;
    noVisitDate = item.no_visit_date;
    sessionStorage.setItem('currentId', currentId);
    sessionStorage.setItem('currentNoVisitDate', noVisitDate);
    $('#last_name').val(item.last_name);
    $('#first_name').val(item.first_name);
    $('#gender').val(item.gender);
    $('#birthdate').val(formatDateDMY(item.birthdate));
    $('#ethnicity').val(item.ethnicity);
    $('#nation').val(item.nation);
    $('#hometown').val(item.hometown);
    $('#permanent_address').val(item.permanent_address);
    $('#zone').val(item.zone);
    $('#cell').val(item.cell);
    $('#offense').text(item.offense);
    $('#arrest_date').val(formatDateDMY(item.arrest_date));
    $('#prison_entry').val(formatDateDMY(item.prison_entry));
    $('#arrest_warrant').val(item.arrest_warrant);
    $('#handling_agency').val(item.handling_agency);
    $('#comment').val(formatMonthMY(item.comment));
    $('#no_visit').val(item.no_visit);
    $('#disease').text(item.disease);
    $('#note').text(item.note);
    $('#visit').val(formatDateDMY(item.visit));
    $('#send').val(formatDateDMY(item.send));
    if(item.no_visit === 'Không'){
        !no_visit_date.hasClass('hide') && no_visit_date.addClass('hide')
        $('#no_visit_date').val('');
    } else {
        no_visit_date.removeClass('hide');
        $('#no_visit_date').val(item.no_visit_date)
    }
}

/**
 * Chuyển đổi ngày từ 'DD/MM/YYYY' sang 'YYYY-MM-DD' (phù hợp với input[type=date])
 * @param {string} dateStr - Ngày dưới dạng chuỗi 'DD/MM/YYYY'
 * @returns {string} - Ngày theo định dạng 'YYYY-MM-DD'
 */
function formatDateYMD(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}
function formatMonthYM(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'MM/YYYY').format('YYYY-MM');
}
/**
 * Chuyển đổi ngày từ 'YYYY-MM-DD' về 'DD/MM/YYYY' để lưu vào JSON
 * @param {string} dateStr - Ngày dưới dạng chuỗi 'YYYY-MM-DD'
 * @returns {string} - Ngày theo định dạng 'DD/MM/YYYY'
 */
function formatDateDMY(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatMonthMY(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'YYYY-MM').format('MM/YYYY');
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
            const formDataArray = $('#editForm').serializeArray();
            const formattedData = formDataArray.map(({ name, value }) => {
                switch (name) {
                    case 'birthdate':
                    case 'arrest_date':
                    case 'prison_entry':
                    case 'visit':
                    case 'send':
                        return {
                            name,
                            value: formatDateYMD(value)
                        };
                    case 'comment':
                        return {
                            name,
                            value: formatMonthYM(value)
                        };
                    default:
                        return { name, value };
                }
            });
            jsonData[itemIndex] = {
                id: parseInt(currentId),
                created_by_user: dataUser?.user_id ?? "",
                created_at: dataUser?.created_at ?? "",
                updated_by_user: user ? user.id : "",
                updated_at: Date.now(),
                ...Object.fromEntries(formattedData.map(({ name, value }) => [name, value]))
            };
            // Ghi đè vào file JSON
            fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Lỗi khi ghi file JSON:', err);
                    return;
                }
                sessionStorage.removeItem('currentId');
                sessionStorage.removeItem('currentNoVisitDate');
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
    flatpickr(".inputDate", {
        locale: Vietnamese,
        dateFormat: "d/m/Y"
    });
    flatpickr(".inputMonth", {
        locale: Vietnamese,
        dateFormat: "m/Y", // hiển thị tháng/năm
        plugins: [
            monthSelectPlugin({
                shorthand: true,
                dateFormat: "m/Y",
                altFormat: "F Y"
            })
        ]
    });
    const storedId = sessionStorage.getItem('currentId');
    const noVisitDate = sessionStorage.getItem('currentNoVisitDate');
    // Quay lại danh sách
    $('.btnBack').on('click', () => {
        sessionStorage.removeItem('currentId');
        sessionStorage.removeItem('currentNoVisitDate');
        ipcRenderer.send('go-back')
    });

    $("#no_visit").on('change', (event) => {
        const no_visit_date = $('#no_visit_date').closest('.form-group')
        if(event.target.value === 'Không'){
            !no_visit_date.hasClass('hide') && no_visit_date.addClass('hide')
            $('#no_visit_date').val("")
        } else {
            no_visit_date.removeClass('hide');
            $('#no_visit_date').val(noVisitDate)
        }
    });

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
                    populateEditForm(item);
                }
            } catch (parseError) {
                console.error('Lỗi khi parse JSON:', parseError);
            }
        });
    }
    $.validator.addMethod("validAge", function (value, element) {
        var birthDate = new Date(formatDateYMD(value)); // Chuyển đổi input thành ngày tháng
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
        var inputDate = new Date(formatDateYMD(value)); // Chuyển đổi input thành ngày tháng
        console.log(value,'value')
        var today = new Date();

        // Kiểm tra nếu inputDate lớn hơn ngày hôm nay thì không hợp lệ
        return this.optional(element) || inputDate <= today;
    }, "Ngày không được vượt quá ngày hiện tại");
    $("#editForm").validate({
        errorClass: 'text-danger mb-0',
        errorElement: 'p',
        ignore: null,
        rules: {
            last_name: { required: true, minlength: 3 },
            first_name: { required: true, minlength: 3 },
            gender: { required: true },
            birthdate: { required: true, validAge: true },
            ethnicity: { required: true },
            nation: { required: true },
            hometown: { required: true },
            permanent_address: { required: true },
            zone: { required: true },
            cell: { required: true },
            offense: { required: true },
            arrest_date: { required: true, validDate: true },
            prison_entry: { required: true, validDate: true },
            arrest_warrant: { required: true },
            handling_agency: { required: true }
        },
        messages: {
            last_name: {
                required: "Họ không được để trống",
                minlength: "Tên phải có ít nhất 3 ký tự"
            },
            first_name: {
                required: "Tên không được để trống",
                minlength: "Tên phải có ít nhất 3 ký tự"
            },
            gender: "Vui lòng chọn giới tính",
            birthdate: {
                required: "Vui lòng chọn ngày sinh",
                validAge: "Người dùng phải ít nhất 16 tuổi" // Hiển thị thông báo lỗi khi không đủ tuổi
            },
            ethnicity: "Dân tộc không được để trống",
            nation: "Quốc tịch không được để trống",
            hometown: "Quê quán không được để trống",
            permanent_address: "Hộ khẩu thường trú không được để trống",
            zone: "Khu không được để trống",
            cell: "Buồng không được để trống",
            offense: "Tội không được để trống",
            arrest_date: {
                required: "Vui lòng chọn ngày bắt",
                validDate: "Ngày bắt không được vượt quá ngày hiện tại"
            },
            prison_entry: {
                required: "Vui lòng chọn ngày nhập trại",
                validDate: "Ngày nhập trại không được vượt quá ngày hiện tại"
            },
            arrest_warrant: "Lệnh không được để trống",
            handling_agency: "Đơn vị thụ lý không được để trống",
        },
        errorPlacement: function (error, element) {
            console.log(error, 'zxcxz')
            let parent = null;
            if (element.closest('.form-group').find('p.text-danger').length > 0) {
                parent = element.parent().find('p.text-danger').remove();
            }
            if (element.is('[type="file"]')) {
                if (element.is('[multiple]')) {
                    parent = element.parent().parent().parent();
                } else {
                    parent = element.parent().parent();
                }
            } else if (element.hasClass('password')) {
                parent = element.parent().parent();
            } else {
                parent = element.parent();
            }
            parent.append(error);

        },
        submitHandler: function () {
            updateItemData();
        }
    });
});

