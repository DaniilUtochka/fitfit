#!/usr/bin/env python3
"""Вырезка котов-маскотов из референса (scripts/cats-source/reference.png).

Для каждого кота: кроп по рамке -> удаление белого фона (flood fill от краёв,
чтобы не тронуть белые тела котов) -> обрезка по альфе -> WebP с альфой в
src/components/cats/assets/. Печатает JSON с aspect ratio для компонента.

Запуск: python scripts/extract-cats.py
Зависимости: pillow (python -m pip install pillow).
"""

from __future__ import annotations

import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "cats-source" / "reference.png"
OUT_DIR = ROOT / "src" / "components" / "cats" / "assets"

# имя -> (лево, верх, право, низ) по сетке референса
BOXES: dict[str, tuple[int, int, int, int]] = {
    "band": (20, 25, 195, 235),
    "sleepy": (205, 85, 439, 225),
    "dumbbell": (25, 270, 210, 470),
    "mat": (225, 285, 435, 460),
    "loaf": (95, 520, 345, 655),
    "wrecked": (25, 725, 245, 940),
    "joy": (240, 700, 430, 975),
}

TOLERANCE = 32  # насколько цвет может отличаться от фонового, чтобы считаться фоном
PAD = 2  # запас в пикселях после обрезки по альфе


def remove_background(img: Image.Image) -> Image.Image:
    """Заливка альфой от краёв: фон — связная область светлых пикселей у рамки.

    Flood fill, а не «всё белое -> прозрачно»: у Повязки и Коврика белые тела,
    их трогать нельзя — они не связаны с фоном (тёмный контур).
    """
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    # эталон фона — медиана угловых пикселей
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    ref = tuple(sorted(c[i] for c in corners)[1] for i in range(3))  # медиана по каналам

    def is_bg(x: int, y: int) -> bool:
        r, g, b, _ = px[x, y]
        return abs(r - ref[0]) + abs(g - ref[1]) + abs(b - ref[2]) < TOLERANCE * 3

    seen = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and is_bg(nx, ny):
                seen[ny][nx] = True
                queue.append((nx, ny))

    return img


def main() -> None:
    src = Image.open(SOURCE)
    meta: dict[str, float] = {}
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, box in BOXES.items():
        cat = remove_background(src.crop(box))
        bbox = cat.getbbox()
        if bbox is None:
            sys.exit(f"{name}: пустой кроп, проверь рамку {box}")
        left, top, right, bottom = bbox
        left = max(0, left - PAD)
        top = max(0, top - PAD)
        right = min(cat.width, right + PAD)
        bottom = min(cat.height, bottom + PAD)
        cat = cat.crop((left, top, right, bottom))

        out = OUT_DIR / f"{name}.webp"
        cat.save(out, "WEBP", quality=90, method=6)
        aspect = round(cat.height / cat.width, 4)
        meta[name] = aspect
        print(f"{name}: {cat.width}x{cat.height} aspect={aspect} -> {out.name}")

    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
