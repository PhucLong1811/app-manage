
const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const Swal = require('sweetalert2');
// Khai báo font
pdfMake.fonts = {
    TimesNewRoman: {
      normal: 'Times New Roman.ttf',
      bold: 'Times New Roman Bold.ttf',
      italics: 'Times New Roman Italic.ttf',
      bolditalics: 'Times New Roman Bold Italic.ttf',
    },
};

const dataFilePath = path.join(__dirname, '../..', 'data', 'data.json');
const dataUserPath = path.join(__dirname, '../..', 'data', 'user.json');
function formatDateDMY(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatDateYMD(dateStr) {
    if (dateStr == '') return '';
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}
function loadUserData() {
    $.getJSON(dataFilePath, function (data) {
        const html = data.map((item, index) => {
            return `<tr>
                <td>${(index + 1).toString().padStart(2, '0')}</td>
                <td>${item.last_name}</td>
                <td>${item.first_name}</td>
                <td>${item.gender}</td>
                <td>${moment(item.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
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
                <td>${item.disease}</td>
                <td>${item.note || ''}</td>
                <td>${formatDateDMY(item.visit)}</td>
                <td>${formatDateDMY(item.send)}</td>
                <td></td>
            </tr>`;
        }).join('');

        $('#listVisitUser tbody').append(html);
    });
}
function renderFilter() {
    const filterZone = $("#filterZone");
    const filterCell = $("#filterCell");
    const filterNoVisit = $("#filterNoVisit");

    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            console.warn("Không có dữ liệu hợp lệ để render!");
            return;
        }
        const uniqueZones = Array.from(
            new Set(jsonData.map(item => JSON.stringify({ zone: item.zone, cell: item.cell, no_visit: item.no_visit })))
        ).map(str => JSON.parse(str));

        let addedZones = new Set();
        let addedCells = new Set();
        let addedNoVisits = new Set();

        uniqueZones.forEach(({ zone, cell, no_visit }) => {
            if (!addedZones.has(zone)) {
                filterZone.append(`<option value="${zone}">${zone}</option>`);
                addedZones.add(zone);
            }
            if (!addedCells.has(cell)) {
                filterCell.append(`<option value="${cell}">${cell}</option>`);
                addedCells.add(cell);
            }
            if (!addedNoVisits.has(no_visit)) {
                filterNoVisit.append(`<option value="${no_visit}">${no_visit}</option>`);
                addedNoVisits.add(no_visit);
            }
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
function handleExportExcel() {
    try {
        const filteredData = handleFilterData();
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
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
function handleExportPdf() {
    try {
        const titlePdf = "DANH SÁCH NGƯỜI BỊ TẠM GIAM, TẠM GIỮ";
        const filteredData = handleFilterData();
        const dataList = filteredData.map(({ created_at, updated_at, created_by_user, updated_by_user, ...item }, index) => ({
            "STT": index + 1,
            "last_name": item.last_name,
            "first_name": item.first_name,
            "gender": item.gender,
            "birthdate": moment(item.birthdate, 'YYYY-MM-DD').format('YYYY'),
            "ethnicity": item.ethnicity,
            "nation": item.nation,
            "hometown": item.hometown,
            "permanent_address": item.permanent_address,
            "zone": item.zone,
            "cell": item.cell,
            "offense": item.offense,
            "arrest_date": formatDateDMY(item.arrest_date),
            "prison_entry": formatDateDMY(item.prison_entry),
            "arrest_warrant": item.arrest_warrant,
            "handling_agency": item.handling_agency,
            "comment": item.comment || '',
            "no_visit_date": item.no_visit_date,
            "disease": item.disease,
            "note": item.note || '',
            "visit": formatDateDMY(item.visit),
            "send": formatDateDMY(item.send),
        }));

        const tableBody = dataList.map((item, index) => [
            { text: index + 1, alignment: "center", valign: 'middle' },
            { text: item.last_name, noWrap: false },
            { text: item.first_name, noWrap: false },
            { text: item.gender, alignment: "center", valign: 'middle' },
            { text: item.birthdate, alignment: "center", valign: 'middle' },
            { text: item.ethnicity, noWrap: false },
            { text: item.nation, noWrap: false },
            { text: item.hometown, noWrap: false },
            { text: item.permanent_address, noWrap: false },
            { text: item.zone, alignment: "center", valign: 'middle' },
            { text: item.cell, alignment: "center", valign: 'middle' },
            { text: item.offense, noWrap: false },
            { text: item.arrest_date, alignment: "center", valign: 'middle' },
            { text: item.prison_entry, alignment: "center", valign: 'middle' },
            { text: item.arrest_warrant, noWrap: false },
            { text: item.handling_agency, noWrap: false },
            { text: item.comment, noWrap: false },
            { text: item.no_visit_date, noWrap: false },
            { text: item.disease, noWrap: false },
            { text: item.note, noWrap: false },
            { text: item.visit, alignment: "center", valign: 'middle' },
            { text: item.send, alignment: "center", valign: 'middle' },
        ]);

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [20, 20, 20, 20],
            content: [
                { text: titlePdf, style: "header", alignment: "center" },
                // { text: subTitlePdf, style: "subheader", alignment: "center" },
                "\n",
                {
                    table: {
                        headerRows: 1,
                        dontBreakRows: true,
                        widths: [
                            15, 30, 30, 20, 20, 20, 30, 40, 40, 15, 25,
                            40, 43, 43, 40, 35, 30, 43, 30, 30, 43, 43
                        ],
                        body: [
                            [
                                { text: "STT", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Họ", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Tên", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Giới tính", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Năm sinh", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Dân tộc", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Quốc tịch", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Quê quán", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "HKTT", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Khu", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Buồng", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Tội", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Ngày bắt", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Ngày nhập", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Lệnh", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Đơn vị thụ lý", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Nhận xét", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Cấm thăm gặp", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Bệnh", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Ghi chú", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Gặp", style: "tableHeader", alignment: "center", valign: 'middle' },
                                { text: "Gửi", style: "tableHeader", alignment: "center", valign: 'middle' },
                            ],
                            ...tableBody
                        ]
                    },
                    layout: {
                        paddingLeft: () => 1.5,
                        paddingRight: () => 1.5,
                        paddingTop: () => 1.5,
                        paddingBottom: () => 1.5,
                    },
                    margin: [0, 0, 0, 0]
                }
            ],
            styles: {
                header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 9, italics: true, margin: [0, 0, 0, 10] },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    alignment: 'center',
                    valign: 'middle',
                    color: "#000000",
                }
            },
            defaultStyle: {
                fontSize: 8,
                alignment: "center",
                padding: 0,
                font: 'TimesNewRoman',
                wrap: true,
            }
        };

        pdfMake.createPdf(docDefinition).download("Danh sách phạm nhân.pdf");
    } catch (error) {
        console.error("Lỗi:", error);
    }
}


function handleFilterData() {
    try {
        const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));

        const dataSortName = $("#sortName").val();
        const dataFilterZone = $("#filterZone").val();
        const dataFilterCell = $("#filterCell").val();
        const dataFilterNoVisit = $("#filterNoVisit").val();

        // Lọc dữ liệu nếu filterKhu hoặc filterBuong có giá trị
        let filteredData = data;
        if (dataFilterZone !== "" || dataFilterCell !== "" || dataFilterNoVisit !== "") {
            filteredData = data.filter(item => {
                const matchKhu = dataFilterZone ? item.zone === dataFilterZone : true;
                const matchBuong = dataFilterCell ? item.cell === dataFilterCell : true;
                const matchNoVisit = dataFilterNoVisit ? item.no_visit === dataFilterNoVisit : true;
                return matchKhu && matchBuong && matchNoVisit;
            });
        }
        // Sắp xếp dữ liệu theo first_name nếu có yêu cầu
        if (dataSortName === "A") {
            filteredData.sort((a, b) => a.first_name.localeCompare(b.first_name, 'vi', { sensitivity: 'base' }));
        } else if (dataSortName === "Z") {
            filteredData.sort((a, b) => b.first_name.localeCompare(a.first_name, 'vi', { sensitivity: 'base' }));
        }
        return filteredData;
    } catch (error) {

    }
}
$(document).ready(function () {
    renderFilter();
    loadUserData();
    $('.btnBack').on('click', () => ipcRenderer.send('open-list'));
    $('#btnExportExcel').on('click', () => handleExportExcel());
    $('#btnExportPdf').on('click', () => handleExportPdf());
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
})