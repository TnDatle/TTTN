import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase initialization
const app = initializeApp({
  apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
  authDomain: "store-music-fae02.firebaseapp.com",
  databaseURL:"https://store-music-fae02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "store-music-fae02",
  storageBucket: "store-music-fae02.appspot.com",
  messagingSenderId: "35440000355",
  appId: "1:35440000355:web:7f49a002690331b9812756",
  measurementId: "G-BQPH02HFGC",
});

const auth = getAuth(app); // Firebase Authentication
const db = getFirestore(app);

// Đăng nhập với email và mật khẩu
async function loginUser(event) {
    event.preventDefault();
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;

    if (!email || !password) {
        alert("Vui lòng nhập email và mật khẩu.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Lưu trạng thái đăng nhập
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email); // Lưu email người dùng nếu cần

        alert("Đăng nhập thành công!");
        console.log("Thông tin người dùng:", user);

        // Chuyển hướng đến trang chủ
        window.location.href = "../home.html";
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        alert("Tên đăng nhập hoặc mật khẩu không chính xác.");
    }
}

// Đăng ký với email và mật khẩu
async function registerUser(event) {
    event.preventDefault();
    const email = document.querySelector('#register-email').value.trim();
    const password = document.querySelector('#register-password').value.trim();
    const fullName = document.querySelector('#register-name').value.trim();
    const phone = document.querySelector('#register-phone').value.trim();

    if (!email || !password) {
        alert("Vui lòng nhập email và mật khẩu.");
        return;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }

    if (phone.length < 10){
        alert("Số điện thoại phải có ít nhất 10 số.");
        return;
    }

    const emailExists = await isEmailExist(email);
    if (emailExists) {
        alert("Email này đã được sử dụng. Vui lòng chọn Email khác.");
        return;
    }

    try {
        // Tạo tài khoản mới
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Tạo document trống trong Firestore với email làm ID
        const emailId = email.replace(/[.#$[\]]/g, "_"); // Thay các ký tự không hợp lệ
        const userDocRef = doc(db, "user",  emailId); // Dùng UID của Firebase Auth làm ID
        await setDoc(userDocRef, {
            email: email,
            fullName: fullName,
            phone: phone,
            province: "",
            district: "",
            address: "" ,
            userid: user.uid
        });

        alert("Đăng ký thành công");
        // Reload lại trang hoặc chuyển hướng
        window.location.reload();
    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        alert("Email đã được đăng ký, vui lòng thử bằng một Email khác!.");
    }
}

// Kiểm tra email đã đăng ký
async function isEmailExist(email) {
    try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        return signInMethods.length > 0; // Nếu có phương thức đăng nhập, email đã được đăng ký
    } catch (error) {
        console.error("Lỗi khi kiểm tra email:", error);
        return false;
    }
}

async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' }); // Buộc chọn tài khoản

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Kiểm tra tài khoản trong Firestore
        const emailId = user.email.replace(/[.#$[\]]/g, "_");
        const userDocRef = doc(db, "user", emailId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user.email);

            alert("Đăng nhập thành công!");
            window.location.href = "../home.html"; // Chuyển hướng tới trang chủ
        } else {
            alert("Tài khoản chưa được đăng ký. Vui lòng đăng ký trước khi đăng nhập.");
            await auth.signOut(); // Đăng xuất khỏi Google
        }
    } catch (error) {
        console.error("Lỗi khi đăng nhập với Google:", error);
        alert("Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại!");
    }
}



async function registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Kiểm tra email đã tồn tại trong Firestore
        const emailId = user.email.replace(/[.#$[\]]/g, "_"); // Xử lý email thành ID hợp lệ
        const userDocRef = doc(db, "user", emailId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            // Nếu email đã tồn tại
            alert("Email này đã được đăng ký. Bạn có thể đăng nhập bằng tài khoản Google này.");
            window.location.href = "Login.html"; // Điều hướng tới trang đăng nhập
        } else {
            // Nếu email chưa tồn tại, xác nhận trước khi đăng ký
            const confirmRegister = confirm(
                "Email này chưa được đăng ký. Bạn có muốn đăng ký với tài khoản Google này không?"
            );
            if (!confirmRegister) {
                await auth.signOut(); // Đăng xuất khỏi Google
                alert("Đăng ký bị hủy.");
                return;
            }

            // Đăng ký tài khoản mới
            await setDoc(userDocRef, {
                email: user.email,
                fullName: user.displayName,
                phone: "", // Cho phép người dùng thêm sau
                province: "",
                district: "",
                address: "",
                userid: user.uid
            });

            alert("Đăng ký với Google thành công!");
            window.location.href = "Login.html"; // Chuyển hướng tới trang đăng nhập
        }
    } catch (error) {
        console.error("Lỗi khi đăng ký với Google:", error);
        alert("Lỗi khi đăng ký với Google.");
    }
}


// Lắng nghe sự kiện form đăng ký
document.getElementById('register-form').addEventListener('submit', registerUser);

// Lắng nghe sự kiện form đăng nhập
document.getElementById('login-form').addEventListener('submit', loginUser);

// Lắng nghe sự kiện đăng nhập Google
document.getElementById('google-login').addEventListener('click', loginWithGoogle);

// Lắng nghe sự kiện đăng ký Google
document.getElementById('google-register').addEventListener('click', registerWithGoogle);
