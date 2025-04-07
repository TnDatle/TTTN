import { db } from './Firebase-Config.js';
import { doc, getDoc,getDocs, collection } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

    // Kiểm tra cả laptop và accessories để tìm sản phẩm
    const pathsToTry = [
      ["products", "laptop", "items"],
      ["products", "accessories", "items"]
    ];

    let docSnap = null;

    for (const path of pathsToTry) {
      const docRef = doc(db, ...path, productId);
      const result = await getDoc(docRef);
      if (result.exists()) {
        docSnap = result;
        break;
      }
    }

    if (docSnap && docSnap.exists()) {
      currentProduct = docSnap.data();
      currentProduct.id = docSnap.id;
      productImages = currentProduct.imageURLs || [];

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

  displayAccessorySpecs(product, product.category);  // ✅ dùng category thật
  toggleSpecTables(product.category);                // ✅ dùng category thật

  updateThumbnails(productImages);
  getSimilarProducts();
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


// Thêm vào giỏ hàng mà không hiển thị thông báo
function addToCartSilently() {
  if (!currentProduct) {
    console.error("Không có thông tin sản phẩm");
    return;
  }

  const quantity = parseInt(document.getElementById('quantity').value);
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existingItemIndex = cart.findIndex(item => item.id === currentProduct.id);
  
  if (existingItemIndex !== -1) {
    // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
    cart[existingItemIndex].quantity += quantity;
  } else {
    // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
    cart.push({
      id: currentProduct.id,
      quantity: quantity
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount(); // Cập nhật số lượng giỏ hàng
}

// Thêm vào giỏ hàng và hiển thị thông báo
function addToCart() {
  addToCartSilently();
}

// 🔄 Cập nhật số lượng giỏ hàng
function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = totalItems;
}

// 💡 Hiển thị thông số phụ kiện nếu không phải là laptop
function displayAccessorySpecs(product, category) {

  //Thông tin của chuột
  if (category === "mouse") {
    document.getElementById('mouse-brand').textContent = product.brand || 'Không có thông tin';
    document.getElementById('mouse-height').textContent = product.height || 'Không có thông tin';
    document.getElementById('mouse-buttons').textContent = product.buttons || 'Không có thông tin';
    document.getElementById('mouse-weight').textContent = product.weight || 'Không có thông tin';
    document.getElementById('mouse-dpi').textContent = product.dpi || 'Không có thông tin';
    document.getElementById('mouse-acceleration').textContent = product.acceleration || 'Không có thông tin';
    document.getElementById('mouse-speed').textContent = product.speed || 'Không có thông tin';
    document.getElementById('mouse-battery').textContent = product.battery || 'Không có thông tin';
    document.getElementById('mouse-warranty').textContent = product.warranty || 'Không có thông tin';
    document.getElementById('mouse-width').textContent = product.width || 'Không có thông tin';
    document.getElementById('mouse-depth').textContent = product.depth || 'Không có thông tin';

    // Thông tin của bàn phím 
  } else if (category === "keyboard") {
    document.getElementById('keyboard-switch').textContent = product.switch || 'Không có thông tin';
    document.getElementById('keyboard-model').textContent = product.model || 'Không có thông tin';
    document.getElementById('keyboard-size').textContent = product.size || 'Không có thông tin';
    document.getElementById('keyboard-os').textContent = product.os || 'Không có thông tin';
    document.getElementById('keyboard-cable-length').textContent = product.cableLength || 'Không có thông tin';
    document.getElementById('keyboard-brand').textContent = product.brand || 'Không có thông tin';
    document.getElementById('keyboard-keycap').textContent = product.keycap || 'Không có thông tin';
    document.getElementById('keyboard-weight').textContent = product.weight || 'Không có thông tin';
    document.getElementById('keyboard-software').textContent = product.software || 'Không có thông tin';
    document.getElementById('keyboard-connection').textContent = product.connection || 'Không có thông tin';
    document.getElementById('keyboard-rgb').textContent = product.rgb || 'Không có thông tin';
    document.getElementById('keyboard-keys').textContent = product.keys || 'Không có thông tin';
    

    //Thông tin của tai nghe
  } else if (category === "headset") {
    document.getElementById('headphone-brand').textContent = product.brand || 'Không có thông tin';
    document.getElementById('headphone-name').textContent = product.name || 'Không có thông tin';
    document.getElementById('headphone-color').textContent = product.color || 'Không có thông tin';
    document.getElementById('headphone-connection').textContent = product.connection || 'Không có thông tin';
    document.getElementById('headphone-type').textContent = product.type || 'Không có thông tin';
    document.getElementById('headphone-port').textContent = product.port || 'Không có thông tin';
    document.getElementById('headphone-cable-length').textContent = product.cableLength || 'Không có thông tin';
    document.getElementById('headphone-mic').textContent = product.microphone || 'Không có thông tin';
    document.getElementById('headphone-material').textContent = product.material || 'Không có thông tin';
    document.getElementById('headphone-driver').textContent = product.driver || 'Không có thông tin';
    document.getElementById('headphone-led').textContent = product.led || 'Không có thông tin';
    document.getElementById('headphone-impedance').textContent = product.impedance || 'Không có thông tin';
    document.getElementById('headphone-frequency').textContent = product.frequency || 'Không có thông tin';
    document.getElementById('headphone-frame').textContent = product.frame || 'Không có thông tin';
    document.getElementById('headphone-earpad').textContent = product.earpad || 'Không có thông tin';
    document.getElementById('headphone-compatible').textContent = product.compatible || 'Không có thông tin';
    document.getElementById('headphone-note').textContent = product.note || 'Không có thông tin';
    document.getElementById('headphone-accessories').textContent = product.accessories || 'Không có thông tin';
    document.getElementById('headphone-features').textContent = product.features || 'Không có thông tin';
    
  }
}



// Hàm lấy sản phẩm tương tự
async function getSimilarProducts() {
  try {
    // Lấy lại từ URL để chắc chắn
    const urlParams = new URLSearchParams(window.location.search);
    const currentCategory = urlParams.get('categories') || "laptop";
    const currentSubCategory = urlParams.get('subCategories') || "items";

    const similarProducts = [];
    const querySnapshot = await getDocs(collection(db, "products", currentCategory, currentSubCategory));

    querySnapshot.forEach((docSnap) => {
      const product = docSnap.data();

      if (docSnap.id !== currentProduct.id) {
        product.id = docSnap.id;
        product.category = currentCategory;
        product.subCategory = currentSubCategory;

        if (
          product.cpu === currentProduct.cpu ||
          product.ram === currentProduct.ram ||
          product.storage === currentProduct.storage ||
          product.category === currentProduct.category ||
          product.price === currentProduct.price ||
          product.price === currentProduct.price - 1000000 ||
          product.price === currentProduct.price + 1000000
        ) {
          similarProducts.push(product);
        }
      }
    });

    displaySimilarProducts(similarProducts);
  } catch (error) {
    console.error("❌ Lỗi khi lấy sản phẩm tương tự: ", error);
  }
}

// Hàm hiển thị sản phẩm tương tự
function displaySimilarProducts(similarProducts) {
  const similarProductsList = document.querySelector(".similar-products ul");
  similarProductsList.innerHTML = "";

  similarProducts.forEach((product) => {
    const link = `product-detail.html?id=${product.id}&categories=${product.category}&subCategories=${product.subCategory}`;
    const imageURL = product.imageURLs?.[0] || 'default.jpg';

    const productHTML = `
      <li onclick="window.location.href='${link}'" style="cursor: pointer;">
        <img src="${imageURL}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price?.toLocaleString('vi-VN') || 'Liên hệ'}đ</p>
      </li>
    `;
    similarProductsList.innerHTML += productHTML;
  });
}



// 🚀 Khởi động khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
  updateCartCount();

  const addToCartBtn = document.getElementById('add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', addToCart);
  }
});

function toggleSpecTables(category) {
  const laptopSpecs = document.querySelector('.product-specs');
  const mouseSpecs = document.querySelector('.mouse-specs');
  const keyboardSpecs = document.querySelector('.keyboard-specs');
  const headphoneSpecs = document.querySelector('.headphone-specs');

  // Ẩn tất cả bảng
  [laptopSpecs, mouseSpecs, keyboardSpecs, headphoneSpecs].forEach(el => {
    if (el) el.style.display = 'none';
  });

  // Hiển thị bảng phù hợp với category
  switch (category) {
    case 'office':
      if (laptopSpecs) laptopSpecs.style.display = 'block';
      break;
    case 'gaming':
      if (laptopSpecs) laptopSpecs.style.display = 'block';
      break;
    case 'workstation':
      if (laptopSpecs) laptopSpecs.style.display = 'block';
      break;
    case 'mouse':
      if (mouseSpecs) mouseSpecs.style.display = 'block';
      break;
    case 'keyboard':
      if (keyboardSpecs) keyboardSpecs.style.display = 'block';
      break;
    case 'headphone': // phòng khi có dùng nhầm từ
      if (headphoneSpecs) headphoneSpecs.style.display = 'block';
      break;
    default:
      console.warn('Không xác định được loại sản phẩm:', category);
  }
}

// Gán các hàm vào `window` để HTML có thể gọi
window.changeMainImage = changeMainImage;
window.addToCart = addToCart;
window.loadProductDetail = loadProductDetail;
window.prevImage = prevImage;
window.nextImage = nextImage;