import { db } from './Firebase-Config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 

// 🛒 Hiển thị danh sách sản phẩm
async function displayProducts(category) {
    try {
        if (!db) {
            console.error("❌ Firestore chưa được khởi tạo.");
            return;
        }

        const productsRef = collection(db, "products", "laptop", "items");
        const q = query(productsRef, where("category", "==", category));
        const snapshot = await getDocs(q);

        const container = document.querySelector('.product-list'); 
        if (!container) {
            console.error("❌ Container element không tìm thấy.");
            return;
        }
        container.innerHTML = '';

        snapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;

            const priceFormatted = (typeof product.price === 'number' && !isNaN(product.price))
                ? product.price.toLocaleString('vi-VN')
                : 'Giá không xác định';

            const rating = product.rating ? product.rating.toFixed(1) : '0.0';
            const reviewCount = product.reviewCount || 0;

            // 🏷 Hiển thị sản phẩm
            const productHTML = `
                <div class="product-card" data-id="${productId}">
                    <div class="product-image">
                        <img src="${product.imageURLs?.[0] || 'default.jpg'}" alt="${product.name}">
                    </div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-pricing">
                        <span class="new-price">${priceFormatted}<sup>đ</sup></span>
                    </div>
                    <div class="product-rating">
                        ⭐ ${rating} <span>(${reviewCount} đánh giá)</span>
                    </div>
                </div>
            `;
            container.innerHTML += productHTML;
        });

        // 🖱 Xử lý sự kiện click vào từng sản phẩm
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function () {
                const productId = this.getAttribute('data-id');
                viewProductDetail(productId, "laptop", "items");
            });
        });

    } catch (error) {
        console.error("❌ Lỗi khi lấy sản phẩm từ Firestore: ", error);
    }
}

// 🔎 Chuyển hướng đến trang chi tiết sản phẩm
function viewProductDetail(productId, category, subCategory) {
    window.location.href = `product-detail.html?id=${productId}&categories=${category}&subCategories=${subCategory}`;
}
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

});
function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    location.reload(); // ⚡ Reload lại trang sau khi xóa sản phẩm
}

// Gán hàm vào `window`
window.viewProductDetail = viewProductDetail;
window.removeItem = removeItem;


export { displayProducts };
