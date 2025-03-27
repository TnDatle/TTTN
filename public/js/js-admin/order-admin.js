import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
    authDomain: "store-music-fae02.firebaseapp.com",
    databaseURL: "https://store-music-fae02-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "store-music-fae02",
    storageBucket: "store-music-fae02.appspot.com",
    messagingSenderId: "35440000355",
    appId: "1:35440000355:web:7f49a002690331b9812756",
    measurementId: "G-BQPH02HFGC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// lấy đơn hàng người dùng dựa trên địa chỉ email
async function fetchUserOrders(userEmail) {
    const ordersCollection = collection(db, "orders");
    const q = query(ordersCollection, where("useremail", "==", userEmail));
    const ordersSnapshot = await getDocs(q);
    const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const currentOrdersContainer = document.getElementById("current-orders-container");
    const orderHistoryContainer = document.getElementById("order-history-container");

    // Xóa dữ liệu cũ
    currentOrdersContainer.innerHTML = "";
    orderHistoryContainer.innerHTML = "";

    if (ordersList.length === 0) {
        currentOrdersContainer.innerHTML = "<p>Không có đơn hàng nào đang xử lý.</p>";
        orderHistoryContainer.innerHTML = "<p>Chưa có lịch sử đơn hàng.</p>";
        return;
    }

    ordersList.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');

        let createdAtFormatted = "Chưa cập nhật";
        if (order.createdAt) {
            const createdAtDate = order.createdAt.toDate();
            createdAtFormatted = createdAtDate.toLocaleString("vi-VN", {
                weekday: "long", day: "numeric", month: "long",
                year: "numeric", hour: "numeric", minute: "numeric", hour24: true
            });
        }

        const createStatusDropdown = (status, orderId) => {
            const statuses = ["Đang chờ tiếp nhận", "Đang xử lý", "Đang giao hàng", "Đã giao thành công", "Đã hủy"];
            
            // Kiểm tra nếu trạng thái là "Đã giao thành công" hoặc "Đã hủy", thì disable dropdown
            const isDisabled = (status === "Đã giao thành công" || status === "Đã hủy") ? "disabled" : "";
        
            return ` 
                <select class="status-dropdown" data-order-id="${orderId}" ${isDisabled}>
                    ${statuses.map(option => ` 
                        <option value="${option}" ${option === status ? "selected" : ""}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
            `;
        };        

        orderDiv.innerHTML = `
            <div class="order-header">
                <h2>ID Đơn hàng: ${order.orderId}</h2>
                <span class="status">${order.status || 'Đang xử lý'}</span>
            </div>
            <div class="customer-info">
                <p><strong>Họ và tên:</strong> ${order.fullName || 'Chưa cập nhật'}</p>
                <p><strong>Số điện thoại:</strong> ${order.phone || 'Chưa cập nhật'}</p>
                <p><strong>Địa chỉ:</strong> ${order.address || 'Chưa cập nhật'}</p>
                 <p><strong>Tỉnh/Thành:</strong> ${order.province || 'Chưa cập nhật'}</p>
                <p><strong>Phương thức thanh toán:</strong> ${order.payment}</p>
                <p><strong>Ngày tạo:</strong> ${createdAtFormatted}</p>
            </div>
            <div class="product-list">
                ${order.items.map(item => `
                    <div class="product">
                        <span>${item.name || 'Không xác định'}</span>
                        <span>Số lượng: ${item.quantity || 0}</span>
                        <span>Thành tiền: ${item.subtotal || 0} đ</span>
                    </div>
                `).join('')}
            </div>
            <div class="total">Tổng tiền: ${order.total || 0} đ</div>
            <div class="order-status">
                ${createStatusDropdown(order.status)}
            </div>
        `;

        // Phân loại vào "Đơn hàng hiện tại" hoặc "Lịch sử đơn hàng"
        if (["Đang chờ tiếp nhận", "Đang xử lý", "Đang giao hàng"].includes(order.status)) {
            currentOrdersContainer.appendChild(orderDiv);
        } else {
            orderHistoryContainer.appendChild(orderDiv);
        }
    });

    // Xử lý sự kiện thay đổi trạng thái
    document.querySelectorAll('.status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async (event) => {
            const orderId = event.target.getAttribute('data-order-id');
            const newStatus = event.target.value;

            const q = query(ordersCollection, where("orderId", "==", orderId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error(`Không tìm thấy đơn hàng với ID ${orderId}`);
                return;
            }

            const orderDoc = querySnapshot.docs[0];
            const orderRef = doc(db, "orders", orderDoc.id);

            await updateDoc(orderRef, { status: newStatus });

            fetchUserOrders(userEmail); // Cập nhật lại danh sách sau khi thay đổi trạng thái
        });
    });
}

// truy vấn firestore để lấy danh sách người dung và thêm địa chỉ email của họ vào dropdown
async function loadEmails() {
    const usersRef = collection(db, "user");
    const snapshot = await getDocs(usersRef);
    const emailSelect = document.getElementById('emailOptions');

    snapshot.forEach((doc) => {
        const user = doc.data();
        const option = document.createElement('option');
        option.value = user.email; // Assuming you have the email field in the user
        option.textContent = user.email;
        emailSelect.appendChild(option);
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const currentOrdersTab = document.getElementById("current-orders-tab");
    const orderHistoryTab = document.getElementById("order-history-tab");
    const currentOrdersContent = document.getElementById("current-orders");
    const orderHistoryContent = document.getElementById("order-history");
    
    // Chuyển tab giữa "Đơn hàng hiện tại" và "Lịch sử đặt hàng"
    currentOrdersTab.addEventListener("click", function () {
        currentOrdersTab.classList.add("active");
        orderHistoryTab.classList.remove("active");

        currentOrdersContent.classList.add("active");
        orderHistoryContent.classList.remove("active");
    });

    orderHistoryTab.addEventListener("click", function () {
        orderHistoryTab.classList.add("active");
        currentOrdersTab.classList.remove("active");

        orderHistoryContent.classList.add("active");
        currentOrdersContent.classList.remove("active");
    });

    // Chỉ gọi fetchUserOrders() sau khi chọn email
    document.getElementById('emailOptions').addEventListener("change", function () {
        let userEmail = this.value; // ✅ Khai báo biến trước khi sử dụng
        userEmail = this.value;
        fetchUserOrders(userEmail);
    });

    loadEmails(); // Load danh sách email khi trang tải xong
});

