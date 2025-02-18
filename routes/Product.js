import { db } from './Firebase-Config.js'

  
  // Hàm hiển thị sản phẩm trên laptop.html
  async function displayProducts(categories, subCategories) {
    try {
        const db = firebase.firestore();
        const productsRef = db.collection("products").doc(categories).collection(subCategories);
        const snapshot = await productsRef.get();

        const container = document.querySelector('.cartegory-right-content');
        if (!container) {
            console.error("Container element not found");
            return;
        }
        container.innerHTML = '';

        snapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;

            const priceFormatted = (typeof product.price === 'number' && !isNaN(product.price))
                ? product.price.toLocaleString('vi-VN')
                : 'Giá không xác định';

            const productHTML = `
                <div class="cartegory-right-content-item" onclick="viewProductDetail('${productId}', '${categories}', '${subCategories}')">
                    <img src="${product.imageURL}" alt="${product.name}">
                    <h1>${product.name}</h1>
                    <p>${priceFormatted}<sup>đ</sup></p>
                </div>
            `;
            container.innerHTML += productHTML;
        });
    } catch (error) {
        console.error("Error getting products: ", error);
    }
}

  // Hàm xem chi tiết sản phẩm
  function viewProductDetail(productId, categories, subCategories) {
    window.location.href = `././product-detail.html?id=${productId}&categories=${categories}&subCategories=${subCategories}`;
}

// Hàm lấy chi tiết sản phẩm
async function getProductDetail(productId, categories, subCategories) {
    try {
        // Kiểm tra các tham số đầu vào
        if (!productId || !categories || !subCategories) {
            console.error('Missing parameters:', { productId, categories, subCategories });
            return null;
        }

        const db = firebase.firestore();
        const productDoc = await db.collection("products")
                                 .doc(categories)
                                 .collection(subCategories)
                                 .doc(productId)
                                 .get();

        if (productDoc.exists) {
            return { id: productDoc.id, ...productDoc.data() };
        } else {
            console.log("Không tìm thấy sản phẩm!");
            return null;
        }
    } catch (error) {
        console.error("Error getting product detail: ", error);
        return null;
    }
}
  export{displayProducts,viewProductDetail,getProductDetail};
