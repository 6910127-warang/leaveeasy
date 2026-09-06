// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — บังคับว่าต้องล็อกอินก่อนถึงจะเห็นหน้านี้ (สัปดาห์ที่ 7)
// ยังไม่แยกสิทธิ์ตาม role — ทุกคนที่ล็อกอินแล้วเห็นเหมือนกันหมด
// (แยกสิทธิ์ตามบทบาทเริ่มบังคับจริงสัปดาห์ที่ 8)
//
// ใช้ในหน้าที่ต้องล็อกอินก่อนเท่านั้น — ห้ามใส่ในหน้า login.html / signup.html
// เพราะจะกลายเป็นเด้งวนไม่รู้จบ
// ─────────────────────────────────────────────────────────────

// หน้าอื่นเรียก รอผู้ใช้ปัจจุบัน().then(function (ผู้ใช้) {...}) เพื่อรอให้รู้ว่าใครล็อกอินอยู่
// ก่อนเขียนข้อมูลที่ต้องใช้ uid/name ของผู้ใช้ปัจจุบัน
var รอผู้ใช้ปัจจุบัน = (function () {
  var สัญญา = new Promise(function (resolve) {
    firebase.auth().onAuthStateChanged(function (ผู้ใช้) {
      if (!ผู้ใช้) {
        var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";
        location.href = "login.html?next=" + encodeURIComponent(หน้าปัจจุบัน);
        return;
      }
      db.collection("users").doc(ผู้ใช้.uid).get().then(function (เอกสาร) {
        var ข้อมูล = เอกสาร.exists ? เอกสาร.data() : {};
        var ผู้ใช้ปัจจุบัน = {
          uid: ผู้ใช้.uid,
          email: ผู้ใช้.email,
          name: ข้อมูล.name || ผู้ใช้.email,
          role: ข้อมูล.role || "employee"
        };
        แสดงผู้ใช้ในนาว(ผู้ใช้ปัจจุบัน);
        ใช้ข้อจำกัดสิทธิ์(ผู้ใช้ปัจจุบัน.role);
        resolve(ผู้ใช้ปัจจุบัน);
      });
    });
  });
  return function () { return สัญญา; };
})();

// ซ่อนปุ่ม/เมนูที่มี data-require-role="xxx" (หรือรายการคั่นด้วย , เช่น "manager,hr")
// ถ้า role ของผู้ใช้ไม่อยู่ในรายการที่อนุญาต — เรียกซ้ำได้ทุกครั้งที่มีการวาด DOM ใหม่
function ใช้ข้อจำกัดสิทธิ์(บทบาท) {
  document.querySelectorAll("[data-require-role]").forEach(function (เอล) {
    var รายการที่อนุญาต = เอล.getAttribute("data-require-role").split(",");
    เอล.style.display = รายการที่อนุญาต.indexOf(บทบาท) === -1 ? "none" : "";
  });
}

// เติมชื่อผู้ใช้ + ปุ่มออกจากระบบ ลงในช่องว่างที่ nav.js เตรียมไว้ (#navUser)
function แสดงผู้ใช้ในนาว(ผู้ใช้) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;

  ที่วาง.innerHTML = "";

  var ชื่อ = document.createElement("span");
  ชื่อ.textContent = "👤 " + ผู้ใช้.name;
  ที่วาง.appendChild(ชื่อ);

  var ปุ่มออกจากระบบ = document.createElement("button");
  ปุ่มออกจากระบบ.type = "button";
  ปุ่มออกจากระบบ.className = "btn-ghost";
  ปุ่มออกจากระบบ.textContent = "ออกจากระบบ";
  ปุ่มออกจากระบบ.addEventListener("click", function () {
    firebase.auth().signOut().then(function () {
      location.href = "login.html";
    });
  });
  ที่วาง.appendChild(ปุ่มออกจากระบบ);
}
