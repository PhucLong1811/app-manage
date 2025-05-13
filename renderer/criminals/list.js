const { ipcRenderer, remote, app } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.fonts = {
    TimesNewRoman: {
        normal: 'Times New Roman.ttf',
        bold: 'Times New Roman Bold.ttf',
        italics: 'Times New Roman Italic.ttf',
        bolditalics: 'Times New Roman Bold Italic.ttf',
    },
};
const Swal = require('sweetalert2');

const user = JSON.parse(sessionStorage.getItem("user"));

async function getDataFilePath(fileName) {
    return await ipcRenderer.invoke('get-data-file-path', fileName);
}

function formatDateDMY(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatDateYMD(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}
function renderMenu() {
    const menuItems = [
        { id: "btnCreate", label: "Tạo mới", icon: "../../assets/images/icon/create.svg" },
        { id: "btnExportExcel", label: "Xuất Excel", icon: "../../assets/images/icon/export-file.svg" },
        // { id: "exportPdfBtn", label: "Xuất Pdf", icon: "../../assets/images/icon/export-file.svg" },
        { id: "filterExportExcel", label: "Lọc danh sách", icon: "../../assets/images/icon/filter.svg" },
        { id: "logout", label: "Đăng xuất", icon: "../../assets/images/icon/logout.svg" }
    ];

    if (user && user.role !== "user") {
        menuItems.splice(1, 0, // Chèn các mục Excel vào trước "Đăng xuất"
            { id: "btnRemoveAll", label: "Xoá tất cả dữ liệu", icon: "../../assets/images/icon/icon-remove-2.svg" },
            { id: "btnImportExcel", label: "Nhập Excel", icon: "../../assets/images/icon/import-file.svg" },
        );
    }

    menuItems.forEach(item => {
        $('#menu').append(`<li><a href="javascript:void(0)" id="${item.id}">
            <img src="${item.icon}" class="icon"/>
            ${item.label}</a>
            </li>`);
    });
}
$(document).ready(function () {
    const filterKhu = $("#filterKhu");
    const filterBuong = $("#filterBuong");
    const filterNoVisit = $("#filterNoVisit");
    const listCrimeZone = $('.listCrimeZone');
    const listCrimeGender = $('.listCrimeGender');
    const totalCrime = $('.totalCrime')
    $('#menu').on('click', '#btnCreate', () => ipcRenderer.send('open-create'));
    $('.mainMenu').on('click', '#btnBack', () => ipcRenderer.send('back-to-main'));
    $('#menu').on('click', '#filterExportExcel', () => ipcRenderer.send('open-filter-export-excel'));
    $('#menu').on('click', '#logout', () => {
        sessionStorage.removeItem("user");
        ipcRenderer.send('logout')
    });

    function renderFilter(data) {
        console.log(data,'zxcxzczx')
        try {
            let jsonData = JSON.parse(data);
            let zoneCountMap = {};
            let genderCountMap = {};

            if (!Array.isArray(jsonData) || jsonData.length === 0) {
                console.warn("Không có dữ liệu hợp lệ để render!");
                return;
            }
            totalCrime.text(jsonData.length)
            jsonData.forEach(item => {
                if (item.zone) {
                    zoneCountMap[item.zone] = (zoneCountMap[item.zone] || 0) + 1;
                }
                if (item.gender) {
                    genderCountMap[item.gender] = (genderCountMap[item.gender] || 0) + 1;
                }
            });
            listCrimeZone.empty();
            listCrimeGender.empty();
            $.each(
                Object.keys(zoneCountMap).sort(),
                function (i, zone) {
                    const count = zoneCountMap[zone];
                    listCrimeZone.append(`<li>Khu ${zone}: ${count}</li>`);
                }
            );
            $.each(
                Object.keys(genderCountMap).sort(),
                function (i, gender) {
                    const count = genderCountMap[gender];
                    listCrimeGender.append(`<li>${gender}: ${count}</li>`);
                }
            );
            const uniqueZones = Array.from(
                new Set(jsonData.map(item => JSON.stringify({ zone: item.zone, cell: item.cell, no_visit: item.no_visit })))
            ).map(str => JSON.parse(str));

            let addedZones = new Set();
            let addedCells = new Set();
            let addedNoVisits = new Set();

            uniqueZones.forEach(({ zone, cell, no_visit }) => {
                if (!addedZones.has(zone)) {
                    filterKhu.append(`<option value="${zone}">${zone}</option>`);
                    addedZones.add(zone);
                }
                if (!addedCells.has(cell)) {
                    filterBuong.append(`<option value="${cell}">${cell}</option>`);
                    addedCells.add(cell);
                }
                if (!addedNoVisits.has(no_visit)) {
                    filterNoVisit.append(`<option value="${no_visit}">${no_visit}</option>`);
                    addedNoVisits.add(no_visit);
                }
            });
        } catch (error) {
            console.error("Lỗi khi parse JSON hoặc cập nhật select:", error);
        }
    }
    // Tải dữ liệu từ file JSON
    async function loadData() {
        const dataFilePath = await getDataFilePath('data.json');
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Lỗi đọc JSON:', err);
                return;
            }
            let jsonData = JSON.parse(data);
            let tableFilter = $('.tableFilter').detach();

            if ($.fn.DataTable.isDataTable('#dataTable')) {
                $('#dataTable').DataTable().destroy();
            }

            const tbody = document.querySelector('#dataTable tbody');
            tbody.innerHTML = '';


            jsonData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td class="stt">${index + 1}</td>
                <td class="lastName">${item.last_name}</td>
                <td class="firstName">${item.first_name}</td>
                <td class="gender">${item.gender}</td>
                <td class="birthYear">${moment(item.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
                <td>${item.ethnicity}</td>
                <td>${item.nation}</td>
                <td>${item.hometown}</td>
                <td>${item.permanent_address}</td>
                <td>${item.zone}</td>
                <td>${item.cell}</td>
                <td>${item.offense}</td>
                <td>${formatDateDMY(item.arrest_date)}</td>
                <td>${formatDateDMY(item.prison_entry)}</td>
                <td>${item.arrest_warrant}</td>
                <td>${item.handling_agency}</td>
                <td>${item.comment || ''}</td>
                <td>${item.no_visit}</td>
                <td>${item.no_visit_date}</td>
                <td>${item.disease}</td>
                <td>${item.note || ''}</td>
                <td>${formatDateDMY(item.visit)}</td>
                <td>${formatDateDMY(item.send)}</td>
                <td class="action">
                    <a class="btn-action btn-info detail-button" data-id="${item.id}" href="javascript:void(0)"><img src="../../assets/images/icon/icon-eye.svg" class="icon" alt="Chi tiết"></a>
                    <a class="btn-action btn-primary edit-btn" data-id="${item.id}" href="javascript:void(0)"><img src="../../assets/images/icon/icon-edit.svg" class="icon" alt="Sửa"></a>
                    <a class="btn-action btn-danger delete-btn" data-id="${item.id}" href="javascript:void(0)"><img src="../../assets/images/icon/icon-remove.svg" class="icon" alt="Xoá"></a>
                    
                </td>
            `;
                tbody.appendChild(row);
            });

            const tableManageUsers = $('#dataTable').DataTable({
                fixedColumns: {
                    leftColumns: 5 // Cố định 5 cột đầu tiên (STT đến ngày sinh)
                },
                pageLength: 10,
                lengthChange: true,
                ordering: true,
                // autoWidth: false,
                order: [
                    [0, 'asc'],
                ], // Đặt sắp xếp mặc định cho các cột
                columnDefs: [
                    { width: "30", targets: 0 },  // STT nhỏ lại
                    { width: "150", targets: -1 }, // Cột action to ra
                    { orderable: true, targets: [0, 2, 3, 4, 5, 10, 12, 13, 17, 21, 22] },
                    { orderable: false, targets: [1, 6, 7, 8, 11, 14, 15, 16, 18, 19, 20, 23] }, // Các cột khác không sắp xếp
                    { searchable: true, targets: [2, 9, 10, 17] },
                    { searchable: false, targets: '_all' }, // tất cả các cột còn lại đều không search
                ],
                responsive: true,
                language: {
                    "sProcessing": "Đang xử lý...",
                    "sLengthMenu": "Hiển thị _MENU_ phạm nhân",
                    "sZeroRecords": "Không tìm thấy dữ liệu nào",
                    "sInfo": "Hiển thị _START_ đến _END_ của _TOTAL_ phạm nhân",
                    "sInfoEmpty": "Hiển thị 0 đến 0 của 0 phạm nhân",
                    "sInfoFiltered": "(lọc từ tổng số _MAX_ phạm nhân)",
                    "sSearch": "Tìm kiếm:",
                    "oPaginate": {
                        "sFirst": "Đầu",
                        "sPrevious": "Trước",
                        "sNext": "Tiếp",
                        "sLast": "Cuối"
                    }
                },
            });
            let $table = $('#dataTable');
            if (!$table.parent().hasClass('areaDataTable')) {
                $table.wrap('<div class="areaDataTable"></div>');
            }
            renderFilter(data);
            $('#dataTable tbody').on('click', '.edit-btn', function () {
                const id = $(this).data('id');
                const selectedItem = jsonData.find(item => item.id === id);
                if (selectedItem) {
                    ipcRenderer.send('open-edit', selectedItem);
                }
            });
            $('#dataTable tbody').on('click', '.report-button', function () {
                const id = $(this).data('id');
                ipcRenderer.send('open-report', id);
            });
            $('#dataTable tbody').on('click', '.detail-button', function () {
                const id = $(this).data('id');
                ipcRenderer.send('open-detail', id);
            });

            $('#dataTable tbody').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
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
                        deleteData(id);
                        Swal.fire({
                            title: 'Đã xóa!',
                            text: 'Dữ liệu đã được xóa thành công.',
                            icon: 'success',
                            timer: 1500, // Tự động đóng sau 1.5 giây
                            showConfirmButton: false
                        });
                    }
                });
                // deleteData(id);
            });
            $('.areaTable').prepend(tableFilter);
            filterKhu.on("change", function () {
                console.log("Lọc khu với:", this.value);
                tableManageUsers.column(9).search(this.value.trim()).draw();
            });
            filterBuong.on("change", function () {
                tableManageUsers.column(10).search(this.value.trim()).draw(); // Cột thứ 10 là "Buồng"
            });

            filterNoVisit.on("change", function () {
                tableManageUsers.column(17).search(this.value.trim()).draw(); // Cột thứ 17 là "Buồng"
            });
        });
    }
    $('#menu').on('click', '#btnRemoveAll', function () {
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa tất cả dữ liệu?',
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
                deleteData();
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
    async function deleteData(id) {
        const dataFilePath = await getDataFilePath('data.json');
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Lỗi đọc JSON:', err);
                return;
            }

            let jsonData = JSON.parse(data);

            // Nếu có id, chỉ xóa phần tử có id đó, nếu không xóa tất cả
            let updatedData = id ? jsonData.filter(item => item.id !== id) : [];
            try {
                fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error('Lỗi ghi JSON:', err);
                        return;
                    }

                    // Cập nhật bảng sau khi xóa dữ liệu
                    let table = $('#dataTable').DataTable();

                    if (id) {
                        // Nếu có id, chỉ xóa hàng tương ứng
                        table.row($(`.delete-btn[data-id="${id}"]`).parents('tr')).remove().draw();
                        // Cập nhật lại STT trong bảng
                        $('#dataTable tbody tr').each((index, row) => {
                            $(row).find('td:first').text(index + 1);
                        });
                    } else {
                        // Nếu không có id, xóa toàn bộ bảng
                        table.clear().draw();
                    }
                    renderFilter(JSON.stringify(updatedData))
                    console.log('Ghi tệp thành công!');
                });
            } catch (writeError) {
                console.error('Lỗi ghi dữ liệu với fs.writeFile:', writeError);
            }
        });
    }


    // ✅ Xuất Excel
    $('#menu').on('click', '#btnExportExcel', async() => {
        // if (user && user.role === 'user') return false;
        const dataFilePath = await getDataFilePath('data.json');
        const dataUserPath = await getDataFilePath('user.json');
        $.when(
            $.getJSON(dataFilePath),
            $.getJSON(dataUserPath)
        ).done((dataResponse, usersResponse) => {
            const data = dataResponse[0];  // Dữ liệu chính
            const users = usersResponse[0]; // Danh sách user

            const dataFilterKhu = $("#filterKhu").val().trim();
            const dataFilterBuong = $("#filterBuong").val().trim();
            const dataFilterNoVisit = $("#filterNoVisit").val().trim();

            // Tạo object ánh xạ user_id -> username
            const userMap = users.reduce((acc, u) => {
                acc[u.id] = u.username; // Hoặc `acc[u.id] = u.full_name;` nếu cần họ tên
                return acc;
            }, {});

            // Lọc dữ liệu nếu filterKhu hoặc filterBuong có giá trị
            let filteredData = data;
            if (dataFilterKhu !== "" || dataFilterBuong !== "" || dataFilterNoVisit !== "") {
                filteredData = data.filter(item => {
                    const matchKhu = dataFilterKhu ? item.zone === dataFilterKhu : true;
                    const matchBuong = dataFilterBuong ? item.cell === dataFilterBuong : true;
                    const matchNoVisit = dataFilterNoVisit ? item.no_visit === dataFilterNoVisit : true;
                    return matchKhu && matchBuong && matchNoVisit;
                });
            }

            // Loại bỏ `created_at`, `updated_at` & đổi ID thành username
            const sanitizedData = filteredData.map(({ created_at, updated_at, created_by_user, updated_by_user, ...item }, index) => ({
                "STT": index + 1,
                "Họ": item.last_name,
                "Tên": item.first_name,
                "Giới tính": item.gender,
                "Ngày sinh": formatDateDMY(item.birthdate),
                "Dân tộc": item.ethnicity,
                "Quốc tịch": item.nation,
                "Quê quán": item.hometown,
                "Hktt": item.permanent_address,
                "Khu": item.zone,
                "Buồng": item.cell,
                "Tội": item.offense,
                "Ngày bắt": formatDateDMY(item.arrest_date),
                "Ngày nhập": formatDateDMY(item.prison_entry),
                "Lệnh": item.arrest_warrant,
                "Đơn vị thụ lý": item.handling_agency,
                "Nhận xét": item.comment || '',
                "Cấm thăm gặp": item.no_visit,
                "Thời gian cấm gặp": item.no_visit_date,
                "Bệnh": item.disease,
                "Ghi chú": item.note || '',
                "Gặp": formatDateDMY(item.visit),
                "Gửi": formatDateDMY(item.send),
            }));

            // Gửi dữ liệu đã xử lý đến ipcRenderer
            ipcRenderer.send('export-excel', sanitizedData);
        });
    });



    // ✅ Nhập Excel
    $('#menu').on('click', '#btnImportExcel', () => {
        if (user && user.role === 'user') return false;
        ipcRenderer.send('import-excel');
    });

    // Nhận thông báo từ main process
    ipcRenderer.on('export-success', (event, message) =>
        Swal.fire({
            icon: 'success',
            title: message,
            timer: 2000,  // Tự đóng sau 2 giây
            showConfirmButton: false
        })
    );
    ipcRenderer.on('export-failed', (event, message) =>
        Swal.fire({
            icon: 'error',
            title: message,
            timer: 2000,
            showConfirmButton: false
        })
    );

    ipcRenderer.on('import-success', async(event, data) => {
        const dataFilePath = await getDataFilePath('data.json');
        let dataFilterKhu = $("#filterKhu").val();
        let dataFilterBuong = $("#filterBuong").val();
        let dataFilterNoVisit = $("#filterNoVisit").val();
        fs.readFile(dataFilePath, 'utf8', (err, fileData) => {
            if (err) return;

            let jsonData = JSON.parse(fileData);

            const filteredData = data.filter(item => {
                const birthdate = formatDateYMD(item['Ngày sinh']);
                const arrest_date = formatDateYMD(item['Ngày bắt']);

                return !jsonData.some(existing =>
                    existing.first_name === item['Tên'] &&
                    existing.gender === item['Giới tính'] &&
                    existing.birthdate === birthdate &&
                    existing.zone === item['Khu'] &&
                    existing.cell === item['Buồng'] &&
                    existing.arrest_date === arrest_date
                );
            });

            const newData = filteredData.map((item, index) => ({
                id: Date.now() + index,
                last_name: item['Họ'],
                first_name: item['Tên'],
                gender: item['Giới tính'],
                birthdate: formatDateYMD(item['Ngày sinh']),
                ethnicity: item['Dân tộc'],
                nation: item['Quốc tịch'],
                hometown: item['Quê quán'],
                permanent_address: item['Hktt'],
                zone: item['Khu'],
                cell: item['Buồng'],
                offense: item['Tội'],
                arrest_date: formatDateYMD(item['Ngày bắt']),
                prison_entry: formatDateYMD(item['Ngày nhập']),
                arrest_warrant: item['Lệnh'],
                handling_agency: item['Đơn vị thụ lý'],
                comment: item['Nhận xét'],
                no_visit: item['Cấm thăm gặp'],
                no_visit_date: item['Thời gian cấm gặp'],
                disease: item['Bệnh'],
                note: item['Ghi chú'],
                visit: formatDateYMD(item['Gặp']),
                send: formatDateYMD(item['Gửi']),
                created_by_user: "",
                created_at: "",
                updated_by_user: "",
                updated_at: ""
            }));

            jsonData = [...jsonData, ...newData];

            fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 4), (err) => {
                if (!err)
                    loadData();
                setTimeout(() => {
                    if (dataFilterKhu) {
                        $('#dataTable').DataTable().column(9).search(dataFilterKhu.trim()).draw();
                    }
                    if (dataFilterBuong) {
                        $('#dataTable').DataTable().column(10).search(dataFilterBuong.trim()).draw();
                    }
                    if (dataFilterNoVisit) {
                        $('#dataTable').DataTable().column(17).search(dataFilterNoVisit.trim()).draw();
                    }
                }, 500);
            });
        });
    });
    $('#menu').on('click', '#exportPdfBtn', async function () {
        const dataFilePath = await getDataFilePath('data.json');
        if (user && user.role === 'user') return false;
        const today = moment().format("[ngày] DD [tháng] MM [năm] YYYY");
        const titlePdf = "DANH SÁCH NGƯỜI BỊ TẠM GIAM, TẠM GIỮ ĐI THĂM GẶP THÂN NHÂN";
        const subTitlePdf = `(Kèm theo Quyết định số ........ /QĐ ${today} của Giám thị Trại giam Công an thành phố Huế)`;
        let dataList = [];
        // Lấy dữ liệu từ file data.json thay vì từ bảng HTML
        $.getJSON(dataFilePath, function (data) {
            dataList = data.map((item, index) => ({
                stt: index + 1, // Tạo số thứ tự nếu JSON không có
                last_name: item.last_name || '',
                first_name: item.first_name || '',
                birthdate: item.birthdate ? moment(item.birthdate, 'YYYY-MM-DD').format('YYYY') : '',
                permanent_address: item.permanent_address || '',
                hanhVi: '',
                arrest_date: item.arrest_date ? formatDateDMY(item.arrest_date) : '',
                cell: item.cell || '',
                sqd: '',
            }));

            // Tạo body cho bảng PDF (Không có header)
            const tableBody = dataList.map((item, index) => [
                { text: index + 1, alignment: "center" },
                { text: item.last_name },
                { text: item.first_name },
                { text: item.birthdate, alignment: "center" },
                { text: item.permanent_address },
                { text: item.hanhVi },
                { text: item.arrest_date, alignment: "center" },
                { text: item.cell, alignment: "center" },
                { text: item.sqd, alignment: "center" },
            ]);

            // Cấu hình file PDF
            const docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                content: [
                    {
                        text: titlePdf,
                        style: "header",
                        alignment: "center",
                        pageBreak: 'auto'
                    },
                    { text: subTitlePdf, style: "subheader", alignment: "center" },
                    "\n",
                    {
                        table: {
                            widths: [30, '*', '*', '*', '*', '*', '*', '*', '*'],
                            keepWithHeaderRows: 1,
                            dontBreakRows: true,
                            body: [
                                [
                                    { text: "STT", style: "tableHeader" },
                                    { text: "Họ", style: "tableHeader" },
                                    { text: "Tên", style: "tableHeader" },
                                    { text: "Năm sinh", style: "tableHeader" },
                                    { text: "Nơi ĐKHKTT", style: "tableHeader" },
                                    { text: "Hành vi phạm tội", style: "tableHeader" },
                                    { text: "Ngày bị bắt", style: "tableHeader" },
                                    { text: "Buồng giam", style: "tableHeader" },
                                    { text: "SQĐ", style: "tableHeader" },
                                ],
                                ...tableBody
                            ]
                        },
                        layout: "lightHorizontalLines",
                        alignment: "center",
                        margin: [0, 0, 0, 0],
                        dontBreakRows: true
                    }
                ],
                styles: {
                    header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
                    subheader: { fontSize: 10, italics: true, margin: [0, 0, 0, 10] },
                    tableHeader: { bold: true, fillColor: "#eeeeee", alignment: "center" }
                },
                defaultStyle: {
                    alignment: "center",
                    font: 'TimesNewRoman',
                }
            };

            // Xuất file PDF
            pdfMake.createPdf(docDefinition).download("Danh sách người bị TG/TG.pdf");
        });
    });

    // Khởi chạy dữ liệu khi mở ứng dụng
    renderMenu();
    loadData();
})