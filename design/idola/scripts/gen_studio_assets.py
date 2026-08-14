"""Generate indoor-studio assets for the YUNA Twinkle stage:
 - 4 seasonal LED-wall backdrops (spring/summer/autumn/winter night skies)
 - a fan silhouette (standing audience member, arms raised) for the close crowd
Run: py gen_studio_assets.py
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter

OUT = r"G:/Unity/Projects/My project/Assets/YUNA/Stage"
random.seed(424242)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def backdrop(name, top, horizon, starTint, motif):
    W, H = 2048, 1024
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        v = y / (H - 1)
        c = lerp(top, horizon, v ** 1.4)
        for x in range(W):
            px[x, y] = c
    d = ImageDraw.Draw(img, "RGBA")
    # broadcast-LED graphic: concentric glowing arcs + a central sky glow (reads as a screen)
    cx, cy = W // 2, int(H * 0.42)
    glowc = tuple(min(255, int(horizon[i] * 1.7 + 60)) for i in range(3))
    for rr in range(260, 900, 130):
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=glowc + (70,), width=10)
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse([cx - 300, cy - 300, cx + 300, cy + 300],
                                 fill=(glowc[0], glowc[1], glowc[2], 120))
    halo = halo.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    # stars
    for _ in range(900):
        x = random.randint(0, W - 1); y = random.randint(0, int(H * 0.8))
        b = random.random(); r = 0.6 + b * 2.0
        inten = int(120 + b * 130)
        col = tuple(min(255, int(starTint[i] * inten / 255)) for i in range(3))
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (255,))
    # bright twinkles
    for _ in range(30):
        x = random.randint(0, W - 1); y = random.randint(0, int(H * 0.6)); L = random.randint(6, 16)
        d.line([x - L, y, x + L, y], fill=(255, 255, 245, 180), width=1)
        d.line([x, y - L, x, y + L], fill=(255, 255, 245, 180), width=1)

    if motif == "spring":  # cherry-blossom branch silhouette + petals
        bc = (30, 12, 24)
        d.line([0, 120, 520, 220], fill=bc, width=10)
        for bx in range(0, 560, 40):
            by = 120 + bx * 0.19
            for _ in range(3):
                px2 = bx + random.randint(-16, 16); py2 = by + random.randint(-24, 8)
                d.ellipse([px2 - 9, py2 - 9, px2 + 9, py2 + 9], fill=(255, 190, 214, 235))
        for _ in range(60):
            x = random.randint(0, W - 1); y = random.randint(0, H - 1)
            d.ellipse([x - 5, y - 7, x + 5, y + 7], fill=(255, 195, 218, 150))
    elif motif == "summer":  # warm fireflies
        for _ in range(120):
            x = random.randint(0, W - 1); y = random.randint(int(H * 0.2), H - 1)
            r = random.uniform(2, 6)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 226, 120, 150))
    elif motif == "autumn":  # falling maple-leaf silhouettes
        for _ in range(70):
            x = random.randint(0, W - 1); y = random.randint(0, H - 1); s = random.uniform(6, 16)
            d.ellipse([x - s, y - s, x + s, y + s], fill=(226, 122, 40, 170))
    elif motif == "winter":  # aurora ribbon + snow
        for k in range(3):
            pts = []
            for x in range(0, W, 40):
                pts.append((x, 200 + k * 40 + int(60 * math.sin(x * 0.006 + k))))
            for i in range(len(pts) - 1):
                d.line([pts[i], pts[i + 1]], fill=(120, 230, 200, 60), width=26)
        for _ in range(140):
            x = random.randint(0, W - 1); y = random.randint(0, H - 1); r = random.uniform(1.5, 4)
            d.ellipse([x - r, y - r, x + r, y + r], fill=(235, 245, 255, 180))

    # soft horizon glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * 0.2, H * 0.72, W * 0.8, H * 1.15], fill=(horizon[0], horizon[1], horizon[2], 90))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    img.save(f"{OUT}/led_{name}.png")
    print("led_" + name + ".png")


def fan():
    # dark silhouette of a standing fan with one arm raised (holding a glowstick)
    W, H = 128, 256
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = (10, 10, 16, 255)
    cx = 64
    d.ellipse([cx - 18, 20, cx + 18, 58], fill=c)          # head
    d.polygon([(cx - 26, 250), (cx - 22, 96), (cx + 22, 96), (cx + 26, 250)], fill=c)  # torso/legs
    d.line([cx - 16, 104, cx - 42, 150], fill=c, width=13)  # left arm down-out
    d.line([cx + 14, 104, cx + 40, 30], fill=c, width=13)   # right arm raised
    d.ellipse([cx + 34, 14, cx + 52, 40], fill=(180, 255, 200, 255))  # glowstick tip
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(f"{OUT}/fan.png")
    print("fan.png")


if __name__ == "__main__":
    # luminous "LED display" palettes — bright THROUGHOUT (top not dark) so the whole screen glows
    backdrop("spring", (92, 54, 124), (205, 120, 172), (255, 235, 245), "spring")
    backdrop("summer", (40, 92, 150), (92, 192, 205), (225, 250, 255), "summer")
    backdrop("autumn", (104, 58, 110), (222, 142, 80), (255, 230, 190), "autumn")
    backdrop("winter", (52, 84, 160), (112, 172, 222), (232, 245, 255), "winter")
    fan()
    print("done ->", OUT)
