// const $ = require('jquery');
// require('select2');
const { ipcRenderer } = require('electron');
const path = require('path');
const moment = require('moment');
const { jsPDF } = require("jspdf");
const fs = require('fs');
const html2canvas = require("html2canvas");

const dataFilePath = path.join(__dirname, '../..', 'data', 'data.json');
function formatDate(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}
function showUserDataBySelect() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        jsonData.forEach(({ id, last_name, first_name }) => {
            $('#selectUserData').append(`<option value="${id}">${last_name} ${first_name}</option>`);
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
function loadUserData(id) {
    const today = moment().format("[ngày] DD [tháng] MM [năm] YYYY");
    $('.today').text(today);
    $.getJSON(dataFilePath, function (data) {
        const user = data.find((data) => parseInt(data.id) === parseInt(id));
        if (!user) return;
        $('.info #arrest_warrant').text(user.arrest_warrant || '');
        $('.info #full_name').text(user.last_name + ' ' + user.first_name);
        $('.info #gender').text(user.gender || '');
        $('.info #birthYear').text(moment(user.birthdate, 'YYYY-MM-DD').format('YYYY') || '');
        $('.info #hometown').text(user.hometown || '');
        $('.info #ethnicity').text(user.ethnicity || '');
        $('.info #nation').text(user.nation || '');
        $('.info #hometown').text(user.hometown || '');
        $('.info #permanent_address').text(user.permanent_address || '');
        $('.info #arrest_date').text(formatDate(user.arrest_date) || '');
        $('.info #prison_entry').text(formatDate(user.prison_entry) || '');
        $('.info #handling_agency').text(user.handling_agency || '');
        $('.info #offense').text(user.offense || '');
        $('.info #cell').text(user.cell || '');
        $('.info #zone').text(user.zone || '');
    });
}
function updatePadding() {

    let top = $("#paper-margin-top").val() === "" ? 0 : $("#paper-margin-top").val();
    let bottom = $("#paper-margin-bottom").val() === "" ? 0 : $("#paper-margin-bottom").val();
    let left = $("#paper-margin-left").val() === "" ? 0 : $("#paper-margin-left").val();
    let right = $("#paper-margin-right").val() === "" ? 0 : $("#paper-margin-right").val();

    $("#document").css({
        "padding-top": top + "cm",
        "padding-bottom": bottom + "cm",
        "padding-left": left + "cm",
        "padding-right": right + "cm"
    });
}
$(document).ready(function () {
    $('.select2').select2({
        placeholder: "Chọn phạm nhân",
    });
    $('#btnBack').on('click', () => {
        ipcRenderer.send('procedure-list');
    });
    $("#selectMarginFile input").on("input", updatePadding);
    $('#selectUserData').on('change', function () {
        let id = $(this).val();
        loadUserData(id)
    })

    $("#exportPdf").on("click", function () {
        const title = $(this).data('title') || 'Biên bản';
        const element = $("#document");

        // Clone khu vực cần xuất PDF
        const tempDiv = element.clone();

        // Chuyển input -> span để giữ giá trị nhập vào
        tempDiv.find("input").each(function () {
            const value = $(this).val() || "";
            $(this).replaceWith(`<span>${value}</span>`);
        });



        // Đặt tempDiv ra khỏi viewport
        tempDiv.css({ position: "absolute", left: "-9999px" }).appendTo("body");

        // Chuyển HTML thành ảnh và xuất PDF
        html2canvas(tempDiv[0], { scale: 3 }).then((canvas) => {
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210; // Chiều rộng trang A4 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
            // In PDF thay vì tải xuống
            pdf.autoPrint();  // Kích hoạt tính năng in

            // Mở cửa sổ in ngay lập tức
            window.open(pdf.output('bloburl'), '_blank');

            setTimeout(() => {
                tempDiv.remove(); // Xóa phần tử tạm thời
            }, 1000); // Đợi 1 giây để đảm bảo việc xử lý hoàn tất
            
            // // ✅ Tạo Blob PDF để tải về ngay lập tức
            // const pdfBlob = pdf.output("blob");
            // const pdfUrl = URL.createObjectURL(pdfBlob);

            // // ✅ Tạo thẻ <a> để tải xuống và xóa sau khi sử dụng
            // const $a = $("<a>")
            //     .attr({ href: pdfUrl, download: `${title}.pdf` })
            //     .appendTo("body")
            //     .get(0);

            // $a.click();
            // $($a).remove(); // Xóa thẻ <a> sau khi click

            // setTimeout(() => {
            //     URL.revokeObjectURL(pdfUrl); // Giải phóng bộ nhớ
            //     tempDiv.remove(); // Xóa phần tử tạm thời

            //     // ✅ Hiển thị thông báo khi tải xuống hoàn tất
            //     // Swal.fire({
            //     //     icon: "success",
            //     //     title: "Thành công!",
            //     //     text: "Tệp PDF đã được tải về!",
            //     //     timer: 2000,
            //     //     showConfirmButton: false
            //     // });

            // }, 1000); // Đợi 1 giây để đảm bảo tải xuống hoàn tất
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    });
    showUserDataBySelect();
});
