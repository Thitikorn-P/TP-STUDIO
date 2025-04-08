import express from "express";
import bodyParser from "body-parser";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

// กำหนด __dirname สำหรับ ES Module
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ตั้งค่าพาธ
const syncFolder = path.join(__dirname, "sync-folder");
const uploadDir = path.join(__dirname, "uploads");

// สร้างโฟลเดอร์หากยังไม่มี
if (!fs.existsSync(syncFolder)) fs.mkdirSync(syncFolder);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ตั้งค่า Chokidar ให้จับตาดู sync-folder
const allowedExtensions = [".jpg", ".png"];
chokidar.watch(syncFolder).on("add", (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.includes(ext)) return;

  const fileName = path.basename(filePath);
  const destPath = path.join(uploadDir, fileName);

  // ย้ายไฟล์จาก sync-folder ไปยัง uploads
  fs.rename(filePath, destPath, (err) => {
    if (err) {
      console.error(`Error moving file: ${err}`);
    } else {
      console.log(`File synced: ${fileName}`);
    }
  });
});

// 📌 API สำหรับดึงรายการไฟล์
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve files" });
    }
    res.json(files);
  }); // ✅ ปิดวงเล็บให้ถูกต้อง
});

// ให้บริการไฟล์ในโฟลเดอร์ uploads
app.use("/uploads", express.static(uploadDir));

// เสิร์ฟไฟล์ index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(" Watching sync-folder for changes...");
});
