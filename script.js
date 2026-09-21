// ============================================
// Load Products & Render
// ============================================
async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;'>กำลังโหลด...</p>";

  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = "<p style='text-align:center;'>ยังไม่มีผลิตภัณฑ์</p>";
      return;
    }

    container.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
      ${product.image_path ? `
        <div class="card-image"><img src="${product.image_path}" alt="${product.name}"></div>
      ` : `
        <div class="card-image no-image"><span>📸 ไม่มีรูปภาพ</span></div>
      `}
      <div class="card-content">
        <div class="card-header">
          <h3>${product.name}</h3>
          <span class="category-badge">${product.category}</span>
        </div>
        <p class="producer">👥 ${product.producer}</p>
        ${product.contact ? `<p class="contact">📞 ${product.contact}</p>` : ""}
        <div class="card-footer">
          <span class="price">฿ ${Number(product.price).toLocaleString()}</span>
          <div class="card-actions">
            <button class="edit-btn" data-id="${product.id}">✏️ แก้ไข</button>
            <button class="delete-btn" data-id="${product.id}">🗑️ ลบ</button>
          </div>
        </div>
      </div>
      `;
      container.appendChild(card);
    });

    attachDeleteHandlers();
    attachEditHandlers();

  } catch (error) {
    container.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
  }
}

// ============================================
// Open Modal (ดึงข้อมูลจากหน้าจอโดยตรง)
// ============================================
function openEditModal(product) {
  const modal = document.getElementById("edit-modal");
  if (!modal) {
    alert("❌ หา element 'edit-modal' ไม่เจอ โปรดตรวจสอบ index.html");
    return;
  }

  document.getElementById("edit-id").value = product.id || "";
  document.getElementById("edit-name").value = product.name || "";
  document.getElementById("edit-producer").value = product.producer || "";
  document.getElementById("edit-price").value = product.price || "";
  document.getElementById("edit-category").value = product.category || "อาหาร/เครื่องดื่ม";
  document.getElementById("edit-contact").value = product.contact || "";

  // ล้างไฟล์รูปเดิมที่เคยค้างใน Input
  const editImageInput = document.getElementById("edit-image");
  if (editImageInput) editImageInput.value = "";

  modal.classList.remove("hidden");
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  if (modal) modal.classList.add("hidden");
  if (editForm) editForm.reset();
}

function attachEditHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;

      const product = {
        id: btn.dataset.id,
        name: card.querySelector("h3")?.textContent.trim() || "",
        category: card.querySelector(".category-badge")?.textContent.trim() || "",
        producer: card.querySelector(".producer")?.textContent.replace("👥 ", "").trim() || "",
        contact: card.querySelector(".contact")?.textContent.replace("📞 ", "").trim() || "",
        price: card.querySelector(".price")?.textContent.replace("฿ ", "").replace(/,/g, "").trim() || "0"
      };

      openEditModal(product);
    });
  });
}

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const card = btn.closest(".card");
      const productName = card ? card.querySelector("h3")?.textContent : "รายการนี้";

      if (!confirm(`ยืนยันลบ "${productName}"?`)) return;

      try {
        const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("ลบไม่สำเร็จ");
        loadProducts();
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    });
  });
}

// ============================================
// Event Listeners (DOMContentLoaded)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Add Product
  const addForm = document.getElementById("add-product-form");
  if (addForm) {
    addForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData();
      formData.append("name", document.getElementById("product-name")?.value || "");
      formData.append("producer", document.getElementById("product-producer")?.value || "");
      formData.append("price", document.getElementById("product-price")?.value || "");
      formData.append("category", document.getElementById("product-category")?.value || "");
      formData.append("contact", document.getElementById("product-contact")?.value || "");

      const fileInput = document.getElementById("product-image");
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append("image", fileInput.files[0]);
      }

      try {
        const response = await fetch("/api/products", { method: "POST", body: formData });
        if (!response.ok) throw new Error("เพิ่มไม่สำเร็จ");
        addForm.reset();
        loadProducts();
        alert("✅ เพิ่มผลิตภัณฑ์สำเร็จ");
      } catch (error) {
        alert("❌ เกิดข้อผิดพลาด: " + error.message);
      }
    });
  }

  // Modal Controls
  const closeBtn = document.getElementById("modal-close");
  const cancelBtn = document.getElementById("cancel-btn");
  const editForm = document.getElementById("edit-form");
  const modal = document.getElementById("edit-modal");

  if (closeBtn) closeBtn.addEventListener("click", closeEditModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeEditModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeEditModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeEditModal();
    }
  });

  // Edit Submit (ส่งเป็น FormData รองรับการเปลี่ยนรูปภาพ)
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = document.getElementById("edit-id")?.value;
      if (!id) return;

      const formData = new FormData();
      formData.append("name", document.getElementById("edit-name")?.value || "");
      formData.append("producer", document.getElementById("edit-producer")?.value || "");
      formData.append("price", document.getElementById("edit-price")?.value || "");
      formData.append("category", document.getElementById("edit-category")?.value || "");
      formData.append("contact", document.getElementById("edit-contact")?.value || "");

      const imageInput = document.getElementById("edit-image");
      if (imageInput && imageInput.files && imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "PUT",
          body: formData // ส่งเป็น FormData
        });

        if (!response.ok) throw new Error("แก้ไขไม่สำเร็จ");

        closeEditModal();
        loadProducts();
        alert("✅ บันทึกสำเร็จ");

      } catch (error) {
        alert("❌ " + error.message);
      }
    });
  }

  loadProducts();
});
