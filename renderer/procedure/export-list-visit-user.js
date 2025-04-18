

function showUserDataBySelect() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        console.log(jsonData,'jsonData')
        jsonData.forEach(({ id, last_name, first_name }) => {
            $('#selectPrisoner').append(`<option value="${id}">${last_name} ${first_name}</option>`);
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
function loadUserData(id) {
    $.getJSON(dataFilePath, function (data) {
        const user = data.find((data) => parseInt(data.id) === parseInt(id));
        if (!user) return;

        const index = $('#listVisitUser tbody tr').length + 1;

        const html = `<tr>
            <td>${index.toString().padStart(2, '0')}</td>
            <td>${user.last_name}</td>
            <td>${user.first_name}</td>
            <td>${moment(user.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
            <td>${user.cell}</td>
            <td>${user.offense}</td>
            <td>${formatDate(user.arrest_date)}</td>
            <td>${user.hometown}</td>
            <td><input type="text" class="inputStyle"></td>
        </tr>`;
        
        $('#listVisitUser tbody').append(html);
    });
}
$(document).ready(function () {
    $('#selectPrisoner').on('change', function () {
        let id = $(this).val();
        loadUserData(id)
    })
    $("#exportListVisit").on("click", function () {
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
        html2canvas(tempDiv[0]).then((canvas) => {
            const pdf = new jsPDF("landscape", "mm", "a4");
            const imgWidth = 297; // Chiều rộng trang A4 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);

            // ✅ Tạo Blob PDF để tải về ngay lập tức
            const pdfBlob = pdf.output("blob");
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // ✅ Tạo thẻ <a> để tải xuống và xóa sau khi sử dụng
            const $a = $("<a>")
                .attr({ href: pdfUrl, download: `${title}.pdf` })
                .appendTo("body")
                .get(0);

            $a.click();
            $($a).remove(); // Xóa thẻ <a> sau khi click

            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl); // Giải phóng bộ nhớ
                tempDiv.remove(); // Xóa phần tử tạm thời

            }, 1000); // Đợi 1 giây để đảm bảo tải xuống hoàn tất
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    });
    showUserDataBySelect();
});
