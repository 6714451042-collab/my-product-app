const Database = require("better-sqlite3");

const db = new Database("data/products.db");
console.log("✅ เปิด Database สำเร็จ");

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL
    )
`);
console.log("✅ สร้างตาราง products");

const count = db.prepare("SELECT COUNT(*) as n FROM products").get();
console.log(`📊 มีสินค้าในตาราง : ${count.n} ตัว`);

if(count.n === 0){
    const insert = db.prepare(
        "INSERT INTO products (name,price) VALUES (?,?)"
    );
    insert.run("Pawfect Glow อาหารเม็ดสุนัขเกรดพรีเมียม สูตรบำรุงขน",590);
    insert.run("Meow Chef มูสทูน่าหน้าล็อบสเตอร์ (สำหรับเจ้านายที่กินยาก)",45);
    insert.run("Crunchy Joy อกไก่ฟรีซดราย 100%",180);
    console.log("✅ เพิ่มข้อมูลเริ่มต้น 3 อย่าง")
}

const allProducts = db.prepare("SELECT * FROM products").all();
console.log("\n📝 สินค้าทั้งหมด: ");
console.log(allProducts);

const cheapProducts = db.prepare("SELECT * FROM products WHERE price < ?").all(200);
console.log("\n💰 สินค้าราคาต่ำกว่า 200: ");
console.log(cheapProducts);

db.close();
console.log("\n✅ ปิด Database");