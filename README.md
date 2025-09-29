
# AgentFlow — README

**زبان:** فارسی  
**فایل:** `app.js` (لوژیک AgentFlow برای ویرایشگر جریان عامل‌ها)

---

## توضیحات کلی
AgentFlow یک رابط ساده و سبک برای طراحی جریان‌های عامل (Agents) به‌صورت بصری است. با استفاده از این پروژه می‌توانید نودهای آماده (مانند کدرهای Python/JS، لودر داده، تریگر و ... ) را به بوم (canvas) بکشید، پارامترهای هر نود را ویرایش کنید، جریان را اجرا کنید و خروجی JSON را صادر/درون‌ریزی کنید.

این README بر اساس `app.js` که شما فرستادید نوشته شده و شامل بخش‌های راه‌اندازی، استفاده، توسعه و رفع اشکال است.

---

## ویژگی‌ها
- پالت آماده از نودها (`AGENT_DATA`) شامل دسته‌های Core, Programming, Data.
- درگ اند دراپ نودها از پنل به بوم.
- افزودن نود با کلیک.
- باز کردن Inspector برای ویرایش label، subtitle و params (فرمت JSON).
- ذخیره/بارگذاری جریان به/از localStorage و فایل JSON.
- پیش‌نمایش JSON در پنجره جدید.
- اجرای شبیه‌سازی ساده (تابع `runFlow`) که برای هر نود خروجی فرضی تولید می‌کند و آن را در داده‌های نود ذخیره می‌کند.
- لاگ (نمایش رخدادها و پیام‌ها).

---

## ملزومات (Dependencies)
این پروژه نیاز دارد به:
- `Drawflow` (کتابخانهٔ ساخت و ویرایش نمودارها/نودها در بوم). نسخهٔ مناسبی از Drawflow را دانلود یا با CDN اضافه کنید.
- یک صفحهٔ HTML که `app.js` را بارگذاری کند و المان‌های با idهای مورد استفاده را داشته باشد (در ادامه نمونه ساختار آورده شده).

نیازی به نصب سرور خاصی نیست؛ برای توسعه محلی می‌توانید از هر سرور سادهٔ فایل استاتیک (مثلاً `http-server` در npm یا `python -m http.server`) استفاده کنید.

---

## ساختار پیشنهادی فایل‌ها
```
agentflow/
├─ index.html
├─ app.js            # فایل شما (کد AgentFlow)
├─ styles.css
├─ libs/
│  └─ drawflow.min.js
└─ assets/
```

---

## نمونهٔ ساختار سادهٔ `index.html`
لطفاً این قطعه را به عنوان پایه استفاده کنید (نیاز به استایل و کتابخانه Drawflow دارد):

```html
<!doctype html>
<html lang="fa">
  <head>
    <meta charset="utf-8" />
    <title>AgentFlow</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="styles.css" />
    <!-- اضافه کردن Drawflow از CDN یا فایل محلی -->
    <script src="libs/drawflow.min.js"></script>
  </head>
  <body>
    <!-- المان‌های مورد استفاده در app.js -->
    <div id="panel-content">
      <div id="panel-list"></div>
    </div>

    <div id="drawflow" style="width:100%;height:600px;border:1px solid #ddd"></div>

    <!-- Inspector modal -->
    <div id="inspector-modal-overlay" class="modal">
      <div id="inspector">
        <div id="inspector-id"></div>
        <div id="inspector-content"></div>
        <button onclick="App.handlers.closeInspector()">بستن</button>
      </div>
    </div>

    <!-- Log panel -->
    <div id="log-panel">
      <div id="log-content"></div>
      <button id="clearLogs">پاک کن</button>
      <button id="closeLogs">بستن</button>
    </div>

    <!-- Controls / toolbar -->
    <button id="previewJson">پیش‌نمایش JSON</button>
    <button id="runFlow">اجرای جریان</button>
    <button id="saveLocal">ذخیره محلی</button>
    <button id="exportJson">صدور JSON</button>
    <button id="importJson">درون‌ریزی JSON</button>
    <button id="openLog">باز کردن لاگ</button>

    <script src="app.js"></script>
  </body>
</html>
```

---

## نحوهٔ اجرا (Run)
1. فایل‌ها را در یک پوشه قرار دهید (index.html, app.js, drawflow).
2. یک سرور محلی ساده اجرا کنید:
   - با Python: `python -m http.server 8000`
   - یا با `http-server` در npm: `npx http-server . -p 8000`
3. مرورگر را باز کنید: `http://localhost:8000`  
4. حال می‌توانید نودها را از پنل به بوم بکشید، روی آن‌ها کلیک کنید تا Inspector باز شود، و جریان را اجرا یا صادر کنید.

---

## فرمت JSON خروجی (نمونه)
خروجی `export()` به شکل Drawflow خواهد بود. نمونهٔ سادهٔ قسمت `drawflow.Home.data`:

```json
{
  "node-1": {
    "id": "node-1",
    "name": "python_coder",
    "data": {
      "label": "Python Coder",
      "subtitle": "Write Python",
      "params": {
        "runtime": "python3.11"
      }
    },
    "class": "agent-node",
    "html": "<div>...</div>",
    "x": 200,
    "y": 120
  }
}
```

---

## نحوهٔ افزودن/تعریف Agent جدید
در `app.js` بخش `AGENT_DATA` را ویرایش کنید. هر Agent حداقل باید این ساختار را داشته باشد:

```js
{ label: 'My Agent', subtitle: 'عملیات X', icon: '⚙️', agentType: 'my_agent', params: { key: 'value' } }
```

- `agentType` نامی است که هنگام اجرا (در `runFlow`) می‌تواند برای تصمیم‌گیری استفاده شود.
- `params` می‌تواند هر دادهٔ تنظیماتی مورد نیاز نود را نگه دارد.

---

## توسعه و گسترش
- پیاده‌سازی `runFlow` واقعی: به‌جای شبیه‌سازی، می‌توانید با Backend یا WebWorker ارتباط برقرار کنید تا برای هر نود کاری واقعی انجام شود (مثلاً فراخوانی LLM، اجرای کد، بارگذاری/ذخیره).
- افزودن قوانین اتصال: کنترل نوع ورودی/خروجی نودها، اعتبارسنجی پارامترها.
- ذخیره در سرور: پیاده‌سازی endpoint برای ذخیره و بارگذاری جریان‌ها.
- تست واحد برای متدهای Editor wrapper (اضافه کردن/حذف/به‌روزرسانی نود).

---

## نکات رایج رفع اشکال
- اگر درگ اند دراپ کار نکرد: مطمئن شوید که `e.dataTransfer` مجاز است و `dragstart` مقدار `data-agent` را می‌سازد.
- اگر `editor.addNode` خطا داد: چک کنید Drawflow به‌درستی بارگذاری شده و `editor.start()` صدا زده شده.
- خطای JSON در Inspector: قبل از ذخیره مطمئن شوید `ins-params` حاوی JSON معتبر است.
- کنسول مرورگر را باز کنید و لاگ‌های App.helpers.log را بررسی کنید؛ آن‌ها اشکال‌یابی را ساده می‌کنند.

---

## امنیت
- هنگام ذخیرهٔ params نودها اگر دادهٔ کاربر ذخیره می‌کنید، از اعتبارسنجی و پاکسازی (sanitization) مناسب استفاده کنید.
- اگر قرار است کد اجرا شود (مثلاً اجرای کد تولیدی توسط نودها)، آن را داخل sandbox یا process جدا اجرا کنید.

---

## نمونهٔ License
قرار دهید مثل MIT:

```
MIT License
Copyright (c) 2025
...
```

---

## تشکر و منابع
- Drawflow — برای بوم نودها.
- هر منبع دیگری که در پروژه استفاده می‌کنید (کتابخانه‌ها، آیکون‌ها و ...).

---

### یادداشت نهایی
این README بر اساس `app.js` که شما ارسال کردید نوشته شده است. اگر خواستید، می‌توانم:
- یک `index.html` کامل و `styles.css` آماده برای شما تولید کنم.
- یک بستهٔ ZIP شامل همهٔ فایل‌ها بسازم.
- یا README را به انگلیسی یا با جزئیات بیشتر فنی بازنویسی کنم.
