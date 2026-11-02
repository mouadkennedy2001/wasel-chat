# واصل | Wasel

واصل تطبيق محادثة ويب بواجهة عربية/إنجليزية، مبني على Node.js وExpress وSQLite وWebSocket، وواجهة HTML/CSS/JavaScript دون خطوة بناء.

## التشغيل المحلي

1. ثبّت Node.js (الإصدار 20 أو أحدث).
2. من جذر المشروع شغّل:

   ```sh
   npm install
   npm start
   ```

3. افتح <http://localhost:3000>. تُنشأ قاعدة البيانات ومفتاح التطوير تلقائياً في `server/data/`.

## ما يعمل الآن

- تسجيل وإنشاء حسابات، كلمات مرور مجزأة، جلسات refresh دوّارة، تسجيل خروج، ومقاومة محاولات الدخول المتكررة.
- البحث عن الأصدقاء وإرسال/قبول/رفض/إلغاء الطلبات، وإزالة الأصدقاء وحظرهم وإلغاء الحظر.
- محادثات مباشرة ومجموعات متعددة الأعضاء، رسائل فورية ومؤشر كتابة، سجل رسائل، رد على رسالة، حذف الرسالة من سجل المستخدم، وحالات التسليم/القراءة.
- مكالمات صوتية مباشرة وجماعية عبر WebRTC mesh حتى 8 مشاركين، مع قبول/رفض، كتم الميكروفون، إنهاء المكالمة، وإشعارات حالة المشاركين.
- مشاركة شاشة أو نافذة أو تبويب عبر `getDisplayMedia` أثناء المكالمة، مع إيقاف المشاركة من التطبيق أو من واجهة المتصفح.
- صلاحيات المجموعات: مالك ومشرف وعضو، إضافة الأصدقاء، الإزالة، ترقية المشرفين وتخفيضهم، نقل الملكية ومغادرة المجموعة.
- تعديل الاسم الظاهر والنبذة، تصميم متجاوب، رموز أصلية، وتخطيط عربي RTL وإنجليزي LTR.
- تُحذف الرسائل المخزنة بعد سبعة أيام. البيانات في قاعدة SQLite على الخادم، ولا تحفظ الواجهة الرسائل أو الأصدقاء في تخزين المتصفح.

## حدود النسخة الحالية — اقرأ قبل الاستخدام

الرسائل الحالية تمر عبر الخادم وتُخزّن **كنص عادي مؤقتاً**؛ لا يوجد تشفير تام بين الطرفين أو نقل رسائل عبر WebRTC P2P. المكالمات الصوتية ومشاركة الشاشة تستخدمان WebRTC، بينما يمر إعداد الاتصال (signaling) عبر WebSocket موثّق على الخادم. لا توجد مفاتيح هوية للتحقق من هوية النظير، لذلك لا تعتبر المكالمات تحققاً مستقلاً من الهوية أو بديلاً عن التشفير التام للرسائل. مكالمات المجموعات mesh ومحدودة بثمانية مشاركين؛ جودة الاتصال تعتمد على الأجهزة والشبكات.

تحتاج المكالمات إلى متصفح حديث واتصال HTTPS (أو localhost للتطوير) مع إذن الميكروفون. مشاركة صوت النظام تعتمد على المتصفح وخيار المشاركة الذي يختاره المستخدم. أضف خدمة TURN موثوقة في الإنتاج للشبكات التي لا ينجح معها STUN: اضبط `TURN_URL` و`TURN_USERNAME` و`TURN_CREDENTIAL` في `server/.env`؛ ويمكن أن تحتوي `TURN_URL` على عدة عناوين مفصولة بفواصل. لا تُضمّن بيانات TURN في الشيفرة أو المستودع. لا تزال مكالمات الفيديو والصور/الملفات ورفع الصور الرمزية والإشعارات المكتبية غير منفذة.

**لا تستخدم هذه النسخة للمعلومات الحساسة ولا تعتبرها تطبيق مراسلة آمناً أو مكتملاً.** راجع [SECURITY.md](./SECURITY.md).

## النشر على Render

أنشئ Web Service من جذر المشروع باستخدام `npm install` للبناء و`npm start` للتشغيل؛ الإعداد الأساسي في `render.yaml`. اضبط `NODE_ENV=production` و`JWT_SECRET` عشوائياً بطول 32 محرفاً على الأقل. اجعل `DB_PATH` يشير إلى قرص دائم إن أردت الاحتفاظ بالبيانات؛ قرص Render المجاني مؤقت وقد تُفقد البيانات عند إعادة التشغيل.

تُقرأ إعدادات TURN الاختيارية من `server/.env.example`؛ نقطة إعداد ICE الموثّقة للمستخدمين هي `/api/rtc-config`. فحص صحة الخدمة: `/health`.

## English

Wasel is a responsive Arabic/English chat website using Node.js, Express, SQLite, WebSocket, and plain HTML/CSS/JavaScript.

### Run locally

Install Node.js 20 or newer. From the project root run `npm install` then `npm start`; open <http://localhost:3000>. A development signing secret and SQLite database are created under `server/data/`.

The current build includes accounts, friend requests/blocking, direct and group text chats, live message/typing updates, replies, delete-for-me, delivery/read state, group roles and member management, editable profiles, WebRTC audio calls (direct and group mesh, up to 8 participants), and screen sharing.

### Important security limitation

Messages currently travel through the server and are temporarily stored as **plaintext**. There is no end-to-end encryption or verified peer identity. Calls and screen sharing use WebRTC media with authenticated WebSocket signaling; group calls use a mesh topology and are limited to 8 participants. Use HTTPS (or localhost during development) and grant microphone/display permissions. Configure a trusted TURN service with `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` in `server/.env` when STUN connectivity is insufficient. Video calls, image/file transfer, avatar uploads, and desktop notifications have not been implemented. Do not send sensitive information or treat this as a secure, complete messenger. See [SECURITY.md](./SECURITY.md).

### Render deployment

Create a Web Service from the repository root with build command `npm install` and start command `npm start`. Set `NODE_ENV=production`, a random `JWT_SECRET` of at least 32 characters, and `DB_PATH` to a persistent disk if needed. Render's free disk is ephemeral. Configure optional TURN credentials in the server environment for reliable calling across restrictive networks.

Health check: `/health`.
# wasel-chat
