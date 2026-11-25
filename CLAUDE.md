# CLAUDE.md — 恆ONE 建案行銷網站

> 本檔記錄專案重點架構，供日後（含 Claude）快速進入狀況。
> 最後更新：2026-11-18（v2 改版：依設計稿 20261117 全面重做版面，地圖與表單維持）

## 專案簡介

單頁式房地產行銷網站（Landing Page）。

- **建案**：恆ONE｜經國河灣中心 ESG超級商辦
- **業主**：中悅建設
- **性質**：純靜態網站（HTML / CSS / JS / 圖片），**無框架、無建置流程（build step）、無自有後端**
- **正式網址**：https://foreverone.com.tw/（自訂網域，canonical）；另有 https://foreverone.web.app
- **GitHub**：https://github.com/chia313339/foreverone

## 技術棧

| 類別 | 內容 |
| --- | --- |
| 核心 | 原生 HTML + CSS + JavaScript（無打包工具） |
| UI 框架 | Bootstrap 5（僅用 Modal 彈窗；版面為自寫 CSS） |
| 滾動動畫 | AOS 2.3.1（CDN 載入） |
| 提示彈窗 | SweetAlert2 11（CDN 載入） |
| jQuery | 3.7.1（僅表單送出用） |
| 字型 | Google Fonts（Noto Serif JP / Noto Sans TC） |
| 追蹤 | Google Tag Manager `GTM-MJLRJLPN`（業主提供） |
| 表單後端 | Google 表單（無自有伺服器，詳見下方資料流） |
| 部署 | Firebase Hosting（GCP 專案 `dwtlung`，站台 `foreverone`） |
| 備用部署 | Dockerfile（nginx 靜態服務） |

## 檔案結構

```
foreverone/
├── index.html          ← 唯一頁面，所有版面內容都在這
├── css/
│   ├── main.css        ← 唯一自訂樣式（其餘為 vendor）
│   ├── bootstrap.min.css
│   └── swiper-bundle.min.css   ← 保留檔但已不載入（部署排除）
├── js/
│   ├── main.js         ← 唯一自訂腳本（動畫初始化 + 表單送出）
│   ├── jquery-3.7.1.min.js
│   ├── bootstrap.bundle.min.js
│   └── swiper-bundle.min.js     ← 保留檔但已不載入（部署排除）
├── img/                ← v2 切圖（hero / traffic / energy / banner / footer_* / stat* / char_* / amenity*）
│   └── _old_v1/        ← 舊版圖片（不部署）
├── video/aerial.mp4    ← 成屋外觀空拍影片（壓縮版，約 4MB）
├── firebase.json       ← 部署設定（public = ".", 鎖定 target、快取標頭、排除清單）
├── .firebaserc         ← 專案/站台綁定
├── FIREBASE_DEPLOY.md  ← 完整部署文件（部署前必讀）
├── Dockerfile          ← nginx 靜態服務（備用）
├── optimize_images.py  ← 圖片最佳化工具（PNG→WebP，macOS/需 Pillow，可重跑）
└── build_v2_assets.py  ← v2 設計稿切圖腳本（不部署）
```

## 頁面結構（index.html，由上而下）— v2（2026-11-18）

設計稿來源：`~/Downloads/LUNG/20261117-中悦恆ONE-一頁式網站-製作檔/`（整頁 4000×22132 JPG + .ai + 空拍影片 + 公設實績照片）。
v2 改為「**照片切圖 + 真實 HTML 文字**」：照片上的文案已從切圖中修補掉，改用 HTML 疊在照片上（桌機 ≥992px），手機則改成「文字在上、照片在下」，文字可讀且利於 SEO。

1. **Header**（sticky）— `logo_header.webp`（透明）+ 貴賓專線／粉絲專頁／線上諮詢／地圖導航／立即預約；手機改為底部固定快捷列 `.mobile-bar`
2. **Hero** — `hero_1125.webp`（主視覺含文字，整張切圖）
3. **運｜交通樞紐** — `traffic.webp`（區位標註保留在圖上）+ HTML 文案疊左上；標題旁「展開全景圖」按鈕 → 全螢幕 Modal `#modalPano` 顯示 `pano.webp`（原圖 4535×2551，約 1.6MB，**開啟時才載入**）。可拖曳環視（含慣性）、滾輪／雙指縮放、雙擊放大、方向鍵；開啟時從全圖推近到恆ONE，工具列有＋／－／恆ONE／全圖／環視（自動左右平移）。對焦點與縮放在 `js/main.js` `initPano()` 的 `FOCUS`、`focusScale()`
4. **能｜能量聚場** — `energy.webp` + 數據圓圈（數字為透明切圖 `stat1~3.webp`，圓框／標籤為 CSS）+ HTML 文案
5. **勢｜立面神韻** — HTML 文案 + 空拍影片 `video/aerial.mp4`（自架，捲到才載入、離開即暫停，右下有播放/暫停鈕）
6. **器｜寰宇公設** — HTML 文案 + 三張公設實績照 `amenity1~3.webp`
7. **結尾主視覺** — `banner_1125.webp`（含文字整張切圖）
8. **線上預約賞屋表單**（欄位 ID 不變）+ 接待會館地址／電話 + 四家公司資訊
9. **Google Maps**（嵌入地圖，圖釘在「恆ONE」）— 桌機疊在 `footer_bg.webp` 的框位上；手機改 `footer_strip.webp`
10. 隱私權聲明 Modal（內容不變）

- PC 版導覽列 `position: fixed` 置頂（body 有 `overflow-x:hidden`，sticky 會失效）；手機版頂部列隨頁捲走。
- 區塊標題（書法字 `char_*.webp` + 線條標題）、`NOW FOREVER ONE` 金色小字皆為 CSS／HTML。
- 色票：底色 `#0c1b38`、金 `#d6b07a`、送出鈕／電話黃 `#f5d169`、Logo 藍 `#182c71`（定義在 `main.css` `:root`）。
- 切圖重做方式：`build_v2_assets.py`（不部署）——從設計稿裁切、修補照片上的文字背景（逐列左右取樣內插）、抽出透明數字／Logo、轉 webp；影片用 ffmpeg 1280px／1Mbps 兩段編碼（79MB → 4MB，已去音軌）。
- 粉絲專頁：https://www.facebook.com/share/1A5wwkQuvr/（2026-11-18 已放入）。
- LINE@：https://line.me/R/ti/p/@269xyofx（2026-11-25 放入；業主給的網址含 fbclid 等追蹤參數，已去除）。
- 兩個連結在 `index.html` 桌機選單與手機底部列各一處。`main.js` 仍保留 `a[data-todo][href="#"]` 的「敬請期待」提示，日後有尚未上線的連結可沿用。
- 舊版 v1 圖片已搬到 `img/_old_v1/`（已排除部署）。
- **2026-11-25 業主修正**：
  - 品牌字一律用「中**悦**」（業主指定，網頁文字全部改為悦；設計稿圖片本來就是悦）。
  - 坪數改為 **74-516 坪**：HTML 文字已改；主視覺與結尾圖的數字是從 `~/Downloads/LUNG/1125/` 的新版 AI 檔（PDF 相容）用 `tools/render_ai.swift` 以 4000px 寬輸出該行，只貼回數字區塊（見 `build_v2_assets.py` 第 4 個參數）。新圖改檔名 `*_1125.webp` 以避開 7 天快取；`og:image` 加 `?v=20261125` 讓 LINE/FB 重抓。
  - 「地圖導航」連結改為業主提供的 https://maps.app.goo.gl/64zscqAvVwX4Ap2YA（桌機選單與手機底部列）；嵌入地圖也改為釘在 Google 地點「恆ONE」（有恆路881號，place ID `0x34681f004db6950b:0x3c132e550686093c`，2026-11-25）。

> 主視覺／結尾圖／交通標註仍是「文字烘在圖上」，改這些文案需重新出圖。

## 表單資料流（重要 — 含雲端後端）

```
網站表單 (js/main.js, jQuery AJAX POST)
   ▼
Google 表單 formResponse endpoint
   ▼
Google 試算表「恆ONE (回覆)」
   ▼
Google Apps Script  ── onFormSubmit 觸發器（表單提交時自動執行，推測為寄通知信給業務）
```

- **前端送出**：`js/main.js` 驗證後用 `fetch(..., { mode: 'no-cors' })` POST 到 Google 表單。
  - Google 表單不回 CORS 標頭，無法讀回應：請求送達即顯示成功，網路失敗才顯示「送出失敗」。
  - 送出中會鎖住按鈕防重複送出，成功後清空表單並 `dataLayer.push({ event: 'form_submit_success' })`（GTM 需建自訂事件觸發條件才會記到轉換）。
  - 隱藏欄位 `#hp_check` 為防機器人 honeypot：有值就假裝成功、不送出。
  - Form endpoint：`https://docs.google.com/forms/u/0/d/e/1FAIpQLSeVoxicRPBWg7ZgqDQMCQTLeNj8Zeslqjs83FWo3e11dXJ4gg/formResponse`
  - 欄位對應（entry ID）：
    | 欄位 | entry ID |
    | --- | --- |
    | 姓名 | `entry.1818746267` |
    | 電話 | `entry.1757153005` |
    | Email | `entry.342666587` |
    | 坪數需求 | `entry.361700726` |
    | 備註 | `entry.1326398902` |
  - 改表單欄位時，這裡的 entry ID 必須同步更新。
- **後端**：Google Apps Script **綁在回覆試算表上**，**不在本 repo**。需從試算表「擴充功能 → Apps Script」編輯／授權。
  - ⚠️ **已知運維問題**：onFormSubmit 觸發器曾出現 `Authorization is required to perform that action.`（需要授權）失敗。
    表單資料仍會正常存入試算表，但提交後的自動動作（通知信）會失敗 → Google 會寄「失敗摘要」信給腳本擁有者。
  - 修法：開回覆試算表 → 擴充功能 → Apps Script → 執行對應函式重新授權；或刪除後重建「表單提交時」觸發器並重新授權（須用建立觸發器的同一 Google 帳號）。

## 部署

詳見 [FIREBASE_DEPLOY.md](FIREBASE_DEPLOY.md)。日常更新內容後：

```bash
firebase deploy --only hosting:foreverone --project dwtlung
```

⚠️ 同 GCP 專案下另有 `dwtlung` 站台，部署**務必加 `:foreverone`**，避免誤動到別站。

`firebase.json` 已設定（2026-06-29 起）：
- **快取標頭**：圖片／JS／CSS `max-age=604800`（7 天）、HTML `max-age=3600`（1 小時）→ 大幅降低回訪流量。
- **部署排除**：`img/**/*.png`（原始素材不上線）、`img/*.mp4`、`img/*.webm`（已停用影片）、swiper 檔。
  → 實際上線內容從約 135MB 降到約 3MB。
- ⚠️ **改 `css/main.css` 或 `js/main.js` 後，務必同步更新 `index.html` 引用處的 `?v=日期`**，否則回訪者 7 天內會拿到舊 CSS/JS 搭配新 HTML。
- ⚠️ 因檔名固定（無 hash），更新某張圖後，7 天內回訪者可能看到舊圖；要立即生效可改檔名或暫時調低該檔 `max-age`。

## 本機預覽

純靜態，直接用瀏覽器開 `index.html` 即可預覽版面。
建議用 `python3 -m http.server` 開本機伺服器預覽（影片延遲載入需 http）。Google Maps、表單送出需實際網路才會作用。

## 流量 / 圖片最佳化（重要 — Firebase 以流量計費）

主要流量來自 `img/` 的滿版圖片。最佳化原則與工作流：

1. **正式上線只用 `.webp`**：`.png` 是原始素材（高解析、檔案大），**已設定不部署**。HTML 一律引用 `.webp`。
2. **加新圖 / 改圖的流程**：
   - 把新的 `.png`（或更新後的）放進 `img/`。
   - 執行 `pip3 install Pillow`（初次）→ `python3 optimize_images.py`。
     - 會自動：超過 2400px 寬的圖縮到 2400px、輸出 `quality=82` 的 webp、且**只在比現有 webp 小時才覆蓋**。
   - 在 `index.html` 引用對應的 `.webp`。
3. **延遲載入**：第一屏以外的 `<img>` 都加了 `loading="lazy"`，Hero 圖加 `fetchpriority="high"`，跳出的訪客不會下載整頁圖片。
4. **成效（2026-06-29 最佳化）**：單次首屏圖片約 9.1MB → 約 2.25MB（約 75%↓）。最大宗是 `section2`（5500px→2400px：1.5MB→257KB）與 Hero `section1v2`（3.0MB png→155KB webp）。

> 若仍要再降流量，可考慮：將 Bootstrap/jQuery 改用 CDN（不佔 Firebase 流量）、或把目前由 CDN 載入的 AOS/SweetAlert2 維持外部載入（現況已是外部，不佔流量）。

## 已修正項目（2026-11-03）

- ✅ 表單：原 jQuery `complete` 會蓋掉 `error`，斷線也顯示成功 → 改 fetch no-cors；加防重複送出、送出後清空、honeypot、GTM 轉換事件。
- ✅ 真正清除表單 input 重複的 `id=""`（6/29 記錄有寫但當時未改到）。
- ✅ SEO：canonical、og:url、og:image 改絕對網址 `img/meta.jpg`（LINE/FB 相容）、改寫 meta description；新增 `robots.txt`、`sitemap.xml`。
- ✅ 手機字級：文案改用 `.intro_title` / `.intro_text`（`max(rem, vw)` 設下限），移除 viewport 的 `maximum-scale=1`。
- ✅ 效能：CSS 不再用 `@import` 串連，改在 `<head>` 用 `<link>` + preconnect；移除未使用的 Noto Serif JP；YouTube iframe 加 `loading="lazy"`；滿版圖與輪播圖加 `width`/`height` 避免版面跳動。
- ✅ 安全：`firebase.json` 加 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`；CDN 的 AOS／SweetAlert2 加 SRI。
- ✅ Dockerfile `EXPOSE 80`，新增 `.dockerignore` 排除原始素材與 .git。
- ✅ 新增「企劃銷售 | 上豪邁實業股份有限公司」（`.form_credit`）：位於 section10 圖下方、地圖上方，上下 30px、左右 50px，字級 `min(5rem, calc((100vw - 100px) / 16))`：寬螢幕固定 5rem，視窗變窄時自動縮小、維持一列。
- ✅ 隱私權聲明錯字「中悦」→「中悅」。

## 已修正項目（2026-06-29）

- ✅ 移除 `main.js` 會報錯的 `myVideo` 死碼（影片已改 YouTube iframe）。
- ✅ 移除未使用的 Swiper（HTML script 與 CSS @import；檔案保留但不部署）。
- ✅ 清除表單 input 重複的 `id=""` 屬性。
- ✅ 強化表單驗證：電話改為「去除非數字後至少 8 碼」（相容市話/手機，避免漏接名單）、Email 有填才驗證格式。
- ✅ 全圖改用最佳化 webp、加 `loading="lazy"`；favicon `type` 改為 `image/webp`。
- ✅ `p.py`（Windows 專用、不可重跑）→ 改為 `optimize_images.py`（macOS 可重跑）。

## 待辦 / 可再優化

- ⚠️ `https://www.foreverone.com.tw` DNS 已指到 Firebase 但**未加入自訂網域**，憑證不含 www → 瀏覽器會跳安全警告。需在 Firebase Console → Hosting → foreverone → 新增自訂網域 `www.foreverone.com.tw` 並設為導向主網域。
- git 歷史中仍有約 82MB 的 `one_vedio.*`（已停用），要瘦身需改寫歷史，暫不處理。
- 右鍵禁止目前保留（未確認是否為業主要求），實際上無法防止存圖。

- webp 仍無 `<picture>` 對 `.png` 的 fallback；目前所有目標瀏覽器皆支援 webp（2020 後全面支援），影響極小，暫不處理。
- 若日後要支援極舊瀏覽器，再考慮 `<picture>` + `.png` fallback（但會讓 png 需重新納入部署）。
