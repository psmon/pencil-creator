"""Pre-distort face textures for planar->sphere projection.

Planar projection compresses texture near the sphere's silhouette. Compensate by
radially remapping: out(r) samples src at asin(r)/(pi/2) (blended), pushing
features outward so they look undistorted ON the sphere. Then fade the outer rim
to the border skin tone so EXTEND smears cleanly.
"""
from PIL import Image
import math, os

# per-member best source: y/a regenerated (v3), u/n good (v2)
SRC_MAP = {
    "y": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-headtex3-y.png",
    "u": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-headtex2-u.png",
    "n": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-headtex2-n.png",
    "a": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-headtex3-a.png",
}
DST_DIR = r"C:\code\psmon\pencil-creator\design\idola\facetex"
BLEND = 0.6          # spherize strength
FADE_R = 9.0         # fade OFF

os.makedirs(DST_DIR, exist_ok=True)
for k in ("y", "u", "n", "a"):
    im = Image.open(SRC_MAP[k]).convert("RGB")
    im = im.resize((768, 768), Image.LANCZOS)
    W = H = 768
    src = im.load()
    out = Image.new("RGB", (W, H))
    dst = out.load()
    cx = cy = (W - 1) / 2.0
    R = W / 2.0
    # border mean skin tone
    tot = [0, 0, 0]; n = 0
    for i in range(0, W, 8):
        for px in (src[i, 2], src[i, H - 3], src[2, i], src[W - 3, i]):
            tot[0] += px[0]; tot[1] += px[1]; tot[2] += px[2]; n += 1
    skin = (tot[0] // n, tot[1] // n, tot[2] // n)
    for y in range(H):
        ny = (y - cy) / R
        for x in range(W):
            nx = (x - cx) / R
            r = math.hypot(nx, ny)
            if r < 1e-6:
                dst[x, y] = src[x, y]; continue
            rc = min(r, 0.999)
            rs = math.asin(rc) / (math.pi / 2)
            rb = rc + (rs - rc) * BLEND        # blended spherize radius
            sx = cx + (nx / r) * rb * R
            sy = cy + (ny / r) * rb * R
            sxi = min(W - 1, max(0, int(sx))); syi = min(H - 1, max(0, int(sy)))
            px = src[sxi, syi]
            if r > FADE_R:                     # rim fade to plain skin
                t = min(1.0, (r - FADE_R) / (1.0 - FADE_R))
                px = (int(px[0] + (skin[0] - px[0]) * t),
                      int(px[1] + (skin[1] - px[1]) * t),
                      int(px[2] + (skin[2] - px[2]) * t))
            dst[x, y] = px
    out.save(os.path.join(DST_DIR, f"{k}.png"))
    print(k, "done", skin)
