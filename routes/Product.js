// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDMKBDgcjZaFh2LDPs9ZuQzQFHMuZtnOPA",
    authDomain: "store-music-fae02.firebaseapp.com",
    databaseURL: "https://store-music-fae02-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "store-music-fae02",
    storageBucket: "store-music-fae02.appspot.com",
    messagingSenderId: "35440000355",
    appId: "1:35440000355:web:7f49a002690331b9812756",
    measurementId: "G-BQPH02HFGC"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
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
async function uploadImageAndGetURL(imageFile, categories, subCategories, imageName) {
    const storage = firebase.storage();
    const storageRef = storage.ref(`image/${categories}/${subCategories}/${imageName}`);
    
    await storageRef.put(imageFile);
    const downloadURL = await storageRef.getDownloadURL();
    return downloadURL;
}

  
  // Hàm xem chi tiết sản phẩm
  function viewProductDetail(productId, collection, document, subCollection) {
    
  }
  export{displayProducts,uploadImageAndGetURL,viewProductDetail};
