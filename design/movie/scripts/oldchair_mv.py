"""'낡은 의자' music video — 10s concept clips -> 5:18 Ken Burns slideshow.

Uses ONLY the two concept videos' extracted stills. Fills the 318s naturally with:
  slow Ken Burns (zoompan, varied move each revisit) + long crossfades (xfade)
  + a mood grade arc (warm memory -> cool loss/rain -> golden dusk peace)
  + subtle film grain + vignette.
Timeline follows the song's energy arc (memory -> loss -> longing -> return ->
succession -> dusk climax -> peaceful outro).

Run:  python oldchair_mv.py sample   (3-segment quick check)
      python oldchair_mv.py full     (whole MV + audio)
"""
import subprocess, os, sys

FF = r"C:\Users\psmon\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
STILLS = r"C:\Users\psmon\infra\video\oldchair\stills"
WORK = r"C:\Users\psmon\infra\video\oldchair\seg"
MUSIC = r"C:\code\psmon\pencil-creator\music\낡은 의자0809.flac"
OUTDIR = r"C:\code\psmon\pencil-creator\design\movie\output"
OUT = os.path.join(OUTDIR, "낡은의자-mv.mp4")
FPS = 24
W, H = 1280, 720
XF = 2.2                          # crossfade seconds

S = {  # scene -> still file
    "memory":   "v1_1.png",       # grandpa + kids, sunny (warmth)
    "chair_a":  "v1_2.2.png",     # empty rocking chair, rain (loss)
    "rail":     "v1_4.png",       # empty railing, rainy cabin (loss)
    "man_post": "v1_7.png",       # man clutching post, looking out (longing)
    "chair_cu": "v1_9.5.png",     # empty chair close-up, rain ripple (loss)
    "approach": "v2_2.png",       # man approaching the chair (return)
    "touch":    "v2_7.png",       # man's hand on the chair (return)
    "sit_cat":  "v2_5.png",       # man sitting + ginger cat, hills (succession)
    "dusk":     "v2_9.2.png",     # man's face, dusk, teardrop (acceptance climax)
}

# (z0, z1, panx, pany) — panx/pany in input px on the 2x-scaled frame
MOVES = {
    "in":  (1.06, 1.30, 0, 0), "out": (1.30, 1.06, 0, 0),
    "inL": (1.08, 1.28, -240, 0), "inR": (1.08, 1.28, 240, 0),
    "inD": (1.08, 1.28, 0, 170), "inU": (1.08, 1.28, 0, -170),
}
GRADES = {
    "warm":   "eq=saturation=1.08:contrast=1.03:brightness=0.01,colorbalance=rs=0.06:gs=0.02:bs=-0.06:rm=0.04:bm=-0.04",
    "cool":   "eq=saturation=0.82:contrast=1.02,colorbalance=rs=-0.04:bs=0.07:rm=-0.03:bm=0.05",
    "neutral":"eq=saturation=0.95:contrast=1.02",
    "golden": "eq=saturation=1.10:contrast=1.04:brightness=0.02,colorbalance=rs=0.09:gs=0.03:bs=-0.07:rm=0.05",
    "faded":  "eq=saturation=0.70:contrast=0.96:brightness=0.03,colorbalance=rs=0.05:bs=-0.03",
}

# emotional-arc timeline aligned to the song energy (scene, move, grade, dur_sec)
TIMELINE = [
    ("memory",  "in",  "warm",   24),   # 0    intro warmth
    ("memory",  "inR", "warm",   20),   # ~22  linger on the memory
    ("chair_a", "in",  "neutral",20),   # ~40  loss enters
    ("rail",    "inL", "cool",   20),   # ~58
    ("man_post","in",  "cool",   24),   # ~76  longing (build)
    ("chair_cu","in",  "cool",   20),   # ~98
    ("man_post","inR", "cool",   22),   # ~116
    ("memory",  "out", "faded",  24),   # ~136 chorus peak: memory flashback (bittersweet)
    ("chair_a", "inD", "cool",   20),   # ~158
    ("chair_cu","in",  "cool",   22),   # ~176 bridge dip: emptiest, most melancholic
    ("approach","in",  "neutral",20),   # ~196 return begins (big build)
    ("touch",   "in",  "neutral",20),   # ~214
    ("sit_cat", "in",  "warm",   24),   # ~232 succession (takes grandpa's place)
    ("sit_cat", "out", "warm",   22),   # ~254 wide reveal
    ("dusk",    "in",  "golden", 24),   # ~274 CLIMAX: acceptance
    ("sit_cat", "out", "golden", 28),   # ~296 peaceful outro (slow pull, fade)
]

def run(cmd):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if r.returncode != 0:
        sys.stdout.write(r.stdout.decode("utf-8", "ignore")[-1500:])
        raise SystemExit("ffmpeg failed: %s" % cmd[-1])

def render_segment(idx, scene, move, grade, dur, path):
    N = int(round(dur * FPS))
    z0, z1, px, py = MOVES[move]
    den = max(1, N - 1)
    z = "%.4f+%.4f*on/%d" % (z0, z1 - z0, den)
    x = "iw/2-(iw/zoom/2)+(%d)*on/%d" % (px, den)
    y = "ih/2-(ih/zoom/2)+(%d)*on/%d" % (py, den)
    # single still in -> zoompan d=N emits exactly N frames (NO -loop, or it explodes:
    # looped input feeds N frames and zoompan makes N per frame = N*N runaway).
    vf = (
        "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        "zoompan=z='%s':x='%s':y='%s':d=%d:s=%dx%d:fps=%d,"
        "%s,noise=alls=7:allf=t,vignette=PI/4.2,format=yuv420p"
        % (z, x, y, N, W, H, FPS, GRADES[grade])
    )
    still = os.path.join(STILLS, S[scene])
    run([FF, "-y", "-i", still, "-vf", vf, "-frames:v", str(N), "-r", str(FPS),
         "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", path])
    return dur

def assemble(seg_files, durs, silent_out):
    """xfade-chain all segments into one silent master."""
    inputs = []
    for f in seg_files: inputs += ["-i", f]
    fc = []; prev = "[0:v]"; off = 0.0
    for i in range(1, len(seg_files)):
        off = sum(durs[:i]) - XF * i
        out = "[x%d]" % i
        fc.append("%s[%d:v]xfade=transition=fade:duration=%.3f:offset=%.3f%s"
                  % (prev, i, XF, off, out))
        prev = out
    total = sum(durs) - XF * (len(seg_files) - 1)
    # fade in from black (1s) + fade out to black (3s at the very end)
    fc.append("%sfade=t=in:st=0:d=1.0,fade=t=out:st=%.2f:d=3.0[vout]" % (prev, total - 3.0))
    run([FF, "-y"] + inputs + ["-filter_complex", ";".join(fc), "-map", "[vout]",
         "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", silent_out])
    return total

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "sample"
    os.makedirs(WORK, exist_ok=True); os.makedirs(OUTDIR, exist_ok=True)
    tl = TIMELINE[:3] if mode == "sample" else TIMELINE
    seg_files, durs = [], []
    for i, (scene, move, grade, dur) in enumerate(tl):
        p = os.path.join(WORK, "seg_%02d.mp4" % i)
        render_segment(i, scene, move, grade, dur, p)
        seg_files.append(p); durs.append(dur)
        print("segment %02d %s/%s/%s %ds" % (i, scene, move, grade, dur))
    silent = os.path.join(WORK, "master_silent.mp4")
    total = assemble(seg_files, durs, silent)
    print("assembled %.1fs" % total)
    if mode == "sample":
        print("OLDCHAIR_SAMPLE_DONE %s" % silent); return
    # mux audio with gentle fade-out
    run([FF, "-y", "-i", silent, "-i", MUSIC,
         "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-af", "afade=t=out:st=%.2f:d=4.0" % (total - 4.0),
         "-c:a", "aac", "-b:a", "192k", "-shortest", OUT])
    print("OLDCHAIR_FULL_DONE %s" % OUT)

main()
