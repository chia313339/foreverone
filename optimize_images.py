#!/usr/bin/env python3
"""img/ 内の PNG を最適化 WebP に変換するツール（macOS / 要 Pillow）。

使い方:
    pip3 install Pillow      # 初回のみ
    python3 optimize_images.py

仕様:
- img/ 直下の *.png を走査し、同名 .webp を生成する。
- 横幅が MAX_WIDTH を超える画像は MAX_WIDTH に縮小（Web 表示に過大な解像度を削減）。
- 既存の .webp より小さくなる場合のみ上書き（既存が小さければ維持）。
- PNG は元素材として残す（firebase.json で本番デプロイからは除外）。
"""
import os
from PIL import Image

IMG_DIR = os.path.join(os.path.dirname(__file__), "img")
MAX_WIDTH = 2400          # Web 表示の上限幅（これ以上は縮小）
QUALITY = 82              # WebP 品質（0-100, 80前後が高品質と容量の均衡点）
METHOD = 6                # 圧縮努力度（0-6, 6が最小サイズ）


def optimize(png_path):
    webp_path = os.path.splitext(png_path)[0] + ".webp"
    im = Image.open(png_path)
    w, h = im.size
    if w > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(h * MAX_WIDTH / w)), Image.LANCZOS)
    tmp = webp_path + ".tmp"
    im.save(tmp, "webp", quality=QUALITY, method=METHOD)
    new = os.path.getsize(tmp)
    old = os.path.getsize(webp_path) if os.path.exists(webp_path) else None
    if old is not None and old <= new:
        os.remove(tmp)
        return webp_path, old, new, "keep"
    os.replace(tmp, webp_path)
    return webp_path, old, new, "write"


def main():
    total_src = total_out = 0
    for name in sorted(os.listdir(IMG_DIR)):
        if not name.lower().endswith(".png"):
            continue
        path = os.path.join(IMG_DIR, name)
        webp, old, new, action = optimize(path)
        total_src += os.path.getsize(path)
        total_out += os.path.getsize(webp)
        old_kb = f"{old//1024}KB" if old else "—"
        print(f"{name:<20} png {os.path.getsize(path)//1024:>5}KB  "
              f"webp {old_kb:>7} -> {new//1024}KB  [{action}]")
    print("-" * 60)
    print(f"PNG 合計 {total_src//1024}KB / WebP 合計 {total_out//1024}KB")


if __name__ == "__main__":
    main()
