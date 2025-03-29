import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
    authDomain: "store-music-fae02.firebaseapp.com",
    databaseURL:"https://store-music-fae02-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "store-music-fae02",
    storageBucket: "store-music-fae02.appspot.com",
    messagingSenderId: "35440000355",
    appId: "1:35440000355:web:7f49a002690331b9812756",
    measurementId: "G-BQPH02HFGC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Hàm tải thông tin cá nhân từ Firestore
async function loadPersonalInfo(emailId) {
    const userDocRef = doc(db, "user", emailId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Điền thông tin vào form
        document.getElementById('fullName').value = data.fullName || "";
        document.getElementById('phone').value = data.phone || "";
        document.getElementById('provinceDropdown').value = data.province || "";
        document.getElementById('districtDropdown').value = data.district || "";
        document.getElementById('addressInput').value = data.address || "";
        document.getElementById('wardInput').value = data.ward || "";
        document.getElementById('userId').value = data.userid || "";
    } else {
        console.log("Không tìm thấy thông tin người dùng.");
    }
}

// Hàm cập nhật thông tin cá nhân
async function updatePersonalInfo() {
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const province = document.getElementById('provinceDropdown').value;
    const district = document.getElementById('districtDropdown').value;
    const ward = document.getElementById('wardInput').value;
    const address = document.getElementById('addressInput').value;

    if (!fullName || !phone || !province || !district || !address) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // Kiểm tra số điện thoại có 10 số không
    if (!/^\d{10}$/.test(phone)) {
        alert("Số điện thoại phải có đúng 10 chữ số.");
        return;
    }

    // Lấy email của người dùng hiện tại
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const emailId = user.email.replace(/[.#$[\]]/g, "_"); // Chuyển email thành ID hợp lệ
            const userDocRef = doc(db, "user", emailId);

            try {
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    // Tài liệu đã tồn tại, cập nhật thông tin
                    await updateDoc(userDocRef, {
                        fullName: fullName,
                        phone: phone,
                        province: province,
                        district: district,
                        ward:ward,
                        address: address
                    });
                    alert("Thông tin cá nhân đã được cập nhật thành công!");
                } else {
                    // Nếu tài liệu không tồn tại, tạo mới
                    await setDoc(userDocRef, {
                        fullName: fullName,
                        phone: phone,
                        province: province,
                        district: district,
                        ward:ward,
                        address: address
                    });
                    alert("Thông tin cá nhân đã được lưu thành công!");
                }
            } catch (error) {
                console.error("Lỗi khi cập nhật thông tin:", error);
                alert("Có lỗi xảy ra khi cập nhật thông tin!");
            }
        } else {
            alert("Bạn chưa đăng nhập!");
        }
    });
}

// Gắn sự kiện click vào nút cập nhật
document.getElementById('update-info-btn').addEventListener('click', updatePersonalInfo);

// Khi người dùng đăng nhập, hiển thị thông tin cá nhân
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const emailId = user.email.replace(/[.#$[\]]/g, "_"); // Chuyển email thành ID hợp lệ
        loadPersonalInfo(emailId); // Tải thông tin người dùng
    } else {
        console.log("Người dùng chưa đăng nhập.");
    }
});        