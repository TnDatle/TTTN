import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hàm tái sử dụng để tạo HTML sản phẩm
function renderProductCard(product, id, collectionName) {
    const formattedPrice = product.price
      ? Number(product.price).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        })
      : "Chưa có giá";
  
    const rating = product.rating || "Chưa có đánh giá";
    const image = product.imageURLs?.[0] || "default.jpg";
  
    return `
      <div class="product-card" data-id="${id}" data-collection="${collectionName}">
        <div class="image">
          <img src="${image}" alt="${product.name}">
        </div>
        <div class="details">
          <h3 class="title">${product.name}</h3>
          <p class="price">Giá: ${formattedPrice}</p> 
          <div class="rating">
            ⭐ ${rating} <span>(${product.reviewCount || 0} đánh giá)</span>
          </div>
        </div>
      </div>
    `;
  }
  
window.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const suggestionsBox = document.getElementById("suggestions");

  if (!searchInput || !searchButton || !suggestionsBox) {
    console.error("Thiếu phần tử HTML cần thiết cho tìm kiếm");
    return;
  }

  // Gợi ý sản phẩm khi nhập từ khóa
  searchInput.addEventListener("input", async () => {
    const keyword = searchInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";

    if (!keyword) {
      suggestionsBox.style.display = "none";
      return;
    }

    try {
      const collections = ["laptop", "accessories"];
      let suggestionsHTML = "";

      for (const collectionName of collections) {
        const itemsRef = collection(db, "products", collectionName, "items");
        const snapshot = await getDocs(itemsRef);

        snapshot.forEach((doc) => {
          const product = doc.data();
          const name = product.name?.toLowerCase();

          if (name && name.includes(keyword)) {
            suggestionsHTML += renderProductCard(product, doc.id);
          }
        });
      }

      if (suggestionsHTML) {
        suggestionsBox.innerHTML = suggestionsHTML;
        suggestionsBox.style.display = "block";
      } else {
        suggestionsBox.style.display = "none";
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm:", err);
    }
  });

  // Bấm chọn sản phẩm trong gợi ý
  suggestionsBox.addEventListener("click", (e) => {
    const target = e.target.closest(".product-card");
    if (target) {
      const id = target.dataset.id;
      window.location.href = `/views/Category/product-detail.html?id=${id}`;
    }
  });

  // Bấm nút tìm kiếm
  searchButton.addEventListener("click", () => {
    const keyword = searchInput.value.trim();
    if (keyword) {
      window.location.href = `/views/Category/Search.html?q=${encodeURIComponent(keyword)}`;
    }
  });

  // Nếu có từ khóa tìm kiếm trong URL -> tìm kiếm
  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get('q');

  if (searchKeyword) {
    searchInput.value = searchKeyword;
    performSearch(searchKeyword);
  }

  async function performSearch(keyword) {
    const searchResultsBox = document.getElementById("search-results");
  
    try {
      const collections = ["laptop", "accessories"];
      let searchResultsHTML = "";
  
      for (const collectionName of collections) {
        const itemsRef = collection(db, "products", collectionName, "items");
        const snapshot = await getDocs(itemsRef);
  
        snapshot.forEach((doc) => {
          const product = doc.data();
          const name = product.name?.toLowerCase();
  
          if (name && name.includes(keyword.toLowerCase())) {
            // Gắn tên loại sản phẩm vào thẻ
            const card = `
              <div class="product-wrapper">
                ${renderProductCard(product, doc.id)}
              </div>
            `;
            searchResultsHTML += card;
          }
        });
      }
  
      if (searchResultsHTML) {
        searchResultsBox.innerHTML = searchResultsHTML;
      } else {
        searchResultsBox.innerHTML = "<p>Không có sản phẩm nào phù hợp với từ khóa tìm kiếm của bạn.</p>";
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm:", err);
    }
  }

    // Bấm chọn sản phẩm trong kết quả tìm kiếm chính
    document.addEventListener("click", (e) => {
        const target = e.target.closest(".product-card");
        if (target && target.closest("#search-results")) {
        const id = target.dataset.id;
        window.location.href = `/views/Category/product-detail.html?id=${id}&categories=${collection}&subCategories=items`;
        }
    });
  
});
