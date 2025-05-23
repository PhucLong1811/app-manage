const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
require('jquery-validation'); // Import jQuery Validation Plugin
const Swal = require('sweetalert2');

async function getDataFilePath(fileName) {
    return await ipcRenderer.invoke('get-data-file-path', fileName);
}
function addEditor() {
    tinymce.init({
        selector: "#editorCreateReport",
        // width: 798,
        height: 2000,
        // menubar: false,
        branding: false,
        language_url: '../../assets/language/tinymce-vi.js',
        language: 'vi',
        plugins: 'table',
        toolbar: 'formatselect | blocks fontfamily fontsize lineheight bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | table tableprops tablecellprops | customMargin lineheightCustom',
        toolbar_mode: 'wrap',
        font_size_formats: '8pt 9pt 10pt 11pt 12pt 13pt 14pt 15pt 16pt 17pt 18pt 19pt 20pt 21pt 22pt 23pt 24pt 36pt 48pt 72pt',
        line_height_formats: '0.5 1 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2 2.1 2.2 2.3 2.4 2.5',
        content_css: "../../assets/css/reset-word.css",
        content_style: `
        body {
                margin: 0;
                width: 794px;  /* Chiều rộng của giấy A4 */
                height: 1123px; /* Chiều cao của giấy A4 */
                font-size: 14pt;
                background: #fff;
            }
        `,
        // content_css: "../../assets/css/base.css",
        setup: function (editor) {
            // Khi TinyMCE được khởi tạo, bọc nội dung với thẻ div có id="document"
            editor.on('init', function () {
                const $body = $(editor.getBody()); // Lấy phần body của TinyMCE dưới dạng jQuery object
                const $documentDiv = $('<div>', { id: 'document' }); // Tạo thẻ div mới với id="document"

                // Di chuyển toàn bộ nội dung vào trong thẻ div
                $body.children().each(function () {
                    $documentDiv.append($(this)); // Di chuyển mỗi phần tử con vào trong thẻ div
                });

                // Thêm thẻ div vào body của TinyMCE
                $body.append($documentDiv); // Thêm div đã chứa nội dung vào trong body
            });
            editor.on('keydown', function (event) {
                if (event.key === 'Tab') {
                    event.preventDefault();

                    let tabSpaces = '    ';
                    editor.execCommand('mceInsertContent', false, tabSpaces);
                }
            });
            editor.ui.registry.addButton('customMargin', {
                text: 'Cài đặt lề',
                tooltip: 'Cài đặt lề',
                onAction: function () {
                    Swal.fire({
                        title: 'Cài đặt lề',
                        html: `
                            <div class="form-group">
                                <label for="topMargin">Lề trên:</label>
                                <input type="text" id="topMargin" value="2" class="swal2-input"><br>
                            </div>
                            <div class="form-group">
                                <label for="rightMargin">Lề phải:</label>
                                <input type="text" id="rightMargin" value="1.5" class="swal2-input"><br>
                            </div>
                            <div class="form-group">
                                <label for="bottomMargin">Lề dưới:</label>
                                <input type="text" id="bottomMargin" value="0" class="swal2-input"><br>
                            </div>
                            <div class="form-group">
                                <label for="leftMargin">Lề trái:</label>
                                <input type="text" id="leftMargin" value="3" class="swal2-input"><br>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Cập nhật',
                        cancelButtonText: 'Hủy',
                        preConfirm: () => {
                            const topMargin = $('#topMargin').val();
                            const rightMargin = $('#rightMargin').val();
                            const bottomMargin = $('#bottomMargin').val();
                            const leftMargin = $('#leftMargin').val();
                            $('#createForm #margin-top').val(topMargin)
                            $('#createForm #margin-right').val(rightMargin)
                            $('#createForm #margin-bottom').val(bottomMargin)
                            $('#createForm #margin-left').val(leftMargin)
                            // Áp dụng lề vào nội dung của TinyMCE
                            editor.getBody().style.marginTop = topMargin + 'cm';
                            editor.getBody().style.marginRight = rightMargin + 'cm';
                            editor.getBody().style.marginBottom = bottomMargin + 'cm';
                            editor.getBody().style.marginLeft = leftMargin + 'cm';
                            $('#document').css({
                                'margin-top': topMargin + 'cm',
                                'margin-right': rightMargin + 'cm',
                                'margin-bottom': bottomMargin + 'cm',
                                'margin-left': leftMargin + 'cm'
                            });
                        }
                    });
                }
            });
        }
    });
}

async function saveReport(title) {
    const reportFilePath = await getDataFilePath('report.json');
    const content = tinymce.get("editorCreateReport").getContent().trim();
    const topMargin = $('#createForm #margin-top').val();
    const rightMargin = $('#createForm #margin-right').val();
    const bottomMargin = $('#createForm #margin-bottom').val();
    const leftMargin = $('#createForm #margin-left').val();
    if (!content) {
        Swal.fire("Lỗi", "Nội dung biểu mẫu không được để trống!", "error");
        return;
    }

    let reports = [];
    if (fs.existsSync(reportFilePath)) {
        const fileData = fs.readFileSync(reportFilePath, "utf8");
        reports = fileData ? JSON.parse(fileData) : [];
    }

    const newReport = {
        id: Date.now(),
        title: title,
        content: content,
        margin_top: topMargin ?? 2,
        margin_right: rightMargin ?? 1.5,
        margin_bottom: bottomMargin ?? 0,
        margin_left: leftMargin ?? 3,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: ""
    };

    reports.push(newReport);

    fs.writeFile(reportFilePath, JSON.stringify(reports, null, 2), "utf8", (err) => {
        if (err) {
            console.error("Lỗi khi lưu biểu mẫu:", err);
            Swal.fire("Lỗi", "Không thể lưu biểu mẫu!", "error");
        } else {
            Swal.fire("Thành công", "Biểu mẫu đã được lưu!", "success").then(() => {
                ipcRenderer.send("report-list"); // Quay về danh sách biểu mẫu
            });
        }
    });
}

$(document).ready(function () {
    $('.btnBack').on('click', () => ipcRenderer.send('report-list'));
    addEditor();

    $("#createForm").validate({
        rules: {
            title: "required",
        },
        messages: {
            title: "Vui lòng nhập tên biểu mẫu!",
        },
        submitHandler: function (form) {
            let title = $("#title").val().trim();
            saveReport(title);
        }
    });
});
