$(document).ready(function () {
    $('#listVisitUser').on('click', function () {
        ipcRenderer.send("navigate-to-procedure", "export-list-visit-user");
    })
});