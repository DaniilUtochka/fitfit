# -*- coding: utf-8 -*-
"""Вырезка котов v2: белый фон + стикер-рамка -> прозрачный WebP."""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = r'C:\Users\Dan\AppData\Local\Temp\opencode\cats-new'
DST = r'C:\Users\Dan\AppData\Local\Temp\opencode\cats-cut'
PRV = r'C:\Users\Dan\AppData\Local\Temp\opencode\cats-cut-preview'
os.makedirs(DST, exist_ok=True)
os.makedirs(PRV, exist_ok=True)

CATS = {
    'img1': 'band',
    'img2': 'sleepy',
    'img3': 'dumbbell',
    'img4': 'mat',
    'img5': 'loaf',
    'img6': 'wrecked',
    'img7': 'joy',
}

for src_name, cat in CATS.items():
    src = None
    for ext in ('.jpeg', '.jpg', '.png'):
        p = os.path.join(SRC, src_name + ext)
        if os.path.exists(p):
            src = p
            break
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.int16)

    # почти-белые пиксели = кандидаты в фон/рамку
    near_white = (a[..., 0] >= 232) & (a[..., 1] >= 232) & (a[..., 2] >= 232)

    # компонент связности почти-белого, касающийся краёв картинки = фон+рамка
    lbl, n = ndimage.label(near_white)
    border_labels = set(np.unique(np.concatenate([
        lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]
    ])))
    border_labels.discard(0)
    bg = np.isin(lbl, list(border_labels))

    # мягкий край: 1px эрозия кота + лёгкое размытие альфы
    cat_er = ndimage.binary_erosion(~bg, iterations=1)
    alpha = (cat_er * 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8))

    rgba = im.convert('RGBA')
    rgba.putalpha(alpha_img)

    # трим по bbox с запасом 8px
    bbox = Image.fromarray(alpha).getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        x0 = max(0, x0 - 8); y0 = max(0, y0 - 8)
        x1 = min(rgba.width, x1 + 8); y1 = min(rgba.height, y1 + 8)
        rgba = rgba.crop((x0, y0, x1, y1))

    out = os.path.join(DST, cat + '.webp')
    rgba.save(out, 'WEBP', quality=92, method=6)
    w, h = rgba.size
    print(f'{cat}: {w}x{h} aspect={h / w:.4f} -> {out}')

    # превью: на сиреневом фоне в двух размерах (крупный и мелкий)
    bgc = Image.new('RGB', (w + 80, h + 80), (237, 228, 255))
    bgc.paste(rgba, (40, 40), rgba)
    bgc.save(os.path.join(PRV, cat + '_big.png'))
    small = rgba.copy()
    small.thumbnail((48, 48), Image.LANCZOS)
    sb = Image.new('RGB', (small.width + 30, small.height + 30), (255, 246, 232))
    sb.paste(small, (15, 15), small)
    sb = sb.resize((sb.width * 3, sb.height * 3), Image.NEAREST)
    sb.save(os.path.join(PRV, cat + '_small.png'))

print('done')
