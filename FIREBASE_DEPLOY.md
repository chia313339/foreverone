# Firebase Hosting 部署說明 — foreverone

本專案（恆ONE 靜態網站）部署於 **GCP 專案 `dwtlung`** 的 Firebase Hosting，
使用**獨立站台 `foreverone`**，與既有的 `dwtlung` 站台完全隔離（透過 hosting target 區分）。

## 基本資訊

| 項目 | 值 |
| --- | --- |
| GCP / Firebase 專案 ID | `dwtlung` |
| Hosting 站台 ID (Site ID) | `foreverone` |
| Hosting Target 名稱 | `foreverone` |
| 正式網址 | https://foreverone.web.app |
| 部署帳號 | chia313339@gmail.com |
| 站台類型 | 純靜態網站（HTML / CSS / JS / 圖片），網站根目錄即專案根目錄 |
| 首次部署時間 | 2026-06-08 |

> 同專案另有既有站台 `dwtlung`（https://dwtlung.web.app）。
> 兩者透過 hosting target 分流，**部署 foreverone 不會影響 dwtlung**。

## 設定檔

### `.firebaserc`
- `projects.default = dwtlung`
- `targets.dwtlung.hosting.foreverone = ["foreverone"]` — 將 target `foreverone` 綁定到 site `foreverone`。

### `firebase.json`
- `hosting.target = "foreverone"` — 只部署到此 target（不會誤觸其他站台）。
- `hosting.public = "."` — 以專案根目錄作為網站內容。
- `hosting.ignore` — 排除設定檔、隱藏檔、`node_modules`、`Dockerfile`、`p.py`、`package-lock.json`、`README.md`、`FIREBASE_DEPLOY.md`。

## 部署指令

日常更新內容後，重新部署只需執行（**務必加 `:foreverone` 限定站台**）：

```bash
firebase deploy --only hosting:foreverone --project dwtlung
```

## 首次建立步驟（紀錄，已完成，不需重跑）

```bash
# 1. 確認登入帳號
firebase login:list                                   # chia313339@gmail.com

# 2. 建立獨立站台（只需一次）
firebase hosting:sites:create foreverone --project dwtlung

# 3. 綁定 hosting target（只需一次；設定已寫入 .firebaserc）
firebase target:apply hosting foreverone foreverone --project dwtlung

# 4. 部署
firebase deploy --only hosting:foreverone --project dwtlung
```

## 常用維運指令

```bash
# 列出專案內所有站台
firebase hosting:sites:list --project dwtlung

# 查看 foreverone 站台的發布狀態
firebase hosting:channel:list --site foreverone --project dwtlung

# 預覽（不直接上線，建立暫時預覽頻道）
firebase hosting:channel:deploy preview --site foreverone --project dwtlung
```

## 注意事項
- 一定要使用 `--only hosting:foreverone`，避免不小心動到 `dwtlung` 站台。
- `firebase.json` 的 `public` 為 `.`，新增檔案會一併上傳；若有不想公開的檔案，請加入 `ignore`。
- Firebase Hosting 僅上傳「有變動」的檔案（依內容雜湊），重複部署很快。
