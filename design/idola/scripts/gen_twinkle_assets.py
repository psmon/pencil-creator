"""Generate starry-night 'Twinkle' stage textures for the YUNA Unity performance.
Outputs: night-sky gradient dome (with baked starfield), soft star sprite, shooting-star streak.
Run with: py gen_twinkle_assets.py
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter

OUT = r"G:/Unity/Projects/My project/Assets/YUNA/Stage"
random.seed(20260814)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky():
    W, H = 2048, 1024
    img = Image.new("RGB", (W, H))
    px = img.load()
    top = (8, 8, 34)        # deep indigo (zenith)
    mid = (26, 22, 74)      # royal night
    hor = (58, 44, 104)     # horizon glow (violet)
    glow = (120, 78, 150)   # faint pink glow band near horizon
    for y in range(H):
        v = y / (H - 1)
        if v < 0.62:
            c = lerp(top, mid, v / 0.62)
        else:
            t = (v - 0.62) / 0.38
            c = lerp(mid, hor, t)
            # subtle warm horizon bloom
            g = math.sin(min(1.0, t) * math.pi) * 0.35
            c = tuple(min(255, int(c[i] + (glow[i] - c[i]) * g * 0.5)) for i in range(3))
        for x in range(W):
            px[x, y] = c
    # baked starfield — the upper 70% of the dome
    d = ImageDraw.Draw(img)
    for _ in range(1400):
        x = random.randint(0, W - 1)
        y = random.randint(0, int(H * 0.72))
        b = random.random()
        r = 0.6 + b * 1.8
        # warmer/cooler star tints
        tint = random.choice([(255, 255, 255), (255, 246, 220), (214, 226, 255), (255, 230, 245)])
        inten = int(120 + b * 135)
        col = tuple(min(255, int(tint[i] * inten / 255)) for i in range(3))
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)
    # a handful of bright twinkle stars with cross flares
    for _ in range(40):
        x = random.randint(0, W - 1)
        y = random.randint(0, int(H * 0.6))
        L = random.randint(6, 14)
        c = (255, 255, 245)
        d.line([x - L, y, x + L, y], fill=c, width=1)
        d.line([x, y - L, x, y + L], fill=c, width=1)
        d.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=c)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(f"{OUT}/sky_twinkle.png")
    print("sky_twinkle.png", img.size)


def star_sprite():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    px = img.load()
    cx = cy = S / 2
    for y in range(S):
        for x in range(S):
            d = math.hypot(x - cx, y - cy) / (S / 2)
            a = max(0.0, 1.0 - d)
            a = a ** 2.2
            px[x, y] = (255, 252, 235, int(a * 255))
    # 4-point sparkle flare
    dr = ImageDraw.Draw(img)
    for w, al in [(3, 90), (1, 200)]:
        dr.line([cx, 8, cx, S - 8], fill=(255, 255, 245, al), width=w)
        dr.line([8, cy, S - 8, cy], fill=(255, 255, 245, al), width=w)
    img = img.filter(ImageFilter.GaussianBlur(1.0))
    img.save(f"{OUT}/star_sprite.png")
    print("star_sprite.png", img.size)


def shooting_star():
    W, H = 256, 96
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    hx, hy = W - 30, H // 2
    # tail: bright head on the right, fading to the left
    for i in range(W - 40):
        x = (W - 30) - i
        t = i / (W - 40)
        a = int(255 * (1.0 - t) ** 1.8)
        wdt = max(1, int((1.0 - t) * 5))
        y = hy + int(i * 0.12)  # slight downward slope
        dr.line([x, y, x - 2, y], fill=(255, 250, 230, a), width=wdt)
    # glowing head
    for r, a in [(11, 70), (7, 140), (3.5, 255)]:
        dr.ellipse([hx - r, hy - r, hx + r, hy + r], fill=(255, 255, 245, a))
    img = img.filter(ImageFilter.GaussianBlur(0.8))
    img.save(f"{OUT}/shooting_star.png")
    print("shooting_star.png", img.size)


if __name__ == "__main__":
    sky()
    star_sprite()
    shooting_star()
    print("done ->", OUT)
