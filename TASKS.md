# งานค้างเรียงตามความสำคัญ

รายการจากการอ่าน source และข้อจำกัดเดิมวันที่ 29 ตุลาคม 2026 เป็นข้อเสนอสำหรับงานถัดไป ยังไม่ได้ลงมือแก้ Game Logic และไม่ใช่ทุกข้อเป็น bug ที่ reproduce แล้ว ลำดับนี้ให้ความสำคัญกับเซฟและความเสถียรก่อนเพิ่มภาพ

| ลำดับ | งาน / หลักฐาน | เกณฑ์รับงาน |
| --- | --- | --- |
| P1 | ทดสอบ iPhone/Safari จริง: touch สองนิ้ว, audio unlock, viewport/orientation, save/resume, memory/thermal และ WebGL; Chromium emulation เดิมไม่ครอบคลุม | ระบุรุ่น/iOS, ขั้นตอนและผลจริง รวม FPS/frame time ระหว่าง rush และหลัง background/resume; ไม่อ้าง 30 FPS ก่อนวัด |
| P1 | เพิ่มความครอบคลุม persistence failure/import: `validateSave` ตรวจเพียงบางส่วน; autosave บางทาง catch เงียบ | ทดสอบ malformed/old/current saves, IndexedDB failure และ import failure โดยรักษาเกมเดิม; สำรองเซฟก่อนเปลี่ยน schema; กำหนด UX แสดงสถานะล้มเหลวโดยไม่ล้างข้อมูล |
| P1 | ทำ QA scripts ให้รันจาก repository ปัจจุบันและไม่เขียนทับหลักฐาน: `inspect.mjs` มี `/workspace/sites/one-day`, บาง scripts ใช้ปุ่ม `เริ่มเช้าวันแรก`; E2E เขียนภาพ tracked | รัน scripts ที่ระบุได้จาก root ใช้ output directory แยกและ browser path ที่กำหนดได้; repository clean หลัง QA; ตรวจ selectors กับ UI ปัจจุบัน |
| P1 | สร้าง CI ที่ติดตั้งด้วย `npm ci` แล้วรัน unit/build และ browser checks ตามทรัพยากร; baseline ยังไม่มี `.github/workflows` | PR แสดง checks จริงพร้อม test counts/artifacts; ไม่ Deploy และไม่เปลี่ยน visibility หรือแท็ก baseline |
| P2 | วัดและลด initial JS: build เตือน chunk >500 kB; Three/scene โหลดรวมใน App | บันทึกขนาดก่อน/หลังและ load/frame metrics; พิจารณา lazy loading โดยไม่เปลี่ยน simulation หรือเส้นทางเซฟ |
| P2 | ตรวจ aisle/chair/service clearance และการหลบคน: collision มี static obstacles แต่ไม่มี dynamic crowd avoidance | มี scenario rush และคนลุก/นั่ง/เสิร์ฟที่ทำซ้ำได้; ต้องไม่เดินผ่าน work areas และไม่เปลี่ยนยอดขาย/ตัด stock ซ้ำ |
| P2 | เพิ่มล็อตวัตถุดิบ/FIFO หากผู้ใช้ต้องการ: ตอนนี้มี quantity และ expiresDay ต่อ ingredient เท่านั้น | ออกแบบ migration และ tests ของ expiry/cost/purchase/cash ก่อนแก้ engine; preserve old saves และไม่ต่ออายุ stock เก่าเมื่อเติมของ |
| P2 | ปรับความสอดคล้องเอกสารเก่า: README ช่วงต้นระบุ 28 tests/พาธ Sites เดิม แต่ส่วนท้ายและ source มี 34 tests | แยก historical evidence จากคำสั่งปัจจุบัน ไม่ลบหลักฐานเก่าแบบไม่มีบริบท; อัปเดต README ในงานที่อนุญาตต่างหาก |
| P3 | ปรับ close-up assets, animation, lighting/AO, texture pipeline/LOD | วัด draw calls/triangles/memory และทดสอบมือถือก่อนเพิ่ม complexity; procedural model ปัจจุบันยังไม่ใช่งาน photorealistic |

ไม่มี confirmed failing unit/build จากรอบเอกสารนี้ ดูผลจริงใน `HANDOFF.md` งานด้าน security/dependency audit ยังไม่มีการประเมินรอบนี้ ห้ามตีความว่าปลอดช่องโหว่

## ขั้นตอนถัดไปที่แนะนำ

1. Review/merge PR เอกสารโดยผู้มีสิทธิ์ หลังตรวจว่า diff มีเพียง 4 Markdown files
2. เลือกงาน P1 หนึ่งเรื่องและกำหนด acceptance criteria กับผู้ใช้ก่อนเริ่ม implementation
3. เก็บ baseline tag เดิมไว้ ใช้ feature branch ใหม่ และแยกผลทดสอบแต่ละรอบ
