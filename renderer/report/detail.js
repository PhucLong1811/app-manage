const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const pdfMake = require('pdfmake/build/pdfmake');
const Swal = require('sweetalert2');

const user = JSON.parse(sessionStorage.getItem("user"));
function formatDateDMY(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function formatDateYMD(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}
function updatePadding() {

    let top = $("#paper-margin-top").val() === "" ? 0 : $("#paper-margin-top").val();
    let bottom = $("#paper-margin-bottom").val() === "" ? 0 : $("#paper-margin-bottom").val();
    let left = $("#paper-margin-left").val() === "" ? 0 : $("#paper-margin-left").val();
    let right = $("#paper-margin-right").val() === "" ? 0 : $("#paper-margin-right").val();

    $("#areaReport").css({
        "padding-top": top + "cm",
        "padding-bottom": bottom + "cm",
        "padding-left": left + "cm",
        "padding-right": right + "cm"
    });
}
function loadData(id) {
    const filePath = path.join(__dirname, "../..", "data", "report.json");

    if (!fs.existsSync(filePath)) return;

    const reports = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const report = reports.find((r) => r.id === id);
    if (!report) {
        $('#areaReport').html('<p style="color: red;">Không tìm thấy báo cáo!</p>');
        return;
    }
    $("#areaReport").css({
        "padding-top": report?.margin_top  ?? 0 + "cm",
        "padding-right": report?.margin_right  ?? 0 + "cm",
        "padding-bottom": report?.margin_bottom  ?? 0 + "cm",
        "padding-left": report?.margin_left ?? 0  + "cm"
    });
    $('#selectMarginFile #paper-margin-top').val(report?.margin_top ?? 0)
    $('#selectMarginFile #paper-margin-right').val(report?.margin_right ?? 0)
    $('#selectMarginFile #paper-margin-bottom').val(report?.margin_bottom ?? 0)
    $('#selectMarginFile #paper-margin-left').val(report?.margin_left ?? 0)
    // Hiển thị tiêu đề + nội dung báo cáo
    $('#areaReport').html(`
        <div class="report-content">${report.content}</div>
    `);
}
$(document).ready(function () {
    const reportId = sessionStorage.getItem('reportId');
    if (reportId) {
        loadData(JSON.parse(reportId));
    }
    $('.btnBack').on('click', () => ipcRenderer.send('report-list'));
    ipcRenderer.on('view-report-data', (event, item) => {
        sessionStorage.setItem('reportId', JSON.stringify(item));
        loadData(item);
    });
    $("#selectMarginFile input").on("input", updatePadding);
})