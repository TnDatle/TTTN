// Kiểm tra trạng thái đăng nhập của admin
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
        // Nếu admin chưa đăng nhập, chuyển hướng đến trang login
        window.location.href = "../login-admin/Loginadmin.html";
    } else {
        const adminname = localStorage.getItem('adminname');
        if (adminname) {
            console.log("Admin đã đăng nhập:", adminname);
        }
    }
}

// Kiểm tra đăng nhập khi tải trang admin
window.onload = checkAdminLogin;

document.addEventListener('DOMContentLoaded', function() {
    // Hàm xử lý đăng xuất
    function logoutAdmin() {
        // Hiển thị hộp thoại xác nhận
        const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất không?");
        
        if (confirmLogout) {
            // Xóa thông tin đăng nhập trong localStorage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('adminname');

            // Xóa lịch sử để ngăn quay lại trang admin sau khi đăng xuất
            history.replaceState(null, null, "Loginadmin.html");

            // Hiển thị thông báo đăng xuất thành công
            alert("Đăng xuất thành công!");

            // Chuyển hướng về trang đăng nhập
            window.location.href = "Loginadmin.html";
        }
    }

    // Lắng nghe sự kiện click vào thẻ <a>
    document.getElementById('logout-link').addEventListener('click', logoutAdmin);
});
