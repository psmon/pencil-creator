"""YUNA — two-song desert-festival concert v3 (Case M integration).

Song 1: '05_Ice cream moon.flac' (214.8s, upbeat/dynamic)
  -> transition: brief audience GREETING (wave/react)
Song 2: 'BEAT_Mastered_run.wav' (177.2s, groove finale)

v3 choreography = HYBRID:
  - UPPER BODY: mocap MOTION LIBRARY states (DANCE/WAVE/GESTURE) via bake_slot,
    arms-only amplitude gain + fcurve smoothing (no zombie neck, no tremble).
  - LOWER BODY: dance3 foot-lock IK (planted feet, natural knee flex).
  - ROOT: formation schedule (spotlight rotation 대형) + beat groove sway/bounce.
LED wall = animated scrolling equalizer graphic (1-pass, no jumbotron render).
Camera = active (orbit/crane/dolly/profile) + over-the-shoulder crowd->stage shots.

Modes:
  blender -b --factory-startup -P yuna_concert2.py -- stills   (fast validation)
  blender -b --factory-startup -P yuna_concert2.py -- full     (full render, bg)
"""
import bpy, math, os, sys
sys.path.append(r"C:\Users\psmon\infra\blender")
import yuna_stageenv as env
from yuna_motionlib import import_clip, bake_slot, smooth_arm_fcurves, CLIPS, LIB

BLEND = r"C:\code\psmon\pencil-creator\design\blend\yuna-rig4.blend"
OUT = r"C:\Users\psmon\infra\blender\out\concert2"
FPS = 24
SONG1, SONG2 = 214.8, 177.2
SEAM = SONG1
TOTAL = SONG1 + SONG2                 # 392.0s
MEMBERS = ["y", "u", "n", "a"]
OFFS = {"y": 0, "u": 6, "n": 12, "a": 18}   # phase offset -> canon 군무
GAIN = 1.2                                   # arm amplitude gain (tamed: less tremble)
OVERLAP = 8

# --- formation + IK + groove (ported/adapted from yuna_dance3) ---
ANKLE, STANCE_W, LIFT = 0.09, 0.058, 0.10
BEAT0, BEATP = 0.5, 0.70                      # generic groove beat for both songs
BASE = {"y": (-1.45, 0.0), "u": (-0.48, 0.0), "n": (0.48, 0.0), "a": (1.45, 0.0)}
LEAD_POS = (0.0, -0.85)
BACK_SLOTS = [(-1.15, 0.62), (0.42, 0.95), (1.15, 0.62)]
# spotlight windows across BOTH songs (member steps to LEAD_POS)
SPOTS = [("y", 30.0, 42.0), ("u", 70.0, 82.0), ("n", 250.0, 262.0), ("a", 300.0, 312.0)]
FINALE = (360.0, 380.0)
LEG_SKIP = {"thigh.L", "shin.L", "foot.L", "thigh.R", "shin.R", "foot.R"}
ARM_BONES = ["upperarm.L", "forearm.L", "hand.L", "upperarm.R", "forearm.R", "hand.R"]

MODE = "stills"
for a in sys.argv:
    if a in ("stills", "full", "preview"): MODE = a

def f(t): return max(1, int(round(t * FPS)))
def smoothstep(u):
    u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)

# ---------------- formation schedule ----------------
def build_schedule(key):
    wp = [(0.0, BASE[key])]
    for (mk, a, b) in SPOTS:
        if mk == key:
            tgt = LEAD_POS
        else:
            others = [k for k in MEMBERS if k != mk]
            tgt = BACK_SLOTS[others.index(key)]
        wp += [(a - 4.6, BASE[key]), (a - 0.2, tgt), (b + 0.2, tgt), (b + 4.6, BASE[key])]
    tight = (BASE[key][0] * 0.62, -0.30)
    wp += [(FINALE[0] - 4.2, BASE[key]), (FINALE[0], tight), (FINALE[1], tight), (FINALE[1] + 4.2, BASE[key])]
    wp.sort(key=lambda w: w[0]); return wp

def sample_pos(wp, t):
    if t <= wp[0][0]: return wp[0][1]
    for i in range(1, len(wp)):
        t0, p0 = wp[i - 1]; t1, p1 = wp[i]
        if t <= t1:
            if t1 - t0 < 1e-6: return p1
            u = smoothstep((t - t0) / (t1 - t0))
            x = p0[0] + (p1[0] - p0[0]) * u; y = p0[1] + (p1[1] - p0[1]) * u
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]
            if abs(dx) > 0.2 or abs(dy) > 0.2:
                bulge = -0.30 if dy < -0.1 else (0.22 if dy > 0.1 else 0.0)
                y += bulge * math.sin(math.pi * u)
            return (x, y)
    return wp[-1][1]

# ---------------- foot-lock IK (planted feet, knee flex) ----------------
def setup_ik(armo, key):
    pb = armo.pose.bones; targets = {}
    for side, s in (("L", 1), ("R", -1)):
        e = bpy.data.objects.new(f"FootIK_{key}_{side}", None); bpy.context.collection.objects.link(e)
        e.empty_display_size = 0.06; e.location = (BASE[key][0] + s * STANCE_W, 0.0, ANKLE)
        p = bpy.data.objects.new(f"Pole_{key}_{side}", None); bpy.context.collection.objects.link(p)
        p.location = (BASE[key][0] + s * STANCE_W, -0.7, 0.48)
        p.parent = armo; p.matrix_parent_inverse = armo.matrix_world.inverted()   # pole travels with body
        sh = pb[f"shin.{side}"]; th = pb[f"thigh.{side}"]
        con = sh.constraints.new('IK'); con.target = e; con.chain_count = 2
        con.pole_target = p; con.pole_angle = math.radians(90)                     # +90 = knee forward (verified)
        sh.use_ik_limit_x = True; sh.ik_min_x = math.radians(-140); sh.ik_max_x = 0.0
        sh.use_ik_limit_y = True; sh.ik_min_y = 0.0; sh.ik_max_y = 0.0
        sh.use_ik_limit_z = True; sh.ik_min_z = 0.0; sh.ik_max_z = 0.0
        th.use_ik_limit_x = True; th.ik_min_x = math.radians(-60); th.ik_max_x = math.radians(40)
        th.use_ik_limit_y = True; th.ik_min_y = math.radians(-12); th.ik_max_y = math.radians(12)
        th.use_ik_limit_z = True; th.ik_min_z = math.radians(-15); th.ik_max_z = math.radians(15)
        targets[side] = e
    return targets

def plan_feet(wp, key, targets):
    plant = {"L": (BASE[key][0] + STANCE_W, 0.0), "R": (BASE[key][0] - STANCE_W, 0.0)}
    for side in ("L", "R"):
        e = targets[side]; e.location = (plant[side][0], plant[side][1], ANKLE)
        e.keyframe_insert("location", frame=1)
    k = 0; t = BEAT0
    while t < TOTAL - BEATP:
        side = "L" if k % 2 == 0 else "R"; s = 1 if side == "L" else -1
        t_land = t + 0.70 * BEATP
        rt = sample_pos(wp, t_land + 0.35 * BEATP)
        desired = (rt[0] + s * STANCE_W, rt[1])
        MAX_REACH = 0.12
        rl = sample_pos(wp, t_land); dxr, dyr = desired[0] - rl[0], desired[1] - rl[1]
        dr = math.hypot(dxr, dyr)
        if dr > MAX_REACH: desired = (rl[0] + dxr / dr * MAX_REACH, rl[1] + dyr / dr * MAX_REACH)
        cur = plant[side]; dist = math.hypot(desired[0] - cur[0], desired[1] - cur[1])
        if dist > 0.06:
            e = targets[side]
            e.location = (cur[0], cur[1], ANKLE); e.keyframe_insert("location", frame=f(t))
            mid = ((cur[0] + desired[0]) / 2, (cur[1] + desired[1]) / 2)
            e.location = (mid[0], mid[1], ANKLE + LIFT); e.keyframe_insert("location", frame=f(t + 0.35 * BEATP))
            e.location = (desired[0], desired[1], ANKLE); e.keyframe_insert("location", frame=f(t_land))
            plant[side] = desired
        k += 1; t += BEATP
    for side in ("L", "R"):
        e = targets[side]; e.location = (plant[side][0], plant[side][1], ANKLE)
        e.keyframe_insert("location", frame=f(TOTAL))

# ---------------- root: formation travel + beat groove ----------------
def animate_root(arm, key, midx):
    ph = midx * 0.9; wp = build_schedule(key)
    n = int((TOTAL - BEAT0) / (BEATP / 2.0))
    for i in range(n):
        t = BEAT0 + i * BEATP / 2.0
        if t >= TOTAL: break
        fr = f(t); onbeat = (i % 2 == 0); bi = i / 2.0
        pos = sample_pos(wp, t); nxt = sample_pos(wp, t + BEATP / 2.0)
        moving = math.hypot(nxt[0] - pos[0], nxt[1] - pos[1]) > 0.02
        cyc4 = 2 * math.pi * (bi / 4.0) + ph
        sway_x = 0.05 * math.sin(cyc4) * (0.25 if moving else 1.0)
        if moving: bounce = -0.05 if onbeat else -0.008
        else:      bounce = -0.030 if onbeat else -0.008
        arm.location = (pos[0] + sway_x, pos[1], bounce)
        arm.keyframe_insert("location", frame=fr)

# ---------------- choreography: mocap upper body ----------------
def fill(pattern, t0, t1):
    out = []; t = t0; i = 0
    while t < t1 - 0.5:
        st, dur = pattern[i % len(pattern)]; dur = min(dur, t1 - t)
        if dur < 1.2: break
        out.append((st, dur)); t += dur; i += 1
    return out

def build_sequence():
    SONG1_PAT = [("DANCE",5),("WAVE",4),("DANCE",5),("GESTURE",4),("WAVE",4),("DANCE",6)]
    SONG2_PAT = [("DANCE",5),("WALK",4),("WAVE",4),("DANCE",5),("GESTURE",4),("WAVE",4)]
    seq = [("IDLE", 4)]
    seq += fill(SONG1_PAT, 4, SEAM - 7)
    seq += [("WAVE", 7), ("WAVE", 4)]            # greeting seam
    seq += fill(SONG2_PAT, SEAM + 4, TOTAL - 5)
    seq += [("WAVE", 5)]
    return seq

def sequence_members(clips):
    seq = build_sequence()
    step = 4 if MODE == "stills" else 2
    for key in MEMBERS:
        arm = bpy.data.objects.get(f"Rig_{key}")
        if not arm: continue
        if arm.animation_data: arm.animation_data.action = None
        # 1) foot-lock IK legs
        targets = setup_ik(arm, key)
        # 2) mocap UPPER body (legs skipped -> IK drives them), arms amplified
        t = 1 + OFFS[key]
        for st, dur in seq:
            bake_slot(arm, clips[st], t, int(dur * FPS), 0, step=step, gain=GAIN, skip=LEG_SKIP)
            t += int(dur * FPS) - OVERLAP
        smooth_arm_fcurves(arm, ARM_BONES, passes=2)   # de-tremble
        # 3) gait + root formation/groove
        plan_feet(build_schedule(key), key, targets)
        animate_root(arm, key, MEMBERS.index(key))
        print("sequenced", key)

# ---------------- LED animated equalizer graphic (1-pass) ----------------
def animate_led():
    m = bpy.data.materials.get("M_LED")
    if not m: return
    nt = m.node_tree
    for nd in list(nt.nodes): nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emi = nt.nodes.new("ShaderNodeEmission")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = 'BANDS'; wave.bands_direction = 'Z'
    wave.inputs["Scale"].default_value = 5.0; wave.inputs["Distortion"].default_value = 6.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].color = (0.85, 0.15, 0.5, 1); e[1].color = (0.2, 0.55, 1.0, 1)
    e2 = ramp.color_ramp.elements.new(0.5); e2.color = (0.95, 0.8, 0.2, 1)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], wave.inputs["Vector"])
    nt.links.new(wave.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emi.inputs["Color"])
    nt.links.new(emi.outputs["Emission"], out.inputs["Surface"])
    beats = int(TOTAL / BEATP)
    for b in range(0, beats + 1):
        fr = f(b * BEATP)
        mp.inputs["Location"].default_value = (0.0, b * 0.14, b * 0.05)   # scroll bands
        mp.inputs["Location"].keyframe_insert("default_value", frame=fr)
        emi.inputs["Strength"].default_value = 1.5 + (0.9 if b % 2 == 0 else 0.0)  # beat pulse
        emi.inputs["Strength"].keyframe_insert("default_value", frame=fr)

# ---------------- camera: active + over-the-shoulder ----------------
def spot_lead(t):
    for (mk, a, b) in SPOTS:
        if a - 1 <= t <= b + 1: return mk
    if FINALE[0] - 1 <= t <= FINALE[1] + 1: return "finale"
    return None

def build_segments():
    SEG = [
        # AERIAL APPROACH INTO STAGE
        (0.0, 6.0,   (0,-58,46),(0,-40,24),  (0,-10,1),(0,-6,1),   26,28),
        (6.0, 10.0,  (0,-32,15),(0,-20,8),   (0,-2,1.2),(0,0.2,1.3),30,34),
        (10.0,13.0,  (0,-13,5.2),(0,-10,4.0),(0,0.4,1.4),(0,0.4,1.4),36,40),
    ]
    TEMPL = [   # (name, c0, c1, tgt, lens) — c0->c1 is intra-shot MOVEMENT
        ("WIDE",   (-6,-9,3.2),(6,-9,3.4),(0,0.7,1.35),40),        # lateral drift
        ("ORBIT",  (7.5,-7.5,2.8),(-7.5,-7.5,2.9),(0,0.6,1.4),44), # arc across front
        ("CRANE",  (0,-11,1.5),(0,-9.5,5.4),(0,0.9,1.5),36),       # rise up
        ("DRONE",  (10,-20,13),(-9,-21,11),(0,-2,1.0),28),         # high sweep over crowd
        ("PROFILE",(9,-4,1.9),(6.5,-2.5,1.7),(0,0.5,1.45),52),     # side profile of the line
        ("OTS",    (7,-16.5,3.5),(-6,-17,3.7),(0,0.6,1.35),34),    # over-shoulder: crowd fg + stage bg
        ("HERO",   (0,-6.4,1.3),(0,-5.2,1.5),(0,1.1,1.85),42),     # low up-angle
        ("PUSHIN", (0,-8,2.1),(0,-5.4,1.75),(0,0.7,1.5),50),       # push toward group
    ]
    LEAD = ((0,-4.4,1.65),(0,-3.6,1.6),(0,-0.85,1.45),56)          # spotlight push-in on forward member
    def cyc(t0, t1, chunk, start_i):
        segs = []; t = t0; i = start_i
        while t < t1 - 0.5:
            d = min(chunk, t1 - t)
            if d < 2.0: break
            if spot_lead(t):                       # follow the member who stepped forward
                c0, c1, g, lens = LEAD
                segs.append((t, t + d, c0, c1, g, g, lens, lens))
            else:
                nm, c0, c1, g, lens = TEMPL[i % len(TEMPL)]
                segs.append((t, t + d, c0, c1, g, g, lens, lens))
            t += d; i += 1
        return segs, i
    s1, i = cyc(13.0, SEAM - 8, 6.5, 0); SEG += s1
    # GREETING at seam: crowd-react (over-shoulder) + medium group wave + react back
    SEG += [
        (SEAM-8, SEAM-3, (6,-16,3.6),(-6,-16,3.6),(0,0.6,1.35),(0,0.6,1.35), 34,34),   # OTS crowd->stage
        (SEAM-3, SEAM+3, (0,-6.4,1.8),(0,-6.0,1.7),(0,0.8,1.5),(0,0.8,1.5), 44,46),    # MEDIUM group wave
        (SEAM+3, SEAM+7, (-6,-16,3.6),(6,-16,3.6),(0,0.6,1.35),(0,0.6,1.35), 34,34),   # OTS other side
    ]
    s2, _ = cyc(SEAM+7, TOTAL - 7, 6.5, 3); SEG += s2
    SEG += [(TOTAL-7, TOTAL, (0,-16,8),(0,-52,40),(0,-2,1.2),(0,-8,1.0), 32,26)]        # outro pull-back
    return SEG

def setup_camera_direction():
    sc = bpy.context.scene; cam = sc.camera
    if cam is None:
        bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
    for c in list(cam.constraints): cam.constraints.remove(c)
    tgt = bpy.data.objects.get("CamTarget") or bpy.data.objects.new("CamTarget", None)
    if tgt.name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(tgt)
    con = cam.constraints.new('TRACK_TO'); con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'; cam.rotation_euler = (0, 0, 0)
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
    beats = int(TOTAL / 0.7)
    for i, o in enumerate(aud):
        bz = o.location.z; ph = (i * 0.7) % (2 * math.pi)
        o.rotation_mode = 'XYZ'; brz = o.rotation_euler.z
        for b in range(0, beats, 2):
            t = b * 0.7; fr = f(t)
            o.location.z = bz + 0.045 * (0.5 + 0.5 * math.sin(math.pi * b + ph))
            o.keyframe_insert("location", frame=fr, index=2)
            o.rotation_euler.z = brz + math.radians(4) * math.sin(0.5 * math.pi * b + ph)
            o.keyframe_insert("rotation_euler", frame=fr, index=2)

def fix_chima_weights():
    """Rig the chima to the HIPS bone only (whole skirt, weight 1.0). With IK legs,
    leaving thigh/shin weights makes the slim skirt SPLIT and wrap each leg like
    pants. Hips-only -> one solid skirt that swings with the body; legs move inside."""
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.name.startswith("G_Chima"):
            for vg in list(ob.vertex_groups):
                if vg.name != "hem":                 # keep hem group for the flutter falloff
                    ob.vertex_groups.remove(vg)
            vg = ob.vertex_groups.new(name="hips")
            vg.add([v.index for v in ob.data.vertices], 1.0, 'REPLACE')

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
    env.build_desert()
    fix_chima_weights()          # hips-only skirt (no split over IK legs)
    clips = {st: import_clip(os.path.join(LIB, fn)) for st, fn in CLIPS.items()}
    sequence_members(clips)
    add_skirt_flutter(); animate_audience(); animate_led()
    setup_camera_direction()
    os.makedirs(OUT, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = (12 if MODE == "stills" else 8)
    except Exception: pass
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "concert2.blend"))
    if MODE == "stills":
        sc.render.resolution_x = 1000; sc.render.resolution_y = 560
        for t in (2.5, 12.0, 36.0, 76.0, 150.0, 214.8, 255.0, 305.0, 340.0, 370.0, 388.0):
            sc.frame_set(f(t)); sc.render.filepath = os.path.join(OUT, "s_%05.1f.png" % t)
            bpy.ops.render.render(write_still=True)
        print("CONCERT2_STILLS_DONE")
    elif MODE == "preview":
        # motion check: Y-spotlight window (formation step-in + foot plant + arm smoothness)
        sc.frame_start = f(24); sc.frame_end = f(46)
        sc.render.resolution_x = 720; sc.render.resolution_y = 405
        sc.render.filepath = os.path.join(OUT, "p_")
        bpy.ops.render.render(animation=True)
        print("CONCERT2_PREVIEW_DONE %d..%d" % (sc.frame_start, sc.frame_end))
    else:
        sc.frame_start = 1; sc.frame_end = f(TOTAL)
        sc.render.resolution_x = 960; sc.render.resolution_y = 540
        sc.render.filepath = os.path.join(OUT, "c_")
        bpy.ops.render.render(animation=True)
        print("CONCERT2_FULL_DONE frames %d" % sc.frame_end)

main()
