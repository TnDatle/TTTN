import { db } from './Firebase-Config.js';
import {  collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 


// Lấy danh sách laptop từ Firebase
async function getLaptops() {
    const laptopsRef = collection(db, 'products/laptop/items');
    const laptops = await getDocs(laptopsRef);
    const laptopList = [];
  
    laptops.forEach((doc) => {
      const laptop = doc.data();
      laptopList.push({
        id: doc.id,
        name: laptop.name,
        cpu: laptop.cpu,
        ram: laptop.ram,
        ssd: laptop.ssd,
        vga: laptop.vga,
        image: laptop.imageURLs, // Thêm trường image vào dữ liệu laptop
      });
    });
  
    return laptopList;
  }
  
  // Hiển thị danh sách laptop trong select
  async function displayLaptopList() {
    const laptopList = await getLaptops();
    const select1 = document.getElementById('laptop-1');
    const select2 = document.getElementById('laptop-2');
  
    laptopList.forEach((laptop) => {
      const option1 = document.createElement('option');
      option1.value = laptop.id;
      option1.textContent = laptop.name;
      select1.appendChild(option1);
  
      const option2 = document.createElement('option');
      option2.value = laptop.id;
      option2.textContent = laptop.name;
      select2.appendChild(option2);
    });
  }
  
  // So sánh cấu hình laptop
  async function compareLaptopConfig() {
    const select1 = document.getElementById('laptop-1');
    const select2 = document.getElementById('laptop-2');
    const laptop1Id = select1.value;
    const laptop2Id = select2.value;
  
    if (laptop1Id && laptop2Id) {
      const laptop1Ref = doc(db, 'products/laptop/items', laptop1Id);
      const laptop2Ref = doc(db, 'products/laptop/items', laptop2Id);
  
      const laptop1 = await getDoc(laptop1Ref);
      const laptop2 = await getDoc(laptop2Ref);
  
      if (laptop1.exists() && laptop2.exists()) {
        const laptop1Data = laptop1.data();
        const laptop2Data = laptop2.data();
  
        document.getElementById('cpu-1').textContent = laptop1Data.cpu;
        document.getElementById('ram-1').textContent = laptop1Data.ram;
        document.getElementById('ssd-1').textContent = laptop1Data.ssd;
        document.getElementById('vga-1').textContent = laptop1Data.vga;
        document.getElementById('laptop-1-image').src = laptop1Data.imageURLs;
        document.querySelector('.compare-config-left h3').textContent = laptop1Data.name; // đổi tên laptop 1 // Thay đổi nguồn hình ảnh
  
        document.getElementById('cpu-2').textContent = laptop2Data.cpu;
        document.getElementById('ram-2').textContent = laptop2Data.ram;
        document.getElementById('ssd-2').textContent = laptop2Data.ssd;
        document.getElementById('vga-2').textContent = laptop2Data.vga;
        document.getElementById('laptop-2-image').src = laptop2Data.imageURLs; // Thay đổi nguồn hình ảnh
        document.querySelector('.compare-config-right h3').textContent = laptop2Data.name; // đổi tên laptop 2
      }
    }
  }
  
  // Sự kiện khi chọn laptop
  document.getElementById('compare-btn').addEventListener('click', compareLaptopConfig);
  
  // Hiển thị danh sách laptop khi tải trang
  displayLaptopList();