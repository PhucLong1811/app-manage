const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
const html2canvas = require("html2canvas");
const { jsPDF } = require("jspdf");

async function getDataFilePath(fileName) {
    return await ipcRenderer.invoke('get-data-file-path', fileName);
}

// Format Date helper functions
function formatDateDMY(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

function formatDateYMD(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}

// Update padding values based on input fields
function updatePadding() {
    const top = $("#paper-margin-top").val() || 0;
    const bottom = $("#paper-margin-bottom").val() || 0;
    const left = $("#paper-margin-left").val() || 0;
    const right = $("#paper-margin-right").val() || 0;

    $("#areaReport").css({
        "padding-top": top + "cm",
        "padding-bottom": bottom + "cm",
        "padding-left": left + "cm",
        "padding-right": right + "cm"
    });
}

// Load report data based on the provided report ID
async function loadData(id) {
    const filePath = await getDataFilePath('report.json');
    if (!fs.existsSync(filePath)) return;

    const reports = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const report = reports.find((r) => r.id === id);
    if (!report) {
        $('#areaReport').html('<p style="color: red;">Không tìm thấy báo cáo!</p>');
        return;
    }

    // Set the margin values from the report data
    $("#areaReport").css({
        "padding-top": report?.margin_top ?? 2 + "cm",
        "padding-right": report?.margin_right ?? 1.5 + "cm",
        "padding-bottom": report?.margin_bottom ?? 0 + "cm",
        "padding-left": report?.margin_left ?? 3 + "cm"
    });

    // Populate the margin input fields
    $('#selectMarginFile #paper-margin-top').val(report?.margin_top ?? 0)
    $('#selectMarginFile #paper-margin-right').val(report?.margin_right ?? 0)
    $('#selectMarginFile #paper-margin-bottom').val(report?.margin_bottom ?? 0)
    $('#selectMarginFile #paper-margin-left').val(report?.margin_left ?? 0)

    // Display report content
    $('#areaReport').html(`
        <div class="report-content">${report.content}</div>
    `);
}

$(document).ready(function () {
    const reportId = sessionStorage.getItem('reportId');
    if (reportId) {
        loadData(JSON.parse(reportId));
    }

    // Back button to report list
    $('.btnBack').on('click', () => ipcRenderer.send('report-list'));

    // Load report data when triggered by 'view-report-data' event
    ipcRenderer.on('view-report-data', (event, item) => {
        sessionStorage.setItem('reportId', JSON.stringify(item));
        loadData(item);
    });

    // Update padding when margin values are changed
    $("#selectMarginFile input").on("input", updatePadding);

    // Export PDF functionality
    $("#btnExportPdf").on("click", async function () {
        const filePath = await getDataFilePath('report.json');
        const title = $(this).data('title') || 'Biên bản';
        const element = $("#areaReport");

        const tempDiv = element.clone();

        // Replace inputs with span elements to keep input values
        tempDiv.find("input").each(function () {
            const value = $(this).val() || "";
            $(this).replaceWith(`<span>${value}</span>`);
        });

        tempDiv.css({ position: "absolute", left: "-9999px", top: "0" }).appendTo("body");

        html2canvas(tempDiv[0], { scale: 2 }).then((canvas) => {
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210; // A4 width
            const pageHeight = 297; // A4 height
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = canvas.height;
            let position = 0;
            const imgData = canvas.toDataURL("image/png");

            while (heightLeft > 0) {
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min((canvas.width * pageHeight) / imgWidth, heightLeft);

                const ctx = pageCanvas.getContext("2d");
                ctx.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

                const pageData = pageCanvas.toDataURL("image/png");
                const pageImgHeight = (pageCanvas.height * imgWidth) / canvas.width;

                if (position === 0) {
                    pdf.addImage(pageData, "PNG", 0, 0, imgWidth, pageImgHeight);
                } else {
                    pdf.addPage();
                    pdf.addImage(pageData, "PNG", 0, 0, imgWidth, pageImgHeight);
                    const reports = JSON.parse(fs.readFileSync(filePath, "utf8"));
                    const report = reports.find((r) => r.id === JSON.parse(reportId));
                    const marginTopMM = (report?.margin_top ?? 2) * 10;
                    const marginBottomMM = (report?.margin_bottom ?? 0) * 10;
                    pdf.addImage(pageData, "PNG", 0, marginTopMM, imgWidth, pageImgHeight - marginTopMM - marginBottomMM);
                }

                heightLeft -= pageCanvas.height;
                position += pageCanvas.height;
            }

            window.open(pdf.output("bloburl"), "_blank");

            setTimeout(() => {
                tempDiv.remove();
            }, 1000);
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    });
});
