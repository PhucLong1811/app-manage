

function showUserDataBySelect() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        console.log(jsonData,'jsonData')
        jsonData.forEach(({ id, last_name, first_name }) => {
            $('#selectUser15Percent').append(`<option value="${id}">${last_name} ${first_name}</option>`);
        });
    } catch (error) {
        console.error("Lỗi:", error);
    }
}
function loadUserData(id) {
    $.getJSON(dataFilePath, function (data) {
        const user = data.find((data) => parseInt(data.id) === parseInt(id));
        if (!user) return;

        const index = $('#tableUser tbody tr').length + 1;

        const html = `<tr>
            <td>${index.toString().padStart(2, '0')}</td>
            <td>${user.last_name + ' ' + user.first_name}</td>
            <td>${moment(user.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
            <td>${user.hometown}</td>
            <td>${user.offense}</td>
            <td>${formatDate(user.arrest_date)}</td>
            <td><input type="text" class="inputStyle"></td>
        </tr>`;
        
        $('#tableUser tbody').append(html);
    });
}
$(document).ready(function () {
    $('#selectUser15Percent').on('change', function () {
        let id = $(this).val();
        loadUserData(id)
    })
    $("#export15PercentPdf").on("click", function () {
        const title = $(this).data('title') || 'Biên bản';
        const element = $("#document");
        const originalCardFooter = element.find(".cardFooter");
        const originalAreaInfo = element.find(".cardBody .areaInfoLast");
    
        // Đếm số hàng của bảng
        const rowsCount = element.find("table tr").length;
    
        // Clone gốc
        const tempDiv = element.clone();
    
        // Chuyển input -> span
        tempDiv.find("input").each(function () {
            const value = $(this).val() || "";
            $(this).replaceWith(`<span>${value}</span>`);
        });
    
        // Gắn tempDiv tạm vào body
        tempDiv.css({ position: "absolute", left: "-9999px", top: "0" });
        $("body").append(tempDiv);
    
        // Nếu bảng có >= 4 hàng thì tách areaInfo + cardFooter sang trang khác
        if (rowsCount >= 4 && originalCardFooter.length) {
            // Clone areaInfo & cardFooter
            const areaInfoClone = originalAreaInfo.clone();
            const cardFooterClone = originalCardFooter.clone();
    
            // Chuyển input -> span trong areaInfoClone
            areaInfoClone.find("input").each(function () {
                const value = $(this).val() || "";
                $(this).replaceWith(`<span>${value}</span>`);
            });
    
            // Chuyển input -> span trong cardFooterClone
            cardFooterClone.find("input").each(function () {
                const value = $(this).val() || "";
                $(this).replaceWith(`<span>${value}</span>`);
            });
    
            // Bỏ areaInfo & cardFooter khỏi bản chính
            tempDiv.find(".areaInfoLast").remove();
            tempDiv.find(".cardFooter").remove();
    
            // Export phần chính (không có areaInfo và footer)
            html2canvas(tempDiv[0]).then((canvas1) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const imgHeight = (canvas1.height * imgWidth) / canvas1.width;
                pdf.addImage(canvas1.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
    
                // Tạo div chứa areaInfo + cardFooter
                const extraDiv = $("<div id='document'></div>")
                    .append(areaInfoClone)
                    .append(cardFooterClone);
                extraDiv.css({ position: "absolute", left: "-9999px", top: "0" });
                $("body").append(extraDiv);
    
                setTimeout(() => {
                    html2canvas(extraDiv[0]).then((canvas2) => {
                        pdf.addPage();
                        const extraHeight = (canvas2.height * imgWidth) / canvas2.width;
                        pdf.addImage(canvas2.toDataURL("image/png"), "PNG", 0, 0, imgWidth, extraHeight);
    
                        const pdfBlob = pdf.output("blob");
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        const $a = $("<a>")
                            .attr({ href: pdfUrl, download: `${title}.pdf` })
                            .appendTo("body")
                            .get(0);
    
                        $a.click();
                        $($a).remove();
    
                        setTimeout(() => {
                            URL.revokeObjectURL(pdfUrl);
                            tempDiv.remove();
                            extraDiv.remove();
                        }, 1000);
                    });
                }, 200); // Đợi render DOM
            });
        } else {
            // Nếu < 4 hàng thì xuất bình thường
            html2canvas(tempDiv[0]).then((canvas) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
                pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
                const pdfBlob = pdf.output("blob");
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const $a = $("<a>")
                    .attr({ href: pdfUrl, download: `${title}.pdf` })
                    .appendTo("body")
                    .get(0);
    
                $a.click();
                $($a).remove();
    
                setTimeout(() => {
                    URL.revokeObjectURL(pdfUrl);
                    tempDiv.remove();
                }, 1000);
            });
        }
    });
    showUserDataBySelect();
});
