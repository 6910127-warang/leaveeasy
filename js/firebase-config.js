// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าเชื่อมต่อ Firebase (Firestore)
// สัปดาห์ที่ 6 — ใช้ SDK รุ่น compat จาก CDN เพื่อให้เปิดไฟล์ .html ตรง ๆ
// (ดับเบิลคลิก) ได้เหมือนเดิม โดยไม่ต้องมีเซิร์ฟเวอร์หรือขั้นตอน build
// ─────────────────────────────────────────────────────────────

firebase.initializeApp({
  apiKey: "AIzaSyD0L7vA0wGfcLee-z8toX_a15YLyHUAUYw",
  authDomain: "leaveeasy---warangkhana.firebaseapp.com",
  projectId: "leaveeasy---warangkhana",
  storageBucket: "leaveeasy---warangkhana.firebasestorage.app",
  messagingSenderId: "389586993125",
  appId: "1:389586993125:web:e619f60f791a975f5cf90c"
});

var db = firebase.firestore();
