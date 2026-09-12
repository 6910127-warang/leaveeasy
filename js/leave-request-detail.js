// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// อ่านใบลาและความเห็นจาก Firestore จริง แก้สถานะและเขียนความเห็นกลับเข้า Firestore
// ─────────────────────────────────────────────────────────────

(function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  var ใบ, ความเห็น, ผู้ใช้ปัจจุบัน;

  // ไม่มี id ต่อท้าย URL — กันไว้ก่อนเรียก Firestore เพราะ .doc("") จะโยน error ทันที ไม่ผ่าน .catch()
  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  Promise.all([
    รอผู้ใช้ปัจจุบัน(),
    db.collection("leaveRequests").doc(รหัสใบลา).get()
  ]).then(function (ผลลัพธ์) {
    ผู้ใช้ปัจจุบัน = ผลลัพธ์[0];
    var เอกสาร = ผลลัพธ์[1];
    if (!เอกสาร.exists) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return null;
    }
    ใบ = Object.assign({ id: เอกสาร.id }, เอกสาร.data());

    // employee ดูใบของคนอื่นไม่ได้ตาม ACL.md — กันคนพิมพ์ URL ตรง ๆ ข้ามหน้ารายการมา
    if (ผู้ใช้ปัจจุบัน.role === "employee" && ใบ.requesterId !== ผู้ใช้ปัจจุบัน.uid) {
      กล่องใบลา.innerHTML = "<p>คุณไม่มีสิทธิ์ดูใบลานี้</p>";
      ใบ = null;
      return null;
    }

    return db.collection("leaveRequests").doc(รหัสใบลา).collection("approvals").get();
  }).then(function (สแนปช็อตความเห็น) {
    if (!ใบ) return;

    ความเห็น = สแนปช็อตความเห็น.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });

    วาดใบลา();
    วาดความเห็น();
    กล่องความเห็น.classList.remove("hidden");
    document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
  }).catch(function (err) {
    กล่องใบลา.innerHTML = "<p>โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา — และเฉพาะคนที่มีสิทธิ์ตาม ACL.md เท่านั้น
    var เป็นผู้อนุมัติ = ผู้ใช้ปัจจุบัน.role === "manager" || ผู้ใช้ปัจจุบัน.role === "hr";
    var เป็นเจ้าของใบ = ใบ.requesterId === ผู้ใช้ปัจจุบัน.uid;

    if (ใบ.status === "รอพิจารณา") {
      // ให้ AI สรุปใบลาให้หัวหน้าอ่านก่อนกดอนุมัติ — เฉพาะผู้อนุมัติ และเฉพาะใบที่ยังรอพิจารณา
      if (เป็นผู้อนุมัติ) {
        html += '<div class="btn-row"><button type="button" class="btn-ghost" id="ปุ่มAIสรุป">ให้ AI สรุปใบลาให้หัวหน้าอ่าน</button></div>';
        html += '<div id="ผลAIสรุป" class="alert alert-ai' + (ใบ.aiSuggestion ? '' : ' hidden') + '">' +
          (ใบ.aiSuggestion ? 'ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: ' + esc(ใบ.aiSuggestion) : '') + '</div>';
      }

      var ปุ่ม = "";
      if (เป็นผู้อนุมัติ) {
        ปุ่ม +=
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>';
      }
      if (เป็นเจ้าของใบ) {
        ปุ่ม += '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลา</button>';
      }
      if (ปุ่ม) html += '<div class="btn-row">' + ปุ่ม + "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
    var ปุ่มลบ = document.getElementById("ปุ่มลบ");
    var ปุ่มAIสรุป = document.getElementById("ปุ่มAIสรุป");
    if (ปุ่มอนุมัติ) ปุ่มอนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    if (ปุ่มไม่อนุมัติ) ปุ่มไม่อนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    if (ปุ่มลบ) ปุ่มลบ.addEventListener("click", ลบใบลา);
    if (ปุ่มAIสรุป) ปุ่มAIสรุป.addEventListener("click", เรียกAIสรุปใบลา);
  }

  // ── ให้ AI สรุปใบลาให้หัวหน้าอ่านก่อนกดอนุมัติ — อ่านใบลานี้ → เขียนสรุปสั้น ๆ → เขียนสรุปกลับลงฐาน ──
  function เรียกAIสรุปใบลา() {
    if (!window.OPENROUTER_CONFIG || !window.OPENROUTER_CONFIG.apiKey) {
      แสดงผลAIสรุป("ไม่พบการตั้งค่า AI (js/config.local.js) — อ่านใบลาเองได้ตามปกติ", "alert-error");
      return;
    }

    // หมายเหตุ: ตั้งใจไม่ส่งชื่อผู้ขอลาไปให้ AI ภายนอก (ตาม leaveeasy-spec.md §9 ห้ามส่งข้อมูลส่วนบุคคลจริงออกนอกระบบ)
    // หัวหน้าเห็นชื่อผู้ขอลาอยู่แล้วในหน้าเดียวกัน ไม่จำเป็นต้องส่งไปกับคำสั่งสรุป
    var คำสั่ง = "สรุปใบลาต่อไปนี้เป็นภาษาไทยสั้น ๆ 2-3 ประโยค ให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติหรือไม่อนุมัติ:\n\n" +
      "หัวข้อ: " + ใบ.title + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "เหตุผลการลา: " + ใบ.reason + "\n\n" +
      "ตอบกลับเฉพาะเนื้อหาสรุป ห้ามมีคำนำหรือคำอธิบายอื่นปน";

    var ปุ่ม = document.getElementById("ปุ่มAIสรุป");
    ปุ่ม.disabled = true;
    var ข้อความปุ่มเดิม = ปุ่ม.textContent;
    ปุ่ม.textContent = "กำลังสรุป...";
    แสดงผลAIสรุป("กำลังให้ AI สรุปใบลา...", "alert-ai");

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
      var สรุป = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "").trim();
      return บันทึกAiLog(คำสั่ง, สรุป).then(function () {
        if (!สรุป) {
          แสดงผลAIสรุป("AI สรุปใบลาให้ไม่ได้ — อ่านใบลาเองได้ตามปกติ", "alert-error");
          return;
        }
        return db.collection("leaveRequests").doc(ใบ.id).update({
          aiSuggestion: สรุป
        }).then(function () {
          ใบ.aiSuggestion = สรุป;
          วาดใบลา();
        });
      });
    }).catch(function (err) {
      บันทึกAiLog(คำสั่ง, "(เรียกไม่สำเร็จ) " + err.message);
      แสดงผลAIสรุป("เรียก AI ไม่สำเร็จ — อ่านใบลาเองได้ตามปกติ", "alert-error");
    }).finally(function () {
      clearTimeout(หมดเวลา);
      var ปุ่มปัจจุบัน = document.getElementById("ปุ่มAIสรุป");
      if (ปุ่มปัจจุบัน) {
        ปุ่มปัจจุบัน.disabled = false;
        ปุ่มปัจจุบัน.textContent = ข้อความปุ่มเดิม;
      }
    });
  }

  function แสดงผลAIสรุป(ข้อความ, คลาส) {
    var กล่อง = document.getElementById("ผลAIสรุป");
    if (!กล่อง) return;
    กล่อง.textContent = ข้อความ;
    กล่อง.className = "alert " + คลาส;
  }

  // ── บันทึกประวัติการเรียก AI ทุกครั้งลงโฟลเดอร์ย่อย aiLog ของใบนี้ — ไม่ว่าจะสำเร็จหรือไม่ ──
  function บันทึกAiLog(input, output) {
    return db.collection("leaveRequests").doc(ใบ.id).collection("aiLog").add({
      input: input,
      output: output,
      createdAt: เวลาตอนนี้()
    }).catch(function () {});
  }

  // ── เปลี่ยนสถานะ — เขียนกลับ Firestore เฉพาะช่อง status เท่านั้น ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    db.collection("leaveRequests").doc(ใบ.id).update({ status: สถานะใหม่ }).then(function () {
      ใบ.status = สถานะใหม่;
      วาดใบลา();
    }).catch(function (err) {
      alert("แก้สถานะไม่สำเร็จ: " + err.message);
    });
  }

  // ── ลบใบลา — ถามยืนยันก่อนทุกครั้ง กดยกเลิกแล้วไม่ลบ ──
  function ลบใบลา() {
    if (!confirm("ยืนยันการลบใบลานี้หรือไม่")) return;

    db.collection("leaveRequests").doc(ใบ.id).delete().then(function () {
      window.location.href = "leave-requests.html";
    }).catch(function (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
    });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ — เขียนลงโฟลเดอร์ย่อย approvals ของใบนี้บน Firestore ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    รอผู้ใช้ปัจจุบัน().then(function (ผู้ใช้) {
      var ความเห็นใหม่ = {
        authorId: ผู้ใช้.uid, authorName: ผู้ใช้.name,
        message: ข้อความ,
        createdAt: เวลาตอนนี้()
      };

      return db.collection("leaveRequests").doc(ใบ.id).collection("approvals").add(ความเห็นใหม่).then(function (อ้างอิง) {
        ความเห็น.push(Object.assign({ id: อ้างอิง.id }, ความเห็นใหม่));
        ช่อง.value = "";
        วาดความเห็น();
      });
    }).catch(function (err) {
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + esc(err.message);
      เตือน.classList.remove("hidden");
    });
  }
})();
