// delivery.js

// Import Firebase modules
import { db, auth } from '../../routes/Firebase-Config.js';
import {  doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


// Firebase configuration


// Hàm để lấy thông tin sản phẩm từ Firestore
async function getProductById(productId) {
    const categories = ['laptop', 'accessories'];

    for (const category of categories) {
        const docRef = doc(db, "products", category, "items", productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data(); // Trả về dữ liệu sản phẩm
        }
    }

    console.log("Không tìm thấy sản phẩm:", productId);
    return null; // Trả về null nếu không tìm thấy
}


// Hàm để tính phí ship
function calculateShippingFee(district) {
    const shippingFees = {
        
    };

    return shippingFees[district] || 0; // Trả về 0 nếu quận không có trong danh sách
}


// Hàm để hiển thị giỏ hàng trong delivery.html
async function displayCartInDelivery() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const deliveryContentRight = document.querySelector('.delivery-content-right');

    // Xóa nội dung cũ
    deliveryContentRight.innerHTML = '';

    // Tạo bảng để hiển thị giỏ hàng
    const table = document.createElement('table');
    table.id = "cart-table"; // Đặt ID cho bảng
    table.innerHTML = `
        <tr>
            <th>Tên sản phẩm</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
        </tr>
    `;

    let total = 0;

    for (const item of cart) {
        const product = await getProductById(item.id); // Gọi hàm lấy thông tin sản phẩm
        if (product) {
            const subtotal = product.price * item.quantity;
            total += subtotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${item.quantity}</td>
                <td>${subtotal.toLocaleString('vi-VN')}đ</td>
            `;
            table.appendChild(row);
        }
    }

    // Thêm tổng tiền vào bảng
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td style="font-weight: bold;" colspan="2">Tổng</td>
               <td style="font-weight: bold;">${total.toLocaleString('vi-VN')}đ</td>
    `;
    table.appendChild(totalRow);

    // Lấy quận từ dropdown
    const selectedDistrict = document.getElementById("districtDropdown").value;
    const shippingFee = calculateShippingFee(selectedDistrict);
    
    // Thêm phí ship vào bảng
    const shippingRow = document.createElement('tr');
    shippingRow.innerHTML = `
        <td style="font-weight: bold;" colspan="2">Phí ship</td>
        <td style="font-weight: bold;">${shippingFee.toLocaleString('vi-VN')}đ</td>
    `;
    table.appendChild(shippingRow);

    // Cập nhật tổng tiền bao gồm phí ship
    const grandTotal = total + shippingFee;
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.innerHTML = `
        <td style="font-weight: bold;" colspan="2">Tổng cộng</td>
        <td style="font-weight: bold;">${grandTotal.toLocaleString('vi-VN')}đ</td>
    `;
    table.appendChild(grandTotalRow);

    // Thêm bảng vào giao diện
    deliveryContentRight.appendChild(table);
}

// Hàm để lưu đơn hàng vào Firestore
async function saveOrder(orderData) {
    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Đơn hàng đã được lưu với ID: ", docRef.id);
        alert("Bạn đã đặt hàng thành công !");
        window.location.href = "../home.html"; // Chuyển hướng về trang chủ (home)
    } catch (e) {
        console.error("Lỗi khi lưu đơn hàng: ", e);
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
}

// Hàm kiểm tra số điện thoại với mã vùng +84 (có số 0 ở đầu trong số điện thoại Việt Nam)
function validatePhoneNumber(phone) {
    const phoneRegex = /^(0\d{9}|\+84\d{9})$/; // Kiểm tra số điện thoại bắt đầu với 0 hoặc +84 và có 9 chữ số sau đó
    return phoneRegex.test(phone);
}



// Hàm để xử lý khi người dùng nhấn nút thanh toán
async function submitOrder() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert("Bạn cần đăng nhập để đặt hàng!");
        return;
    }

    const useremail = currentUser.email;
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const provinceSelect = document.getElementById("provinceDropdown");
    const province = provinceSelect.options[provinceSelect.selectedIndex].text;
    const district = document.getElementById("districtDropdown").value;
    const ward = document.getElementById("wardInput").value.trim();
    const address = document.getElementById("addressInput").value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Kiểm tra xem tất cả các ô nhập liệu đã được điền chưa
    if (!fullName || !phone || !province || !district || !ward || !address || !paymentMethod) {
        alert("Vui lòng nhập đầy đủ thông tin giao hàng và chọn phương thức thanh toán!");
        return;
    }

    // Kiểm tra số điện thoại hợp lệ
    if (!validatePhoneNumber(phone)) {
        alert("Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại có 10 số.");
        return;
    }

    // Kiểm tra giỏ hàng có sản phẩm không
    if (cart.length === 0) {
        alert("Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi đặt hàng.");
        return;
    }

    let total = 0;
    const items = [];

    for (const item of cart) {
        const product = await getProductById(item.id);
        if (product) {
            const subtotal = product.price * item.quantity;
            total += subtotal;
            items.push({
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                subtotal: subtotal,
            });
        }
    }

    // Lấy phí ship
    const shippingFee = calculateShippingFee(district);
    const grandTotal = total + shippingFee;

    // Tạo đối tượng đơn hàng
    const orderData = {
        useremail,
        fullName,
        phone,
        province,
        district,
        ward,
        address,
        items,
        total: grandTotal,
        shippingFee,
        createdAt: new Date(),
        orderId: `ORDER-${Date.now()}`,
        status: "Đang chờ tiếp nhận",
        payment: paymentMethod.value // Lấy giá trị của radio button
    };

    // Lưu đơn hàng vào Firestore
    await saveOrder(orderData);
}

let allProvinces = []; // Biến lưu trữ tất cả tỉnh và quận để tái sử dụng

// Hàm tải danh sách tỉnh/thành và quận/huyện từ Open API
async function loadProvinces() {
    try {
        const response = await fetch("https://provinces.open-api.vn/api/?depth=2");
        const data = await response.json();

        allProvinces = data; // Lưu lại dữ liệu để dùng khi chọn tỉnh
        const provinceDropdown = document.getElementById("provinceDropdown");

        data.forEach(province => {
            const option = document.createElement("option");
            option.value = province.code; // province.code là ID của tỉnh
            option.text = province.name;
            provinceDropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh/thành:", error);
    }
}

// Hàm xử lý khi người dùng chọn tỉnh -> hiện danh sách quận/huyện
function loadDistricts(provinceID) {
    const selectedProvince = allProvinces.find(p => p.code == provinceID);
    const districtDropdown = document.getElementById("districtDropdown");

    districtDropdown.innerHTML = '<option value="">--Chọn quận/huyện--</option>';

    if (selectedProvince && selectedProvince.districts) {
        selectedProvince.districts.forEach(district => {
            const option = document.createElement("option");
            option.value = district.name;
            option.text = district.name;
            districtDropdown.appendChild(option);
        });
    }
}

// Gọi hàm loadProvinces khi trang được tải
document.addEventListener("DOMContentLoaded", loadProvinces);

document.getElementById("provinceDropdown").addEventListener("change", function () {
    const provinceID = this.value;
    loadDistricts(provinceID);
});


// Lấy giỏ hàng từ localStorage
function getCart() {
return JSON.parse(localStorage.getItem('cart')) || [];
}

// Cập nhật bảng giỏ hàng với các sản phẩm
async function updateCartTable() {
const cart = getCart();
const cartTable = document.getElementById('cart-table');
let total = 0;
let totalQuantity = 0;

// Xóa các hàng cũ trong bảng
const rows = cartTable.querySelectorAll('tr');
rows.forEach((row, index) => {
    if (index > 0) row.remove(); // Bỏ qua dòng tiêu đề
});

// Lặp qua các sản phẩm trong giỏ hàng và thêm vào bảng
for (const item of cart) {
    try {
        // Lấy thông tin sản phẩm từ Firebase
        const docRef = doc(db, "products", item.id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const product = docSnap.data();
                const subtotal = product.price * item.quantity; // Tính tiền cho sản phẩm

            // Cập nhật tổng số tiền và số lượng
            total += subtotal;
            totalQuantity += item.quantity;

            // Thêm dòng mới vào bảng
            const row = `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.discount ? `-${product.discount}%` : 'Không có'}</td>
                    <td>${item.quantity}</td>
                    <td>${subtotal.toLocaleString('vi-VN')}đ</td>
                </tr>
            `;
            cartTable.innerHTML += row;
        }
    } catch (error) {
        console.error("Error loading product data:", error);
    }
}

// Cập nhật tổng số tiền và số lượng


}

// Khởi động khi trang tải
document.addEventListener('DOMContentLoaded', updateCartTable);


// Gán sự kiện cho nút thanh toán
document.querySelector('.delivery-content-left-button button:last-child').addEventListener('click', submitOrder);
document.getElementById('districtDropdown').addEventListener('change', function() {
        displayCartInDelivery(); // Cập nhật lại giỏ hàng khi quận thay đổi
    });
// Hiển thị giỏ hàng khi trang được tải
document.addEventListener('DOMContentLoaded', displayCartInDelivery);