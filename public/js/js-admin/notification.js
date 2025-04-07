import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase config
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

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lưu orderId đã đọc vào localStorage
function markAsRead(orderId) {
  const readOrders = JSON.parse(localStorage.getItem("readOrders") || "[]");
  if (!readOrders.includes(orderId)) {
    readOrders.push(orderId);
    localStorage.setItem("readOrders", JSON.stringify(readOrders));
  }
}

// Lấy danh sách orderId đã đọc
function isRead(orderId) {
  const readOrders = JSON.parse(localStorage.getItem("readOrders") || "[]");
  return readOrders.includes(orderId);
}


// Lắng nghe đơn hàng mới
const ordersRef = collection(db, "orders");
onSnapshot(ordersRef, async (snapshot) => {
  const addedDocs = snapshot.docChanges().filter(
    (change) => change.type === "added"
  );

  if (addedDocs.length === 0) return;

  const notifications = await Promise.all(
    addedDocs.map(async (change) => {
      const orderId = change.doc.id;
      const orderData = change.doc.data();
  
      // 👉 Bỏ qua nếu đã đọc hoặc không đúng trạng thái
      if (isRead(orderId) || orderData.status !== "Đang chờ tiếp nhận") return null;
  
      return {
        id: orderId,
        message: `🆕 Đơn hàng mới từ ${orderData.Name || "Khách hàng"} (${orderData.useremail || "Email không rõ"})`,
        data: orderData,
      };
    })
  );
  

  // Lọc bỏ các phần tử null (vì một số đơn không phải "Đang chờ tiếp nhận")
  const validNotifications = notifications.filter((n) => n !== null);

  if (validNotifications.length > 0) {
    updateNotificationUI(validNotifications);
  }
});


// Hiển thị thông báo lên giao diện
function updateNotificationUI(notifications) {
  const list = document.getElementById("notification-list");
  const count = document.getElementById("notification-count");
  const dropdown = document.getElementById("notification-dropdown");

  if (!list || !count || !dropdown) return;

  notifications.forEach((noti) => {
    const li = document.createElement("li");
    li.classList.add("notification-item");

    const messageSpan = document.createElement("span");
    messageSpan.textContent = noti.message;
    messageSpan.style.cursor = "pointer";

    messageSpan.addEventListener("click", () => {
      const item = noti.data.items?.[0] || {};
      showOrderDetailsModal(noti.data, item); // Gọi hàm modal thay cho alert()
    });
    
    // Hàm tạo modal hiển thị thông tin đơn hàng
    function showOrderDetailsModal(orderData, item) {
      const modal = document.createElement("div");
      modal.classList.add("order-details-modal");
    
      const modalContent = document.createElement("div");
      modalContent.classList.add("order-details-modal-content");
    
      const modalHeader = document.createElement("h2");
      modalHeader.textContent = `Thông tin đơn hàng: ${orderData.orderId || "Không rõ"}`;
    
      // Định dạng tiền Việt Nam
      const formattedTotal = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(orderData.total || 0);
    
      const orderDetails = document.createElement("p");
      orderDetails.textContent = `
        Khách hàng: ${orderData.fullName || "Không rõ"}
        Email: ${orderData.useremail || "Không rõ"}
        Tỉnh/Thành: ${orderData.province || "Không rõ"}
        Phường/Xã: ${orderData.ward || "Không rõ"}
        Quận/Huyện: ${orderData.district || "Không rõ"}
        Sản phẩm: ${item.name || "Không rõ"}
        Số lượng: ${item.quantity || "Không rõ"}
        Tổng tiền: ${formattedTotal}
      `;
    
      const closeButton = document.createElement("button");
      closeButton.textContent = "Đóng";
      closeButton.classList.add("close-modal-button");
    
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(orderDetails);
      modalContent.appendChild(closeButton);
      modal.appendChild(modalContent);
    
      document.body.appendChild(modal);
    
      // Đóng modal khi người dùng bấm "Đóng"
      closeButton.addEventListener("click", () => {
        modal.remove();
      });
    }
    

    // Nút đã đọc
    const readBtn = document.createElement("button");
    readBtn.textContent = "✔️ Đã đọc";
    readBtn.classList.add("read-button");
    readBtn.style.marginLeft = "10px";
    readBtn.style.background = "transparent";
    readBtn.style.border = "none";
    readBtn.style.cursor = "pointer";
    readBtn.style.color = "blue";

    readBtn.addEventListener("click", () => {
      li.remove();
      markAsRead(noti.id); // 👉 lưu vào localStorage
    
      // Cập nhật số thông báo
      const currentCount = parseInt(count.textContent) || 0;
      count.textContent = Math.max(currentCount - 1, 0);
      if (list.children.length === 0) {
        dropdown.style.display = "none";
      }
    });
    

    li.appendChild(messageSpan);
    li.appendChild(readBtn);
    list.prepend(li);
  });

  // Cập nhật số lượng thông báo
  const currentCount = parseInt(count.textContent) || 0;
  count.textContent = currentCount + notifications.length;

  // Mở dropdown thông báo
  dropdown.style.display = "block";
}

// Bấm vào icon để hiển thị / ẩn dropdown
document.getElementById("notification-icon")?.addEventListener("click", () => {
  const dropdown = document.getElementById("notification-dropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }
});
