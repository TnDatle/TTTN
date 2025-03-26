import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 🔹 Cấu hình Firebase
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

// 🔹 Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = []; // Lưu toàn bộ sản phẩm
const pageSize = 5; // ✅ Mỗi trang hiển thị 5 sản phẩm
let currentPage = 0; // Trang hiện tại

// 🔹 Lấy sản phẩm từ Firebase
async function fetchBestSellingProducts() {
    const productsList = document.getElementById("products-list");
    const paginationDots = document.querySelector(".swiper-pagination");

    productsList.innerHTML = ""; // Xóa dữ liệu cũ
    paginationDots.innerHTML = ""; // Xóa dots cũ

    try {
        const productCategories = ["laptop"];
        allProducts = []; // Reset danh sách sản phẩm

        for (const category of productCategories) {
            const itemsRef = collection(db, `products/${category}/items`);
            const q = query(itemsRef, where("sold", ">", 5));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                const productData = doc.data();
                allProducts.push({
                    id: doc.id,
                    name: productData.name || "Không có tên",
                    price: productData.price
                        ? Number(productData.price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })
                        : "Chưa có giá",
                    sold: productData.sold || 0,
                    image: productData.imageURLs ? productData.imageURLs[0] : "placeholder.jpg",
                });
            });
        }

        // Nếu không có sản phẩm, hiển thị thông báo trống
        if (allProducts.length === 0) {
            productsList.innerHTML = "<p>Không có sản phẩm nào.</p>";
            return;
        }

        // 🔹 Tạo dots dựa trên số lượng trang
        const totalPages = Math.ceil(allProducts.length / pageSize);
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement("span");
            dot.classList.add("dot");
            if (i === 0) dot.classList.add("active"); // Dot đầu tiên active mặc định
            dot.dataset.page = i;
            paginationDots.appendChild(dot);
        }

        // Hiển thị trang đầu tiên
        renderProducts(0);

        // 🔹 Thêm sự kiện click cho dots
        document.querySelectorAll(".dot").forEach((dot) => {
            dot.addEventListener("click", function () {
                const page = Number(this.dataset.page);
                renderProducts(page);
            });
        });

    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
        productsList.innerHTML = "<p>Lỗi khi tải sản phẩm.</p>";
    }
}

// 🔹 Hiển thị sản phẩm theo trang
function renderProducts(page) {
    const productsList = document.getElementById("products-list");
    productsList.innerHTML = ""; // Xóa sản phẩm cũ

    const start = page * pageSize;
    const end = start + pageSize;
    const productsToShow = allProducts.slice(start, end);

    productsToShow.forEach((product) => {
        const productItem = document.createElement("div");
        productItem.classList.add("product-item");
        productItem.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img" data-id="${product.id}" />
            <h3>${product.name}</h3>
            <p class="price">Giá: ${product.price}</p> 
            <p>Đã bán: ${product.sold}</p>
        `;
        productsList.appendChild(productItem);
    });

    // Cập nhật trạng thái dot active
    document.querySelectorAll(".dot").forEach((dot) => dot.classList.remove("active"));
    document.querySelector(`.dot[data-page="${page}"]`).classList.add("active");

    // Thêm sự kiện click cho ảnh sản phẩm
    document.querySelectorAll(".product-img").forEach((img) => {
        img.addEventListener("click", (event) => {
            const productId = event.target.dataset.id;
            window.location.href = `../views/Category/product-detail.html?id=${productId}`;
        });
    });
}

// Khi trang load, gọi hàm fetchBestSellingProducts
document.addEventListener("DOMContentLoaded", fetchBestSellingProducts);

// Thêm sự kiện cho nút điều hướng
document.getElementById("prev-btn").addEventListener("click", () => changePage(-1));
document.getElementById("next-btn").addEventListener("click", () => changePage(1));

function changePage(direction) {
    const totalPages = Math.ceil(allProducts.length / pageSize);
    currentPage += direction;

    if (currentPage < 0) {
        currentPage = totalPages - 1; // Quay lại trang cuối nếu lùi quá đầu danh sách
    } else if (currentPage >= totalPages) {
        currentPage = 0; // Quay về trang đầu nếu vượt quá danh sách
    }

    renderProducts(currentPage);
}


