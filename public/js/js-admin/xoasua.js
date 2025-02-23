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

// 🔹 Tải danh sách sản phẩm
async function loadProductList() {
    const productList = document.getElementById("productList");
    productList.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "products", "laptop", "items"));
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const card = document.createElement("div");
            card.classList.add("product-card");

            card.innerHTML = `
                <img src="${product.imageURLs?.[0] || 'placeholder.jpg'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Hãng: ${product.brand}</p>
                <p>Đã bán: ${product.sold || 0}</p>
                <p>Đánh giá: ${product.rating || "Chưa có"}/5⭐</p>
                <button class="edit-btn" data-id="${doc.id}">Sửa</button>
                <button class="delete-btn" data-id="${doc.id}">Xóa</button>
            `;
            productList.appendChild(card);
        });
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", () => editProduct(button.dataset.id));
        });
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => deleteLaptop(button.dataset.id));
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
}

// 🔹 Chỉnh sửa sản phẩm
async function editProduct(id) {
    try {
        const docRef = doc(db, "products", "laptop", "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setLaptopDetails(docSnap.data(), docSnap.id);
        } else {
            alert("Sản phẩm không tồn tại.");
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
    }
}

// 🔹 Hiển thị thông tin lên form
function setLaptopDetails(laptop, id) {
    document.getElementById('productId').value = id;
    Object.keys(laptop).forEach(key => {
        if (document.getElementById(key)) {
            document.getElementById(key).value = laptop[key];
        }
    });

    // Hiển thị ảnh
    const previewContainer = document.getElementById("previewImages");
    previewContainer.innerHTML = "";
    if (laptop.imageURLs) {
        laptop.imageURLs.forEach(url => {
            const img = document.createElement("img");
            img.src = url;
            img.style.maxWidth = "100px";
            img.style.margin = "5px";
            previewContainer.appendChild(img);
        });
    }
}

// 🔹 Lưu Laptop với nhiều ảnh
async function saveLaptop(event) {
    event.preventDefault();

    const productIdInput = document.getElementById('productId').value.trim();
    const laptopData = {};

    ["name", "brand", "model", "cpu", "ram", "storage", "gpu", "screen", "battery", "os", "warranty", "description", "price", "discount", "stock", "weight", "ports", "category", "sold", "rating"].forEach(id => {
        laptopData[id] = document.getElementById(id)?.value || "";
    });

    laptopData.price = parseFloat(laptopData.price) || 0;
    laptopData.discount = parseFloat(laptopData.discount) || 0;
    laptopData.stock = parseInt(laptopData.stock) || 0;
    laptopData.sold = parseInt(laptopData.sold) || 0;
    laptopData.rating = parseFloat(laptopData.rating) || 0;
    laptopData.weight = parseFloat(laptopData.weight) || 0;

    if (!laptopData.name || !laptopData.brand || !laptopData.model) {
        alert("Vui lòng nhập đầy đủ thông tin Laptop!");
        return;
    }

    try {
        const imageFiles = document.getElementById('image').files;
        let imageURLs = [];

        for (const file of imageFiles) {
            const storageRef = ref(storage, `images/laptop/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            imageURLs.push(downloadURL);
        }

        if (imageURLs.length > 0) {
            laptopData.imageURLs = imageURLs;
        }

        if (!productIdInput) {
            alert("Vui lòng nhập ID sản phẩm!");
            return;
        }

        await setDoc(doc(db, "products", "laptop", "items", productIdInput), laptopData);
        alert("Sản phẩm đã được lưu!");

        window.location.href = 'xoasua.html';
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
    }
}
// 🔹 Xóa ảnh khỏi Firebase Storage
async function deleteImageFromStorage(imageURL) {
    if (!imageURL) return;
    try {
        const imageRef = ref(storage, imageURL);
        await deleteObject(imageRef);
        console.log("🗑 Ảnh đã được xóa khỏi Firebase Storage:", imageURL);
    } catch (error) {
        console.error("❌ Lỗi khi xóa ảnh từ Storage:", error);
    }
}
// 🔹 Xóa Laptop
async function deleteLaptop(id) {
    if (!id) {
        alert("Không tìm thấy ID sản phẩm để xóa.");
        return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
        const docRef = doc(db, "products", "laptop", "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const productData = docSnap.data();
            const imageURLs = productData.imageURLs || [];
            await Promise.all(imageURLs.map(deleteImageFromStorage));
        }
        await deleteDoc(docRef);
        alert("Sản phẩm laptop đã được xóa.");
        loadProductList();
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
    }
}

// 📌 Xem trước ảnh mới tải lên
document.getElementById("image").addEventListener("change", function (event) {
    const previewNewImages = document.getElementById("previewNewImages");
    previewNewImages.innerHTML = ""; // Xóa preview cũ trước khi hiển thị mới
    const files = event.target.files;

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgWrapper = document.createElement("div");
            imgWrapper.classList.add("image-wrapper");
            imgWrapper.innerHTML = `
                <img src="${e.target.result}" class="preview-image" alt="New Image">
                <button class="remove-btn">❌</button>
            `;
            previewNewImages.appendChild(imgWrapper);

            // Xóa ảnh mới khi bấm nút ❌
            imgWrapper.querySelector(".remove-btn").addEventListener("click", function () {
                imgWrapper.remove();
            });
        };
        reader.readAsDataURL(file);
    }
});

// Hiển thị ảnh đã lưu trong Firebase
function displayStoredImages(images) {
    const previewImages = document.getElementById("previewImages");
    previewImages.innerHTML = ""; // Xóa danh sách cũ
    
    images.forEach((imageURL, index) => {
        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("image-wrapper");
        imgWrapper.innerHTML = `
            <img src="${imageURL}" class="preview-image" alt="Stored Image">
            <button class="remove-btn" data-index="${index}">❌</button>
        `;
        previewImages.appendChild(imgWrapper);

        // Xóa ảnh đã lưu khi bấm nút ❌
        imgWrapper.querySelector(".remove-btn").addEventListener("click", function () {
            if (confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
                images.splice(index, 1); // Xóa ảnh khỏi danh sách
                displayStoredImages(images); // Cập nhật giao diện
            }
        });
    });
}

// 📌 Lắng nghe sự kiện khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadProductList();
    if (productId) {
        editProduct(productId);
    }

    document.getElementById("saveButton")?.addEventListener("click", saveLaptop);
    document.getElementById("updateButton")?.addEventListener("click", saveLaptop);
    document.getElementById("deleteButton")?.addEventListener("click", () => deleteLaptop(productId));
});
