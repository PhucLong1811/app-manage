const fs = require('fs');
const { saveAs } = require('file-saver');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const $ = require('jquery');
const { ipcRenderer } = require('electron');
const path = require('path');
const moment = require('moment');
const { jsPDF } = require("jspdf");
const html2canvas = require("html2canvas");

const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');
function formatDate(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
$(document).ready(function () {
    $('#btnBack').on('click', () => {
        ipcRenderer.send('open-list');
    });

    let storedItem = sessionStorage.getItem('selectedItem');
    if (storedItem) {
        loadUserData(JSON.parse(storedItem));
    }

    ipcRenderer.on('user-report', (event, item) => {
        sessionStorage.setItem('selectedItem', JSON.stringify(item));
        loadUserData(item);
    });

    function loadUserData(item) {
        const today = moment().format("[ngày] DD [tháng] MM [năm] YYYY");
        $('.today').text(today);
        $.getJSON(dataFilePath, function (data) {
            const user = data.find((data) => data.id === item);
            if (!user) return;

            $('.info #full_name').val(user.full_name || '');
            $('.info #gender').val(user.gender || '');
            $('.info #birthYear').val(moment(user.birthdate, 'YYYY-MM-DD').format('YYYY') || '');
            $('.info #hometown').val(user.hometown || '');
            $('.info #permanent_address').val(user.permanent_address || '');
            $('.info #arrest_date').val(formatDate(user.arrest_date) || '');
            $('.info #cell').val(user.cell || '');
            $('.info #zone').val(user.zone || '');
        });
    }

    // Biến đếm để đặt ID duy nhất cho mỗi editor mới
    let editorCount = 0;

    // Hàm khởi tạo Editor mới
    function addEditor(position) {
        editorCount++;
        const editorId = `editor${editorCount}`;
        const editorContainer = $(`#areaEditor${position}`);
        const textarea = $(`<textarea id="${editorId}"></textarea>`);
        editorContainer.append(textarea);

        // Khởi tạo TinyMCE cho textarea mới
        tinymce.init({
            selector: `#${editorId}`,
            height: 300,
            menubar: false,
            branding: false,
            plugins: 'table lists advlist',
            toolbar: 'formatselect | fontsizeinput | bold italic underline | alignleft aligncenter alignright alignjustify | outdent indent | bullist | table',
            toolbar_mode: 'wrap',
            fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt 72pt',
            content_style: "body { margin: 1rem }",
            content_css: "../assets/css/base.css"
        });
    }

    // Thêm Editor khi nhấn vào nút trên areaTitle
    $('#addEditorBefore').on('click', function () {
        addEditor('Before');
    });

    // Thêm Editor khi nhấn vào nút dưới cardInfo
    $('#addEditorAfter').on('click', function () {
        addEditor('After');
    });

    $("#exportPdf").on("click", function () {
        const element = $("#textPdf");

        // Clone khu vực cần xuất PDF
        const tempDiv = element.clone();

        // Chuyển input -> span để giữ giá trị nhập vào
        tempDiv.find("input").each(function () {
            const value = $(this).val() || "";
            $(this).replaceWith(`<span>${value}</span>`);
        });

        // Chuyển textarea -> div giữ nội dung từ TinyMCE
        tempDiv.find("textarea").each(function () {
            const editor = tinymce.get(this.id);
            if (editor) {
                $(this).replaceWith(`<div>${editor.getContent()}</div>`);
            }
        });

        // Xóa các thành phần không cần thiết
        tempDiv.find(".tox-tinymce, .areaAddEditor, .tinymce-toolbar").remove();

        // Đặt tempDiv ra khỏi viewport
        tempDiv.css({ position: "absolute", left: "-9999px" }).appendTo("body");

        // Chuyển HTML thành ảnh và xuất PDF
        html2canvas(tempDiv[0], { scale: 2 }).then((canvas) => {
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210; // Chiều rộng trang A4 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);

            // ✅ Tạo Blob PDF để tải về ngay lập tức
            const pdfBlob = pdf.output("blob");
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // ✅ Tạo thẻ <a> để tải xuống và xóa sau khi sử dụng
            const $a = $("<a>")
                .attr({ href: pdfUrl, download: "document.pdf" })
                .appendTo("body")
                .get(0);

            $a.click();
            $($a).remove(); // Xóa thẻ <a> sau khi click

            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl); // Giải phóng bộ nhớ
                tempDiv.remove(); // Xóa phần tử tạm thời

                // ✅ Hiển thị thông báo khi tải xuống hoàn tất
                // Swal.fire({
                //     icon: "success",
                //     title: "Thành công!",
                //     text: "Tệp PDF đã được tải về!",
                //     timer: 2000,
                //     showConfirmButton: false
                // });

            }, 1000); // Đợi 1 giây để đảm bảo tải xuống hoàn tất
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    });
});
