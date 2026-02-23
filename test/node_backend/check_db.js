/**
 * 데이터베이스 연결 확인용 스크립트
 * 실행: node check_db.js (node_backend 폴더에서)
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function check() {
  if (!process.env.DB_USER || process.env.DB_USER === "your_user") {
    console.log("❌ .env 파일에 DB_USER를 넣어주세요. (.env.example 을 복사해 .env 를 만든 뒤 값 채우기)");
    process.exit(1);
  }
  if (!process.env.DB_NAME || process.env.DB_NAME === "your_database") {
    console.log("❌ .env 파일에 DB_NAME을 넣어주세요.");
    process.exit(1);
  }

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await conn.ping();
    await conn.end();
    console.log("✅ 연결 성공");
    console.log(`   DB: ${process.env.DB_NAME} @ ${process.env.DB_HOST || "localhost"}`);
    process.exit(0);
  } catch (err) {
    console.log("❌ 연결 실패:", err.message);
    process.exit(1);
  }
}

check();
