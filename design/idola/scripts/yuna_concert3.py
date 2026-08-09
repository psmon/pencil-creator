"""YUNA concert v4 — 30 LEGO backup-dancers on stage (musical-flow, non-sync).

Reuses concert2 (YUNA singers hybrid choreo + desert env + animated LED + the same
two-song timeline + active camera) and ADDS:
  - 30 lego backup dancers upstage (behind the singers) with VARIED per-figure
    bounce / walk / sway / spin -> a lively, non-synchronized 'musical flow' crowd.
  - a MORE DYNAMIC audience (bigger hops + sway).
Stage dynamics over character-motion detail. Same music, only the staging changes.

Modes:  blender -b --factory-startup -P yuna_concert3.py -- stills|full
"""
import bpy, math, os, sys, random
sys.path.append(r"C:\Users\psmon\infra\blender")
from yuna_concert2 import (env, import_clip, CLIPS, LIB, BLEND, FPS, TOTAL, BEATP, f,
                           fix_chima_weights, sequence_members, add_skirt_flutter,
                           animate_led, setup_camera_direction, MODE)

OUT = r"C:\Users\psmon\infra\blender\out\concert3"

# ---------------- lego backup-dancer band ----------------
def build_lego_band():
    """30 lego figures upstage (behind singers, in front of the LED), facing the crowd."""
    masters = {'hat': env.build_lego_minifig('hat'), 'hair': env.build_lego_minifig('hair')}
    for m in masters.values():
        # bake the builder's non-uniform scale (0.30,0.24,0.32) into the mesh so the
        # master is scale=1 with real 0.845m proportions. Otherwise a uniform inst.scale
        # multiplies the ~2.64m raw MESH -> giant distorted figures.
        bpy.ops.object.select_all(action='DESELECT'); m.select_set(True)
        bpy.context.view_layer.objects.active = m
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        m.hide_render = True; m.hide_viewport = True
    torso_cols = [(0.85,0.2,0.2),(0.2,0.4,0.85),(0.9,0.7,0.2),(0.2,0.7,0.4),
                  (0.7,0.3,0.7),(0.9,0.5,0.2),(0.3,0.75,0.8),(0.95,0.95,0.95)]
    top_cols = [(0.1,0.1,0.12),(0.5,0.3,0.15),(0.85,0.2,0.3),(0.15,0.2,0.5),(0.9,0.8,0.2),(0.8,0.8,0.85)]
    figs = []; idx = 0
    rows = [1.35, 2.45, 3.45]                       # y upstage (singers ~0, LED ~4)
    for r, y in enumerate(rows):
        for c in range(10):
            x = -6.3 + c * 1.4 + (0.7 if r % 2 else 0.0)
            master = masters['hat'] if idx % 2 == 0 else masters['hair']
            inst = master.copy(); inst.data = master.data.copy()
            inst.name = f"Band_{idx}"; bpy.context.collection.objects.link(inst)
            inst.hide_render = False; inst.hide_viewport = False
            sc = 1.5 + ((idx * 13) % 4) * 0.06         # ~1.27-1.42m: shorter than singers (1.68m)
            inst.location = (x, y, 0.16 * sc)          # feet on the deck (origin 0.16 above feet)
            inst.scale = (sc, sc, sc)
            inst.rotation_euler = (0, 0, math.radians(180))   # face -Y (toward the crowd)
            for i, slot in enumerate(inst.data.materials):
                if slot is None: continue
                if "Torso" in slot.name:
                    nm = slot.copy(); nm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*torso_cols[idx % len(torso_cols)], 1)
                    inst.data.materials[i] = nm
                elif "Top" in slot.name:
                    nm = slot.copy(); nm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*top_cols[(idx//2) % len(top_cols)], 1)
                    inst.data.materials[i] = nm
            figs.append(inst); idx += 1
    return figs

def animate_lego_band(figs):
    """Per-figure VARIED choreography (bounce/walk/sway/spin) -> musical, non-sync flow."""
    beats = int(TOTAL / BEATP)
    for i, o in enumerate(figs):
        random.seed(i * 7 + 3)
        bx, by, bz = o.location
        amp = 0.07 + random.random() * 0.13           # bounce height
        swA = math.radians(10 + random.random() * 24)  # sway amplitude
        ph = random.random() * 6.2832
        style = i % 4                                   # 0 bounce / 1 sway / 2 walk / 3 spin
        walkR = 0.35 + random.random() * 0.6
        o.rotation_mode = 'XYZ'; brz = o.rotation_euler.z
        for b in range(0, beats + 1):
            fr = f(b * BEATP)
            hop = amp * abs(math.sin(math.pi * b + ph))     # bounce on the beat
            x, y = bx, by
            if style == 2:                              # small walk loop around the spot
                x = bx + walkR * math.sin(b * 0.16 + ph)
                y = by + 0.35 * math.sin(b * 0.11 + ph * 0.5)
            o.location = (x, y, bz + hop); o.keyframe_insert("location", frame=fr)
            if style == 1:   rz = brz + swA * math.sin(0.5 * math.pi * b + ph)
            elif style == 3: rz = brz + math.radians(b * 7)                 # slow spin
            else:            rz = brz + math.radians(6) * math.sin(math.pi * b + ph)
            o.rotation_euler.z = rz; o.keyframe_insert("rotation_euler", frame=fr, index=2)

def animate_crowd_dynamic():
    """Bigger, livelier audience: hops + sway (replaces concert2's mild bob)."""
    aud = [o for o in bpy.data.objects if o.name.startswith("Aud_")]
    beats = int(TOTAL / 0.7)
    for i, o in enumerate(aud):
        random.seed(1000 + i)
        bz = o.location.z; ph = random.random() * 6.2832
        amp = 0.09 + random.random() * 0.13
        o.rotation_mode = 'XYZ'; brz = o.rotation_euler.z
        for b in range(0, beats + 1):
            fr = f(b * 0.7)
            o.location.z = bz + amp * abs(math.sin(math.pi * b + ph))
            o.keyframe_insert("location", frame=fr, index=2)
            o.rotation_euler.z = brz + math.radians(9) * math.sin(0.5 * math.pi * b + ph)
            o.keyframe_insert("rotation_euler", frame=fr, index=2)

# ---------------- main ----------------
def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    sc = bpy.context.scene; sc.render.fps = FPS
    env.build_desert()
    fix_chima_weights()
    clips = {st: import_clip(os.path.join(LIB, fn)) for st, fn in CLIPS.items()}
    sequence_members(clips)                 # YUNA singers (hybrid choreo)
    figs = build_lego_band()                # 30 backup dancers
    animate_lego_band(figs)
    add_skirt_flutter(); animate_crowd_dynamic(); animate_led()
    os.makedirs(OUT, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.image_settings.file_format = 'PNG'
    try: sc.eevee.taa_render_samples = (12 if MODE == "stills" else 8)
    except Exception: pass
    if MODE == "stills":
        # FIXED wide stage cam (no keyframes) to validate band placement/scale/motion
        cam = sc.camera or (bpy.ops.object.camera_add() or bpy.context.object)
        sc.camera = cam
        for c in list(cam.constraints): cam.constraints.remove(c)
        cam.rotation_euler = (math.radians(80), 0, 0); cam.data.lens = 34
        sc.render.resolution_x = 1000; sc.render.resolution_y = 560
        for t, loc in ((15.0,(0,-15,6.5)),(100.0,(0,-13,5.0)),(214.8,(0,-16,7.5)),
                       (300.0,(0,-12,4.5)),(380.0,(0,-18,9))):
            sc.frame_set(f(t)); cam.location = loc     # set AFTER frame_set (no cam fcurves to override)
            sc.render.filepath = os.path.join(OUT, "s_%05.1f.png" % t)
            bpy.ops.render.render(write_still=True)
        print("CONCERT3_STILLS_DONE")
    else:
        setup_camera_direction()
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "concert3.blend"))
        sc.frame_start = 1; sc.frame_end = f(TOTAL)
        sc.render.resolution_x = 960; sc.render.resolution_y = 540
        sc.render.filepath = os.path.join(OUT, "c_")
        bpy.ops.render.render(animation=True)
        print("CONCERT3_FULL_DONE frames %d" % sc.frame_end)

main()
