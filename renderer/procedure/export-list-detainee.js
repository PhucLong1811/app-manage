async function showUserDataBySelect() {
    const dataFilePath = await getDataFilePath('data.json');
    try {
        const jsonData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
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

            const html = `
                <tr>
                    <td>${(index + 1).toString().padStart(2, '0')}</td>
                    <td>${user.last_name} ${user.first_name}</td>
                    <td>${user.gender}</td>
                    <td>${moment(user.birthdate, 'YYYY-MM-DD').format('YYYY')}</td>
                    <td>${user.hometown}</td>
                    <td>${user.permanent_address}</td>
                    <td>${user.ethnicity}</td>
                    <td>${user.nation}</td>
                    <td>${user.offense}</td>
                    <td>${formatDate(user.arrest_date)}</td>
                    <td>${user.note}</td>
                </tr>`;
            fragment.appendChild($(html)[0]);
        });
        $('#listDetaineeUser tbody').empty().append(fragment);
    });
}

function replaceInputsWithSpans(container) {
    container.find("input").each(function () {
        const value = $(this).val() || "";
        $(this).replaceWith(`<span>${value}</span>`);
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
    const originalListDetaineeUser = element.find("#listDetaineeUser");

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

    if (numberOfRows > 7 && numberOfRows < 11) {
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
    } else if (numberOfRows > 10) {
        const cardFooterClone = originalCardFooter.clone();
        const cardListDetaineeClone = originalListDetaineeUser.clone();

        tempDiv.find('#listDetaineeUser tbody tr').each(function (index) {
            if (index >= 10) $(this).remove();
        });

        cardListDetaineeClone.find('thead').remove();
        cardListDetaineeClone.find('tbody tr').each(function (index) {
            if (index < 10) $(this).remove();
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
    showUserDataBySelect();
    $('#selectPrisoner').on('change', function () {
        let ids = $(this).val();
        if (ids && ids.length === 0) {
            $('#listDetaineeUser tbody').empty();
            return;
        }
        if (ids) {
            loadUserData(ids);
        }
    });

    $("#exportListDetainee").on("click", exportToPDF);
});
