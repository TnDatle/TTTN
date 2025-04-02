import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-storage.js";

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
            
            const imageUrl = product.imageURLs && product.imageURLs.length > 0 ? product.imageURLs[0] : "placeholder.jpg";
            
            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
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
    document.getElementById('productImageContainer').innerHTML = product.imageURLs?.map(url => `<img src="${url}" alt="Ảnh sản phẩm">`).join('') || "";
}

async function saveProduct(event) {
    event.preventDefault();

    const productIdInput = document.getElementById('productId').value.trim();
    const productType = document.getElementById("productType").value;
    
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
    
    const imageFiles = document.getElementById('images').files;
    let imageURLs = [];
    
    try {
        for (let file of imageFiles) {
            const storageRef = ref(storage, `images/accessories/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            imageURLs.push(url);
        }
        
        if (imageURLs.length > 0) {
            productData.imageURLs = imageURLs;
        }
        
        await setDoc(doc(db, "products", "accessories", "items", productIdInput), productData);
        alert("Phụ kiện đã được lưu!");
        window.location.href = 'phukien.html';
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
    }
}


// 🔹 Xóa ảnh khỏi Firebase Storage
async function deleteImageFromStorage(imageURL) {
    if (!imageURL) return;
    try {
        // Giả sử imageURL đã được cung cấp là đường dẫn hợp lệ
        const imageRef = ref(storage, imageURL);
        await deleteObject(imageRef);
        console.log("🗑 Ảnh đã được xóa khỏi Firebase Storage:", imageURL);
    } catch (error) {
        console.error("❌ Lỗi khi xóa ảnh từ Storage:", error);
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
        const productRef = doc(db, "products", "accessories", "items", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
            const productData = productSnap.data();
            const imageURLs = productData.imageURLs || [];

            // Xóa tất cả ảnh khỏi Firebase Storage trước khi xóa sản phẩm
            await Promise.all(imageURLs.map(deleteImageFromStorage)); // Xóa ảnh liên quan

            // Xóa sản phẩm khỏi Firestore
            await deleteDoc(productRef);
            alert("Sản phẩm phụ kiện đã được xóa.");
        } else {
            alert("Sản phẩm không tồn tại.");
        }

        loadProductList(); // Tải lại danh sách sản phẩm
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
