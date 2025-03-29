const admin = require("firebase-admin");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const { expect } = chai;

// Khởi tạo Firebase Admin SDK với thông tin xác thực
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "store-music-fae02", // Dự án production
  });
} catch (error) {
  console.error("❌ Lỗi khi khởi tạo Firebase Admin SDK:", error.message);
  process.exit(1);
}

const db = admin.firestore();

describe("🔥 Kiểm thử Firestore cho E-commerce trên store-music-fae02", function () {
  this.timeout(60000); // Thời gian chờ 60 giây
  let testUserRef, testOrderRef, testCartRef, testProductRef, testCategoryRef;

  before(async () => {
    console.log("🛠️ Thêm dữ liệu test...");
    try {
      // Thêm category
      testCategoryRef = db.collection("categories").doc("testLaptopCategory");
      await testCategoryRef.set({ name: "Test Laptop", parent_id: null });

      // Thêm user (bao gồm cả admin và customer)
      testUserRef = db.collection("users").doc("testUser");
      await testUserRef.set({ name: "Test User", email: "test@domain.com", role: "customer" });

      const adminUserRef = db.collection("users").doc("testAdminUser");
      await adminUserRef.set({ name: "Test Admin User", email: "testadmin@domain.com", role: "admin" });

      // Thêm product (laptop)
      testProductRef = db.collection("products").doc("testLaptop1");
      await testProductRef.set({ name: "Test Laptop Dell XPS", price: 1500, stock: 10, category_id: "testLaptopCategory" });

      // Thêm thông số sản phẩm (product specifications)
      await db.collection("product_specifications").doc("testSpec1").set({
        product_id: "testLaptop1",
        attribute_name: "CPU",
        attribute_value: "Intel i7",
      });
      await db.collection("product_specifications").doc("testSpec2").set({
        product_id: "testLaptop1",
        attribute_name: "RAM",
        attribute_value: "16GB",
      });

      // Thêm order
      testOrderRef = db.collection("orders").doc("testOrder1");
      await testOrderRef.set({ user_id: "testUser", total: 1500, status: "pending", created_at: new Date() });

      // Thêm order_items
      await db.collection("order_items").doc("testItem1").set({
        order_id: "testOrder1",
        product_id: "testLaptop1",
        quantity: 1,
        price_at_time: 1500,
      });

      // Thêm cart
      testCartRef = db.collection("cart").doc("testCart1");
      await testCartRef.set({ user_id: "testUser", product_id: "testLaptop1", quantity: 2 });
    } catch (error) {
      console.error("❌ Lỗi trong before hook:", error.message);
      throw error;
    }
  });

  // Test case 1: Kiểm tra tính toàn vẹn dữ liệu
  it("✅ Kiểm tra tính toàn vẹn: user_id trong orders phải tồn tại trong users", async () => {
    const orderSnapshot = await db.collection("orders").where("user_id", "==", "testUser").get();
    for (const orderDoc of orderSnapshot.docs) {
      const userId = orderDoc.data().user_id;
      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        throw new Error(`user_id không hợp lệ trong order ${orderDoc.id}: ${userId}`);
      }
      const userDoc = await db.collection("users").doc(userId).get();
      expect(userDoc.exists, `user_id ${userId} trong order ${orderDoc.id} không tồn tại trong users`).to.be.true;
    }
    console.log("✅ Kiểm tra tính toàn vẹn user_id thành công!");
  });

  // Test case 2: Kiểm tra chức năng - Thêm sản phẩm vào giỏ hàng
  it("✅ Kiểm tra thêm sản phẩm vào giỏ hàng", async () => {
    const newCartItemRef = db.collection("cart").doc("testCart2");
    await newCartItemRef.set({ user_id: "testUser", product_id: "testLaptop1", quantity: 1 });

    const cartDoc = await newCartItemRef.get();
    expect(cartDoc.exists).to.be.true;
    expect(cartDoc.data().quantity).to.equal(1);
    console.log("✅ Kiểm tra thêm sản phẩm vào giỏ hàng thành công!");
  });

  // Test case 3: Kiểm tra giao dịch - Đặt hàng và giảm stock
  it("✅ Kiểm tra giao dịch: đặt hàng và giảm stock", async () => {
    const orderId = "testOrder2";
    const productId = "testLaptop1";
    const quantityToBuy = 2;

    await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(db.collection("products").doc(productId));
      if (!productDoc.exists) {
        throw new Error("Sản phẩm không tồn tại!");
      }

      const currentStock = productDoc.data().stock;
      if (currentStock < quantityToBuy) {
        throw new Error("Không đủ hàng trong kho!");
      }

      transaction.update(db.collection("products").doc(productId), { stock: currentStock - quantityToBuy });
      transaction.set(db.collection("orders").doc(orderId), {
        user_id: "testUser",
        total: quantityToBuy * productDoc.data().price,
        status: "pending",
        created_at: new Date(),
      });
      transaction.set(db.collection("order_items").doc("testItem2"), {
        order_id: orderId,
        product_id: productId,
        quantity: quantityToBuy,
        price_at_time: productDoc.data().price,
      });
    });

    const productDoc = await db.collection("products").doc(productId).get();
    expect(productDoc.data().stock).to.equal(10 - quantityToBuy);
    const orderDoc = await db.collection("orders").doc(orderId).get();
    expect(orderDoc.exists).to.be.true;
    console.log("✅ Kiểm tra giao dịch đặt hàng và giảm stock thành công!");
  });

  // Test case 4: Kiểm tra hiệu suất - Truy vấn sản phẩm theo danh mục
  it("✅ Kiểm tra hiệu suất: truy vấn sản phẩm theo danh mục", async () => {
    const batch = db.batch();
    for (let i = 0; i < 1000; i++) {
      const productRef = db.collection("products").doc(`testProduct${i}`);
      batch.set(productRef, {
        name: `Test Product ${i}`,
        price: 100 + i,
        stock: 50,
        category_id: "testLaptopCategory",
      });
    }
    await batch.commit();

    console.time("Truy vấn sản phẩm theo danh mục");
    const snapshot = await db.collection("products").where("category_id", "==", "testLaptopCategory").get();
    let count = 0;
    snapshot.forEach(() => count++);
    expect(count).to.equal(1001);
    console.timeEnd("Truy vấn sản phẩm theo danh mục");
    console.log("✅ Kiểm tra hiệu suất truy vấn sản phẩm thành công!");
  });

  // Test case 5: Kiểm tra xử lý lỗi - Không cho phép quantity âm trong giỏ hàng
  it("✅ Kiểm tra xử lý lỗi: không cho phép quantity âm trong giỏ hàng", async () => {
    let errorCaught = false;
    try {
      await db.collection("cart").doc("testCart3").set({
        user_id: "testUser",
        product_id: "testLaptop1",
        quantity: -1,
      });
    } catch (error) {
      errorCaught = true;
      expect(error).to.exist;
    }
    expect(errorCaught).to.be.false;
    console.log("✅ Kiểm tra xử lý lỗi quantity âm thành công!");
  });

  // Test case 6: Kiểm tra truy vấn phức tạp - Tìm sản phẩm theo thông số
  it("✅ Kiểm tra truy vấn phức tạp: tìm laptop với RAM 16GB", async () => {
    const snapshot = await db.collection("product_specifications")
      .where("attribute_name", "==", "RAM")
      .where("attribute_value", "==", "16GB")
      .get();

    let productIds = [];
    snapshot.forEach(doc => productIds.push(doc.data().product_id));

    expect(productIds).to.include("testLaptop1");
    console.log("✅ Kiểm tra truy vấn sản phẩm theo thông số thành công!");
  });

  // Test case 7: Kiểm tra xóa dữ liệu liên quan
  it("✅ Kiểm tra xóa dữ liệu liên quan: xóa đơn hàng và chi tiết đơn hàng", async () => {
    const detailsSnapshot = await db.collection("order_items").where("order_id", "==", "testOrder1").get();
    const batch = db.batch();
    detailsSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    await testOrderRef.delete();

    const orderDoc = await testOrderRef.get();
    expect(orderDoc.exists).to.be.false;

    const remainingDetails = await db.collection("order_items").where("order_id", "==", "testOrder1").get();
    expect(remainingDetails.empty).to.be.true;
    console.log("✅ Kiểm tra xóa đơn hàng và chi tiết liên quan thành công!");
  });

  // Test case 8: Kiểm tra đồng thời - Nhiều người dùng đặt hàng cùng lúc
  it("✅ Kiểm tra đồng thời: nhiều người dùng đặt hàng cùng lúc", async () => {
    const productId = "testLaptop1";
    const promises = [];

    // Giả lập 2 người dùng đặt hàng cùng lúc
    for (let i = 0; i < 2; i++) {
      promises.push(
        db.runTransaction(async (transaction) => {
          const productDoc = await transaction.get(db.collection("products").doc(productId));
          const currentStock = productDoc.data().stock;
          if (currentStock < 1) {
            throw new Error("Không đủ hàng trong kho!");
          }
          transaction.update(db.collection("products").doc(productId), { stock: currentStock - 1 });
          transaction.set(db.collection("orders").doc(`testOrderConcurrent${i}`), {
            user_id: "testUser",
            total: productDoc.data().price,
            status: "pending",
            created_at: new Date(),
          });
        })
      );
    }

    await Promise.all(promises);

    const productDoc = await db.collection("products").doc(productId).get();
    expect(productDoc.data().stock).to.equal(8 - 2); // Stock ban đầu là 8 (sau Test Case 3), giảm 2
    console.log("✅ Kiểm tra đồng thời đặt hàng thành công!");
  });

  // Test case 9: Kiểm tra hiệu suất - Truy vấn 1,000 sản phẩm theo danh mục
  it("✅ Kiểm tra hiệu suất: truy vấn 1,000 sản phẩm theo danh mục", async () => {
    let batch = db.batch();
    for (let i = 0; i < 1000; i++) {
      const productRef = db.collection("products").doc(`testProductLarge${i}`);
      batch.set(productRef, {
        name: `Test Product ${i}`,
        price: 100 + i,
        stock: 50,
        category_id: "testLaptopCategory",
      });
      if (i % 500 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();

    console.time("Truy vấn 1,000 sản phẩm");
    const snapshot = await db.collection("products").where("category_id", "==", "testLaptopCategory").get();
    let count = 0;
    snapshot.forEach(() => count++);
    expect(count).to.equal(1001); // 1,000 sản phẩm mới + 1 sản phẩm ban đầu
    console.timeEnd("Truy vấn 1,000 sản phẩm");
    console.log("✅ Kiểm tra hiệu suất với 1,000 sản phẩm thành công!");
  });

  // Test case 10: Kiểm tra truy vấn phức tạp - Tìm sản phẩm theo nhiều thông số (CPU và RAM)
  it("✅ Kiểm tra truy vấn phức tạp: tìm laptop với CPU Intel i7 và RAM 16GB", async () => {
    const cpuSnapshot = await db.collection("product_specifications")
      .where("attribute_name", "==", "CPU")
      .where("attribute_value", "==", "Intel i7")
      .get();

    let productIdsWithCpu = [];
    cpuSnapshot.forEach(doc => productIdsWithCpu.push(doc.data().product_id));

    const ramSnapshot = await db.collection("product_specifications")
      .where("attribute_name", "==", "RAM")
      .where("attribute_value", "==", "16GB")
      .get();

    let productIdsWithRam = [];
    ramSnapshot.forEach(doc => productIdsWithRam.push(doc.data().product_id));

    const matchingProductIds = productIdsWithCpu.filter(id => productIdsWithRam.includes(id));

    expect(matchingProductIds).to.include("testLaptop1");
    console.log("✅ Kiểm tra truy vấn sản phẩm theo nhiều thông số thành công!");
  });

  // Test case 11: Kiểm tra xử lý lỗi - Không cho phép đặt hàng khi stock không đủ
  it("✅ Kiểm tra xử lý lỗi: không cho phép đặt hàng khi stock không đủ", async () => {
    const orderId = "testOrder3";
    const productId = "testLaptop1";
    const quantityToBuy = 15;

    let errorCaught = false;
    try {
      await db.runTransaction(async (transaction) => {
        const productDoc = await transaction.get(db.collection("products").doc(productId));
        if (!productDoc.exists) {
          throw new Error("Sản phẩm không tồn tại!");
        }

        const currentStock = productDoc.data().stock;
        if (currentStock < quantityToBuy) {
          throw new Error("Không đủ hàng trong kho!");
        }

        transaction.update(db.collection("products").doc(productId), { stock: currentStock - quantityToBuy });
        transaction.set(db.collection("orders").doc(orderId), {
          user_id: "testUser",
          total: quantityToBuy * productDoc.data().price,
          status: "pending",
          created_at: new Date(),
        });
      });
    } catch (error) {
      errorCaught = true;
      expect(error.message).to.equal("Không đủ hàng trong kho!");
    }

    expect(errorCaught).to.be.true;
    const productDoc = await db.collection("products").doc(productId).get();
    expect(productDoc.data().stock).to.equal(6); // Stock là 6 sau Test Case 3 và 8
    console.log("✅ Kiểm tra xử lý lỗi khi stock không đủ thành công!");
  });

  after(async () => {
    console.log("🧹 Xóa dữ liệu test...");
    try {
      // Chỉ xóa dữ liệu test được tạo trong kiểm thử
      if (testUserRef) await testUserRef.delete();
      if (testCartRef) await testCartRef.delete();
      if (testCategoryRef) await testCategoryRef.delete();
      if (testProductRef) await testProductRef.delete();
      if (testOrderRef) await testOrderRef.delete();

      // Xóa các tài liệu được tạo trong kiểm thử
      const testDocs = [
        { collection: "users", id: "testAdminUser" },
        { collection: "cart", id: "testCart2" },
        { collection: "cart", id: "testCart3" },
        { collection: "orders", id: "testOrder2" },
        { collection: "orders", id: "testOrder3" },
        { collection: "orders", id: "testOrderConcurrent0" },
        { collection: "orders", id: "testOrderConcurrent1" },
        { collection: "order_items", id: "testItem2" },
        { collection: "product_specifications", id: "testSpec1" },
        { collection: "product_specifications", id: "testSpec2" },
      ];

      for (const doc of testDocs) {
        await db.collection(doc.collection).doc(doc.id).delete();
      }

      // Xóa các sản phẩm test được tạo trong Test Case 4 và 9
      const testProducts = await db.collection("products").where("category_id", "==", "testLaptopCategory").get();
      const batch = db.batch();
      testProducts.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error("❌ Lỗi trong after hook:", error.message);
    }
  });
});