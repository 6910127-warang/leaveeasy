// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่าง (seed) จาก js/data.js ลง Firestore
// ใช้ครั้งเดียวตอนตั้งค่าสัปดาห์ที่ 6 ผ่านหน้า seed.html
// ─────────────────────────────────────────────────────────────

document.getElementById("ปุ่มใส่ข้อมูล").addEventListener("click", ใส่ข้อมูล);

function ใส่ข้อมูล() {
  var ปุ่ม = document.getElementById("ปุ่มใส่ข้อมูล");
  var สถานะ = document.getElementById("สถานะ");
  ปุ่ม.disabled = true;
  สถานะ.innerHTML = "<p>กำลังใส่ข้อมูล…</p>";

  var ข้อมูล = window.LEAVE_DATA;
  var งานทั้งหมด = [];

  ข้อมูล.users.forEach(function (u) {
    งานทั้งหมด.push(db.collection("users").doc(u.id).set({ name: u.name, email: u.email, role: u.role }));
  });

  ข้อมูล.leaveTypes.forEach(function (lt) {
    งานทั้งหมด.push(db.collection("leaveTypes").doc(lt.id).set({ name: lt.name }));
  });

  ข้อมูล.leaveRequests.forEach(function (lr) {
    var ช่องข้อมูล = Object.assign({}, lr);
    delete ช่องข้อมูล.id;
    งานทั้งหมด.push(db.collection("leaveRequests").doc(lr.id).set(ช่องข้อมูล));
  });

  ข้อมูล.approvals.forEach(function (ap) {
    var ช่องความเห็น = Object.assign({}, ap);
    delete ช่องความเห็น.id;
    delete ช่องความเห็น.requestId;
    งานทั้งหมด.push(
      db.collection("leaveRequests").doc(ap.requestId).collection("approvals").doc(ap.id).set(ช่องความเห็น)
    );
  });

  Promise.all(งานทั้งหมด).then(function () {
    สถานะ.innerHTML = "<p>✅ ใส่ข้อมูลตัวอย่างเรียบร้อย — เปิด Firebase Console เพื่อตรวจดูได้เลย</p>";
  }).catch(function (err) {
    สถานะ.innerHTML = "<p>❌ ใส่ข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  }).finally(function () {
    ปุ่ม.disabled = false;
  });
}
