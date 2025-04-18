


const $ = require('jquery');
const { saveAs } = require('file-saver');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const $ = require('jquery');
// Sự kiện xuất file Word
$('#exportWord').click(async function () {
    const receiver = $('#receiver').val();
    const summary = $('#summary').val();
    const proposer = $('#proposer').val();
    const receiverAgain = $('#receiverAgain').val();
    const mainContentHtml = tinymce.get('editor').getContent();

    // Lấy nội dung từ các TinyMCE động
    const extraFieldsHtml = [];
    $('.tinyEditor').each(function () {
        const editorInstance = tinymce.get($(this).attr('id'));
        if (editorInstance) {
            extraFieldsHtml.push(editorInstance.getContent());
        }
    });

    // Chuyển đổi nội dung TinyMCE thành đoạn văn bản Word
    const mainContentParagraphs = htmlToDocxParagraphs(mainContentHtml);
    const extraContentParagraphs = extraFieldsHtml.flatMap(htmlToDocxParagraphs);

    // Tạo tài liệu Word
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, alignment: "center" }),
                new Paragraph({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, alignment: "center" }),
                new Paragraph({ text: "-------------", alignment: "center", spacing: { after: 200 } }),
                new Paragraph({ text: `Kính gửi: ${receiver}`, spacing: { after: 100 } }),
                new Paragraph({ text: `Căn cứ các quy định pháp luật liên quan đến việc ${summary}, ${proposer} đề nghị ${receiverAgain} xem xét, giải quyết/thông báo một số nội dung sau:`, spacing: { after: 100 } }),
                new Paragraph({ text: "Nội dung chính:", bold: true, spacing: { after: 100 } }),
                ...mainContentParagraphs, // Giữ nguyên định dạng từ TinyMCE
                ...extraContentParagraphs, // Giữ nguyên định dạng từ các trường động
                new Paragraph({ text: "Trân trọng cảm ơn./.", spacing: { after: 200 } }),
                new Paragraph({ text: "THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ", bold: true, alignment: "right", spacing: { after: 100 } }),
                new Paragraph({ text: "(Ký tên, đóng dấu)", alignment: "right", spacing: { after: 100 } }),
            ],
        }],
    });

    // Xuất file
    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), "NoiDungDeNghi.docx");

    alert("Xuất file Word thành công!");
});

function htmlToDocxParagraphs(html) {
    const docxParagraphs = [];
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    tempDiv.childNodes.forEach(node => {
        if (node.nodeName === "P") {
            // Kiểm tra căn lề
            let alignment = AlignmentType.LEFT;
            if (node.style.textAlign === "center") alignment = AlignmentType.CENTER;
            if (node.style.textAlign === "right") alignment = AlignmentType.RIGHT;

            docxParagraphs.push(
                new Paragraph({
                    children: parseHtmlToDocxText(node),
                    alignment: alignment,
                    spacing: { after: 200 },
                })
            );
        } else if (node.nodeName === "UL") {
            const listItems = Array.from(node.getElementsByTagName("LI")).map(
                li =>
                    new Paragraph({
                        children: [new TextRun({ text: `• ${li.textContent}`, bold: false, size: 24 })],
                        spacing: { after: 100 },
                    })
            );
            docxParagraphs.push(...listItems);
        } else if (node.nodeName === "OL") {
            let counter = 1;
            const listItems = Array.from(node.getElementsByTagName("LI")).map(
                li =>
                    new Paragraph({
                        children: [new TextRun({ text: `${counter++}. ${li.textContent}`, bold: false, size: 24 })],
                        spacing: { after: 100 },
                    })
            );
            docxParagraphs.push(...listItems);
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") {
            docxParagraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: node.textContent, size: 24, spacing: { after: 100 } })],
                })
            );
        }
    });

    return docxParagraphs;
}

// Hàm chuyển HTML inline thành TextRun có định dạng
// Hàm chuyển HTML inline thành TextRun có định dạng, giữ lại font size
function parseHtmlToDocxText(node) {
const textRuns = [];

node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
        textRuns.push(new TextRun({ text: child.textContent }));
    } else if (child.nodeName === "B" || child.nodeName === "STRONG") {
        textRuns.push(new TextRun({ text: child.textContent, bold: true }));
    } else if (child.nodeName === "I" || child.nodeName === "EM") {
        textRuns.push(new TextRun({ text: child.textContent, italics: true }));
    } else if (child.nodeName === "BR") {
        textRuns.push(new TextRun({ break: 1 })); // Xuống dòng
    } else {
        let fontSize = 24; // Kích thước mặc định (12pt)
        
        // Lấy font size từ style nếu có
        if (child.style && child.style.fontSize) {
            const fontSizeMatch = child.style.fontSize.match(/\d+/);
            if (fontSizeMatch) {
                fontSize = parseInt(fontSizeMatch[0]) * 2; // Chuyển px -> Half-Point (Word dùng đơn vị này)
            }
        }

        textRuns.push(
            new TextRun({ text: child.textContent, size: fontSize })
        );
    }
});

return textRuns;
}