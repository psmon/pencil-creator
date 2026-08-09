"""Outdoor special-stage concert ENVIRONMENT (character-free preview).

- Skybox: generated dusk image on a large background dome + matching world tint.
- Stage: raised dark glossy platform (top at z=0, characters stand here).
- LED backdrop wall (emissive), truss frame + concert spot lights, speaker stacks.
- Audience: ONE lego-style minifig built once, then INSTANCED in rows with color
  variation; two topper types only (hat / hair). Simple bob anim added later.

Provides build_stage_env() for import, and standalone renders empty-stage stills.
Run: blender -b --factory-startup -P yuna_stageenv.py
"""
import bpy, math
from mathutils import Vector

SKY = r"C:\code\psmon\pencil-creator\image\gemini\2026-08-09-skybox-night-concert.png"
OUT = r"C:\Users\psmon\infra\blender\out\stageenv"

def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True
    return o
def mat(name, rgba, rough=0.5, metallic=0.0, emit=None, emit_str=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if emit is not None:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = emit_str
    return m
def box(name, loc, scale, m):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale
    if m: o.data.materials.append(m)
    return o
def cyl(name, loc, r, depth, m, rot=(0,0,0), verts=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name; smooth(o)
    if m: o.data.materials.append(m)
    return o

# ---------------- sky ----------------
def build_sky():
    w = bpy.context.scene.world
    if not w: w = bpy.data.worlds.new("W"); bpy.context.scene.world = w
    w.use_nodes = True; nt = w.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    # NIGHT ambient — very low, cool; stage lights do the work
    bg.inputs["Color"].default_value = (0.05, 0.06, 0.12, 1)
    bg.inputs["Strength"].default_value = 0.25
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    # LARGE flat sky BACKPLATE behind the stage, facing the camera (-Y). Unlit emissive.
    img = bpy.data.images.load(SKY)
    skym = bpy.data.materials.new("M_Sky"); skym.use_nodes = True
    snt = skym.node_tree
    tex = snt.nodes.new("ShaderNodeTexImage"); tex.image = img
    emi = snt.nodes.new("ShaderNodeEmission"); emi.inputs["Strength"].default_value = 1.0
    snt.links.new(tex.outputs["Color"], emi.inputs["Color"])
    mo = snt.nodes["Material Output"]; snt.links.new(emi.outputs["Emission"], mo.inputs["Surface"])
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 30, 22))
    sky = bpy.context.object; sky.name = "SkyPlate"
    sky.rotation_euler = (math.radians(90), 0, 0)      # vertical, facing -Y
    sky.scale = (180, 100, 1)                          # 16:9-ish, huge
    sky.data.materials.append(skym); sky.hide_select = True
    return sky

# ---------------- stage ----------------
def build_stage():
    dark = mat("M_Stage", (0.05, 0.05, 0.06, 1), rough=0.25, metallic=0.3)
    box("Stage_Deck", (0, 1.0, -0.25), (9.0, 6.0, 0.5), dark)        # top at z=0
    trim = mat("M_StageTrim", (0.9, 0.75, 0.4, 1), rough=0.4, emit=(1.0,0.8,0.3,1), emit_str=2.0)
    box("Stage_EdgeF", (0, -1.98, -0.03), (9.0, 0.06, 0.06), trim)   # glowing front edge
    # ground field (grass, dusk-dark)
    box("Ground", (0, 15, -0.55), (120, 120, 0.1), mat("M_Ground", (0.06,0.08,0.05,1), rough=0.9))
    # LED backdrop wall (emissive gradient graphic)
    ledm = bpy.data.materials.new("M_LED"); ledm.use_nodes = True
    lnt = ledm.node_tree
    tc = lnt.nodes.new("ShaderNodeTexCoord"); sep = lnt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = lnt.nodes.new("ShaderNodeValToRGB")
    emi = lnt.nodes.new("ShaderNodeEmission"); emi.inputs["Strength"].default_value = 1.4
    lnt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    lnt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    e = ramp.color_ramp.elements
    e[0].color = (0.25, 0.06, 0.28, 1); e[1].color = (0.06, 0.12, 0.4, 1)   # deep night
    m2 = ramp.color_ramp.elements.new(0.5); m2.color = (0.4, 0.15, 0.35, 1)
    lnt.links.new(ramp.outputs["Color"], emi.inputs["Color"])
    lnt.links.new(emi.outputs["Emission"], ledm.node_tree.nodes["Material Output"].inputs["Surface"])
    # LED as a PLANE (full-face UV) facing -Y — a box would split the image across 6 faces
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 4.0, 2.6))
    led = bpy.context.object; led.name = "Stage_LED"
    led.rotation_euler = (math.radians(90), 0, 0); led.scale = (8.2, 5.2, 1)
    led.data.materials.append(ledm)
    # speaker stacks
    spk = mat("M_Speaker", (0.03,0.03,0.03,1), rough=0.6)
    for s in (1,-1):
        box(f"Speaker_{s}", (s*4.6, -0.5, 1.4), (0.9, 1.0, 2.8), spk)
    # truss (metal) : top beam + 2 towers
    met = mat("M_Truss", (0.35,0.36,0.38,1), rough=0.35, metallic=0.9)
    cyl("Truss_Top", (0, 0.2, 5.4), 0.12, 11.5, met, rot=(0,math.radians(90),0))
    for s in (1,-1):
        cyl(f"Truss_Tower_{s}", (s*5.5, 0.2, 2.7), 0.12, 5.6, met)
    build_stage_lights()

def build_stage_lights():
    # NIGHT concert: punchy colored spots are the main light source
    cols = [(1.0,0.35,0.55),(0.35,0.55,1.0),(0.9,0.4,1.0),(0.4,1.0,0.7),(1.0,0.75,0.3),
            (0.5,0.6,1.0),(1.0,0.4,0.7)]
    xs = (-4.5,-3,-1.5,0,1.5,3,4.5)
    for i, x in enumerate(xs):
        bpy.ops.object.light_add(type='SPOT', location=(x, 0.2, 5.3))
        sp = bpy.context.object; sp.name = f"Spot_{i}"
        sp.data.energy = 900; sp.data.spot_size = math.radians(42); sp.data.spot_blend = 0.6
        sp.data.color = cols[i % len(cols)]
        try: sp.data.use_soft_falloff = True
        except Exception: pass
        d = Vector((x*0.35,0.0,1.25)) - Vector((x,0.2,5.3))   # aim at performer upper bodies
        sp.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
    # COOL moonlight key from the front so faces read clearly
    bpy.ops.object.light_add(type='AREA', location=(0,-5,4)); k=bpy.context.object
    k.name="StageKey"; k.data.energy=450; k.data.size=5; k.data.color=(0.82,0.86,1.0)
    k.rotation_euler=(math.radians(52),0,0)
    # warm front fill (softens shadows on faces without killing the night mood)
    bpy.ops.object.light_add(type='AREA', location=(-2.5,-4.5,2.6)); wf=bpy.context.object
    wf.name="StageWarmFill"; wf.data.energy=180; wf.data.size=5; wf.data.color=(1.0,0.82,0.66)
    wf.rotation_euler=(math.radians(66),0,math.radians(-20))
    # warm back rim to separate performers from the dark
    bpy.ops.object.light_add(type='AREA', location=(0,4.5,4.5)); r=bpy.context.object
    r.name="StageRim"; r.data.energy=550; r.data.size=5; r.data.color=(1.0,0.66,0.82)
    r.rotation_euler=(math.radians(-125),0,0)
    # footlight uplight wash at stage front
    bpy.ops.object.light_add(type='AREA', location=(0,-1.8,0.1)); fl=bpy.context.object
    fl.name="Footlight"; fl.data.energy=90; fl.data.size=8; fl.data.color=(0.6,0.7,1.0)
    fl.rotation_euler=(math.radians(-15),0,0)

# ---------------- lego audience ----------------
def build_lego_minifig(topper):
    """topper: 'hat' or 'hair'. One joined lego figure ~0.9m, facing +Y.
    Material slot order is FIXED: 0=legs, 1=TORSO, 2=skin, 3=TOPPER — so instances
    recolor slots 1 and 3 for variety."""
    legm = mat("M_LegoLegs", (0.10,0.10,0.12,1), 0.5)
    torm = mat(f"M_LegoTorso_{topper}", (0.7,0.3,0.3,1), 0.5)
    skin = mat("M_LegoSkin", (0.98,0.80,0.55,1), 0.5)
    topm = mat(f"M_LegoTop_{topper}", (0.15,0.15,0.18,1), 0.5)
    legs = box("l_legs", (0,0,0.16), (0.30,0.24,0.32), legm)
    torso = box("l_torso", (0,0,0.44), (0.34,0.26,0.30), torm)
    arms = [cyl(f"l_arm{s}", (s*0.21,0.02,0.44), 0.05, 0.28, torm, rot=(math.radians(8),0,0)) for s in (1,-1)]
    head = cyl("l_head", (0,0,0.68), 0.115, 0.16, skin, verts=20)
    tops = []
    if topper == 'hat':
        tops.append(cyl("l_hatbrim", (0,0,0.755), 0.16, 0.02, topm, verts=20))
        tops.append(cyl("l_hatcrown", (0,0,0.80), 0.10, 0.09, topm, verts=20))
    else:
        tops.append(box("l_hair", (0,-0.01,0.775), (0.24,0.25,0.12), topm))
    parts = [legs, torso] + arms + [head] + tops
    for p in parts: smooth(p)
    # ensure consistent slot order on the base object (legs) before join
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = legs
    bpy.ops.object.join()
    fig = bpy.context.object; fig.name = f"LegoFig_{topper}"
    return fig

def place_audience():
    masters = {'hat': build_lego_minifig('hat'), 'hair': build_lego_minifig('hair')}
    for m in masters.values():
        m.hide_render = True; m.hide_viewport = True
    torso_cols = [(0.85,0.2,0.2),(0.2,0.4,0.85),(0.9,0.7,0.2),(0.2,0.7,0.4),
                  (0.7,0.3,0.7),(0.9,0.5,0.2),(0.3,0.75,0.8),(0.9,0.9,0.9)]
    top_cols = [(0.1,0.1,0.12),(0.5,0.3,0.15),(0.85,0.2,0.3),(0.15,0.2,0.5),(0.9,0.8,0.2),(0.8,0.8,0.85)]
    rows, per = 5, 15
    idx = 0
    for r in range(rows):
        y = -4.4 - r*2.0                    # roomier row spacing
        z = -0.55 + r*0.20
        for c in range(per):
            x = -11.9 + c*1.7 + (0.85 if r % 2 else 0)   # roomier lateral gaps
            master = masters['hat'] if (idx % 2 == 0) else masters['hair']
            inst = master.copy(); inst.data = master.data.copy()
            inst.name = f"Aud_{r}_{c}"; bpy.context.collection.objects.link(inst)
            inst.hide_render = False; inst.hide_viewport = False
            inst.location = (x, y, z)
            inst.rotation_euler = (0, 0, math.radians((idx*37) % 20 - 10))
            sc = 0.62 + ((idx*13) % 5) * 0.02
            inst.scale = (sc, sc, sc)
            # per-instance recolor: copy torso/topper material slots and tint
            for i, slot in enumerate(inst.data.materials):
                if slot is None: continue
                if "Torso" in slot.name:
                    nm = slot.copy(); nm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*torso_cols[idx % len(torso_cols)], 1)
                    inst.data.materials[i] = nm
                elif "Top" in slot.name:
                    nm = slot.copy(); nm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*top_cols[(idx//2) % len(top_cols)], 1)
                    inst.data.materials[i] = nm
            idx += 1
    return masters

# ---------------- desert festival surroundings ----------------
def _cap(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=12, ring_count=8, location=loc)
    o = bpy.context.object; o.name = name; smooth(o)
    if m: o.data.materials.append(m)
    return o

def build_cactus():
    """Saguaro: trunk + rounded cap + two L-arms. Joined, ~2.6m, faces +Y."""
    g = mat("M_Cactus", (0.09, 0.20, 0.11, 1), rough=0.85)
    parts = [cyl("cac_trunk", (0,0,1.1), 0.20, 2.2, g, verts=12),
             _cap("cac_top", (0,0,2.2), 0.20, g)]
    for s, zz in ((1, 1.15), (-1, 1.55)):
        parts.append(cyl(f"cac_a{s}", (s*0.30, 0, zz), 0.11, 0.62, g,
                         rot=(0, math.radians(s*58), 0), verts=10))
        parts.append(cyl(f"cac_au{s}", (s*0.50, 0, zz+0.42), 0.11, 0.60, g, verts=10))
        parts.append(_cap(f"cac_ac{s}", (s*0.50, 0, zz+0.72), 0.11, g))
    for p in parts: smooth(p)
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = "Cactus_master"; return o

def build_lego_car():
    """Simple lego block car: body + cabin + 4 wheels + 2 emissive headlights.
    Slot 0 = BODY (recolored per instance). Joined, ~2m long, faces +Y."""
    body = mat("M_CarBody", (0.75, 0.2, 0.2, 1), rough=0.35, metallic=0.2)
    blk = mat("M_CarBlack", (0.03, 0.03, 0.03, 1), rough=0.6)
    head = mat("M_CarHead", (1.0, 0.95, 0.7, 1), rough=0.3, emit=(1.0, 0.92, 0.6, 1), emit_str=6.0)
    parts = [box("car_body", (0,0,0.34), (1.0, 2.0, 0.44), body),
             box("car_cabin", (0,-0.05,0.66), (0.86, 1.05, 0.36), body)]
    for sx in (1,-1):
        for sy in (1,-1):
            parts.append(cyl(f"car_w{sx}{sy}", (sx*0.52, sy*0.62, 0.20), 0.20, 0.16, blk,
                             rot=(0, math.radians(90), 0), verts=12))
    for sx in (1,-1):
        parts.append(box(f"car_hl{sx}", (sx*0.34, 1.0, 0.36), (0.16, 0.05, 0.12), head))
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = "Car_master"; return o

def build_tent():
    """Striped canopy info-booth: flat roof + 4 legs + a glowing banner. Placed as-is."""
    poles = mat("M_TentPole", (0.2,0.2,0.22,1), rough=0.6, metallic=0.7)
    canopy = mat("M_Tent", (0.85,0.82,0.75,1), rough=0.8)
    ban = mat("M_Banner", (0.95,0.35,0.45,1), rough=0.5, emit=(0.9,0.3,0.4,1), emit_str=1.6)
    grp = []
    grp.append(box("Tent_roofA", (0,0,2.05), (3.2,3.2,0.08), canopy))
    grp.append(box("Tent_roofB", (0,0,2.16), (2.4,2.4,0.08), mat("M_TentStripe",(0.8,0.3,0.35,1),0.8)))
    for sx in (1,-1):
        for sy in (1,-1):
            grp.append(cyl(f"Tent_leg{sx}{sy}", (sx*1.4, sy*1.4, 1.0), 0.06, 2.0, poles))
    grp.append(box("Tent_banner", (0,1.55,1.45), (2.6,0.05,0.5), ban))
    return grp

def build_desert():
    """Turn the empty surroundings into a night desert festival: sand ground,
    dunes ring, scattered cacti, two lego-car parking lots, an info tent."""
    sand = mat("M_Sand", (0.19,0.15,0.10,1), rough=0.95)
    # retint the existing grass ground to sand
    g = bpy.data.objects.get("Ground")
    if g and g.data.materials:
        gm = g.data.materials[0]
        try: gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.19,0.15,0.10,1)
        except Exception: pass
    # dune ring (big flattened mounds, half-sunk) around the perimeter
    import math as _m
    dunes = [(-46,20,10,7),(-30,55,13,8),(0,64,16,9),(34,52,12,8),(48,18,10,7),
             (44,-20,9,6),(-48,-22,10,7),(-58,8,12,8),(58,4,11,7)]
    for i,(x,y,rx,ry) in enumerate(dunes):
        d = _cap(f"Dune_{i}", (x,y,-1.6), 1.0, sand)
        d.scale = (rx, ry, 3.2)
    # cacti scattered flanking the crowd (avoid stage/audience footprint |x|<9,y<2)
    cac = build_cactus(); cac.hide_render=True; cac.hide_viewport=True
    spots = [(-16,-6),(-22,-13),(-14,-20),(17,-5),(23,-12),(15,-19),(-26,3),(27,2),
             (-19,8),(22,10),(-33,-6),(31,-8)]
    for i,(x,y) in enumerate(spots):
        inst = cac.copy(); inst.name=f"Cactus_{i}"; bpy.context.collection.objects.link(inst)
        inst.location=(x,y,0); s=0.8+((i*7)%5)*0.12; inst.scale=(s,s,s)
        inst.rotation_euler=(0,0,_m.radians((i*47)%360))
    # two parking lots of lego cars (stage-left & stage-right, behind the crowd)
    car = build_lego_car(); car.hide_render=True; car.hide_viewport=True
    car_cols=[(0.8,0.2,0.2),(0.2,0.4,0.8),(0.9,0.75,0.2),(0.85,0.85,0.88),
              (0.2,0.6,0.35),(0.7,0.35,0.15),(0.5,0.3,0.6)]
    idx=0
    for (x0,ydir) in ((-30,1),(30,-1)):
        for r in range(3):
            for c in range(6):
                x = x0 + (c*2.4)*(1 if x0<0 else -1)
                y = -6 - r*3.2
                inst=car.copy(); inst.data=car.data.copy()
                inst.name=f"Car_{idx}"; bpy.context.collection.objects.link(inst)
                inst.location=(x,y,0); inst.rotation_euler=(0,0,_m.radians(90+ (5 if r%2 else -5)))
                inst.scale=(0.9,0.9,0.9)
                slot=inst.data.materials[0]
                if slot and "Body" in slot.name:
                    nm=slot.copy(); nm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*car_cols[idx%len(car_cols)],1)
                    inst.data.materials[0]=nm
                idx+=1
    # info tent near the crowd's right entrance
    for p in build_tent():
        p.location = (p.location.x+15.5, p.location.y-15.0, p.location.z)
    # MOONLIGHT: cool sun reveals the whole desert (dunes/cacti/cars/tent) without
    # killing the night concert mood — stage spots (900W) still dominate the stage.
    bpy.ops.object.light_add(type='SUN', location=(-20,-30,40))
    moon = bpy.context.object; moon.name = "DesertMoon"
    moon.data.energy = 1.1; moon.data.color = (0.55,0.68,1.0); moon.data.angle = math.radians(3)
    moon.rotation_euler = (math.radians(38), math.radians(-14), math.radians(20))
    # lift world ambient a touch so shadowed sand isn't pure black
    w = bpy.context.scene.world
    if w and w.use_nodes:
        bg = w.node_tree.nodes.get("Background")
        if bg: bg.inputs["Strength"].default_value = 0.42
    print("DESERT_CARS", idx, "CACTI", len(spots), "DUNES", len(dunes))

def setup_camera():
    bpy.ops.object.camera_add(); cam = bpy.context.object; bpy.context.scene.camera = cam
    return cam

def render(cam, loc, rot, lens, path, x=1280, y=720, s=48):
    cam.location = loc; cam.rotation_euler = rot; cam.data.lens = lens
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = x; sc.render.resolution_y = y
    try: sc.eevee.taa_render_samples = s
    except Exception: pass
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = path
    import os; os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.render.render(write_still=True)

def main():
    reset()
    build_sky()
    build_stage()
    place_audience()
    aud = [o for o in bpy.data.objects if o.name.startswith("Aud_")]
    print("AUDIENCE_COUNT", len(aud))
    cam = setup_camera()
    # FULL overview: high & far, everything (stage + entire crowd) in frame
    render(cam, (0,-26,13), (math.radians(66),0,0), 34, OUT+r"\env_overview.png", 1600, 900)
    render(cam, (0,-17,6.5), (math.radians(75),0,0), 40, OUT+r"\env_wide.png", 1600, 900)
    print("STAGEENV_DONE")

def build_env():
    """Library entry: build sky+stage+audience into the CURRENT scene (no reset,
    no camera, no render) — for integration with the character pipeline."""
    build_sky(); build_stage(); place_audience()

if __name__ == "__main__":
    main()
