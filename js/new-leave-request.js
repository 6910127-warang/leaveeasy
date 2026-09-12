// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// ประเภทการลาอ่านจาก Firestore · กดบันทึกแล้วเขียนใบลาใหม่ลง Firestore จริง
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var กล่องผลAI = document.getElementById("ผลAI");
  var ประเภททั้งหมด = [];

  // เติมรายการเลื่อนลงด้วยประเภทการลาจาก Firestore
  db.collection("leaveTypes").get().then(function (สแนปช็อต) {
    ประเภททั้งหมด = สแนปช็อต.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    ประเภททั้งหมด.forEach(function (ประเภท) {
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = ประเภท.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  }).catch(function (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

    ปุ่มบันทึก.disabled = true;
    รอผู้ใช้ปัจจุบัน().then(function (ผู้ใช้) {
      var ใบใหม่ = {
        title: ค่า.title,
        reason: ค่า.reason,
        status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
        requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.name,
        approverId: "",      approverName: "",
        leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
        startDate: ค่า.startDate,
        endDate: ค่า.endDate,
        createdAt: เวลาตอนนี้()
      };
      return db.collection("leaveRequests").add(ใบใหม่);
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
      ปุ่มบันทึก.disabled = false;
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  // ปุ่มให้ AI ช่วยจัดประเภทการลา — อ่านช่องเหตุผล ส่งไปพร้อมรายชื่อประเภทที่มีอยู่จริง แล้วเลือกให้
  ปุ่มAI.addEventListener("click", function () {
    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      เตือน("กรอกเหตุผลการลาก่อน แล้วค่อยกดให้ AI ช่วยจัดประเภท");
      return;
    }
    if (!window.OPENROUTER_CONFIG || !window.OPENROUTER_CONFIG.apiKey) {
      แสดงผลAI("ไม่พบการตั้งค่า AI (js/config.local.js) — เลือกประเภทการลาเองได้ตามปกติ", "alert-error");
      return;
    }
    if (!ประเภททั้งหมด.length) {
      แสดงผลAI("ยังโหลดรายชื่อประเภทการลาไม่เสร็จ ลองอีกครั้ง", "alert-error");
      return;
    }

    var รายชื่อประเภท = ประเภททั้งหมด.map(function (t) { return t.name; });
    var คำสั่ง = "ต่อไปนี้คือรายชื่อประเภทการลาที่มีอยู่จริงในระบบ: " + รายชื่อประเภท.join(", ") + "\n\n" +
      "เหตุผลการลาของผู้ขอลา: " + เหตุผล + "\n\n" +
      "ตอบกลับด้วยชื่อประเภทการลาที่ตรงที่สุดจากรายการด้านบนเท่านั้น คำเดียว ห้ามมีคำอธิบายหรือเครื่องหมายอื่นปน " +
      "ถ้าไม่มีประเภทไหนเข้ากับเหตุผลเลย ให้ตอบว่า ไม่พบ";

    ปุ่มAI.disabled = true;
    var ข้อความปุ่มเดิม = ปุ่มAI.textContent;
    ปุ่มAI.textContent = "กำลังให้ AI ช่วยจัด...";
    แสดงผลAI("กำลังให้ AI ช่วยจัดประเภทการลา...", "alert-ai");

    var ตัวยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, 15000);

    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวยกเลิก.signal,
      headers: {
        "Authorization": "Bearer " + window.OPENROUTER_CONFIG.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: window.OPENROUTER_CONFIG.model,
        messages: [{ role: "user", content: คำสั่ง }]
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error((data && data.error && data.error.message) || ("HTTP " + res.status));
        }
        return data;
      });
    }).then(function (data) {
      var คำตอบ = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "").trim();
      var ประเภทที่ตรง = ประเภททั้งหมด.find(function (t) { return t.name === คำตอบ; }) ||
        ประเภททั้งหมด.find(function (t) { return คำตอบ.indexOf(t.name) !== -1; });

      if (ประเภทที่ตรง) {
        ช่องประเภท.value = ประเภทที่ตรง.id;
        แสดงผลAI('ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: "' + ประเภทที่ตรง.name + '"', "alert-ai");
      } else {
        แสดงผลAI("AI จัดประเภทให้ไม่ได้ — กรุณาเลือกเอง", "alert-error");
      }
    }).catch(function () {
      แสดงผลAI("เรียก AI ไม่สำเร็จ — กรุณาเลือกประเภทการลาเอง", "alert-error");
    }).finally(function () {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มเดิม;
    });
  });

  function แสดงผลAI(ข้อความ, คลาส) {
    กล่องผลAI.textContent = ข้อความ;
    กล่องผลAI.className = "alert " + คลาส;
  }
})();
