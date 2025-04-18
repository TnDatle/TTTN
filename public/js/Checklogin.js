// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const topMenuIcons = document.querySelector(".top-menu-icons ul"); 
    if (!topMenuIcons) return console.error("Không tìm thấy phần tử .top-menu-icons!");

    // Cấu hình Firebase
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

    // Khởi tạo Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Hàm kiểm tra trạng thái đăng nhập và theo dõi thay đổi fullName
    function checkSessionAndListen() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const emailKey = user.email.replace(/\./g, "_"); 
                    const userRef = doc(db, "user", emailKey);

                    // Lắng nghe thay đổi dữ liệu trong Firestore
                    onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists() && docSnap.data().fullName) {
                            const fullName = docSnap.data().fullName;
                            localStorage.setItem("fullName", fullName);
                            resolve({ isLoggedIn: true, fullName });
                            updateUserInterface(fullName); // Cập nhật giao diện ngay khi fullName thay đổi
                        } else {
                            resolve({ isLoggedIn: true, fullName: "Bạn chưa cập nhật thông tin" });
                        }
                    }, (error) => {
                        console.error("Lỗi khi lắng nghe dữ liệu Firestore:", error);
                        resolve({ isLoggedIn: false });
                    });
                } else {
                    localStorage.removeItem("fullName");
                    resolve({ isLoggedIn: false });
                }
            });
        });
    }

    // Cập nhật giao diện user
    async function updateUserInterface(fullName = "Tài khoản") {
        const loginLi = topMenuIcons.querySelector("li:nth-child(2)");
    
        if (!loginLi) {
            console.error("Không tìm thấy phần tử đăng nhập!");
            return;
        }
    
        if (fullName) {
            loginLi.innerHTML = `
            <div id="user-box" 
                 style="display:inline-flex; align-items:center; gap:8px; padding:10px 15px; border-radius:8px; border:1px solid #ccc; background-color:#fefefe; font-weight:500; cursor:pointer; transition:all 0.5s ease; box-shadow:0 2px 5px rgba(0,0,0,0.1);" 
                 onmouseover="this.style.background='#f1f1f1'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.15)'" 
                 onmouseout="this.style.background='#fefefe'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.1)'">
                <i class="fas fa-user" style="font-size:15px; color:#666;"></i>
                <span class="user-name" style="white-space:nowrap; font-size:15px; color:#333;">${fullName}</span>
            </div>
        `;
        
            const userBox = document.querySelector("#user-box");
    
            // Xử lý click mở menu
            userBox.addEventListener("click", (e) => {
                e.preventDefault();
    
                let userMenu = document.querySelector("#user-menu");
                if (!userMenu) {
                    userMenu = document.createElement("div");
                    userMenu.id = "user-menu";
                    userMenu.className = "menu-dropdown";
                    userMenu.innerHTML = `
                        <ul>
                            <li><a href="/views/Information/Orders.html"><i class="fas fa-receipt"></i> Đơn hàng của tôi</a></li>
                            <li><a href="/views/Information/Information.html"><i class="fas fa-eye"></i> Thông tin cá nhân</a></li>
                            <li><a href="/views/Login/ForgotPassword.html"><i class="fas fa-lock"></i> Đổi mật khẩu</a></li>
                            <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></li>
                        </ul>
                    `;
                    document.body.appendChild(userMenu);
                }
    
                 // Căn chỉnh menu ngay dưới user box
                    const rect = userBox.getBoundingClientRect();
                    userMenu.style.left = `${rect.left}px`;
                    userMenu.style.top = `${rect.bottom + window.scrollY}px`;
                    userMenu.style.display = "block";

                    // Xử lý đóng menu khi click ra ngoài
                    setTimeout(() => {
                        document.addEventListener("click", closeMenu, { once: true });
                    }, 0);

                    function closeMenu(event) {
                        if (!userMenu.contains(event.target) && !userBox.contains(event.target)) {
                            userMenu.style.display = "none";
                        }
                    }
    
                // Xử lý đăng xuất
                document.querySelector("#logout-btn").addEventListener("click", async () => {
                    if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
                        await signOut(auth);
                        alert("Bạn đã đăng xuất thành công!");
                        userMenu.remove();
                        updateUserInterface();
                        window.location.href = "../../views/home.html";
                    }
                });
            });
        } else {
            // Nếu chưa đăng nhập, hiển thị icon user như cũ
            loginLi.innerHTML = `<a href="/views/Login/Login.html"><i class="fa-regular fa-user"></i></a>`;
        }
    }
    

    // Xử lý giỏ hàng
    const cartIcon = document.querySelector(".fa-shopping-cart");
    if (cartIcon) {
        cartIcon.addEventListener("click", async (e) => {
            e.preventDefault();
            const { isLoggedIn } = await checkSessionAndListen();
            window.location.href = isLoggedIn ? "/views/Cart/Cart.html" : "/views/Login/Login.html";
        });
    }

    checkSessionAndListen(); // Kiểm tra đăng nhập và lắng nghe thay đổi real-time
});



async function buyNow(event) {
    event.preventDefault(); // Ngăn chặn hành động mặc định của button

    const userSession = await checkSessionAndListen(); // Kiểm tra trạng thái đăng nhập từ Firebase
    console.log("Trạng thái đăng nhập:", userSession);

    if (userSession.isLoggedIn) {
        window.location.href = "/views/Delivery/Delivery.html"; // Chuyển đến trang thanh toán
    } else {
        alert("Bạn cần đăng nhập để mua hàng!");
        window.location.href = "/views/Login/Login.html"; // Chuyển đến trang đăng nhập
    }
}



// Gán sự kiện khi DOM được load xong
document.addEventListener("DOMContentLoaded", () => {
    const buyNowBtn = document.querySelector("#buy-now");
    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", buyNow);
    }
});

async function checkSessionAndListen() {
    return new Promise((resolve) => {
        const auth = getAuth(); // Lấy Firebase Auth
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve({ isLoggedIn: true, userEmail: user.email });
            } else {
                resolve({ isLoggedIn: false });
            }
        });
    });
}


