// delivery.js

// Import Firebase modules
import { db, auth } from '../../routes/Firebase-Config.js';
import {  doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


// Firebase configuration


// Hàm để lấy thông tin sản phẩm từ Firestore
async function getProductById(productId) {
    const collections = [
        'products/laptop/items',
    ];

    for (const collectionPath of collections) {
        const docRef = doc(db, collectionPath, productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data(); // Trả về dữ liệu sản phẩm
        }
    }

    console.log("Không tìm thấy sản phẩm");
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
    const fullName = document.getElementById("fullName").value;
    const phone = document.getElementById("phone").value;
    const province = document.getElementById("provinceDropdown").value;
    const district = document.getElementById("districtDropdown").value;
    const ward = document.getElementById("wardInput").value;
    const address = document.getElementById("addressInput").value;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

     // Kiểm tra số điện thoại
     if (!validatePhoneNumber(phone)) {
        alert("Số điện thoại phải có 10 số ");
        return; // Dừng xử lý nếu số điện thoại không hợp lệ
    }

    // Tính tổng tiền và tạo mảng items
    let total = 0;
    const items = []; // Mảng để lưu thông tin sản phẩm

    for (const item of cart) {
        const product = await getProductById(item.id); // Gọi hàm lấy thông tin sản phẩm
        if (product) {
            const subtotal = product.price * item.quantity;
            total += subtotal;

            // Thêm thông tin sản phẩm vào mảng items
            items.push({
                name: product.name, // Tên sản phẩm
                quantity: item.quantity, // Số lượng
                price: product.price, // Giá sản phẩm
                subtotal: subtotal, // Thành tiền
            });
        }
    }

    // Lấy phí ship
    const shippingFee = calculateShippingFee(district);
    const grandTotal = total + shippingFee; // Tổng tiền bao gồm phí ship

    // Tạo đối tượng đơn hàng
    const orderData = {
        fullName,
        phone,
        province:"Thành phố Hồ Chí Minh",
        district,
        ward,
        address,
        items, // Lưu mảng items vào đơn hàng
        total: grandTotal, // Lưu tổng tiền
        shippingFee, // Lưu phí ship
        createdAt: new Date(), // Thêm thời gian tạo đơn hàng
        orderId: `ORDER-${Date.now()}`, // Tạo mã đơn hàng duy nhất
        status: "Đang chờ tiếp nhận", // Trạng thái mặc định
        payment: "Thanh toán khi nhận hàng"
    };

    // Gọi hàm lưu đơn hàng
    await saveOrder(orderData);
}
  // Hàm tải danh sách tỉnh/thành
  async function loadProvinces() {
    try {   
        const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/province", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Token": "66ce5502-9c0f-11ef-8693-5abc7748e730" // API_Key 
            }
        });
        const data = await response.json();
        
        if (data.code === 200) {
            const provinces = data.data;
            const provinceDropdown = document.getElementById("provinceDropdown");
            
            provinces.forEach(province => {
                const option = document.createElement("option");
                option.value = province.ProvinceID;
                option.text = province.ProvinceName;
                provinceDropdown.add(option);
            });
        } else {
            console.error("Không thể tải danh sách tỉnh thành", data.message);
        }
    } catch (error) {
        console.error("Lỗi khi gọi API", error);
    }
}

// Hàm tải danh sách quận/huyện dựa vào tỉnh/thành đã chọn
async function loadDistricts(provinceID) {
    try {
        const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/district", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Token": "66ce5502-9c0f-11ef-8693-5abc7748e730" // Thay YOUR_API_KEY bằng API Key của bạn
            },
            body: JSON.stringify({ province_id: parseInt(provinceID) })
        });
        const data = await response.json();
        
        if (data.code === 200) {
            const districts = data.data;
            const districtDropdown = document.getElementById("districtDropdown");
            districtDropdown.innerHTML = '<option value="">--Chọn quận/huyện--</option>';
            
            districts.forEach(district => {
                const option = document.createElement("option");
                option.value = district.DistrictID;
                option.text = district.DistrictName;
                districtDropdown.add(option);
            });
        } else {
            console.error("Không thể tải danh sách quận/huyện:", data.message);
        }
    } catch (error) {
        console.error("Lỗi khi gọi API", error);
    }
}
// Gọi hàm loadProvinces khi trang được tải
document.addEventListener("DOMContentLoaded", loadProvinces);

// Lắng nghe sự kiện khi người dùng chọn tỉnh/thành để tải quận/huyện
document.getElementById("provinceDropdown").addEventListener("change", function() {
    const provinceID = this.value;
    if (provinceID) {
        loadDistricts(provinceID);
    } else {
        document.getElementById("district").innerHTML = '<option value="">--Chọn quận/huyện--</option>';
    }
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