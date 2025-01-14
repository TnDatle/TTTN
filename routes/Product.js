// Import Firestore SDK
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { db } from './Firebase-Config.js';

// Xuất các hàm
export { displayProducts, viewProductDetail, getProductDetail, searchProductsByName };

async function displayProducts() {
    try {
        const container = document.querySelector('.cartegory-right-content');
        if (!container) {
            console.error("Container element not found");
            return;
        }
        container.innerHTML = '';

        // Lấy danh sách các thương hiệu (brands)
        const brandsSnapshot = await db.collection("products").doc("laptop").listCollections();
        if (!brandsSnapshot || brandsSnapshot.length === 0) {
            console.error("No brands found under 'products/laptop'");
            return;
        }

        // Duyệt qua từng thương hiệu
        for (const brand of brandsSnapshot) {
            console.log("Processing brand:", brand.id);
            const productsSnapshot = await brand.get();

            productsSnapshot.forEach((doc) => {
                const product = doc.data();
                const { name, price, imageURL } = product;

                if (!name || !price || !imageURL) {
                    console.warn("Missing fields in product:", doc.id, product);
                    return;
                }

                const productHTML = `
                    <div class="cartegory-right-content-item" onclick="viewProductDetail('${brand.id}', '${doc.id}')">
                        <img src="${imageURL}" alt="${name}">
                        <h1>${name}</h1>
                        <p>${price.toLocaleString('vi-VN')}<sup>đ</sup></p>
                    </div>
                `;
                console.log('Product HTML:', productHTML);
                container.innerHTML += productHTML;
            });
        }
    } catch (error) {
        console.error("Error displaying products:", error);
    }
}

// Hàm chuyển đến chi tiết sản phẩm
function viewProductDetail(brand, productId) {
    if (!brand || !productId) {
        console.error("Missing parameters for viewProductDetail");
        return;
    }
    window.location.href = `product-detail.html?brand=${brand}&id=${productId}`;
}

// Hàm lấy chi tiết sản phẩm
async function getProductDetail(brand, productId) {
    try {
        if (!brand || !productId) {
            console.error('Missing parameters:', { brand, productId });
            return null;
        }

        const productDocRef = doc(db, "products/laptop", brand, productId);
        const productDoc = await getDoc(productDocRef);

        if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() };
        } else {
            console.log("Không tìm thấy sản phẩm!");
            return null;
        }
    } catch (error) {
        console.error("Error getting product detail:", error);
        return null;
    }
}

// Tìm kiếm sản phẩm theo tên
async function searchProductsByName(searchTerm) {
    if (!searchTerm) {
        console.error("Invalid search term");
        return [];
    }

    try {
        const laptopDocRef = doc(db, "products", "laptop");
        const laptopDoc = await getDoc(laptopDocRef);

        if (!laptopDoc.exists()) {
            console.error("No 'laptop' document found");
            return [];
        }

        const brands = laptopDoc.data();
        const results = [];

        for (const brand in brands) {
            const brandCollectionRef = collection(db, "products/laptop", brand);
            const productsSnapshot = await getDocs(brandCollectionRef);

            const filteredProducts = productsSnapshot.docs
                .map(doc => {
                    const { name, price, imageURL } = doc.data();
                    return {
                        id: doc.id,
                        name,
                        price,
                        imageURL,
                        brand
                    };
                })
                .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));

            results.push(...filteredProducts);
        }

        return results;
    } catch (error) {
        console.error("Error searching products:", error);
        return [];
    }
}
