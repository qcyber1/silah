# خط ثمانية — محلي فقط

هذا المجلد **مستثنى من git ومن النشر** (`.gitignore` و`.assetsignore`). لا يُرفع ولا يُخدَم من أي رابط عام.

## لماذا

ترخيص ثمانية يجيز لك: *«Use the Font Software for personal projects»* و*«used on your own devices and projects»*.

ويمنع: *«Make the Font Software available in any manner that allows end users or third parties to extract, download, access… including through web embedding»*.

فالتشغيل على جهازك مسموح. النشر على `silah.na900r2022.workers.dev` ممنوع، لأن أي زائر يقدر ينزّل ملف `.woff2` من أدوات المطوّر.

## كيف يعمل

`js/font-local.js` يفحص اسم المضيف: إن كان `localhost` أو `127.0.0.1` أو عنوان شبكة محلية، يحقن `@font-face` لخط ثمانية ويجعله خط الواجهة. على أي نطاق عام لا يفعل شيئًا، ويبقى Cairo.

يعني: تفتح `http://localhost:5179` فتشوف ثمانية · وتفتح الرابط العام فتشوف Cairo.

## لتشغيله على الرابط العام

راسل **ask@thmanyah.com** واطلب استثناء web embedding — الترخيص نفسه يوجّه لذلك. نصّ الرسالة جاهز في `../../THMANYAH-REQUEST.md`.

بعد وصول الموافقة الخطية: انقل الملفات من `fonts/local/` إلى `fonts/`، واحذف شرط المضيف من `font-local.js`، واحذف السطور المستثنية من `.gitignore` و`.assetsignore`.
