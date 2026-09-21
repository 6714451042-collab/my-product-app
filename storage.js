// ============================================
// storage.js — OTOP Products SQLite
// ============================================

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "products.db");
const db = new Database(DB_PATH);

// สร้างตารางใหม่ (ถ้ายังไม่มี)
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    producer TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    contact TEXT,
    image_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrate ข้อมูลเริ่มต้น
const count = db.prepare("SELECT COUNT(*) as n FROM products").get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, producer, price, category, contact, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    "น้ำผึ้งป่าดอกลำไย",
    "กลุ่มเลี้ยงผึ้งบ้านหนองบัว",
    250,
    "อาหาร/เครื่องดื่ม",
    "081-234-5678",
    "/assets/product-1.jpg" // 👈 แก้พาธรูปภาพให้ตรงกับไฟล์จริงในโฟลเดอร์ assets
  );

  insert.run(
    "ผ้าไหมมัดหมี่",
    "กลุ่มทอผ้าบ้านหนองแวง",
    850,
    "ผ้า/เครื่องแต่งกาย",
    "089-876-5432",
    "/assets/product-2.jpg" // 👈 แก้พาธรูปภาพให้ตรงกับไฟล์จริงในโฟลเดอร์ assets
  );

  insert.run(
    "สบู่สมุนไพรใบเตย",
    "วิสาหกิจชุมชนใบเตยหอม",
    80,
    "สมุนไพร/สุขภาพ",
    "092-111-2222",
    "/assets/product-3.jpg" // 👈 แก้พาธรูปภาพให้ตรงกับไฟล์จริงในโฟลเดอร์ assets
  );

  console.log("📦 เพิ่มข้อมูลเริ่มต้น 3 ตัวพร้อมรูปภาพสำเร็จ");
}

// ============================================
// SELECT ทั้งหมด
// ============================================
function loadProducts() {
  return db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
}

// ============================================
// SELECT 1 ตัว
// ============================================
function getProductById(id) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
}

// ============================================
// INSERT
// ============================================
function addProduct(product) {
  const stmt = db.prepare(`
    INSERT INTO products (name, producer, price, category, contact, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    product.name,
    product.producer,
    product.price,
    product.category,
    product.contact || null,
    product.image_path || null
  );

  return getProductById(result.lastInsertRowid);
}

// ============================================
// DELETE
// ============================================
function deleteProduct(id) {
  const stmt = db.prepare("DELETE FROM products WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============================================
// UPDATE
// ============================================
function updateProduct(id, data) {
  const stmt = db.prepare(`
    UPDATE products
    SET name = ?, producer = ?, price = ?, category = ?, contact = ?, image_path = ?
    WHERE id = ? 
  `);

  const result = stmt.run(
    data.name,
    data.producer,
    data.price,
    data.category,
    data.contact,
    data.image_path || null,
    id
  );

  if (result.changes === 0) return null;
  return getProductById(id);
}

module.exports = {
  loadProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
};
