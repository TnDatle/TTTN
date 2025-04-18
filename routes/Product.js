import { db } from './Firebase-Config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 

// 🛒 Hiển thị danh sách sản phẩm
async function displayProducts(category, filters = {}) {
    try {
        if (!db) {
            console.error("❌ Firestore chưa được khởi tạo.");
            return;
        }

        let productsRef = collection(db, "products", "laptop", "items");
        let q = query(productsRef, where("category", "==", category));

        // Áp dụng bộ lọc brand và priceRange bằng Firestore
        if (filters.brand) {
            const formattedBrand = filters.brand.charAt(0).toUpperCase() + filters.brand.slice(1); // "lenovo" → "Lenovo"
            q = query(q, where("brand", "==", formattedBrand));
        }
        if (filters.priceRange) {
            const { min, max } = filters.priceRange;
            if (min !== null) q = query(q, where("price", ">=", min));
            if (max !== null) q = query(q, where("price", "<=", max));
        }

        const snapshot = await getDocs(q);
        console.log("Số sản phẩm tìm thấy từ Firestore:", snapshot.size); // Log số sản phẩm từ Firestore

        const container = document.querySelector('.product-list');
        if (!container) {
            console.error("❌ Không tìm thấy container.");
            return;
        }
        container.innerHTML = '';

        if (snapshot.empty) {
            console.log("❌ Không có sản phẩm nào khớp với bộ lọc Firestore.");
            container.innerHTML = '<p>Không tìm thấy sản phẩm nào.</p>';
            return;
        }

        // Chuyển dữ liệu từ snapshot thành mảng để lọc phía client
        let products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Lọc phía client cho cpu, ram, gpu bằng .includes()
        let filteredProducts = products;
        if (filters.cpu) {
            const cpuValues = filters.cpu.split('|');
            console.log("Đang lọc CPU với giá trị:", cpuValues);
            filteredProducts = filteredProducts.filter(product => {
                const cpuLower = product.cpu.toLowerCase();
                return cpuValues.some(value => {
                    const valueLower = value.toLowerCase();
                    // Kiểm tra .includes() như trước
                    if (cpuLower.includes(valueLower)) return true;
                    // Kiểm tra thêm các mẫu khác
                    if (valueLower.includes('intel i')) {
                        const cpuType = valueLower.split(' ')[2]; // Lấy "i5", "i7", "i9"
                        // Kiểm tra "i5", "i7", "i9" ở bất kỳ vị trí nào
                        return cpuLower.includes(cpuType);
                    }
                    if (valueLower.includes('amd ryzen')) {
                        const cpuType = valueLower.split(' ')[2]; // Lấy "5", "7", "9"
                        return cpuLower.includes(`ryzen ${cpuType}`) || cpuLower.includes(cpuType);
                    }
                    if (valueLower.includes('ultra')) {
                        return cpuLower.includes('ultra');
                    }
                    return false;
                });
            });
        }
        if (filters.ram) {
            filteredProducts = filteredProducts.filter(product =>
                product.ram.toLowerCase().includes(filters.ram.toLowerCase())
            );
        }
        if (filters.vga) {
            filteredProducts = filteredProducts.filter(product =>
                product.gpu.toLowerCase().includes(filters.vga.toLowerCase())
            );
        }

        if (filteredProducts.length === 0) {
            console.log("❌ Không có sản phẩm nào khớp với bộ lọc client.");
            container.innerHTML = '<p>Không tìm thấy sản phẩm nào.</p>';
            return;
        }

        // Hiển thị sản phẩm đã lọc
        filteredProducts.forEach(product => {
            const priceFormatted = (typeof product.price === 'number' && !isNaN(product.price))
                ? product.price.toLocaleString('vi-VN')
                : 'Giá không xác định';

            const rating = product.rating ? product.rating.toFixed(1) : '0.0';
            const reviewCount = product.reviewCount || 0;

            const productHTML = `
                <div class="product-card" data-id="${product.id}">
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

        // Gắn sự kiện click cho các sản phẩm
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

function getFilters() {
    const brand = document.getElementById('filter-brand')?.value || null;
    const cpu = document.getElementById('filter-cpu')?.value || null;
    const ram = document.getElementById('filter-ram')?.value || null;
    const vga = document.getElementById('filter-vga')?.value || null;
    const priceRangeValue = document.getElementById('filter-price-range')?.value || null;

    let priceRange = { min: null, max: null };
    if (priceRangeValue) {
        if (priceRangeValue.includes('+')) {
            // Trường hợp "Trên 30 triệu"
            priceRange.min = parseInt(priceRangeValue.replace('+', ''));
            priceRange.max = null; // Không giới hạn trên
        } else {
            const [min, max] = priceRangeValue.split('-').map(Number);
            priceRange = { min, max };
        }
    }

    return {
        brand,
        cpu,
        ram,
        vga,
        priceRange
    };
}

document.getElementById('apply-filters')?.addEventListener('click', () => {
    const filters = getFilters();
    // Lấy category từ data-category của .filter-container
    const category = document.querySelector('.filter-container')?.dataset.category || 'office'; // Mặc định là 'office' nếu không tìm thấy
    console.log("Đang áp dụng bộ lọc:", filters, "Category:", category);
    displayProducts(category, filters);
});

async function displayAccessories(category, filters = {}) {
    try {
        if (!db) {
            console.error("❌ Firestore chưa được khởi tạo.");
            return;
        }

        const productsRef = collection(db, "products", "accessories", "items");
        let q = query(productsRef, where("category", "==", category));

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

            //  Lọc tên phụ kiện (dùng includes, không phân biệt hoa thường)
            if (filters.name) {
                const keyword = filters.name.toLowerCase();
                const productName = product.name?.toLowerCase() || '';
                if (!productName.includes(keyword)) return; // Skip nếu không khớp
            }

            //  Lọc giá nếu có
            if (filters.priceRange) {
                const { min, max } = filters.priceRange;
                if ((min !== null && product.price < min) || (max !== null && product.price > max)) return;
            }

            // Tạo HTML sản phẩm
            const priceFormatted = (typeof product.price === 'number' && !isNaN(product.price))
                ? product.price.toLocaleString('vi-VN')
                : 'Giá không xác định';

            const rating = product.rating ? product.rating.toFixed(1) : '0.0';
            const reviewCount = product.reviewCount || 0;

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

        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function () {
                const productId = this.getAttribute('data-id');
                viewProductDetail(productId, "accessories", "items");
            });
        });

    } catch (error) {
        console.error("❌ Lỗi khi lấy sản phẩm từ Firestore: ", error);
    }
}

function getFiltersForAccessories() {
    const name = document.getElementById('filter-name-accesories')?.value || null;
    const priceRangeValue = document.getElementById('filter-price-range-accesories')?.value || null;

    let priceRange = { min: null, max: null };
    if (priceRangeValue) {
        if (priceRangeValue === '1000000') {
            priceRange.min = 0;
            priceRange.max = 1000000;
        } else if (priceRangeValue === '1000000-') {
            priceRange.min = 1000000;
            priceRange.max = null;
        }
    }

    return { name, priceRange };
}

document.getElementById('apply-filters-accesories')?.addEventListener('click', () => {
    const filters = getFiltersForAccessories();
    const category = document.querySelector('.filter-container')?.dataset.category || 'mouse,keyboard,headphone'; // Mặc định là 'mouse' nếu không tìm thấy
    console.log("Đang áp dụng bộ lọc phụ kiện:", filters, "Category:", category);
    displayAccessories(category, filters);  // Gọi hàm displayAccessories để áp dụng bộ lọc
});



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


export { displayProducts, displayAccessories };
