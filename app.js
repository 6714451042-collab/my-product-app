const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  loadProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require("./storage");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serving Static Files (ไฟล์หน้าเว็บ + ไฟล์รูปภาพใน uploads)
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ============================================
// 🖼 Multer Setup
// ============================================
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `product-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("ไฟล์ต้องเป็น jpg, png, หรือ webp เท่านั้น"));
    }
  }
});

// ============================================
// Routes
// ============================================

// GET ทั้งหมด
app.get("/api/products", (req, res) => {
  res.json(loadProducts());
});

// GET ตาม ID
app.get("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);
  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
  res.json(product);
});

// POST เพิ่มสินค้าพร้อมรูปภาพ
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const { name, producer, price, category, contact } = req.body;

    if (!name || !producer || !price || !category) {
      return res.status(400).json({
        error: "กรุณาระบุ name, producer, price, category"
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = addProduct({
      name,
      producer,
      price: Number(price),
      category,
      contact,
      image_path: imagePath
    });

    res.status(201).json(newProduct);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT แก้ไขสินค้า
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingProduct = getProductById(id);

    if (!existingProduct) {
      return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
    }

    const { name, producer, price, category, contact } = req.body;

    if (!name || !producer || !price || !category) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    let imagePath = existingProduct.image_path;

    if (req.file) {
      if (existingProduct.image_path) {
        const oldPath = path.join(__dirname, "public", existingProduct.image_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    const updated = updateProduct(id, {
      name,
      producer,
      price: Number(price),
      category,
      contact,
      image_path: imagePath
    });

    res.json(updated);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE ลบสินค้าพร้อมลบไฟล์รูปภาพ
app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);

  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });

  if (product.image_path) {
    const filePath = path.join(__dirname, "public", product.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ ลบไฟล์รูป: ${product.image_path}`);
    }
  }

  deleteProduct(id);
  res.json({ message: "ลบสำเร็จ", deleted: product });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
