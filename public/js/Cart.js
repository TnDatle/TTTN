import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { db } from '../../routes/Firebase-Config.js';

// Lấy dữ liệu sản phẩm từ Firestore
async function getProductData(productId) {
    try {
        // Thử với laptop
        let productRef = doc(db, "products", "laptop", "items", productId);
        let productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            return productSnap.data();
        }

        // Nếu không có thì thử với accessories
        productRef = doc(db, "products", "accessories", "items", productId);
        productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            return productSnap.data();
        }

        console.error("❌ Không tìm thấy sản phẩm trong cả laptop và accessories:", productId);
        return null;

    } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu sản phẩm:", error);
        return null;
    }
}


// Hiển thị giỏ hàng
async function displayCart() {
    try {
        const cart = getCart();
        console.log('Cart data:', cart);

        const cartContent = document.querySelector('.cart-content-left table tbody');
        const totalQuantityElement = document.getElementById('total-quantity');
        const totalPriceElement = document.getElementById('total-price');
        const subtotalPriceElement = document.getElementById('subtotal-price');

        if (!cartContent) {
            console.error('Cart content element not found');
            return;
        }

        cartContent.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        for (const item of cart) {
            try {
                let product = await getProductData(item.id);

                if (product) {
                    const subtotal = product.price * item.quantity;
                    total += subtotal;
                    totalItems += item.quantity;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><img src="${product.imageURLs}" alt="${product.name}"></td>
                        <td><p>${product.name}</p></td>
                        <td>
                            <div class="quantity-controls">
                                <button onclick="decreaseQuantity('${item.id}')">-</button>
                                <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', this.value)">
                                <button onclick="increaseQuantity('${item.id}')">+</button>
                            </div>
                        </td>
                        <td><p>${product.price.toLocaleString('vi-VN')}đ</p></td>
                        <td><span class="cart-delete" onclick="removeItem('${item.id}')">Xóa</span></td>
                    `;
                    cartContent.appendChild(row);
                }
            } catch (error) {
                console.error("Error loading product:", error);
            }
        }

        // Cập nhật tổng tiền và số lượng
        if (totalQuantityElement) totalQuantityElement.textContent = totalItems.toString();
        if (totalPriceElement) totalPriceElement.textContent = `${total.toLocaleString('vi-VN')}đ`;
        if (subtotalPriceElement) subtotalPriceElement.textContent = `${total.toLocaleString('vi-VN')}đ`;

        // Hiển thị/ẩn thông báo giỏ hàng trống
        const emptyCartMessage = document.querySelector('.empty-cart-message');
        if (emptyCartMessage) {
            emptyCartMessage.style.display = cart.length === 0 ? 'block' : 'none';
        }

        updateCartCount(); // Cập nhật số lượng hiển thị trên giỏ hàng

    } catch (error) {
        console.error("Error displaying cart:", error);
    }
}

// Cập nhật số lượng sản phẩm
function updateQuantity(productId, newQuantity) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === productId);

    if (index !== -1) {
        newQuantity = parseInt(newQuantity);
        if (newQuantity < 1) newQuantity = 1;
        cart[index].quantity = newQuantity;
        saveCart(cart);
        displayCart();
    }
}

// Tăng số lượng sản phẩm
function increaseQuantity(productId) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart[index].quantity++;
        saveCart(cart);
        displayCart();
    }
}

// Giảm số lượng sản phẩm
function decreaseQuantity(productId) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1 && cart[index].quantity > 1) {
        cart[index].quantity--;
        saveCart(cart);
        displayCart();
    }
}

// Xóa sản phẩm khỏi giỏ hàng (CÓ RELOAD TRANG)
function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    location.reload(); // ⚡ Reload lại trang sau khi xóa sản phẩm
}

// Xóa toàn bộ giỏ hàng
function clearCart() {
    localStorage.removeItem('cart');
    displayCart();
}

// Chuyển đến trang thanh toán
function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Giỏ hàng của bạn đang trống!');
        return;
    }
    window.location.href = '../../views/Delivery/Delivery.html';
}

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', () => {
    displayCart();

    // Thêm event listener cho nút thanh toán
    const checkoutButton = document.querySelector('.cart-content-right-button button:last-child');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', proceedToCheckout);
    }
});

// Lấy giỏ hàng từ localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Lưu giỏ hàng vào localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Cập nhật số lượng hiển thị trên biểu tượng giỏ hàng
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

// Đặt các hàm vào window object để có thể gọi từ HTML
window.updateQuantity = updateQuantity;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;

export { displayCart, updateQuantity, increaseQuantity, decreaseQuantity, removeItem, clearCart };
