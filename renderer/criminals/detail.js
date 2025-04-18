const $ = require('jquery');
const { ipcRenderer } = require('electron');
const path = require('path');
const moment = require('moment');

const dataFilePath = path.join(__dirname, '../..', 'data', 'data.json');
const dataUserPath = path.join(__dirname, '../..', 'data', 'user.json');
/**
 * Chuyển đổi ngày từ 'YYYY-MM-DD' về 'DD/MM/YYYY' để lưu vào JSON
 * @param {string} dateStr - Ngày dưới dạng chuỗi 'YYYY-MM-DD'
 * @returns {string} - Ngày theo định dạng 'DD/MM/YYYY'
 */
function formatDate(dateStr) {
    return moment(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

$(document).ready(function () {
    $('#btnBack').on('click', () => {
        ipcRenderer.send('open-list');
    });
    $('.edit-btn').on('click', function () {
        const id = $(this).data('id');
        $.getJSON(dataFilePath, function(data) {
            const selectedItem = data.find(item => item.id === parseInt(id));
            console.log(id,'data')
            if (selectedItem) {
                ipcRenderer.send('open-edit', selectedItem);
            }
        })
    });

    let storedItem = sessionStorage.getItem('selectedItem');
    if (storedItem) {
        loadUserData(JSON.parse(storedItem));
    }

    ipcRenderer.on('load-detail', (event, item) => {
        sessionStorage.setItem('selectedItem', JSON.stringify(item));
        loadUserData(item);
    });

    function loadUserData(item) {
        $.getJSON(dataFilePath, function (data) {
            const user = data.find((data) => data.id === item);
            if (!user) return;
    
            // Lấy danh sách tất cả người dùng
            $.getJSON(dataUserPath, function (users) {
                const createdByUser = users.find((val) => val.id === user.created_by_user);
                const updatedByUser = users.find((val) => val.id === user.updated_by_user);
    
                $('.edit-btn').attr('data-id', user.id);
                $('.areaDetail #full_name').text(user.last_name + ' ' + user.first_name || '');
                $('.areaDetail #gender').text(user.gender || '');
                $('.areaDetail #birthdate').text(formatDate(user.birthdate) || '');
                $('.areaDetail #ethnicity').text(user.ethnicity || '');
                $('.areaDetail #nation').text(user.nation || '');
                $('.areaDetail #hometown').text(user.hometown || '');
                $('.areaDetail #permanent_address').text(user.permanent_address || '');
                $('.areaDetail #cell').text(user.cell || '');
                $('.areaDetail #zone').text(user.zone || '');
                $('.areaDetail #offense').text(user.offense || '');
                $('.areaDetail #prison_entry').text(formatDate(user.prison_entry) || '');
                $('.areaDetail #arrest_date').text(formatDate(user.arrest_date) || '');
                $('.areaDetail #arrest_warrant').text(user.arrest_warrant || '');
                $('.areaDetail #handling_agency').text(user.handling_agency || '');
                $(".areaDetail #comment").text(moment(user.comment, 'YYYY-MM').format('MM/YYYY') || '');
                $('.areaDetail #no_visit').text(user.no_visit || '');
                $('.areaDetail #no_visit_date').text(user.no_visit_date || '');
                $('.areaDetail #disease').text(user.disease || '');
                $(".areaDetail #note").html((user.note || "").replace(/\n/g, "<br>"));
                $('.areaDetail #visit').text(formatDate(user.visit) || '');
                $('.areaDetail #send').text(formatDate(user.send) || '');
    
                // Hiển thị thông tin người tạo & cập nhật
                $('.areaDetail #created_by_user').text(createdByUser ? createdByUser.username : '');
                $('.areaDetail #updated_by_user').text(updatedByUser ? updatedByUser.username : '');
            });
        });
    }
    
});
