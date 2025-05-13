

async function showUserDataBySelect() {
    const dataFilePath = await getDataFilePath('data.json');
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        console.log(jsonData, 'jsonData')
        jsonData.forEach(({ id, last_name, first_name }) => {
            $('#selectPrisoner').append(`<option value="${id}">${last_name} ${first_name}</option>`);
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
async function loadUserData(ids) {
    const dataFilePath = await getDataFilePath('data.json');
    $.getJSON(dataFilePath, function (data) {
        const fragment = document.createDocumentFragment();
        ids.forEach((id, index) => {
            const user = data.find((data) => parseInt(data.id) === parseInt(id));
            if (!user) return;

            const html = `<tr>
                <td>${(index + 1).toString().padStart(2, '0')}</td>
                <td>${user.last_name}</td>
                <td>${user.first_name}</td>
                <td>${moment(user.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
                <td>${user.zone + '-' + user.cell}</td>
                <td>${user.offense}</td>
                <td>${formatDate(user.arrest_date)}</td>
                <td>${user.hometown}</td>
                <td><input type="text" class="inputStyle"></td>
            </tr>`;

            fragment.appendChild($(html)[0]);
        });

        $('#listVisitUser tbody').empty().append(fragment);
    });
}
function replaceInputsWithSpans(container) {
    container.find("input").each(function () {
        const $input = $(this);
        const value = $input.val() || "";
        if ($input.hasClass("date") && value === "") {
            $input.replaceWith(`<span>......</span>`);
        } else if ($input.hasClass("year") && value === "") {
            $input.replaceWith(`<span>..........</span>`);
        } else if ($input.hasClass("inputNumber") && value === "") {
            $input.replaceWith(`<span>..........</span>`);
        } else if ($input.hasClass("dateMonthYear") && value === "") {
            $input.replaceWith(`<span>......................</span>`);
        } else {
            $input.replaceWith(`<span>${value}</span>`);
        }
    });
}

function captureAndAddPage(tempDiv, extraDiv, imgWidth, pdf) {
    return html2canvas(extraDiv[0]).then((canvas) => {
        pdf.addPage();
        const extraHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, extraHeight);

        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');

        setTimeout(() => {
            tempDiv.remove();
            extraDiv.remove();
        }, 1000);
    });
}

function exportToPDF() {
    const element = $("#document");
    const originalCardFooter = element.find(".cardFooter");
    const originalListVisitUser = element.find("#listVisitUser");

    const tempDiv = element.clone();
    tempDiv.css({ position: "absolute", left: "-9999px", top: "0px" }).appendTo("body");

    replaceInputsWithSpans(tempDiv);

    const tableBodyRows = tempDiv.find("tbody tr");
    const numberOfRows = tableBodyRows.length;

    const handleExport = (canvas, imgWidth, imgHeight) => {
        const pdf = new jsPDF("landscape", "mm", "a4");
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
        return pdf;
    };

    if (numberOfRows > 7 && numberOfRows < 16) {
        const cardFooterClone = originalCardFooter.clone();
        replaceInputsWithSpans(cardFooterClone);
        tempDiv.find(".cardFooter").remove();

        html2canvas(tempDiv[0], { scale: 3 }).then((canvas) => {
            const pdf = handleExport(canvas, 297, (canvas.height * 297) / canvas.width);
            const extraDiv = $("<div id='document'></div>").append(cardFooterClone).css({ position: "absolute", left: "-9999px", top: "0" });
            $("body").append(extraDiv);

            setTimeout(() => {
                captureAndAddPage(tempDiv, extraDiv, 297, pdf);
            }, 200);
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    } else if (numberOfRows > 15) {
        const cardFooterClone = originalCardFooter.clone();
        const cardListDetaineeClone = originalListVisitUser.clone();

        tempDiv.find('#listVisitUser tbody tr').each(function (index) {
            if (index >= 15) $(this).remove();
        });

        cardListDetaineeClone.find('thead').remove();
        cardListDetaineeClone.find('tbody tr').each(function (index) {
            if (index < 15) $(this).remove();
        });

        replaceInputsWithSpans(cardFooterClone);
        tempDiv.find(".cardFooter").remove();

        html2canvas(tempDiv[0], { scale: 3 }).then((canvas) => {
            const pdf = handleExport(canvas, 297, (canvas.height * 297) / canvas.width);
            const extraDiv = $("<div id='document'></div>").append(cardListDetaineeClone).append(cardFooterClone).css({ position: "absolute", left: "-9999px", top: "0" });
            $("body").append(extraDiv);

            setTimeout(() => {
                captureAndAddPage(tempDiv, extraDiv, 297, pdf);
            }, 200);
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    } else {
        html2canvas(tempDiv[0], { scale: 3 }).then((canvas) => {
            const pdf = handleExport(canvas, 297, (canvas.height * 297) / canvas.width);
            pdf.autoPrint();
            window.open(pdf.output('bloburl'), '_blank');

            setTimeout(() => {
                tempDiv.remove();
            }, 1000);
        }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    }
}
$(document).ready(function () {
    $('#selectPrisoner').on('change', function () {
        let ids = $(this).val();
        if (ids && ids.length === 0) {
            $('#listVisitUser tbody').empty();
            return false;
        }
        if (ids) {
            loadUserData(ids);
        }
    })

    $("#exportListVisit").on("click", exportToPDF);
    // $("#exportListVisit").on("click", function () {
    //     const title = $(this).data('title') || 'Biên bản';
    //     const element = $("#document");

    //     // Clone khu vực cần xuất PDF
    //     const tempDiv = element.clone();

    //     // Chuyển input -> span để giữ giá trị nhập vào
    //     tempDiv.find("input").each(function () {
    //         const value = $(this).val() || "";
    //         $(this).replaceWith(`<span>${value}</span>`);
    //     });



    //     // Đặt tempDiv ra khỏi viewport
    //     tempDiv.css({ position: "absolute", left: "-9999px" }).appendTo("body");

    //     // Chuyển HTML thành ảnh và xuất PDF
    //     html2canvas(tempDiv[0]).then((canvas) => {
    //         const pdf = new jsPDF("landscape", "mm", "a4");
    //         const imgWidth = 297; // Chiều rộng trang A4 (mm)
    //         const imgHeight = (canvas.height * imgWidth) / canvas.width;

    //         pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);

    //         // In PDF thay vì tải xuống
    //         pdf.autoPrint();  // Kích hoạt tính năng in

    //         // Mở cửa sổ in ngay lập tức
    //         window.open(pdf.output('bloburl'), '_blank');

    //         setTimeout(() => {
    //             tempDiv.remove(); // Xóa phần tử tạm thời
    //         }, 1000); // Đợi 1 giây để đảm bảo việc xử lý hoàn tất
            
    //         // // ✅ Tạo Blob PDF để tải về ngay lập tức
    //         // const pdfBlob = pdf.output("blob");
    //         // const pdfUrl = URL.createObjectURL(pdfBlob);

    //         // // ✅ Tạo thẻ <a> để tải xuống và xóa sau khi sử dụng
    //         // const $a = $("<a>")
    //         //     .attr({ href: pdfUrl, download: `${title}.pdf` })
    //         //     .appendTo("body")
    //         //     .get(0);

    //         // $a.click();
    //         // $($a).remove(); // Xóa thẻ <a> sau khi click

    //         // setTimeout(() => {
    //         //     URL.revokeObjectURL(pdfUrl); // Giải phóng bộ nhớ
    //         //     tempDiv.remove(); // Xóa phần tử tạm thời

    //         // }, 1000); // Đợi 1 giây để đảm bảo tải xuống hoàn tất
    //     }).catch(error => console.error("Lỗi khi xuất PDF:", error));
    // });
    showUserDataBySelect();
});
