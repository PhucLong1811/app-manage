

async function showUserDataBySelect() {
    const dataFilePath = await getDataFilePath('data.json');
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        console.log(jsonData, 'jsonData')
        jsonData.forEach(({ id, last_name, first_name }) => {
            $('#selectUser15Percent').append(`<option value="${id}">${last_name} ${first_name}</option>`);
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
                <td>${user.last_name + ' ' + user.first_name}</td>
                <td>${moment(user.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
                <td>${user.hometown}</td>
                <td>${user.offense}</td>
                <td>${formatDate(user.arrest_date)}</td>
                <td><input type="text" class="inputStyle"></td>
            </tr>`;

            fragment.appendChild($(html)[0]);
        });

        $('#tableUser tbody').empty().append(fragment);
    });
}
$(document).ready(function () {
    $('#selectUser15Percent').on('change', function () {
        let id = $(this).val();
        console.log(id, 'idid')
        if (id && id.length === 0) {
            $('#tableUser tbody').empty();
            return false;
        }
        if (id) {
            loadUserData(id);
        }
    })
    $('#selectUser15Percent').on('select2:clear', function (e) {
        $('#tableUser tbody').empty();
    });
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

        // Nếu bảng có >= 2 hàng thì tách areaInfo + cardFooter sang trang khác
        if (rowsCount >= 2 && originalCardFooter.length) {
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
            html2canvas(tempDiv[0], { scale: 3 }).then((canvas1) => {
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

                        // Auto print and open in new window
                        pdf.autoPrint();
                        window.open(pdf.output('bloburl'), '_blank');

                        setTimeout(() => {
                            tempDiv.remove();
                            extraDiv.remove();
                        }, 1000);
                    });
                }, 200); // Đợi render DOM
            });
        } else {
            // Nếu < 2 hàng thì xuất bình thường
            html2canvas(tempDiv[0], { scale: 3 }).then((canvas) => {
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
                // Auto print and open in new window
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');

                setTimeout(() => {
                    tempDiv.remove();
                }, 1000);
            });
        }
    });
    showUserDataBySelect();
});
