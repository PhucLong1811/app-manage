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
            language_url: '../assets/language/tinymce-vi.js',
            language: 'vi',
            plugins: 'table lists advlist',
            toolbar: 'formatselect | blocks fontfamily fontsizeinput | lineheight | bold italic underline | alignleft aligncenter alignright alignjustify | outdent indent | table | insertShortcode',
            toolbar_mode: 'wrap',
            fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt 72pt',
            content_style: "body { margin: 1rem }",
            content_css: "../assets/css/base.css",
            style_formats: [
                { title: 'Đoạn văn (P)', block: 'p' },
                { title: 'Tiêu đề 1', block: 'h1' },
                { title: 'Tiêu đề 2', block: 'h2' },
                { title: 'Tiêu đề 3', block: 'h3' },
                { title: 'Canh lề trái', selector: 'p', styles: { 'text-align': 'left' } },
                { title: 'Canh lề giữa', selector: 'p', styles: { 'text-align': 'center' } },
                { title: 'Canh lề phải', selector: 'p', styles: { 'text-align': 'right' } },
                { title: 'Canh đều hai bên', selector: 'p', styles: { 'text-align': 'justify' } }
            ],
            setup: function (editor) {
                // Thêm nút dropdown "Chèn Shortcode"
                editor.ui.registry.addMenuButton('insertShortcode', {
                    text: 'Chèn Shortcode',
                    fetch: function (callback) {
                        callback([
                            {
                                type: 'menuitem',
                                text: 'Tên đầy đủ',
                                onAction: function () {
                                    editor.insertContent('<span class="shortcode">[name]</span>');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Ngày sinh',
                                onAction: function () {
                                    editor.insertContent('<span class="shortcode">[birthday]</span>');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Email',
                                onAction: function () {
                                    editor.insertContent('<span class="shortcode">[email]</span>');
                                }
                            }
                        ]);
                    }
                });

                
                // Khi nhấn Tab, chèn khoảng trắng thay vì chuyển input
                editor.on('keydown', function (event) {
                    if (event.key === 'Tab') {
                        event.preventDefault(); // Chặn mặc định (di chuyển input)

                        let tabSpaces = '    '; // 4 khoảng trắng
                        editor.execCommand('mceInsertContent', false, tabSpaces);
                    }
                });
                // Khi lưu nội dung, loại bỏ <span> để lưu shortcode gọn gàng
                editor.on('GetContent', function (e) {
                    e.content = e.content
                        .replace(/<span class="shortcode">\[name\]<\/span>/g, '[name]')
                        .replace(/<span class="shortcode">\[birthday\]<\/span>/g, '[birthday]')
                        .replace(/<span class="shortcode">\[email\]<\/span>/g, '[email]');
                });
            }
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
                .attr({ href: pdfUrl, download: "BienBan.pdf" })
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
