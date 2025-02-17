import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-storage.js";

// 🔥 Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
    authDomain: "store-music-fae02.firebaseapp.com",
    projectId: "store-music-fae02",
    storageBucket: "store-music-fae02.appspot.com",
    messagingSenderId: "35440000355",
    appId: "1:35440000355:web:7f49a002690331b9812756"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 📌 Lấy ID sản phẩm từ URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 🔹 Tải danh sách phụ kiện
async function loadProductList() {
    const productList = document.getElementById("productList");
    productList.innerHTML = "";
    
    try {
        const querySnapshot = await getDocs(collection(db, "products", "accessories", "items"));
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const card = document.createElement("div");
            card.classList.add("product-card");

            card.innerHTML = `
                <img src="${product.imageURL || 'placeholder.jpg'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <button class="edit-btn" data-id="${doc.id}">Sửa</button>
                <button class="delete-btn" data-id="${doc.id}">Xóa</button>
            `;
            
            productList.appendChild(card);
        });

        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", () => editProduct(button.dataset.id));
        });
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => deleteProduct(button.dataset.id));
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
}

// 🔹 Chỉnh sửa sản phẩm
async function editProduct(id) {
    try {
        const docRef = doc(db, "products", "accessories", "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setProductDetails(docSnap.data(), docSnap.id);
        } else {
            alert("Sản phẩm không tồn tại.");
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
    }
}

// 🔹 Hiển thị thông tin lên form
function setProductDetails(product, id) {
    document.getElementById('productId').value = id;
    Object.keys(product).forEach(key => {
        if (document.getElementById(key)) {
            document.getElementById(key).value = product[key];
        }
    });
    document.getElementById('productImage').src = product.imageURL || "";
}

async function saveProduct(event) {
    event.preventDefault();

    const productIdInput = document.getElementById('productId').value.trim();
    const productType = document.getElementById("productType").value; // Lấy loại sản phẩm

    if (!productIdInput) {
        alert("Vui lòng nhập ID sản phẩm!");
        return;
    }

    const productData = {
        name: document.getElementById("name")?.value || "",
        description: document.getElementById("description")?.value || "",
        price: parseFloat(document.getElementById("price")?.value) || 0,
        category: productType
    };

    // Lấy các trường riêng theo loại sản phẩm
    if (productType === "headphone") {
        productData.brand = document.getElementById("brand")?.value || "";
        productData.type = document.getElementById("type")?.value || "";
        productData.connection = document.getElementById("connection")?.value || "";
        productData.noiseCancelling = document.getElementById("noiseCancelling")?.value || "";
        if (productData.connection === "wireless" || productData.connection === "bluetooth") {
            productData.battery = document.getElementById("battery")?.value || "";
        }
    } else if (productType === "keyboard") {
        productData.brand = document.getElementById("brand")?.value || "";
        productData.switchType = document.getElementById("switchType")?.value || "";
        productData.connection = document.getElementById("connection")?.value || "";
        productData.led = document.getElementById("led")?.value || "";
    } else if (productType === "mouse") {
        productData.brand = document.getElementById("brand")?.value || "";
        productData.dpi = document.getElementById("dpi")?.value || "";
        productData.connection = document.getElementById("connection")?.value || "";
        productData.buttons = document.getElementById("buttons")?.value || "";
    }

    // Xử lý upload ảnh nếu có
    try {
        const imageFile = document.getElementById('image').files[0];

        if (imageFile) {
            const storageRef = ref(storage, `images/accessories/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            productData.imageURL = await getDownloadURL(storageRef);
        }

        await setDoc(doc(db, "products", "accessories", "items", productIdInput), productData);
        alert("Phụ kiện đã được lưu!");
        window.location.href = 'phukien.html';
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
    }
}

// 🔹 Xóa phụ kiện
async function deleteProduct(id) {
    if (!id) {
        alert("Không tìm thấy ID sản phẩm để xóa.");
        return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
        await deleteDoc(doc(db, "products", "accessories", "items", id));
        alert("Sản phẩm đã được xóa.");
        loadProductList();
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
    }
}

// 📌 Lắng nghe sự kiện khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadProductList();
    if (productId) {
        editProduct(productId);
    }
    
    document.getElementById("saveButton")?.addEventListener("click", saveProduct);
    document.getElementById("updateButton")?.addEventListener("click", saveProduct);
    document.getElementById("deleteButton")?.addEventListener("click", () => deleteProduct(productId));
});
