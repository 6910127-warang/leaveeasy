// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ (สัปดาห์ที่ 7)
// ห้ามใส่ js/auth-guard.js ในหน้านี้ — จะกลายเป็นเด้งวนไม่รู้จบ
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

  // ล็อกอินอยู่แล้ว ไม่ต้องเห็นหน้านี้อีก
  firebase.auth().onAuthStateChanged(function (ผู้ใช้) {
    if (ผู้ใช้) location.href = ปลายทางถัดไป();
  });

  function ปลายทางถัดไป() {
    return ค่าจากURL("next") || "index.html";
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!อีเมล || !รหัสผ่าน) {
      เตือน("กรอกอีเมลและรหัสผ่านให้ครบ");
      return;
    }

    ปุ่มเข้าสู่ระบบ.disabled = true;
    firebase.auth().signInWithEmailAndPassword(อีเมล, รหัสผ่าน).then(function () {
      location.href = ปลายทางถัดไป();
    }).catch(function (err) {
      เตือน(แปลข้อผิดพลาด(err));
      ปุ่มเข้าสู่ระบบ.disabled = false;
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function แปลข้อผิดพลาด(err) {
    if (err.code === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
    return "เข้าสู่ระบบไม่สำเร็จ: " + err.message;
  }
})();
