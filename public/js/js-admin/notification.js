import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {getFirestore,collection,onSnapshot,doc,getDoc
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

// Listen to new orders
const ordersRef = collection(db, "orders");
onSnapshot(ordersRef, async (snapshot) => {
  const notifications = [];

  // Loop through each change in the snapshot
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === "added") {
      const orderId = change.doc.id;
      const data = change.doc.data();

      // Fetch user email using orderId
      const orderDocRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderDocRef);
      const orderData = orderDoc.data();

      notifications.push({
        id: orderId,
        message: `Đơn hàng mới từ ${orderData.Name || "Khách hàng"} (${orderData.useremail || "Email không rõ"})`,
        data: orderData
      });
    }
  });

  // Update UI with the new notifications
  updateNotificationUI(notifications);
});

// Update UI
function updateNotificationUI(notifications) {
  const list = document.getElementById("notification-list");
  const count = document.getElementById("notification-count");
  const dropdown = document.getElementById("notification-dropdown");

  // Nếu không có thông báo mới
  if (notifications.length === 0) {
    if (list.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Không có thông báo nào.";
      li.style.color = "#666";
      li.style.textAlign = "center";
      li.style.padding = "10px";
      list.appendChild(li);
    }
    return;
  }

  // Append new notifications to the UI
  notifications.forEach((noti) => {
    const li = document.createElement("li");
    li.classList.add("notification-item");
    li.textContent = noti.message;

    li.addEventListener("click", () => {
      alert(`
      🧾 Thông tin đơn hàng:
      Khách hàng: ${noti.data.customerName || "Không rõ"}
      Email: ${noti.data.useremail || "Không rõ"}
      Sản phẩm: ${noti.data.productName || "Không rõ"}
      Số lượng: ${noti.data.quantity || "Không rõ"}
      Tổng tiền: ${noti.data.totalPrice || "Không rõ"}
      Thời gian: ${noti.data.createdAt || "Không rõ"}
      `);
    });

    list.prepend(li);
  });

  // Update notification count
  const currentCount = parseInt(count.textContent) || 0;
  count.textContent = currentCount + notifications.length;

  // Display the notification dropdown
  dropdown.style.display = "block";
}

// Toggle dropdown when the icon is clicked
document.getElementById("notification-icon").addEventListener("click", () => {
  const dropdown = document.getElementById("notification-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});
