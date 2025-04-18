const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const Swal = require('sweetalert2');

const user = JSON.parse(sessionStorage.getItem("user"));
const procedureFilePath = path.join(__dirname, '../..', 'data', 'procedure.json');

function formatDateDMY(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatDateYMD(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}

function renderMenu() {
    const menuItems = [
        { id: "listVisitUser", label: "Tạo danh sách thăm gặp" },
        { id: "logout", label: "Đăng xuất" }
    ];

    menuItems.forEach(item => {
        $('#menu').append(`<li><a href="javascript:void(0)" id="${item.id}">${item.label}</a></li>`);
    });
}
$(document).ready(function () {
    const procedureTable = $('#procedureTable');
    const tableBody = $("#procedureTable tbody");
    function loadProcedures() {
        if (!fs.existsSync(procedureFilePath)) {
            console.warn("File report.json không tồn tại.");
            return;
        }

        const fileData = fs.readFileSync(procedureFilePath, "utf8");
        const procedures = fileData ? JSON.parse(fileData) : [];

        tableBody.empty(); // Xóa dữ liệu cũ trong bảng
        
        procedures.forEach((procedure, index) => {
            tableBody.append(`
                <tr data-view="${procedure.view}">
                    <td>${index + 1}</td>
                    <td>${procedure.title}</td>
                    <td>${procedure.type}</td>
                    <td>
                        <a class="btn-action btn-info btn-view" href="javascript:void(0)"><img src="../../assets/images/icon/icon-eye.svg" class="icon" alt="Chi tiết"> Xem</a>
                    </td>
                </tr>
            `);
        });
        console.log(tableBody,'procedures')
        // Khởi tạo DataTable nếu chưa có
        if (!$.fn.DataTable.isDataTable("#procedureTable")) {
            procedureTable.DataTable({
                pageLength: 10,
                lengthChange: false,
                ordering: true,
                order: [[0, 'asc']], // Mặc định sắp xếp cột đầu tiên (Họ và Tên) tăng dần
                columnDefs: [
                    { width: "30px", targets: 0 }, // STT nhỏ lại
                    { width: "250px", targets: -1 }, // Cột action to ra
                    { orderable: true, targets: [0, 1, 2] },
                    { orderable: false, targets: [3] } // Các cột khác không sắp xếp
                ],
                responsive: true,
                language: {
                    "sProcessing": "Đang xử lý...",
                    "sLengthMenu": "Hiển thị _MENU_ thủ tục",
                    "sZeroRecords": "Không tìm thấy dữ liệu nào",
                    "sInfo": "Hiển thị _START_ đến _END_ của _TOTAL_ thủ tục",
                    "sInfoEmpty": "Hiển thị 0 đến 0 của 0 thủ tục",
                    "sInfoFiltered": "(lọc từ tổng số _MAX_ thủ tục)",
                    "sSearch": "Tìm kiếm:",
                    "oPaginate": {
                        "sFirst": "Đầu",
                        "sPrevious": "Trước",
                        "sNext": "Tiếp",
                        "sLast": "Cuối"
                    }
                }
            });
        }
    }

    // Xử lý sự kiện khi bấm nút "Xem"
    tableBody.on("click", ".btn-view", function () {
        const fileName = $(this).closest("tr").data("view");
        ipcRenderer.send("navigate-to-procedure", fileName);
    });
    
    $('#btnBack').on('click', () => ipcRenderer.send("open-main"))

    $('#menu').on('click', '#logout', () => {
        sessionStorage.removeItem("user");
        ipcRenderer.send('logout');
    });
    $('#menu').on('click', '#listVisitUser', function () {
        ipcRenderer.send("navigate-to-procedure", "export-list-visit-user");
    })
    renderMenu();
    loadProcedures();
});
