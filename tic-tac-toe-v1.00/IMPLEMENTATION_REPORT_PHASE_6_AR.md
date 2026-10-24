# تقرير التنفيذ الهندسي — المرحلة السادسة

**التاريخ:** 24 أكتوبر 2026  
**حالة الإصدار:** `PARTIALLY VERIFIED` — تم التحقق جزئيًا

## 1. ملخص تنفيذي

نُفذت المرحلة السادسة على مشروع المرحلة الخامسة. ركزت على جعل حل فجوة ملف القفل قابلًا للتنفيذ عبر GitHub Actions، وتوسيع اختبارات مدقق الاعتماديات، وإضافة اختبارات Playwright حقيقية لرحلات اللاعب، وتشغيلها في CI بعد بناء التطبيق، مع الحفاظ على عدم نشر الموقع أو تفعيل الإعلانات تلقائيًا.

لم أُنشئ ملف `package-lock.json` مصطنعًا. محاولة توليده من البيئة الحالية انتهت بمهلة، ولم يتمكن DNS من حل `registry.npmjs.org`. لذلك بقي تثبيت الاعتماديات واختبارات React والبناء الإنتاجي واختبارات Playwright غير قابل للتنفيذ محليًا. أضيف سير عمل يدوي باسم **Bootstrap and verify npm lockfile** لإنشاء الملف بواسطة npm على Runner متصل، ورفع نسخة كأثر لمراجعة المالك وتنزيلها؛ السير لا يدفع تغييرات إلى المستودع.

## 2. التغييرات الفعلية

### الاعتماديات وقابلية إعادة الإنتاج

- أُضيف `@playwright/test` مثبتًا على `1.64.1` إلى `devDependencies` لإتاحة اختبار متصفح فعلي. راجع [صفحة الحزمة الرسمية على npm](https://www.npmjs.com/package/@playwright/test).
- توسع `scripts/check-lockfile.mjs` ليتحقق من نسخة lockfile v3، وبيانات الاسم والإصدار في المستويين الأعلى والجذر، وتطابق أقسام الاعتماديات المباشرة مع `package.json`، ووجود إدخال مباشر بإصدار محلول لكل اعتماد معلن.
- وُسعت `scripts/test-lockfile.mjs` من 3 إلى **9 سيناريوهات**: ملف صالح، ملف مفقود، عدم تطابق قسم الاعتماديات، JSON تالف، إصدار lockfile غير مدعوم، إدخال حزمة مفقود، إصدار حزمة غير محلول، وعدم تطابق بيانات الجذر/البيانات العليا.
- أُضيفت أوامر `test:e2e` و`verify:release`. وأصبح `npm run verify` يشغّل اختبارات مدقق ملف القفل قبل فحص وجود الملف، ثم فحوص الموقع واللغة واختبارات المشروع والتحقق من الأنواع والبناء.
- لا يحتوي التسليم على `package-lock.json` لأن إنشاءه يحتاج سجل npm حقيقيًا. هذا مانع إصدار معلن وليس ملفًا مفقودًا بالخطأ.

### اختبارات المتصفح

- أُضيف `playwright.config.ts` ليختبر تطبيق الإنتاج من خلال Vite Preview على `127.0.0.1:4173`، مع صور وtrace عند الفشل.
- أُضيف `e2e/app.spec.ts` وفيه **8 اختبارات** تغطي: ظهور اللوحة وعدم حدوث خطأ JavaScript غير معالج؛ مباراة محلية مكتملة وتسجيل النتيجة مرة واحدة؛ استجابة الذكاء الاصطناعي؛ إلغاء استجابة AI متقادمة بعد إعادة الجولة؛ حفظ العربية واتجاه RTL والتنقل بالأسهم؛ عدم التجاوز الأفقي على شاشة هاتف؛ حفظ اختيار اللغة بين الصفحات العامة؛ وعدم تحميل الإعلانات افتراضيًا.
- أُدرج `playwright.config.ts` وملفات E2E في فحص TypeScript الخاص بملفات الإعدادات، وأُضيفت تقارير Playwright إلى `.gitignore`.

### CI وسير إنشاء ملف القفل

- تم تحديث `.github/workflows/ci.yml` ليشغّل اختبار Playwright بعد تثبيت الاعتماديات والتحقق والبناء، مع رفع تقرير Playwright التشخيصي عند الفشل.
- أُضيف `.github/workflows/bootstrap-lockfile.yml`، وهو يدوي التشغيل فقط. يتحقق من أن الملف غير موجود قبل بدء العملية، ويولد الملف باستخدام `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`، ثم يفحصه ويثبت الاعتماديات عبر `npm ci`. بعد نجاح التثبيت يرفع `package-lock.json` كأثر `ttu-package-lock` للمراجعة؛ ثم يشغل تدقيق الحزم والتحقق والبناء واختبارات المتصفح.
- لا يقوم سير العمل بدفع التغييرات إلى المستودع، ولا ينشر التطبيق.
- حُدثت وسوم إجراءات GitHub إلى إصدارات تصحيحية منشورة: [actions/checkout v7.0.1](https://github.com/actions/checkout/releases) و[actions/setup-node v7.1.0](https://github.com/actions/setup-node/releases) و[actions/upload-artifact v7.0.2](https://github.com/actions/upload-artifact/releases).
- حُدّث `scripts/check-site.mjs` ليتحقق من وجود سير عمل إنشاء القفل وملفات Playwright وأوامر التحقق ذات الصلة.
- حُدّث `README.md` و`SITE_LAUNCH_CHECKLIST.md` لتوضيح خطوات إنشاء القفل وتشغيل اختبارات المتصفح.

## 3. نتائج التحقق — الأوامر الفعلية

### PASS

| الأمر أو الفحص | النتيجة |
|---|---|
| `npm run test:lockfile` | PASS — 9 سيناريوهات |
| `npm run check:site` | PASS — 14 ملفًا رئيسيًا وفحوص اللغة والصفحات وCI وPlaywright |
| `npm run test:site-language` | PASS — 4 سيناريوهات |
| `node --check public/site.js` | PASS |
| `node --check scripts/check-site.mjs` | PASS |
| `node --check scripts/test-site-language.mjs` | PASS |
| `node --check scripts/check-lockfile.mjs` | PASS |
| `node --check scripts/test-lockfile.mjs` | PASS |
| تحليل YAML لـ `.github/workflows/ci.yml` | PASS — وظيفتا `static-site-checks` و`full-verification` |
| تحليل YAML لـ `.github/workflows/bootstrap-lockfile.yml` | PASS — وظيفة `bootstrap` |
| تحويل TypeScript/TSX النحوي | PASS — 22 ملفًا؛ فحص صياغة فقط وليس typecheck كاملًا |
| تجميع TypeScript صارم مستقل لوحدات المحرك والتخزين والترجمة والصوت | PASS باستخدام TypeScript 5.8.3 المحلي |
| محاكاة مستقلة لقواعد اللعبة والذكاء الاصطناعي | PASS: 5,478 حالة قابلة للوصول؛ 16,167 انتقالًا قانونيًا؛ 45,200 فحص قانونية لحركات AI؛ ولم يُكتشف مسار خسارة مفروض لـ Impossible بعلامتي X وO |

### BLOCKED أو FAIL بسبب البيئة/المتطلبات السابقة

| الأمر أو الفحص | النتيجة والدليل |
|---|---|
| `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` | BLOCKED — انتهى `timeout 30s` برمز 124؛ `getent hosts registry.npmjs.org` لم يرجع عنوانًا (رمز 2). |
| `npm run check:lockfile` على المشروع الفعلي | FAIL مقصود كحاجز إصدار — لا يوجد `package-lock.json`. |
| `npm ci --no-audit --no-fund` | BLOCKED — npm يرفض لأن lockfile غير موجود (`EUSAGE`). |
| `npm test` | BLOCKED — `vitest: not found` (رمز 127). |
| `npm run typecheck` | BLOCKED — الاعتماديات وأنواع React وVitest وTesting Library غير مثبتة؛ تظهر أخطاء `Cannot find module`. لا يثبت هذا وحده وجود عيب نوعي في المصدر. |
| `npm run build` | BLOCKED — يتوقف `tsc -b` على الوحدات والأنواع غير المثبتة؛ لم يكتمل `vite build`. |
| `npm run audit:deps` | BLOCKED — `ENOLOCK` لغياب lockfile. |
| `npm run test:e2e` | BLOCKED — `@playwright/test` غير مثبتة؛ لا يمكن تشغيل مجموعة المتصفح في هذه الجلسة. |
| `npm run verify` و`npm run verify:release` | BLOCKED عند حاجز ملف القفل بعد نجاح اختبارات مدقق القفل. |
| تشغيل GitHub Actions عن بعد | NOT RUN — لم يتوفر وصول مستودع/Runner من هذه الجلسة لتشغيل workflow فعليًا. |
| اختبارات React وPlaywright الفعلية | NOT RUN بسبب نقص الاعتماديات وعدم وجود build للإنتاج. ملفات الاختبار أضيفت لكن لم يُدّع اجتيازها. |

## 4. خطوات إكمال المرحلة على Runner متصل

1. انشر المشروع في مستودع GitHub أو استخدم مستودعًا متصلًا بالفعل.
2. من `Actions` شغّل **Bootstrap and verify npm lockfile** يدويًا.
3. نزّل أثر `ttu-package-lock` وراجع `package-lock.json` ثم أضفه إلى المستودع والتزم به. لا يقوم workflow بهذه الخطوة نيابة عنك.
4. شغّل سير `Verify Tic-Tac-Toe Ultimate` وتأكد من نجاح `full-verification`.
5. يجب أن تمر `npm ci`، وتدقيق الاعتماديات، وVitest، وفحص الأنواع الكامل، والبناء، ثم Playwright على نسخة Preview.
6. راجع أي إخفاقات في اختبارات المتصفح وأصلح السبب ثم أعد التشغيل؛ لا تغيّر الاختبارات فقط للحصول على نجاح.

## 5. التقييم النهائي

**PARTIALLY VERIFIED — تم التحقق جزئيًا.** تم تنفيذ تغييرات حقيقية في الاختبارات والتهيئة وسير العمل، واجتازت الفحوص المستقلة المتاحة. لكن لا يمكن اعتماد الإصدار للإطلاق قبل إنشاء lockfile حقيقي، وتشغيل `npm ci`، واختبارات React، والتدقيق الأمني، وفحص الأنواع الكامل، والبناء، واختبارات المتصفح على Runner متصل.
