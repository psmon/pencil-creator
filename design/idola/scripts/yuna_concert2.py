"""YUNA — two-song desert-festival concert (Case M integration).

Song 1: '05_Ice cream moon.flac' (214.8s, upbeat/dynamic)
  -> transition: brief audience GREETING (wave/react)
Song 2: 'BEAT_Mastered_run.wav' (177.2s, groove finale)

Choreography = the mocap MOTION LIBRARY states (IDLE/DANCE/WAVE/GESTURE/WALK)
sequenced across both songs per member with a phase offset (군무), using the
verified direct-bake retarget (yuna_motionlib.bake_slot).

Camera opens with an AERIAL approach that flies down into the stage, then cuts
broadcast-style through both songs (WIDE/DOLLY/DRONE/PUSHIN/REACT/HERO), a
GREETING react at the song seam, and an outro drone pull-back.

Env = night desert festival (yuna_stageenv.build_desert): sand, dunes, cacti,
lego-car parking, info tent, moonlight.

Modes:
  blender -b --factory-startup -P yuna_concert2.py -- stills   (fast validation)
  blender -b --factory-startup -P yuna_concert2.py -- full     (full render, bg)
"""
import bpy, math, os, sys
sys.path.append(r"C:\Users\psmon\infra\blender")
import yuna_stageenv as env
from yuna_motionlib import import_clip, bake_slot, CLIPS, LIB

BLEND = r"C:\code\psmon\pencil-creator\design\blend\yuna-rig4.blend"
OUT = r"C:\Users\psmon\infra\blender\out\concert2"
FPS = 24
SONG1, SONG2 = 214.8, 177.2
SEAM = SONG1
TOTAL = SONG1 + SONG2                 # 392.0s
MEMBERS = ["y", "u", "n", "a"]
OFFS = {"y": 0, "u": 4, "n": 8, "a": 12}   # frame phase offset for 군무
OVERLAP = 8

MODE = "stills"
for a in sys.argv:
    if a in ("stills", "full", "preview"): MODE = a

def f(t): return max(1, int(round(t * FPS)))

# ---------------- choreography: fill each song with a musical state pattern ----------------
def fill(pattern, t0, t1):
    out = []; t = t0; i = 0
    while t < t1 - 0.5:
        st, dur = pattern[i % len(pattern)]
        dur = min(dur, t1 - t)
        if dur < 1.2: break
        out.append((st, dur)); t += dur; i += 1
    return out

def build_sequence():
    """Return list of (state, dur_sec) spanning both songs with a greeting seam."""
    SONG1_PAT = [("DANCE",6),("DANCE",6),("WAVE",4),("DANCE",7),("GESTURE",5),("DANCE",6)]
    SONG2_PAT = [("DANCE",6),("GESTURE",5),("DANCE",6),("WALK",5),("DANCE",6),("WAVE",4)]
    seq = [("IDLE", 4)]
    seq += fill(SONG1_PAT, 4, SEAM - 7)          # dynamic song 1
    seq += [("WAVE", 7)]                          # greeting to the crowd at the seam (song1 end)
    seq += [("WAVE", 4)]                          # ...continues into song2 open
    seq += fill(SONG2_PAT, SEAM + 4, TOTAL - 5)  # groove finale song 2
    seq += [("WAVE", 5)]                          # final bow/wave
    return seq

def sequence_members(clips):
    seq = build_sequence()
    step = 4 if MODE == "stills" else 2          # stills: sparse keys (fast); full: 12fps keys
    for key in MEMBERS:
        arm = bpy.data.objects.get(f"Rig_{key}")
        if not arm: continue
        if arm.animation_data: arm.animation_data.action = None
        t = 1 + OFFS[key]
        for st, dur in seq:
            bake_slot(arm, clips[st], t, int(dur * FPS), 0, step=step)
            t += int(dur * FPS) - OVERLAP
        print("sequenced", key)

# ---------------- camera: aerial approach -> broadcast cuts -> outro ----------------
def build_segments():
    """(t0,t1, cam0,cam1, tgt0,tgt1, lens0,lens1). Stage center ~ (0,0.4,1.3)."""
    SEG = [
        # AERIAL APPROACH INTO STAGE (0-13s) — high over the desert, fly down & in
        (0.0, 6.0,   (0,-58,46),(0,-40,24),  (0,-10,1),(0,-6,1),   26,28),
        (6.0, 10.0,  (0,-32,15),(0,-20,8),   (0,-2,1.2),(0,0.2,1.3),30,34),
        (10.0,13.0,  (0,-13,5.2),(0,-10,4.0),(0,0.4,1.4),(0,0.4,1.4),36,40),
    ]
    TEMPL = [   # (c0, c1, tgt, lens)
        ("WIDE",  (0,-9.6,3.3),(0,-8.6,3.1),(0,0.4,1.3),40),
        ("DOLLY", (7,-9,3.2),(-4,-9,2.9),(0,0.4,1.3),42),
        ("DRONE", (9,-19,12),(-8,-20,12),(0,-2,1.0),30),
        ("PUSHIN",(0,-6.6,1.6),(0,-5.6,1.5),(0,0.35,1.4),50),   # medium group (not between members)
        ("REACT", (1.8,-2,3.0),(-1.5,-2.1,3.0),(0,-9,0.6),30),
        ("HERO",  (0,-6,1.0),(0,-5.2,1.1),(0,0.8,1.9),40),
    ]
    def cyc(t0, t1, chunk, start_i):
        segs = []; t = t0; i = start_i
        while t < t1 - 0.5:
            d = min(chunk, t1 - t)
            if d < 2.0: break
            nm, c0, c1, g, lens = TEMPL[i % len(TEMPL)]
            if i % 2:  # mirror some shots for variety
                c0 = (-c0[0], c0[1], c0[2]); c1 = (-c1[0], c1[1], c1[2])
            segs.append((t, t + d, c0, c1, g, g, lens, lens)); t += d; i += 1
        return segs, i
    s1, i = cyc(13.0, SEAM - 8, 7.0, 0)
    SEG += s1
    # GREETING at the seam (song1 end -> song2 open): react to the crowd + wave close-up
    SEG += [
        (SEAM-8, SEAM-3, (2.2,-2.2,3.1),(-2.2,-2.2,3.1),(0,-9,0.7),(0,-9,0.7), 28,28),  # crowd react
        (SEAM-3, SEAM+3, (0,-4.4,1.7),(0,-4.0,1.6),(0,-0.2,1.5),(0,-0.2,1.5), 58,64),   # wave close-up
        (SEAM+3, SEAM+7, (-2.2,-2.2,3.1),(2.2,-2.2,3.1),(0,-9,0.7),(0,-9,0.7), 28,28),  # crowd react back
    ]
    s2, _ = cyc(SEAM+7, TOTAL - 7, 7.0, 3)
    SEG += s2
    # OUTRO drone pull back up to aerial
    SEG += [(TOTAL-7, TOTAL, (0,-16,8),(0,-52,40),(0,-2,1.2),(0,-8,1.0), 32,26)]
    return SEG

def setup_camera_direction():
    sc = bpy.context.scene
    cam = sc.camera
    if cam is None:
        bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
    for c in list(cam.constraints): cam.constraints.remove(c)
    tgt = bpy.data.objects.get("CamTarget") or bpy.data.objects.new("CamTarget", None)
    if tgt.name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(tgt)
    con = cam.constraints.new('TRACK_TO')
    con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    cam.rotation_euler = (0, 0, 0)
    for (t0, t1, c0, c1, g0, g1, l0, l1) in build_segments():
        for (tt, cp, gp, lens) in ((t0, c0, g0, l0), (t1, c1, g1, l1)):
            fr = f(tt) - (1 if tt == t1 else 0)
            cam.location = cp; cam.keyframe_insert("location", frame=fr)
            tgt.location = gp; tgt.keyframe_insert("location", frame=fr)
            cam.data.lens = lens; cam.data.keyframe_insert("lens", frame=fr)
    return cam

# ---------------- crowd + skirt life ----------------
def animate_audience():
    aud = [o for o in bpy.data.objects if o.name.startswith("Aud_")]
    beats = int(TOTAL / 0.7)                      # ~86bpm-ish generic bob
    for i, o in enumerate(aud):
        bz = o.location.z; ph = (i * 0.7) % (2*math.pi)
        o.rotation_mode = 'XYZ'; brz = o.rotation_euler.z
        for b in range(0, beats, 2):              # key every 2 beats (light)
            t = b * 0.7; fr = f(t)
            o.location.z = bz + 0.045*(0.5+0.5*math.sin(math.pi*b + ph))
            o.keyframe_insert("location", frame=fr, index=2)
            o.rotation_euler.z = brz + math.radians(4)*math.sin(0.5*math.pi*b + ph)
            o.keyframe_insert("rotation_euler", frame=fr, index=2)

def add_skirt_flutter():
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.name.startswith("G_Chima"):
            if any(m.type == 'WAVE' for m in ob.modifiers): continue
            w = ob.modifiers.new("Flutter", 'WAVE')
            w.use_normal = True; w.height = 0.012; w.width = 0.5
            w.narrowness = 2.0; w.speed = 0.4
            if "hem" in [g.name for g in ob.vertex_groups]: w.vertex_group = "hem"

# ---------------- main ----------------
def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    sc = bpy.context.scene; sc.render.fps = FPS
    # 1) desert festival surroundings
    env.build_desert()
    # 2) import mocap clips once, sequence both songs onto all members
    clips = {st: import_clip(os.path.join(LIB, fn)) for st, fn in CLIPS.items()}
    sequence_members(clips)
    # 3) life: crowd bob + skirt flutter
    add_skirt_flutter()
    animate_audience()
    # 4) camera direction
    setup_camera_direction()
    os.makedirs(OUT, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = (12 if MODE == "stills" else 8)
    except Exception: pass
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "concert2.blend"))
    if MODE == "stills":
        sc.render.resolution_x = 1000; sc.render.resolution_y = 560
        for t in (2.5, 8.0, 12.0, 40.0, 95.0, 150.0, 210.0, 214.8, 250.0, 320.0, 388.0):
            sc.frame_set(f(t))
            sc.render.filepath = os.path.join(OUT, "s_%05.1f.png" % t)
            bpy.ops.render.render(write_still=True)
        print("CONCERT2_STILLS_DONE")
    else:
        sc.frame_start = 1; sc.frame_end = f(TOTAL)
        sc.render.resolution_x = 960; sc.render.resolution_y = 540
        sc.render.filepath = os.path.join(OUT, "c_")
        bpy.ops.render.render(animation=True)
        print("CONCERT2_FULL_DONE frames %d" % sc.frame_end)

main()
