const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const moment = require('moment');
require('jquery-validation');
const Swal = require('sweetalert2');

// Định dạng ngày tháng
function formatDateDMY(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

function formatDateYMD(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD');
}

// Khởi tạo TinyMCE
function addEditor(callback) {
    tinymce.init({
        selector: "#editorReport",
        width: 798,
        height: 2000,
        branding: false,
        language_url: '../../assets/language/tinymce-vi.js',
        language: 'vi',
        plugins: 'table',
        toolbar: 'formatselect | blocks fontfamily fontsizeinput lineheight bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | outdent indent | table tableprops tablecellprops | customMargin',
        toolbar_mode: 'wrap',
        fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt 72pt',
        content_style: `
        body {
                // margin: 2.5cm;
                // width: 794px;  /* Chiều rộng của giấy A4 */
                // height: 1123px; /* Chiều cao của giấy A4 */
            }
        `,
        setup: function (editor) {
            editor.on('keydown', function (event) {
                if (event.key === 'Tab') {
                    event.preventDefault();
                    editor.execCommand('mceInsertContent', false, '    '); // Thêm 4 dấu cách khi bấm Tab
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
                            $('#editForm #margin-top').val(topMargin)
                            $('#editForm #margin-right').val(rightMargin)
                            $('#editForm #margin-bottom').val(bottomMargin)
                            $('#editForm #margin-left').val(leftMargin)
                            // Áp dụng lề vào nội dung của TinyMCE
                            editor.getBody().style.marginTop = topMargin + 'cm';
                            editor.getBody().style.marginRight = rightMargin + 'cm';
                            editor.getBody().style.marginBottom = bottomMargin + 'cm';
                            editor.getBody().style.marginLeft = leftMargin + 'cm';
                        }
                    });
                }
            });
        },
        init_instance_callback: function (editor) {
            console.log("✅ TinyMCE đã khởi tạo!");
            if (callback) callback(); // Gọi callback sau khi TinyMCE sẵn sàng
        }
    });
}

// Tải dữ liệu báo cáo từ file JSON
function loadData(id) {
    const filePath = path.join(__dirname, "../..", "data", "report.json");
    if (!fs.existsSync(filePath)) return;

    const reports = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const report = reports.find((r) => r.id === id);

    if (!report) {
        $('#areaReport').html('<p style="color: red;">Không tìm thấy báo cáo!</p>');
        return;
    }

    $('#title').val(report.title);
    $('#editForm #margin-top').val(report.margin_top)
    $('#editForm #margin-right').val(report.margin_right)
    $('#editForm #margin-bottom').val(report.margin_bottom)
    $('#editForm #margin-left').val(report.margin_left)

    function trySetContent(retries = 5) {
        const editor = tinymce.get("editorReport");
        if (editor) {
            editor.setContent(report.content);
            editor.getBody().style.marginTop = report.margin_top + 'cm';
            editor.getBody().style.marginRight = report.margin_right + 'cm';
            editor.getBody().style.marginBottom = report.margin_bottom + 'cm';
            editor.getBody().style.marginLeft = report.margin_left + 'cm';
        } else if (retries > 0) {
            setTimeout(() => trySetContent(retries - 1), 300);
        } else {
            console.error("❌ Không thể set content vào TinyMCE!");
        }
    }

    trySetContent();
}
// Hàm cập nhật báo cáo trong file JSON
function updateReport(reportId, newTitle, newContent) {
    const filePath = path.join(__dirname, "../..", "data", "report.json");
    const topMargin = $('#editForm #margin-top').val();
    const rightMargin = $('#editForm #margin-right').val();
    const bottomMargin = $('#editForm #margin-bottom').val();
    const leftMargin = $('#editForm #margin-left').val();
    if (!fs.existsSync(filePath)) {
        Swal.fire("Lỗi", "Không tìm thấy file dữ liệu!", "error");
        return;
    }

    let reports = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const index = reports.findIndex(report => report.id === reportId);
    if (index === -1) {
        Swal.fire("Lỗi", "Không tìm thấy báo cáo cần cập nhật!", "error");
        return;
    }

    // Cập nhật dữ liệu
    reports[index].title = newTitle;
    reports[index].content = newContent;
    reports[index].margin_top = topMargin;
    reports[index].margin_right = rightMargin;
    reports[index].margin_bottom = bottomMargin;
    reports[index].margin_left = leftMargin;
    reports[index].updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

    fs.writeFile(filePath, JSON.stringify(reports, null, 2), "utf8", (err) => {
        if (err) {
            console.error("Lỗi khi cập nhật báo cáo:", err);
            Swal.fire("Lỗi", "Không thể cập nhật báo cáo!", "error");
        } else {
            Swal.fire("Thành công", "Báo cáo đã được cập nhật!", "success").then(() => {
                ipcRenderer.send("report-list"); // Chuyển về danh sách báo cáo sau khi cập nhật thành công
            });
        }
    });
}
// Khi document đã sẵn sàng
$(document).ready(function () {
    addEditor(() => {
        const reportId = sessionStorage.getItem('reportId');
        if (reportId) {
            loadData(JSON.parse(reportId));
        }
    });

    $('.btnBack').on('click', () => ipcRenderer.send('report-list'));

    ipcRenderer.on('edit-report-data', (event, item) => {
        sessionStorage.setItem('reportId', JSON.stringify(item));
        loadData(item);
    });

    $("#editForm").validate({
        rules: {
            title: "required",
        },
        messages: {
            title: "Vui lòng nhập tên biểu mẫu!",
        },
        submitHandler: function (form) {
            // Lấy dữ liệu từ form: tiêu đề và nội dung từ TinyMCE
            let title = $("#title").val().trim();
            let content = tinymce.get("editorReport").getContent().trim();
            let reportId = JSON.parse(sessionStorage.getItem("reportId")); // ID báo cáo cần cập nhật

            // Gọi hàm updateReport với dữ liệu mới
            updateReport(reportId, title, content);
        }
    });
});
