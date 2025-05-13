

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
        const title = $(this).data("title") || "Biên bản";
        const element = $("#document");
        const rowsCount = element.find("table tr").length;
        const originalCardFooter = element.find(".cardFooter");
        const originalAreaInfo = element.find(".cardBody .areaInfoLast");
    
        // Clone element và chuyển input -> span
        const tempDiv = cloneAndConvertInputs(element);
        tempDiv.css({ position: "absolute", left: "-9999px", top: "0" });
        $("body").append(tempDiv);
    
        const imgWidth = 210;
    
        // Hàm render canvas -> pdf
        function renderToPDF(canvas, pdf, addNewPage = false) {
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            if (addNewPage) pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
        }
    
        // Hàm xử lý hiển thị và in PDF
        function finalizePDF(pdf) {
            pdf.autoPrint();
            window.open(pdf.output("bloburl"), "_blank");
        }
    
        // Hàm tạo canvas từ div
        function createCanvasFromElement(div, callback) {
            html2canvas(div[0], { scale: 3 }).then(callback);
        }
    
        // Hàm clone và chuyển input -> span
        function cloneAndConvertInputs(source) {
            const clone = source.clone();
            clone.find("input").each(function () {
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
            return clone;
        }
    
        if (rowsCount < 3) {
            createCanvasFromElement(tempDiv, (canvas) => {
                const pdf = new jsPDF("p", "mm", "a4");
                renderToPDF(canvas, pdf);
                finalizePDF(pdf);
                setTimeout(() => tempDiv.remove(), 1000);
            });
        } else {
            let extraDiv;
    
            const pdf = new jsPDF("p", "mm", "a4");
            let canvas1Done = false;
    
            const cardFooterClone = cloneAndConvertInputs(originalCardFooter);
            const areaInfoClone = cloneAndConvertInputs(originalAreaInfo);
    
            if (rowsCount === 3 && originalCardFooter.length) {
                tempDiv.find(".cardFooter .note").remove();
                cardFooterClone.find(".signature").remove();
                extraDiv = $("<div id='document'></div>").append(cardFooterClone);
            }
    
            if (rowsCount >= 6) {
                tempDiv.find(".areaInfoLast, .cardFooter").remove();
                extraDiv = $("<div id='document'></div>").append(areaInfoClone, cardFooterClone);
            } else if (rowsCount > 3) {
                tempDiv.find(".cardFooter").remove();
                extraDiv = $("<div id='document'></div>").append(cardFooterClone);
            }
    
            if (extraDiv) {
                extraDiv.css({ position: "absolute", left: "-9999px", top: "0" });
                $("body").append(extraDiv);
            }
    
            createCanvasFromElement(tempDiv, (canvas1) => {
                renderToPDF(canvas1, pdf);
    
                if (extraDiv) {
                    setTimeout(() => {
                        createCanvasFromElement(extraDiv, (canvas2) => {
                            renderToPDF(canvas2, pdf, true);
                            finalizePDF(pdf);
                            setTimeout(() => {
                                tempDiv.remove();
                                extraDiv.remove();
                            }, 1000);
                        });
                    }, 200);
                } else {
                    finalizePDF(pdf);
                    setTimeout(() => tempDiv.remove(), 1000);
                }
            });
        }
    });
    
    showUserDataBySelect();
});
