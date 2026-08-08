"""Y-U-N-A choreography v3 — physically-grounded walking (foot-lock IK).

Fixes vs v2: ghost-glide removed via per-foot IK targets WORLD-PINNED during
stance; gait computes real stride from displacement; knee flex emerges from
root drop (ground reaction, IK); joint limits (knee one-way, elbow
no-hyperextend, min arm abduction) prevent body penetration.

Modes:  blender -b --factory-startup -P yuna_dance3.py -- mode=stills
        blender -b --factory-startup -P yuna_dance3.py -- mode=preview
"""
import bpy, math, sys, os
from mathutils import Euler, Vector

BLEND = r"C:\code\psmon\pencil-creator\design\blend\yuna-rig4.blend"
OUTDIR = r"C:\Users\psmon\infra\blender\out\dance3"
ANKLE = 0.09          # planted foot target height (rig ankle z)
STANCE_W = 0.058      # narrower stance -> legs stay inside the slim chima
LIFT = 0.055          # swing foot lift
FPS = 24
BPM, BEAT0, BEATP, DUR = 84.2, 0.511, 0.713, 177.2
ORDER = ["y", "u", "n", "a"]
BASE = {"y": (-1.45, 0.0), "u": (-0.48, 0.0), "n": (0.48, 0.0), "a": (1.45, 0.0)}
SPOTS = [("y", 18.0, 26.0), ("u", 41.0, 49.0), ("n", 92.0, 100.0), ("a", 116.0, 124.0)]
FINALE = (150.0, 170.0)
LEAD_POS = (0.0, -0.85)
BACK_SLOTS = [(-1.15, 0.62), (0.42, 0.95), (1.15, 0.62)]   # center offset: never stack behind the lead

MODE = "stills"
for a in sys.argv:
    if a.startswith("mode="):
        MODE = a.split("=", 1)[1]

def f(t): return max(1, int(round(t * FPS)))

def smoothstep(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)

# ---------------- formation schedule ----------------
def build_schedule(key):
    """waypoints [(t,(x,y))] — hold base, travel to spot formation and back."""
    wp = [(0.0, BASE[key])]
    for (mk, a, b) in SPOTS:
        if mk == key:
            tgt = LEAD_POS
        else:
            others = [k for k in ORDER if k != mk]
            tgt = BACK_SLOTS[others.index(key)]
        # slow, calm transitions: capped root speed keeps strides within human reach
        wp += [(a - 4.6, BASE[key]), (a - 0.2, tgt), (b + 0.2, tgt), (b + 4.6, BASE[key])]
    # finale: tighter line, step forward
    tight = (BASE[key][0] * 0.62, -0.30)
    wp += [(FINALE[0] - 4.2, BASE[key]), (FINALE[0], tight), (FINALE[1], tight), (FINALE[1] + 4.2, BASE[key])]
    wp.sort(key=lambda w: w[0])
    return wp

def sample_pos(wp, t):
    """Waypoint interp with ARC paths: downstage movers bulge further downstage,
    upstage movers bulge upstage -> crossing members separate in depth (no blocking)."""
    if t <= wp[0][0]: return wp[0][1]
    for i in range(1, len(wp)):
        t0, p0 = wp[i - 1]; t1, p1 = wp[i]
        if t <= t1:
            if t1 - t0 < 1e-6: return p1
            u = smoothstep((t - t0) / (t1 - t0))
            x = p0[0] + (p1[0] - p0[0]) * u
            y = p0[1] + (p1[1] - p0[1]) * u
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]
            if abs(dx) > 0.2 or abs(dy) > 0.2:      # real travel -> arc it
                bulge = -0.30 if dy < -0.1 else (0.22 if dy > 0.1 else 0.0)
                y += bulge * math.sin(math.pi * u)
            return (x, y)
    return wp[-1][1]

def amp_at(t, key):
    lead = None
    for (mk, a, b) in SPOTS:
        if a - 0.5 <= t <= b + 0.5:
            lead = mk; break
    if t < 11.0: return 0.45, lead
    if lead:
        return (1.2 if lead == key else 0.6), lead
    if FINALE[0] <= t <= FINALE[1]: return 1.35, lead
    return 1.0, lead

def gesture_env(t, key):
    """returns (g, variant) — variant rotates every 4 beats (2-3 gestures per spotlight)."""
    for (mk, a, b) in SPOTS:
        if mk == key and a <= t <= b:
            if t < a + 1.4: g = smoothstep((t - a) / 1.4)
            elif t > b - 1.4: g = smoothstep((b - t) / 1.4)
            else: g = 1.0
            var = int((t - a) / (4 * BEATP)) % 3
            return g, var
    return 0.0, 0

# ---------------- IK + joint constraints ----------------
def setup_ik(armo, key):
    """Foot IK targets (world-pinned empties) + knee poles + joint limits."""
    pb = armo.pose.bones
    targets = {}
    for side, s in (("L", 1), ("R", -1)):
        e = bpy.data.objects.new(f"FootIK_{key}_{side}", None)
        bpy.context.collection.objects.link(e)
        e.empty_display_size = 0.06
        e.location = (BASE[key][0] + s * STANCE_W, 0.0, ANKLE)
        p = bpy.data.objects.new(f"Pole_{key}_{side}", None)
        bpy.context.collection.objects.link(p)
        p.location = (BASE[key][0] + s * STANCE_W, -0.7, 0.48)
        # CRITICAL: pole must travel WITH the body. Static world pole + a walking
        # member = knee aims at the stale pole -> sideways/reverse knee. Parent it.
        p.parent = armo
        p.matrix_parent_inverse = armo.matrix_world.inverted()
        sh = pb[f"shin.{side}"]; th = pb[f"thigh.{side}"]
        con = sh.constraints.new('IK')
        con.target = e; con.chain_count = 2
        con.pole_target = p; con.pole_angle = math.radians(-90)
        # knee: one-way hinge; thigh: limited cone (physically plausible)
        sh.use_ik_limit_x = True; sh.ik_min_x = math.radians(-140); sh.ik_max_x = 0.0
        sh.use_ik_limit_y = True; sh.ik_min_y = 0.0; sh.ik_max_y = 0.0
        sh.use_ik_limit_z = True; sh.ik_min_z = 0.0; sh.ik_max_z = 0.0
        # human range, not circus: hip cone tightened
        th.use_ik_limit_x = True; th.ik_min_x = math.radians(-60); th.ik_max_x = math.radians(40)
        th.use_ik_limit_y = True; th.ik_min_y = math.radians(-12); th.ik_max_y = math.radians(12)
        th.use_ik_limit_z = True; th.ik_min_z = math.radians(-15); th.ik_max_z = math.radians(15)
        targets[side] = e
    return targets

def add_joint_balls(armo, key):
    """Skin-colored joint spheres pinned to bone heads/tails — hide the gap that
    opens between capsule limb segments when joints bend (elbow/shoulder/knee)."""
    from mathutils import Matrix
    skin = bpy.data.materials.get("M_Skin") or bpy.data.materials.get("M_SkinV2")
    JOINTS = [
        ("upperarm.L", "head", 0.027), ("upperarm.R", "head", 0.027),   # shoulders
        ("upperarm.L", "tail", 0.023), ("upperarm.R", "tail", 0.023),   # elbows
        ("forearm.L", "tail", 0.019), ("forearm.R", "tail", 0.019),     # wrists
        ("thigh.L", "tail", 0.033), ("thigh.R", "tail", 0.033),         # knees
        ("shin.L", "tail", 0.023), ("shin.R", "tail", 0.023),           # ankles
    ]
    for bn, end, r in JOINTS:
        pb = armo.pose.bones.get(bn)
        if not pb: continue
        world = armo.matrix_world @ (pb.head if end == "head" else pb.tail)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=14, ring_count=8, location=world)
        o = bpy.context.object
        o.name = f"JB_{key}_{bn}_{end}"
        for p in o.data.polygons: p.use_smooth = True
        if skin: o.data.materials.append(skin)
        o.parent = armo; o.parent_type = 'BONE'; o.parent_bone = bn
        o.matrix_world = Matrix.Translation(world)   # recompute local vs bone-tail frame

def add_arm_limits(armo):
    """Elbow no-hyperextend + twist lock; upperarm min abduction (no torso clip)."""
    pb = armo.pose.bones
    def lim(name, x=None, y=None, z=None):
        b = pb.get(name)
        if not b: return
        c = b.constraints.new('LIMIT_ROTATION'); c.owner_space = 'LOCAL'
        for axis, rng in (("x", x), ("y", y), ("z", z)):
            if rng is not None:
                setattr(c, f"use_limit_{axis}", True)
                setattr(c, f"min_{axis}", math.radians(rng[0]))
                setattr(c, f"max_{axis}", math.radians(rng[1]))
    # human SHOULDER ROM. x = swing: for R, -x is FORWARD (gestures use -20 fwd),
    # so cap backward (+x) hard at +8; mirror for L. Blocks the chicken-wing.
    lim("forearm.L", x=(-120, -2), y=(0, 0), z=(0, 0))
    lim("forearm.R", x=(-120, -2), y=(0, 0), z=(0, 0))
    lim("upperarm.L", x=(-8, 70), z=(6, 78))
    lim("upperarm.R", x=(-70, 8), z=(-78, -6))

def plan_feet(wp, key, targets):
    """Gait: alternate steps on the beat; stance foot stays WORLD-PINNED.
    Swing keys: hold(contact) -> lift(mid) -> land at future root pos + stance offset."""
    plant = {"L": (BASE[key][0] + STANCE_W, 0.0), "R": (BASE[key][0] - STANCE_W, 0.0)}
    for side in ("L", "R"):
        e = targets[side]
        e.location = (plant[side][0], plant[side][1], ANKLE)
        e.keyframe_insert("location", frame=1)
    k = 0
    t = BEAT0
    while t < DUR - BEATP:
        side = "L" if k % 2 == 0 else "R"
        s = 1 if side == "L" else -1
        t_land = t + 0.70 * BEATP
        rt = sample_pos(wp, t_land + 0.35 * BEATP)     # lead the root slightly
        desired = (rt[0] + s * STANCE_W, rt[1])
        # REACH CLAMP: foot may not land farther than the leg can reach from the
        # pelvis at landing time (prevents IK hyper-extension / circus knees).
        MAX_REACH = 0.12          # small natural steps (slim skirt won't be kicked open)
        rl = sample_pos(wp, t_land)
        dxr, dyr = desired[0] - rl[0], desired[1] - rl[1]
        dr = math.hypot(dxr, dyr)
        if dr > MAX_REACH:
            desired = (rl[0] + dxr / dr * MAX_REACH, rl[1] + dyr / dr * MAX_REACH)
        cur = plant[side]
        dist = math.hypot(desired[0] - cur[0], desired[1] - cur[1])
        if dist > 0.06:
            e = targets[side]
            # contact hold until liftoff
            e.location = (cur[0], cur[1], ANKLE)
            e.keyframe_insert("location", frame=f(t))
            # mid-swing: lifted, halfway
            mid = ((cur[0] + desired[0]) / 2, (cur[1] + desired[1]) / 2)
            e.location = (mid[0], mid[1], ANKLE + LIFT)
            e.keyframe_insert("location", frame=f(t + 0.35 * BEATP))
            # land (pinned again until next swing)
            e.location = (desired[0], desired[1], ANKLE)
            e.keyframe_insert("location", frame=f(t_land))
            plant[side] = desired
        k += 1
        t += BEATP
    for side in ("L", "R"):
        e = targets[side]
        e.location = (plant[side][0], plant[side][1], ANKLE)
        e.keyframe_insert("location", frame=f(DUR))

# ---------------- animation ----------------
def setpb(arm, name):
    pb = arm.pose.bones.get(name)
    if pb: pb.rotation_mode = 'XYZ'
    return pb

def kr(pb, fr, x=0.0, y=0.0, z=0.0):
    pb.rotation_euler = Euler((math.radians(x), math.radians(y), math.radians(z)), 'XYZ')
    pb.keyframe_insert("rotation_euler", frame=fr)

def animate_member(arm, key, midx):
    ph = midx * 0.9            # phase offset (loose sync, radians into 4-beat cycle)
    dirn = 1 if midx % 2 == 0 else -1
    wp = build_schedule(key)
    hips, spine, chest = setpb(arm, "hips"), setpb(arm, "spine"), setpb(arm, "chest")
    neck, head = setpb(arm, "neck"), setpb(arm, "head")
    uaL, uaR = setpb(arm, "upperarm.L"), setpb(arm, "upperarm.R")
    faL, faR = setpb(arm, "forearm.L"), setpb(arm, "forearm.R")
    haL, haR = setpb(arm, "hand.L"), setpb(arm, "hand.R")
    # legs are IK-driven (foot-lock targets) — no FK leg keys

    # spotlight gesture vocabulary: (uaR x,z | faR x | uaL x,z | faL x)
    GESTURES = [   # arm reaches FORWARD-out (x negative = forward), never folds back
        dict(uaRx=-20, uaRz=-58, faR=-30, uaLx=4,  uaLz=12, faL=-18),   # forward point
        dict(uaRx=-24, uaRz=-24, faR=-58, uaLx=0,  uaLz=34, faL=-20),   # hand-to-heart + open L
        dict(uaRx=-16, uaRz=-66, faR=-26, uaLx=6,  uaLz=14, faL=-22),   # forward-high wave
    ]
    n_beats = int((DUR - BEAT0) / BEATP)
    for i in range(n_beats * 2):            # half-beat resolution
        t = BEAT0 + i * BEATP / 2.0
        if t >= DUR: break
        fr = f(t)
        onbeat = (i % 2 == 0)
        bi = i / 2.0                         # beat index (float)
        b_idx = i // 2
        amp, lead = amp_at(t, key)
        g, gvar = gesture_env(t, key)
        # ---- root: CONTINUOUS travel (feet are world-pinned by IK -> no glide) ----
        pos = sample_pos(wp, t)
        nxt = sample_pos(wp, t + BEATP / 2.0)
        moving = math.hypot(nxt[0] - pos[0], nxt[1] - pos[1]) > 0.02
        cyc4 = 2 * math.pi * (bi / 4.0) + ph          # slow weight-shift cycle
        cyc2 = 2 * math.pi * (bi / 2.0) + ph
        wside = 1 if math.sin(cyc4) >= 0 else -1      # which hip carries weight
        sway_x = 0.055 * amp * math.sin(cyc4) * (0.25 if moving else 1.0)
        if moving:
            # walking: shallow bounce (keeps leg reach margin, no hyper-extension)
            bounce = -0.018 if onbeat else -0.006
        else:
            bounce = (-0.030 * amp) if onbeat else (-0.008 * amp)
        arm.location = (pos[0] + sway_x, pos[1], bounce)
        arm.keyframe_insert("location", frame=fr)

        gr = (1 - g)
        mv = 0.4 if moving else 1.0

        # ---- torso: contrapposto weight shift, counter-rotated chain ----
        lean = 9.0 * amp * math.sin(cyc4) * mv
        twist = 4.5 * amp * math.sin(cyc4 + math.pi / 3) * mv
        glean = 5.0 * g                                # body leans into the gesture
        if moving:                                     # gait: pelvis yaw with steps + slight forward lean
            step_side = 1 if b_idx % 2 == 0 else -1
            twist += 5.0 * step_side
        kr(hips, fr, z=lean * dirn - glean, y=twist * dirn)
        kr(spine, fr, z=-lean * 0.45 * dirn + glean * 0.4, y=-twist * 0.4 * dirn)
        kr(chest, fr, z=-lean * 0.30 * dirn + glean * 0.3,
           x=(-4.0 * amp if (onbeat and int(bi) % 4 == 0) else 0.0) - 3.0 * g + (-4.0 if moving else 0.0))
        look = 0.0
        if lead and lead != key:
            look = 8.0 * (1 if (LEAD_POS[0] - BASE[key][0]) > 0 else -1)
        nod = 2.5 * amp if (onbeat and int(bi) % 2 == 0) else 0.0
        kr(neck, fr, z=-lean * 0.15 * dirn)
        kr(head, fr, x=nod, z=-lean * 0.20 * dirn - 3.0 * g, y=look)

        # ---- arms ----
        if moving:                                     # walk: swing amplitude follows stride length
            step_side = 1 if b_idx % 2 == 0 else -1
            t_b0 = BEAT0 + b_idx * BEATP
            pb0 = sample_pos(wp, t_b0); pb1 = sample_pos(wp, t_b0 + BEATP)
            stride = math.hypot(pb1[0] - pb0[0], pb1[1] - pb0[1])
            # walk arm swing capped small; FORWARD-biased so neither elbow goes back
            sw_amp = max(3.0, min(8.0, stride * 40.0))
            sw = sw_amp * (0.5 + 0.5 * step_side)          # 0..sw_amp, never negative
            uaL_v = dict(x=6 + sw, z=12)                    # L forward = +x
            uaR_v = dict(x=-6 - (sw_amp - sw), z=-12)       # R forward = -x (out of phase)
            faL_v = dict(x=-14); faR_v = dict(x=-14)
        else:
            # gentle groove: FORWARD-ONLY pulse (never swings the elbow behind body)
            swA = 3.0 * amp * (0.5 + 0.5 * math.sin(cyc2)) * gr           # 0..3
            swB = 3.0 * amp * (0.5 + 0.5 * math.sin(cyc2 + math.pi)) * gr
            breathe = 6.0 * amp * (0.5 + 0.5 * math.sin(cyc4)) * gr
            uaL_v = dict(x=5 + swB, z=14 + breathe)         # L: always forward (+x)
            uaR_v = dict(x=-(5 + swA), z=-(14 + breathe))   # R: always forward (-x)
            faL_v = dict(x=-(18 + 8 * abs(math.sin(cyc2))) * gr - 5)
            faR_v = dict(x=-(18 + 8 * abs(math.sin(cyc2 + math.pi))) * gr - 5)
        if g > 0.001:                                  # blend into gesture pose (bent elbow!)
            G = GESTURES[gvar]
            flo = 6.0 * math.sin(2 * math.pi * bi / 4.0)   # gentle float
            uaR_v = dict(x=uaR_v["x"] * gr + G["uaRx"] * g,
                         z=uaR_v["z"] * gr + (G["uaRz"] + flo) * g)
            faR_v = dict(x=faR_v["x"] * gr + G["faR"] * g)
            uaL_v = dict(x=uaL_v["x"] * gr + G["uaLx"] * g,
                         z=uaL_v["z"] * gr + G["uaLz"] * g)
            faL_v = dict(x=faL_v["x"] * gr + G["faL"] * g)
        kr(uaL, fr, **uaL_v); kr(uaR, fr, **uaR_v)
        kr(faL, fr, **faL_v); kr(faR, fr, **faR_v)
        if haL: kr(haL, fr, x=6 * math.sin(cyc2) * amp)
        if haR: kr(haR, fr, x=6 * math.sin(cyc2 + math.pi) * amp)

        # ---- legs: fully IK-driven (world-pinned feet + root motion = real gait) ----

# ---------------- camera direction ----------------
def setup_camera_direction():
    sc = bpy.context.scene
    cam = sc.camera
    if cam is None:
        bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
    tgt = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(tgt)
    con = cam.constraints.new('TRACK_TO')
    con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    cam.rotation_euler = (0, 0, 0)

    # FULL-SONG broadcast shot list (contiguous, hard cuts on phrase boundaries).
    # shot kinds: DRONE (high wide over whole crowd), WIDE, DOLLY (3/4 move),
    # PUSHIN (spotlight member), APOV (audience-POV incl. LED jumbotron),
    # REACT (from stage looking back at the crowd), HERO (low up-angle).
    # (t0,t1, cam0,cam1, tgt0,tgt1, lens0,lens1)
    SEG = [
        # --- INTRO 0-11: drone establish -> crane in ---
        (0.0, 6.0,  (0,-26,15), (0,-22,12),   (0,-6,1.0),(0,-4,1.0), 30,32),
        (6.0, 11.0, (0,-17,7.5),(0,-13,5.2),  (0,0,1.4),(0,0.5,1.4), 34,36),
        # --- A section 11-18: group groove ---
        (11.0,14.5, (0,-9.5,3.4),(0,-8.8,3.2),(0,0.4,1.3),(0,0.4,1.3), 40,40),
        (14.5,18.0, (6.5,-8.5,3.2),(3.5,-8.5,2.7),(0,0.4,1.3),(0,0.4,1.3), 42,44),
        # --- Y spotlight 18-26 ---
        (18.0,22.0, (0,-4.6,1.65),(0,-3.7,1.55),(0,-0.85,1.45),(0,-0.85,1.45), 58,70),
        (22.0,26.5, (0,-12.5,4.5),(0,-11,4.1),(0,1.6,2.4),(0,1.6,2.4), 34,36),   # APOV+jumbotron
        # --- audience reaction + group 26-41 ---
        (26.5,30.0, (1.8,-2.0,3.0),(0.5,-2.2,3.0),(0,-9,0.6),(0,-9,0.6), 30,32),  # REACT crowd
        (30.0,35.0, (-6,-8,3.0),(-2,-8.5,2.7),(0,0.4,1.3),(0,0.4,1.3), 42,42),    # DOLLY
        (35.0,41.0, (9,-18,11),(-4,-19,11.5),(0,-2,1.0),(0,-2,1.0), 30,30),        # DRONE sweep
        # --- U spotlight 41-49 ---
        (41.0,45.0, (0,-4.6,1.65),(0,-3.7,1.55),(0,-0.85,1.45),(0,-0.85,1.45), 58,70),
        (45.0,49.0, (0,-12.5,4.5),(0,-11,4.1),(0,1.6,2.4),(0,1.6,2.4), 34,36),
        # --- 49-68 group/drone/hero ---
        (49.0,55.0, (0,-6.8,0.85),(0,-6.0,1.0),(0,1.0,1.9),(0,1.0,1.9), 40,40),   # HERO low
        (55.0,62.0, (7,-9,3.4),(-3,-9,3.0),(0,0.4,1.4),(0,0.4,1.4), 40,42),        # DOLLY across
        (62.0,68.0, (-9,-19,11),(6,-20,12),(0,-2,1.0),(0,-2,1.0), 30,30),          # DRONE
        # --- break 68-70 quick react ---
        (68.0,70.0, (-1.5,-2.0,3.0),(-0.5,-2.1,3.0),(0,-9,0.6),(0,-9,0.6), 32,32),
        # --- B section 70-92 ---
        (70.0,77.0, (0,-9.5,3.4),(0,-8.8,3.2),(0,0.4,1.3),(0,0.4,1.3), 40,40),
        (77.0,85.0, (6.5,-8.5,3.0),(3,-8.5,2.7),(0,0.4,1.3),(0,0.4,1.3), 42,44),
        (85.0,92.0, (0,-16,7),(0,-13,5.5),(0,0.6,1.6),(0,0.6,1.6), 34,36),         # crane
        # --- N spotlight 92-100 ---
        (92.0,96.0, (0,-4.6,1.65),(0,-3.7,1.55),(0,-0.85,1.45),(0,-0.85,1.45), 58,70),
        (96.0,100.0,(0,-12.5,4.5),(0,-11,4.1),(0,1.6,2.4),(0,1.6,2.4), 34,36),
        # --- 100-116 react/drone ---
        (100.0,105.0,(2.0,-2.0,3.0),(0.6,-2.2,3.0),(0,-9,0.6),(0,-9,0.6), 30,32), # REACT
        (105.0,110.0,(-6,-8,3.0),(-2,-8.5,2.7),(0,0.4,1.3),(0,0.4,1.3), 42,42),
        (110.0,116.0,(9,-18,11),(-4,-19,11.5),(0,-2,1.0),(0,-2,1.0), 30,30),       # DRONE
        # --- A spotlight 116-124 ---
        (116.0,120.0,(0,-4.6,1.65),(0,-3.7,1.55),(0,-0.85,1.45),(0,-0.85,1.45), 58,70),
        (120.0,124.0,(0,-12.5,4.5),(0,-11,4.1),(0,1.6,2.4),(0,1.6,2.4), 34,36),
        # --- 124-137 group ---
        (124.0,131.0,(7,-9,3.4),(-3,-9,3.0),(0,0.4,1.4),(0,0.4,1.4), 40,42),
        (131.0,137.0,(0,-9.5,3.2),(0,-8.8,3.0),(0,0.4,1.3),(0,0.4,1.3), 40,40),
        # --- bridge 137-147 moody slow drone ---
        (137.0,147.0,(0,-14,8),(0,-11,5.5),(0,0.4,1.6),(0,0.4,1.6), 34,38),
        # --- FINALE 147-172 energetic ---
        (147.0,153.0,(0,-9,3.4),(0,-7.5,3.0),(0,0.2,1.5),(0,0.2,1.5), 38,40),
        (153.0,160.0,(10,-19,12),(-8,-20,12),(0,-1,1.2),(0,-1,1.2), 28,28),        # DRONE sweep
        (160.0,166.0,(0,-5.5,1.0),(0,-4.8,1.1),(0,0.6,1.9),(0,0.6,1.9), 40,42),    # HERO
        (166.0,172.0,(2.0,-2.0,3.2),(-2.0,-2.0,3.2),(0,-9,0.7),(0,-9,0.7), 30,30), # REACT big
        # --- OUTRO 172-177 drone pull back ---
        (172.0,177.2,(0,-16,8),(0,-26,15),(0,-2,1.2),(0,-4,1.2), 34,30),
    ]
    for (t0, t1, c0, c1, g0, g1, l0, l1) in SEG:
        for (tt, cpos, gpos, lens) in ((t0, c0, g0, l0), (t1, c1, g1, l1)):
            fr = f(tt) - (1 if tt == t1 else 0)
            cam.location = cpos; cam.keyframe_insert("location", frame=fr)
            tgt.location = gpos; tgt.keyframe_insert("location", frame=fr)
            cam.data.lens = lens; cam.data.keyframe_insert("lens", frame=fr)
    return cam

# ---------------- main ----------------
def setup_cloth():
    """Chima becomes REAL cloth: waist band pinned (follows the armature),
    the rest simulated — legs COLLIDE with the silk and push it away."""
    for ob in bpy.data.objects:
        if ob.type != 'MESH':
            continue
        if ob.name.startswith("G_Chima"):
            cl = ob.modifiers.new("Cloth", 'CLOTH')      # after Armature -> pinned verts follow body
            cl.settings.vertex_group_mass = "pin"
            cl.settings.quality = 12                      # high substeps -> slim skirt won't tunnel
            cl.settings.mass = 0.40
            cl.settings.tension_stiffness = 18.0
            cl.settings.bending_stiffness = 0.7           # softer -> drapes ONTO hips (clingy slim)
            cl.settings.air_damping = 1.4
            cl.collision_settings.use_collision = True
            cl.collision_settings.collision_quality = 6   # robust against fast leg passes
            cl.collision_settings.distance_min = 0.011    # hug close (slim look) but no clip
            cl.collision_settings.impulse_clamp = 0.0
            cl.collision_settings.use_self_collision = True
            cl.collision_settings.self_distance_min = 0.008
        elif ob.name.startswith(("LegColl_", "ArmColl_")):   # legs AND hands push the silk
            co = ob.modifiers.new("Coll", 'COLLISION')
            co.settings.thickness_outer = 0.012
            co.settings.thickness_inner = 0.012
            co.settings.damping = 0.2
            co.settings.cloth_friction = 3.0              # silk grips/slides naturally on legs
    # floor keeps hems from sinking
    fl = bpy.data.objects.get("Plane")
    if fl: fl.modifiers.new("Coll", 'COLLISION')

def bake_cloth(end_frame):
    sc = bpy.context.scene
    sc.frame_start = 1; sc.frame_end = end_frame
    for ob in bpy.data.objects:
        for m in ob.modifiers:
            if m.type == 'CLOTH':
                m.point_cache.frame_start = 1
                m.point_cache.frame_end = end_frame
    bpy.ops.ptcache.bake_all(bake=True)
    print("CLOTH_BAKED to", end_frame)

def fix_garment_weights():
    """Torso garments deform with torso only; SLEEVES keep arm weights;
    CHIMA keeps hip+LEG weights so the slim skirt follows the legs (no poke)."""
    bad = ("upperarm", "forearm", "hand.")
    for ob in bpy.data.objects:
        if ob.type != 'MESH' or not ob.name.startswith("G_") or ob.name.startswith("G_Slv"):
            continue
        if ob.name.startswith("G_Chima"):
            continue                      # keep full auto-weights (hips + thighs + shins)
        for vg in list(ob.vertex_groups):
            if any(b in vg.name for b in bad):
                ob.vertex_groups.remove(vg)

def animate_audience():
    """Lego-level crowd motion: subtle beat-synced vertical bob + tiny sway,
    phase-offset per person, keyframed across the preview window."""
    aud = [o for o in bpy.data.objects if o.name.startswith("Aud_")]
    if not aud: return
    n_beats = int((DUR - BEAT0) / BEATP)
    for i, o in enumerate(aud):
        base_z = o.location.z
        ph = (i * 0.7) % (2 * math.pi)
        o.rotation_mode = 'XYZ'
        base_rz = o.rotation_euler.z
        for b in range(0, n_beats):                  # full song
            t = BEAT0 + b * BEATP
            fr = f(t)
            bob = 0.045 * (0.5 + 0.5 * math.sin(2 * math.pi * (b / 2.0) + ph))
            o.location.z = base_z + bob
            o.keyframe_insert("location", frame=fr, index=2)
            o.rotation_euler.z = base_rz + math.radians(4) * math.sin(2 * math.pi * (b / 4.0) + ph)
            o.keyframe_insert("rotation_euler", frame=fr, index=2)

def add_skirt_flutter():
    """Gentle hem flutter on the SKINNED slim chima (wave along its normal,
    weighted to the hem) — motion without unstable cloth sim."""
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.name.startswith("G_Chima"):
            w = ob.modifiers.new("Flutter", 'WAVE')
            w.use_normal = True
            w.height = 0.012; w.width = 0.5; w.narrowness = 2.0; w.speed = 0.4
            w.vertex_group = "hem"

def setup_broadcast_cam():
    """A tight center-stage 'jumbotron' camera. Whoever steps to the front
    (LEAD_POS 0,-0.85) fills this close-up; otherwise it frames center stage."""
    bpy.ops.object.camera_add(); bc = bpy.context.object; bc.name = "BroadcastCam"
    tgt = bpy.data.objects.new("BC_Target", None); bpy.context.collection.objects.link(tgt)
    tgt.location = (0, -0.5, 1.32)
    tgt.location = (0, -0.7, 1.50)                        # aim at head height of the front spot
    con = bc.constraints.new('TRACK_TO'); con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    bc.location = (0, -4.4, 1.55); bc.data.lens = 88      # fills frame w/ the forward member
    return bc

def render_broadcast(sc, bc):
    """PASS 1: render the broadcast cam to out/broadcast/bc_####.png over the
    preview window. LED hidden so the jumbotron shows the artist, not itself."""
    led = bpy.data.objects.get("Stage_LED")
    sky = bpy.data.objects.get("SkyPlate")
    if led: led.hide_render = True
    if sky: sky.hide_render = True                       # medium-dark bg -> artist pops on the jumbotron
    wbg = sc.world.node_tree.nodes.get("Background")
    prev_str = wbg.inputs["Strength"].default_value if wbg else None
    if wbg: wbg.inputs["Strength"].default_value = 0.35
    # temporary broadcast KEY fill so the artist is clearly lit on the feed
    bpy.ops.object.light_add(type='AREA', location=(0, -3.0, 2.4))
    fill = bpy.context.object; fill.name = "BC_Fill"
    fill.data.energy = 600; fill.data.size = 4; fill.data.color = (1.0, 0.96, 0.92)
    fill.rotation_euler = (math.radians(65), 0, 0)
    prev_cam = sc.camera; sc.camera = bc
    bcdir = r"C:\Users\psmon\infra\blender\out\broadcast"
    os.makedirs(bcdir, exist_ok=True)
    sc.render.resolution_x = 560; sc.render.resolution_y = 350   # ~LED aspect (light)
    sc.render.filepath = os.path.join(bcdir, "bc_")
    bpy.ops.render.render(animation=True)
    if led: led.hide_render = False
    if sky: sky.hide_render = False
    if wbg and prev_str is not None: wbg.inputs["Strength"].default_value = prev_str
    bpy.data.objects.remove(fill, do_unlink=True)
    sc.camera = prev_cam
    return bcdir, sc.frame_start

def set_led_sequence(bcdir, seq_start):
    """Point the LED wall material at the broadcast frames (image sequence),
    synced 1:1 to the scene frame -> real-time jumbotron feed."""
    m = bpy.data.materials.get("M_LED")
    if not m: return
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emi = nt.nodes.new("ShaderNodeEmission"); emi.inputs["Strength"].default_value = 1.7
    tex = nt.nodes.new("ShaderNodeTexImage")
    first = os.path.join(bcdir, "bc_%04d.png" % seq_start)
    img = bpy.data.images.load(first); img.source = 'SEQUENCE'
    tex.image = img
    iu = tex.image_user
    iu.frame_duration = 900; iu.frame_start = seq_start; iu.frame_offset = seq_start - 1
    iu.use_auto_refresh = True
    nt.links.new(tex.outputs["Color"], emi.inputs["Color"])
    nt.links.new(emi.outputs["Emission"], out.inputs["Surface"])

def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    sc = bpy.context.scene
    sc.render.fps = FPS
    fix_garment_weights()
    for i, k in enumerate(ORDER):
        arm = bpy.data.objects.get(f"Rig_{k}")
        if not arm: continue
        targets = setup_ik(arm, k)
        add_arm_limits(arm)
        add_joint_balls(arm, k)
        plan_feet(build_schedule(k), k, targets)
        animate_member(arm, k, i)
    add_skirt_flutter()          # skinned slim skirt + hem wave (no cloth sim)
    animate_audience()           # lego crowd beat bob
    setup_camera_direction()
    os.makedirs(OUTDIR, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = 10
    except Exception: pass
    if MODE == "stills":
        sc.render.resolution_x = 720; sc.render.resolution_y = 520
        for t in (13.0, 17.0, 19.5, 21.5, 23.5, 28.0):
            sc.frame_set(f(t))
            sc.render.filepath = os.path.join(OUTDIR, "still_%05.1fs.png" % t)
            bpy.ops.render.render(write_still=True)
        print("DANCE2_STILLS_DONE")
    else:
        main_cam = sc.camera
        if MODE == "full":
            sc.frame_start = 1; sc.frame_end = f(177.0)
            main_x, main_y = 960, 540
        else:
            sc.frame_start = f(12.0); sc.frame_end = f(34.0)
            main_x, main_y = 640, 460
        # PASS 1 — broadcast/jumbotron feed
        bc = setup_broadcast_cam()
        bcdir, seq0 = render_broadcast(sc, bc)
        set_led_sequence(bcdir, seq0)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "yuna-dance3.blend"))
        # PASS 2 — main render (LED shows the live close-up)
        sc.camera = main_cam
        sc.render.resolution_x = main_x; sc.render.resolution_y = main_y
        sc.render.filepath = os.path.join(OUTDIR, "f_")
        bpy.ops.render.render(animation=True)
        print("DANCE2_%s_DONE %d..%d" % (MODE.upper(), sc.frame_start, sc.frame_end))

main()
