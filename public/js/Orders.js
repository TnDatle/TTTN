// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

// **Lấy danh sách đơn hàng từ Firebase**
async function fetchUserOrders(userEmail) {
    try {
        const ordersCollection = collection(db, "orders");
        const q = query(ordersCollection, where("useremail", "==", userEmail.toLowerCase()));
        const ordersSnapshot = await getDocs(q);
        const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Phân loại đơn hàng
        const currentOrders = ordersList.filter(order => ["Đang chờ tiếp nhận", "Đang xử lý", "Đang giao hàng"].includes(order.status));
        const historyOrders = ordersList.filter(order => ["Đã giao thành công", "Đã hủy"].includes(order.status));

        renderOrders(currentOrders, "current-orders-container");
        renderOrders(historyOrders, "order-history-container");
    } catch (error) {
        console.error("Lỗi khi tìm đơn hàng:", error);
    }
}

// **Hiển thị danh sách đơn hàng vào từng tab**
function renderOrders(ordersList, containerId) {
    const ordersContainer = document.getElementById(containerId);
    ordersContainer.innerHTML = ""; // Xóa nội dung cũ

    if (ordersList.length === 0) {
        ordersContainer.innerHTML = "<p>Không có đơn hàng nào.</p>";
        return;
    }

    ordersList.forEach(order => {
        const orderDiv = document.createElement("div");
        orderDiv.classList.add("order");
        orderDiv.innerHTML = `
            <div class="order-header">
                <h2>ID Đơn hàng: ${order.orderId}</h2>
                <span class="status">${order.status || "Đang xử lý"}</span>
            </div>
            <div class="order-details">
                <p><strong>Họ tên:</strong> ${order.fullName || "Chưa cung cấp"}</p>
                <p><strong>Số điện thoại:</strong> ${order.phone || "Chưa cung cấp"}</p>
                <p><strong>Địa chỉ:</strong> ${order.address || "Chưa cung cấp"}</p>
                <p><strong>Tỉnh/Thành:</strong> ${order.province || "Chưa cung cấp"}</p>
                <p><strong>Phường:</strong> ${order.ward || "Chưa cung cấp"}</p>
                <p><strong>Phương thức thanh toán:</strong> ${order.payment || "Chưa cung cấp"}</p>
            </div>
           <div class="product-list">
                ${order.items.map(item => `
                    <div class="product">
                        <span class="name"><strong>${item.name}</strong></span>
                        <span>Số lượng: ${item.quantity}</span>
                        <span>Thành tiền: ${Number(item.subtotal).toLocaleString('vi-VN')} ₫</span>
                    </div>
                `).join("")}
            </div>
            <div class="total">Tổng tiền: ${Number(order.total).toLocaleString('vi-VN')} ₫</div>
            ${order.status === "Đang chờ tiếp nhận" 
                ? `<button class="cancel-order-btn" data-order-id="${order.id}">Hủy đơn hàng</button>` 
                : ""}  

        `;
        ordersContainer.appendChild(orderDiv);
    });

    attachCancelButtons();
}

// **Gắn sự kiện cho nút hủy đơn**
function attachCancelButtons() {
    const cancelButtons = document.querySelectorAll(".cancel-order-btn");
    cancelButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const orderId = event.target.getAttribute("data-order-id");
            showCancelForm(orderId);
        });
    });
}

// **Hiển thị form xác nhận hủy đơn hàng**
function showCancelForm(orderId) {
    document.querySelector(".modal")?.remove();

    const cancelFormHtml = `
        <div class="cancel-form">
            <h3>Chọn lý do hủy đơn hàng</h3>
            <select id="cancel-reason-${orderId}">
                <option value="Tôi tìm được chỗ khác giá tốt hơn">Tôi tìm được chỗ khác giá tốt hơn</option>
                <option value="Thay đổi địa chỉ giao hàng">Thay đổi địa chỉ giao hàng</option>
                <option value="Không còn nhu cầu">Không còn nhu cầu</option>
                <option value="Lý do khác">Lý do khác</option>
            </select>
            <button id="confirm-cancel-btn-${orderId}">Xác nhận hủy</button>
            <button id="cancel-cancel-btn-${orderId}">Hủy bỏ</button>
        </div>
    `;

    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = cancelFormHtml;
    document.body.appendChild(modal);

    document.getElementById(`confirm-cancel-btn-${orderId}`).addEventListener("click", () => confirmCancelOrder(orderId));
    document.getElementById(`cancel-cancel-btn-${orderId}`).addEventListener("click", cancelModal);
}

// **Xác nhận hủy đơn hàng**
async function confirmCancelOrder(orderId) {
    const reason = document.getElementById(`cancel-reason-${orderId}`).value;
    try {
        const orderDocRef = doc(db, "orders", orderId);
        await updateDoc(orderDocRef, {
            status: "Đã hủy",
            cancelReason: reason
        });

        alert("Đơn hàng đã được hủy thành công!");
        document.querySelector(".modal").remove();
        location.reload(); // Cập nhật danh sách đơn hàng
    } catch (e) {
        console.error("Lỗi khi hủy đơn hàng: ", e);
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
}

// **Đóng modal**
function cancelModal() {
    document.querySelector(".modal")?.remove();
}

// **Lấy đơn hàng khi người dùng đăng nhập**
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchUserOrders(user.email);
    } else {
        console.log("Người dùng chưa đăng nhập.");
    }
});


// Xử lý chuyển đổi giữa các tab
document.getElementById("current-orders-tab").addEventListener("click", function () {
    document.getElementById("current-orders").classList.add("active");
    document.getElementById("order-history").classList.remove("active");
    this.classList.add("active");
    document.getElementById("order-history-tab").classList.remove("active");
});

document.getElementById("order-history-tab").addEventListener("click", function () {
    document.getElementById("current-orders").classList.remove("active");
    document.getElementById("order-history").classList.add("active");
    this.classList.add("active");
    document.getElementById("current-orders-tab").classList.remove("active");
});
