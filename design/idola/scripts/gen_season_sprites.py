"""Generate seasonal particle sprites for the YUNA Twinkle stage: petal, leaf, snowflake.
(Summer motes reuse star_sprite.png.) Run: py gen_season_sprites.py
"""
import math
from PIL import Image, ImageDraw, ImageFilter

OUT = r"G:/Unity/Projects/My project/Assets/YUNA/Stage"


def petal():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # cherry-blossom petal: rounded teardrop with a small notch
    d.ellipse([34, 20, 94, 104], fill=(255, 190, 214, 255))
    d.ellipse([44, 12, 84, 62], fill=(255, 205, 224, 255))
    # notch at bottom
    d.polygon([(64, 108), (54, 92), (74, 92)], fill=(0, 0, 0, 0))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    img.save(f"{OUT}/petal.png")
    print("petal.png")


def leaf():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # simple maple-ish leaf via overlapping lobes, autumn amber/orange
    col = (226, 122, 40, 255)
    cx, cy = 64, 66
    for ang in (-60, -20, 20, 60, 90, 130, 230):
        r = 40
        x = cx + r * math.cos(math.radians(ang - 90))
        y = cy + r * math.sin(math.radians(ang - 90))
        d.ellipse([x - 20, y - 20, x + 20, y + 20], fill=col)
    d.ellipse([cx - 22, cy - 20, cx + 22, cy + 26], fill=col)
    # stem
    d.line([cx, cy + 20, cx, cy + 46], fill=(150, 80, 30, 255), width=4)
    img = img.filter(ImageFilter.GaussianBlur(0.8))
    img.save(f"{OUT}/leaf.png")
    print("leaf.png")


def snow():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = 64
    c = (235, 245, 255, 255)
    for k in range(6):
        a = math.radians(k * 60)
        x2 = cx + 44 * math.cos(a)
        y2 = cy + 44 * math.sin(a)
        d.line([cx, cy, x2, y2], fill=c, width=4)
        # branchlets
        for t in (0.5, 0.75):
            bx = cx + 44 * t * math.cos(a)
            by = cy + 44 * t * math.sin(a)
            for da in (-40, 40):
                d.line([bx, by, bx + 14 * math.cos(a + math.radians(da)), by + 14 * math.sin(a + math.radians(da))], fill=c, width=3)
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=c)
    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(f"{OUT}/snow.png")
    print("snow.png")


if __name__ == "__main__":
    petal(); leaf(); snow()
    print("done ->", OUT)
