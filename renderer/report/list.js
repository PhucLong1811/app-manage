const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const Swal = require('sweetalert2');

const user = JSON.parse(sessionStorage.getItem("user"));
const reportFilePath = path.join(__dirname, '../..', 'data', 'report.json');

function formatDateDMY(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatDateYMD(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}
function renderMenu() {
    const menuItems = [
        { id: "logout", label: "Đăng xuất", icon: "../../assets/images/icon/logout.svg"  }
    ];
    if (user && user.role !== "user") {
        menuItems.splice(0, 0, // Chèn các mục Excel vào trước "Đăng xuất"
            { id: "btnCreate", label: "Tạo mới", icon: "../../assets/images/icon/create.svg"  },
        );
    }
    menuItems.forEach(item => {
        $('#menu').append(`<li><a href="javascript:void(0)" id="${item.id}">
            <img src="${item.icon}" class="icon"/>
            ${item.label}</a>
            </li>`);
    });
}
function deleteData(id) {
    fs.readFile(reportFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi đọc JSON:', err);
            return;
        }

        let jsonData = JSON.parse(data);
        let updatedData = jsonData.filter(item => item.id !== id);

        fs.writeFile(reportFilePath, JSON.stringify(updatedData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Lỗi ghi JSON:', err);
                return;
            }
            let table = $('#reportTable').DataTable();
            table.row($(`tr[data-id="${id}"]`)).remove().draw();
            // Cập nhật lại STT trong bảng
            $('#reportTable tbody tr').each((index, row) => {
                $(row).find('td:first').text(index + 1);
            });
        });
    });
}
$(document).ready(function () {
    const tableBody = $("#reportTable tbody");
    $('#btnBack').on('click', () => ipcRenderer.send("open-main"))
    function loadReports() {
        if (!fs.existsSync(reportFilePath)) {
            console.warn("File report.json không tồn tại.");
            return;
        }

        const fileData = fs.readFileSync(reportFilePath, "utf8");
        const reports = fileData ? JSON.parse(fileData) : [];

        tableBody.empty(); // Xóa dữ liệu cũ trong bảng

        reports.forEach((report, index) => {
            tableBody.append(`
                <tr data-id="${report.id}">
                    <td>${index + 1}</td>
                    <td>${report.title}</td>
                    // <td>${formatDateDMY(report.created_at)}</td>
                    <td>
                        <a class="btn-action btn-info btn-view" href="javascript:void(0)"><img src="../../assets/images/icon/icon-eye.svg" class="icon" alt="Chi tiết"> Xem</a>
                        ${user.role === 'admin' ? `<a class="btn-action btn-primary btn-edit" href="javascript:void(0)"><img src="../../assets/images/icon/icon-edit.svg" class="icon" alt="Sửa"> Sửa</a>` : ""}
                        ${user.role === 'admin' ? `<a class="btn-action btn-danger delete-btn" href="javascript:void(0)"><img src="../../assets/images/icon/icon-remove.svg" class="icon" alt="Xoá"> Xoá</a>` : ""}
                    </td>
                </tr>
            `);
        });

        // Khởi tạo DataTable nếu chưa có
        if (!$.fn.DataTable.isDataTable("#reportTable")) {
            $("#reportTable").DataTable({
                pageLength: 10,
                lengthChange: false,
                ordering: true,
                order: [[0, 'asc']], // Mặc định sắp xếp cột đầu tiên (Họ và Tên) tăng dần
                columnDefs: [
                    { width: "30px", targets: 0 }, // STT nhỏ lại
                    { width: "250px", targets: -1 }, // Cột action to ra
                    { orderable: true, targets: [0, 1] },
                    { orderable: false, targets: [2, 3] }, // Các cột khác không sắp xếp
                    { searchable: true, targets: [1] },
                    { searchable: false, targets: '_all' }, // tất cả các cột còn lại đều không search
                ],
                responsive: true,
                language: {
                    "sProcessing": "Đang xử lý...",
                    "sLengthMenu": "Hiển thị _MENU_ biểu mẫu",
                    "sZeroRecords": "Không tìm thấy dữ liệu nào",
                    "sInfo": "Hiển thị _START_ đến _END_ của _TOTAL_ biểu mẫu",
                    "sInfoEmpty": "Hiển thị 0 đến 0 của 0 biểu mẫu",
                    "sInfoFiltered": "(lọc từ tổng số _MAX_ biểu mẫu)",
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

    loadReports();

    // Xử lý sự kiện khi bấm nút "Xem"
    tableBody.on("click", ".btn-view", function () {
        const reportId = $(this).closest("tr").data("id");
        console.log('xzcxz')
        ipcRenderer.send("report-detail", reportId);
    });
    tableBody.on("click", ".btn-edit", function () {
        const reportId = $(this).closest("tr").data("id");
        console.log('xzcxz')
        ipcRenderer.send("report-edit", reportId);
    });
    tableBody.on('click', '.delete-btn', function () {
        const reportId = $(this).closest("tr").data("id");
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa?',
            text: "Dữ liệu này sẽ không thể khôi phục!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            cancelButtonText: 'Hủy',
            confirmButtonText: 'Xóa',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                deleteData(reportId);
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Dữ liệu đã được xóa thành công.',
                    icon: 'success',
                    timer: 1500, // Tự động đóng sau 1.5 giây
                    showConfirmButton: false
                });
            }
        });
    });
    // Thêm sự kiện cho các nút trên menu
    $('#menu').on('click', '#logout', () => {
        sessionStorage.removeItem("user");
        ipcRenderer.send('logout');
    });

    $('#menu').on('click', '#btnCreate', () => ipcRenderer.send('report-create'));

    renderMenu();
});
