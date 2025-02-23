import { db } from './Firebase-Config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🛠 Lấy tham số từ URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const category = urlParams.get('categories') || "laptop";
const subCategory = urlParams.get('subCategories') || "items";

let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];

// 🏷 Tải chi tiết sản phẩm
async function loadProductDetail() {
    try {
        if (!productId) {
            console.error("❌ Thiếu ID sản phẩm!");
            document.querySelector('.product-detail-container').innerHTML = '<p>Không tìm thấy sản phẩm.</p>';
            return;
        }

        console.log(`🛒 Đang tải sản phẩm: ${productId}, Category: ${category}, SubCategory: ${subCategory}`);

        const docRef = doc(db, "products", category, subCategory, productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentProduct = docSnap.data();
            currentProduct.id = docSnap.id;
            productImages = currentProduct.imageURLs || [];  // Lưu danh sách ảnh

            displayProductDetails(currentProduct);
        } else {
            console.warn("⚠ Không tìm thấy sản phẩm!");
            document.querySelector('.product-detail-container').innerHTML = '<p>Sản phẩm không tồn tại.</p>';
        }
    } catch (error) {
        console.error("❌ Lỗi khi tải sản phẩm: ", error);
    }
}

// 🎨 Hiển thị chi tiết sản phẩm
function displayProductDetails(product) {
    const mainImage = document.getElementById('product-image');
    if (!mainImage) {
        console.error("❌ Không tìm thấy phần tử product-image.");
        return;
    }

    mainImage.src = productImages.length > 0 ? productImages[0] : 'default.jpg';
    document.getElementById('product-name').textContent = product.name || 'Không có tên';
    document.getElementById('product-price').textContent = 
        product.price ? `${product.price.toLocaleString('vi-VN')}đ` : 'Giá không xác định';
    document.getElementById('product-description').textContent = 
        product.description || 'Không có mô tả';

    document.getElementById('product-cpu').textContent = product.cpu || 'Không có thông tin';
    document.getElementById('product-ram').textContent = product.ram || 'Không có thông tin';
    document.getElementById('product-storage').textContent = product.storage || 'Không có thông tin';
    document.getElementById('product-screen').textContent = product.screen || 'Không có thông tin';
    document.getElementById('product-gpu').textContent = product.gpu || 'Không có thông tin';
    document.getElementById('product-battery').textContent = product.battery || 'Không có thông tin';
    document.getElementById('product-os').textContent = product.os || 'Không có thông tin';
    document.getElementById('product-ports').textContent = product.ports || 'Không có thông tin';
    document.getElementById('product-warranty').textContent = product.warranty || 'Không có bảo hành';
    document.getElementById('product-weight').textContent = product.weight ? `${product.weight} kg` : 'Không có thông tin';

    updateThumbnails(productImages);
}

// 🖼 Cập nhật danh sách ảnh nhỏ
function updateThumbnails(imageUrls) {
    const thumbnailContainer = document.querySelector('.product-thumbnails');
    if (!thumbnailContainer) return;

    thumbnailContainer.innerHTML = (imageUrls.length > 0) 
        ? imageUrls.map((url, index) => 
            `<img src="${url}" alt="Thumbnail" class="thumbnail" onclick="changeMainImage(${index})">`
        ).join('')
        : '<p>Không có hình ảnh</p>';
}

// 📸 Đổi ảnh chính
function changeMainImage(index) {
    const mainImage = document.getElementById('product-image');
    if (!mainImage) return;

    if (productImages.length > index) {
        mainImage.src = productImages[index];
        currentImageIndex = index;
    }
}

// ▶️ Chuyển sang ảnh tiếp theo
function nextImage() {
    if (productImages.length === 0) return;

    currentImageIndex = (currentImageIndex + 1) % productImages.length;
    document.getElementById('product-image').src = productImages[currentImageIndex];
}

// ◀️ Quay lại ảnh trước đó
function prevImage() {
    if (productImages.length === 0) return;

    currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    document.getElementById('product-image').src = productImages[currentImageIndex];
}

// 🛒 Thêm vào giỏ hàng
function addToCart() {
    if (!currentProduct) {
        alert("⚠ Không tìm thấy sản phẩm để thêm vào giỏ hàng!");
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const existingItemIndex = cart.findIndex(item => item.id === currentProduct.id);

    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: productImages[0] || 'default.jpg',
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    alert(`🎉 Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
}

// 🔄 Cập nhật số lượng giỏ hàng
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

// 🚀 Khởi động khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail();
    updateCartCount();

    document.getElementById('prev-button').addEventListener('click', prevImage);
    document.getElementById('next-button').addEventListener('click', nextImage);
});

// Gán các hàm vào `window` để HTML có thể gọi
window.changeMainImage = changeMainImage;
window.addToCart = addToCart;
window.loadProductDetail = loadProductDetail;
window.prevImage = prevImage;
window.nextImage = nextImage;
