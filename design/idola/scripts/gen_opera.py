"""Opera-house / concert-hall interior panorama for the studio surround dome.
Warm ornate hall: tiered arched balcony bays, red+gold, domed ceiling glow, chandeliers.
Tiles horizontally so it wraps on the dome. Run: py gen_opera.py
"""
import math
from PIL import Image, ImageDraw, ImageFilter

OUT = r"G:/Unity/Projects/My project/Assets/YUNA/Stage/opera.png"
W, H = 4096, 2048


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new("RGB", (W, H))
px = img.load()
ceil = (86, 40, 30)       # warm dome ceiling
wall = (58, 22, 22)       # deep red walls
low = (16, 8, 10)         # dark lower
for y in range(H):
    v = y / (H - 1)
    if v < 0.34:
        c = lerp((120, 66, 44), ceil, v / 0.34)      # bright domed ceiling glow at very top
    elif v < 0.72:
        c = lerp(ceil, wall, (v - 0.34) / 0.38)
    else:
        c = lerp(wall, low, (v - 0.72) / 0.28)
    for x in range(W):
        px[x, y] = c

d = ImageDraw.Draw(img, "RGBA")
gold = (208, 168, 92)
warm = (255, 206, 120)

# central domed ceiling glow + chandelier
for cx in range(W // 4, W, W // 2):
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse([cx - 260, -120, cx + 260, 340], fill=(255, 214, 150, 120))
    halo = halo.filter(ImageFilter.GaussianBlur(70))
    img = Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    # chandelier
    d.line([cx, 150, cx, 320], fill=gold + (255,), width=6)
    for k in range(10):
        a = k / 10 * math.pi * 2
        d.ellipse([cx + math.cos(a) * 90 - 9, 320 + math.sin(a) * 40 - 9,
                   cx + math.cos(a) * 90 + 9, 320 + math.sin(a) * 40 + 9], fill=warm + (255,))

# tiered arched balcony bays (2 tiers), repeating horizontally -> wraps
bay = W // 12
for tier, (y0, y1) in enumerate([(560, 900), (980, 1360)]):
    for bx in range(0, W, bay):
        cx = bx + bay // 2
        # gold-trimmed arch opening (dark box interior with warm rail)
        d.rounded_rectangle([bx + 26, y0, bx + bay - 26, y1], radius=90, fill=(24, 12, 14, 255), outline=gold + (255,), width=8)
        # warm box interior glow + tiny figures (audience in boxes)
        d.rectangle([bx + 46, y1 - 90, bx + bay - 46, y1 - 20], fill=(70, 34, 30, 255))
        for f in range(5):
            fx = bx + 70 + f * (bay - 150) / 4
            d.ellipse([fx - 7, y1 - 96, fx + 7, y1 - 74], fill=(20, 12, 14, 255))
        # warm sconce lights flanking each bay
        d.ellipse([bx + 6, (y0 + y1) // 2 - 8, bx + 22, (y0 + y1) // 2 + 8], fill=warm + (240,))
        d.ellipse([bx + bay - 22, (y0 + y1) // 2 - 8, bx + bay - 6, (y0 + y1) // 2 + 8], fill=warm + (240,))

# gold cornice lines between tiers
for yy in (540, 940, 1380):
    d.rectangle([0, yy, W, yy + 10], fill=gold + (255,))

# proscenium-ish warm floor glow at bottom
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).rectangle([0, H - 220, W, H], fill=(120, 50, 40, 120))
glow = glow.filter(ImageFilter.GaussianBlur(50))
img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")

img = img.filter(ImageFilter.GaussianBlur(0.6))
img.save(OUT)
print("opera.png", img.size, "->", OUT)
