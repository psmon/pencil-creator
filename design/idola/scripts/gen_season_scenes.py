"""Distinct seasonal LED-wall SCENES for the studio backdrop (not all night):
 - spring : blooming nature, daytime, cherry blossoms (romance)
 - summer : beach / seaside, bright daytime
 - autumn : falling leaves, warm daytime dusk
 - winter : Christmas night (the ONLY night scene) — snow, tree lights, moon, stars
Run: py gen_season_scenes.py
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter

OUT = r"G:/Unity/Projects/My project/Assets/YUNA/Stage"
W, H = 2048, 1024
random.seed(20260814)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def grad(top, bot, p=1.0):
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        c = lerp(top, bot, (y / (H - 1)) ** p)
        for x in range(W):
            px[x, y] = c
    return img


def sun(img, cx, cy, r, col):
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(halo)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col + (255,))
    d.ellipse([cx - r * 2.4, cy - r * 2.4, cx + r * 2.4, cy + r * 2.4], fill=col + (70,))
    halo = halo.filter(ImageFilter.GaussianBlur(40))
    return Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")


def spring():
    img = grad((120, 196, 240), (222, 244, 250), 1.3)   # blue day sky
    img = sun(img, int(W * 0.74), int(H * 0.26), 70, (255, 244, 205))
    d = ImageDraw.Draw(img, "RGBA")
    # rolling green hills
    d.polygon([(0, H), (0, 720), (500, 690), (1100, 760), (1600, 700), (W, 760), (W, H)], fill=(126, 190, 96))
    d.polygon([(0, H), (0, 820), (700, 800), (1400, 850), (W, 810), (W, H)], fill=(96, 168, 82))
    # cherry-blossom trees (trunk + pink canopy)
    for tx, ty, s in [(300, 700, 1.3), (1500, 720, 1.1), (900, 740, 0.9)]:
        d.line([tx, ty, tx, ty - int(150 * s)], fill=(90, 60, 45), width=int(16 * s))
        for _ in range(90):
            a = random.random() * 6.28; rr = random.random() * 120 * s
            bx = tx + math.cos(a) * rr; by = (ty - 150 * s) + math.sin(a) * rr * 0.8
            c = random.choice([(255, 190, 214), (255, 205, 224), (255, 225, 236)])
            d.ellipse([bx - 8, by - 8, bx + 8, by + 8], fill=c + (255,))
    # falling petals
    for _ in range(90):
        x = random.randint(0, W); y = random.randint(0, H)
        d.ellipse([x - 5, y - 7, x + 5, y + 7], fill=(255, 195, 220, 180))
    img.filter(ImageFilter.GaussianBlur(0.6)).save(f"{OUT}/led_spring.png"); print("spring")


def summer():
    img = grad((92, 196, 232), (206, 244, 252), 1.2)   # bright beach sky
    img = sun(img, int(W * 0.5), int(H * 0.22), 66, (255, 250, 220))
    d = ImageDraw.Draw(img, "RGBA")
    # ocean
    horizon = int(H * 0.52)
    d.rectangle([0, horizon, W, int(H * 0.86)], fill=(40, 150, 210))
    for y in range(horizon, int(H * 0.86), 6):
        t = (y - horizon) / (H * 0.86 - horizon)
        c = lerp((70, 178, 224), (28, 120, 186), t)
        d.line([0, y, W, y], fill=c + (255,))
    # sun glitter on water
    for _ in range(220):
        x = random.randint(0, W); y = random.randint(horizon, int(H * 0.85))
        d.ellipse([x - 3, y - 1, x + 3, y + 1], fill=(255, 255, 245, random.randint(80, 200)))
    # sandy beach
    d.rectangle([0, int(H * 0.86), W, H], fill=(238, 220, 170))
    # palm silhouettes
    for px_ in (170, 1880):
        d.line([px_, int(H * 0.86), px_ - 20, int(H * 0.45)], fill=(60, 50, 40), width=14)
        for a in (-50, -20, 20, 50, 90):
            ex = px_ - 20 + math.cos(math.radians(a - 90)) * 150
            ey = int(H * 0.45) + math.sin(math.radians(a - 90)) * 90
            d.line([px_ - 20, int(H * 0.45), ex, ey], fill=(46, 92, 52), width=10)
    img.filter(ImageFilter.GaussianBlur(0.6)).save(f"{OUT}/led_summer.png"); print("summer")


def autumn():
    img = grad((244, 176, 96), (252, 226, 176), 1.2)   # warm dusk sky
    img = sun(img, int(W * 0.28), int(H * 0.30), 64, (255, 226, 150))
    d = ImageDraw.Draw(img, "RGBA")
    # autumn treeline
    d.polygon([(0, H), (0, 760), (W, 760), (W, H)], fill=(120, 74, 40))
    for tx in range(80, W, 150):
        th = random.randint(150, 240)
        col = random.choice([(214, 108, 40), (196, 72, 40), (226, 150, 52)])
        d.ellipse([tx - 90, 700 - th, tx + 90, 760 - th + 120], fill=col + (255,))
    # falling leaves
    for _ in range(120):
        x = random.randint(0, W); y = random.randint(0, H); s = random.uniform(7, 16)
        c = random.choice([(214, 108, 40), (226, 150, 52), (196, 72, 40)])
        d.ellipse([x - s, y - s * 0.7, x + s, y + s * 0.7], fill=c + (200,))
    img.filter(ImageFilter.GaussianBlur(0.6)).save(f"{OUT}/led_autumn.png"); print("autumn")


def winter():
    img = grad((8, 14, 44), (24, 40, 78), 1.4)   # night — the ONLY night scene
    d = ImageDraw.Draw(img, "RGBA")
    # stars
    for _ in range(700):
        x = random.randint(0, W); y = random.randint(0, int(H * 0.7)); b = random.random()
        r = 0.6 + b * 1.8
        d.ellipse([x - r, y - r, x + r, y + r], fill=(230, 240, 255, int(120 + b * 130)))
    # moon (small, on-screen only)
    mx, my = int(W * 0.78), int(H * 0.24)
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse([mx - 130, my - 130, mx + 130, my + 130], fill=(230, 236, 250, 120))
    halo = halo.filter(ImageFilter.GaussianBlur(50))
    img = Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([mx - 62, my - 62, mx + 62, my + 62], fill=(236, 240, 250, 255))
    # snowy ground — soft blue-grey gradient (not a harsh white bar), lower on the image
    for y in range(864, H):
        t = (y - 864) / (H - 864)
        c = lerp((70, 92, 140), (150, 172, 206), t)
        d.line([0, y, W, y], fill=c + (255,))
    # Christmas trees with colored lights
    for tx, s in [(360, 1.2), (1580, 1.0), (980, 0.85)]:
        base = 872; th = int(230 * s); w = int(120 * s)
        d.polygon([(tx, base - th), (tx - w, base), (tx + w, base)], fill=(28, 74, 48))
        d.polygon([(tx, base - th - 40 * s), (tx - w * 0.7, base - th * 0.4), (tx + w * 0.7, base - th * 0.4)], fill=(34, 88, 56))
        for _ in range(int(40 * s)):
            lx = tx + random.randint(-w, w); ly = base - random.randint(0, th)
            if abs(lx - tx) < (base - ly) / th * w:
                c = random.choice([(255, 90, 90), (255, 210, 90), (110, 200, 255), (140, 255, 150)])
                d.ellipse([lx - 4, ly - 4, lx + 4, ly + 4], fill=c + (255,))
        d.ellipse([tx - 10, base - th - 60 * s, tx + 10, base - th - 40 * s], fill=(255, 230, 120, 255))  # star topper
    # falling snow
    for _ in range(180):
        x = random.randint(0, W); y = random.randint(0, H); r = random.uniform(2, 5)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(240, 248, 255, 210))
    # warm string-light glow across top
    for x in range(60, W, 90):
        c = random.choice([(255, 180, 90), (255, 120, 120), (150, 220, 255)])
        d.ellipse([x - 7, 60, x + 7, 74], fill=c + (230,))
    img.filter(ImageFilter.GaussianBlur(0.5)).save(f"{OUT}/led_winter.png"); print("winter")


if __name__ == "__main__":
    spring(); summer(); autumn(); winter()
    print("done ->", OUT)
