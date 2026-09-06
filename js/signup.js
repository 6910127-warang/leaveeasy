// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก (สัปดาห์ที่ 7)
// สมัครสำเร็จแล้วสร้างไฟล์ใหม่ใน users/{uid} ทันที ด้วย role เริ่มต้น "employee"
// ห้ามใส่ js/auth-guard.js ในหน้านี้ — จะกลายเป็นเด้งวนไม่รู้จบ
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มสมัคร = document.getElementById("ปุ่มสมัคร");

  // ล็อกอินอยู่แล้วตั้งแต่ก่อนเปิดหน้านี้ ไม่ต้องเห็นหน้านี้อีก
  // เช็คแค่ครั้งแรกตอนโหลดหน้าแล้วเลิกฟังทันที — ถ้าฟังต่อไปเรื่อย ๆ ตอนสมัครสำเร็จ
  // auth state จะเปลี่ยนเป็นล็อกอินด้วยเช่นกัน แล้วโค้ดนี้จะแย่งกันพาไป index.html
  // ก่อนที่ users/{uid} จะถูกเขียนเสร็จ
  var เลิกฟังสถานะเริ่มต้น = firebase.auth().onAuthStateChanged(function (ผู้ใช้) {
    เลิกฟังสถานะเริ่มต้น();
    if (ผู้ใช้) location.href = "index.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ชื่อ = document.getElementById("name").value.trim();
    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!ชื่อ || !อีเมล || !รหัสผ่าน) {
      เตือน("กรอกชื่อ อีเมล และรหัสผ่านให้ครบ");
      return;
    }
    if (รหัสผ่าน.length < 6) {
      เตือน("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    ปุ่มสมัคร.disabled = true;
    firebase.auth().createUserWithEmailAndPassword(อีเมล, รหัสผ่าน).then(function (ผลลัพธ์) {
      return db.collection("users").doc(ผลลัพธ์.user.uid).set({
        name: ชื่อ,
        email: อีเมล,
        role: "employee"
      });
    }).then(function () {
      location.href = "index.html";
    }).catch(function (err) {
      เตือน(แปลข้อผิดพลาด(err));
      ปุ่มสมัคร.disabled = false;
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function แปลข้อผิดพลาด(err) {
    if (err.code === "auth/email-already-in-use") return "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน";
    if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
    if (err.code === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    return "สมัครสมาชิกไม่สำเร็จ: " + err.message;
  }
})();
