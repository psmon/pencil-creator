"""Y-U-N-A body v2 — anatomical female body line via Skin modifier + Subsurf.

Step 1 focus: BODY LINE only (connected torso/limb silhouette with waist-in,
hip-out curve). Head is a rough blob placeholder here; hands/hair/face refined
in later steps. Runs inside MCP exec context.
"""
import bpy

def _skin_body(name, cx, height=1.68):
    """Build a single connected female base mesh using the Skin modifier.
    Returns the object. Proportions scaled to `height`."""
    H = height
    # z landmarks as fractions of height
    z = {
        # K-pop 8등신 styling: small head (7.6), long legs, high waist tuck.
        "pelvis": 0.555 * H, "waist": 0.64 * H, "underbust": 0.70 * H,
        "chest": 0.755 * H, "neck": 0.845 * H, "headc": 0.930 * H, "headtop": 0.996 * H,
        "sh": 0.828 * H, "elbow": 0.635 * H, "wrist": 0.455 * H,
        "hip": 0.53 * H, "knee": 0.275 * H, "ankle": 0.040 * H,
    }
    # widths (x half) and depths (y half)
    xw = {"sh": 0.100 * H}  # narrow sloping shoulders
    # vertex table: (co, (rx, ry))  radii in meters
    V = []
    def add(co, r):
        V.append((co, r)); return len(V) - 1

    # hourglass: narrow waist, modest bust/hip; BMI~17 slim
    i_pelvis   = add((cx, 0, z["pelvis"]),    (0.084*H, 0.056*H))
    i_waist    = add((cx, 0, z["waist"]),     (0.050*H, 0.046*H))
    i_underb   = add((cx, 0, z["underbust"]), (0.060*H, 0.050*H))
    i_chest    = add((cx, 0, z["chest"]),     (0.078*H, 0.058*H))
    i_neck     = add((cx, 0, z["neck"]),      (0.028*H, 0.028*H))
    i_necktop  = add((cx, 0, z["neck"]+0.032*H), (0.026*H, 0.026*H))

    # front = -Y, back = +Y
    bust = {}
    glute = {}
    arms = {}
    legs = {}
    feet = {}
    for side, s in (("L", 1), ("R", -1)):
        sh    = add((cx + s*xw["sh"], 0,      z["sh"]),    (0.030*H, 0.030*H))
        elbow = add((cx + s*(xw["sh"]+0.010*H), 0.01*H, z["elbow"]), (0.023*H, 0.023*H))
        wrist = add((cx + s*(xw["sh"]+0.024*H), 0.02*H, z["wrist"]), (0.015*H, 0.015*H))
        arms[side] = (sh, elbow, wrist)
        hip   = add((cx + s*0.056*H, 0,       z["hip"]),   (0.056*H, 0.056*H))
        knee  = add((cx + s*0.058*H, 0.008*H, z["knee"]),  (0.032*H, 0.034*H))
        ankle = add((cx + s*0.058*H, 0.010*H, z["ankle"]), (0.018*H, 0.022*H))
        legs[side] = (hip, knee, ankle)
        # foot toe forward (-Y), near floor
        toe   = add((cx + s*0.058*H, -0.085*H, 0.012*H), (0.020*H, 0.020*H))
        feet[side] = toe
        # glute (back +Y) branch vert — skin branch works well for rounded rear
        gv = add((cx + s*0.048*H, +0.050*H, z["pelvis"]-0.015*H), (0.052*H, 0.046*H))
        glute[side] = gv

    verts = [v[0] for v in V]
    edges = [
        (i_pelvis, i_waist), (i_waist, i_underb), (i_underb, i_chest),
        (i_chest, i_neck), (i_neck, i_necktop),
    ]
    for side in ("L", "R"):
        sh, el, wr = arms[side]
        edges += [(i_chest, sh), (sh, el), (el, wr)]
        hp, kn, an = legs[side]
        edges += [(i_pelvis, hp), (hp, kn), (kn, an), (an, feet[side])]
        edges += [(i_pelvis, glute[side])]

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, [])
    me.update()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)

    skin = obj.modifiers.new("Skin", 'SKIN')
    skin.use_smooth_shade = True
    sv = obj.data.skin_vertices[0].data
    for idx, (_, r) in enumerate(V):
        sv[idx].radius = r
    sv[i_pelvis].use_root = True

    sub = obj.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 2

    obj["landmarks"] = {k: (round(vv, 4) if isinstance(vv, float) else vv) for k, vv in z.items()}
    return obj, {"z": z, "arms": arms, "legs": legs, "cx": cx, "H": H,
                 "i_chest": i_chest, "i_pelvis": i_pelvis, "i_necktop": i_necktop}

def add_bust(meta, mat):
    """Two embedded UV spheres forming a natural bust, joined to torso."""
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]
    made = []
    for s in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.044*H, segments=24, ring_count=14,
            location=(cx + s*0.042*H, -0.040*H, z["chest"] - 0.014*H))
        b = bpy.context.object
        b.name = f"Bust_{'L' if s>0 else 'R'}"
        b.scale = (0.92, 0.72, 0.78)
        for p in b.data.polygons:
            p.use_smooth = True
        b.data.materials.append(mat)
        made.append(b)
    return made

def _tapered(name, top, bot, r_top, r_bot, mat, verts=10):
    """Small tapered cylinder (finger segment) between two points, smooth."""
    from mathutils import Vector
    top, bot = Vector(top), Vector(bot)
    mid = (top + bot) / 2
    vec = top - bot
    length = max(vec.length, 1e-5)
    bpy.ops.mesh.primitive_cone_add(radius1=r_bot, radius2=r_top, depth=length,
                                    location=mid, vertices=verts)
    o = bpy.context.object
    o.name = name
    z = Vector((0, 0, 1)); n = vec.normalized()
    axis = z.cross(n)
    if axis.length > 1e-6:
        o.rotation_mode = 'AXIS_ANGLE'
        o.rotation_axis_angle = (z.angle(n), axis.x, axis.y, axis.z)
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(mat)
    # rounded tip
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r_top, location=top, segments=8, ring_count=6)
    tip = bpy.context.object; tip.name = name + "_tip"
    for p in tip.data.polygons:
        p.use_smooth = True
    tip.data.materials.append(mat)
    return [o, tip]

def add_hand(meta, side, mat):
    """Palm + 4 fingers + thumb hanging down, overlapping the forearm stump."""
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]
    s = 1 if side == "L" else -1
    wx = cx + s*(0.100*H + 0.024*H)
    wy = 0.02*H
    wz = z["wrist"] + 0.032*H  # anchor above wrist vert to overlap forearm stump
    parts = []
    # wrist connector sphere bridging forearm stump and palm
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024*H, segments=16, ring_count=10,
                                         location=(wx, wy - 0.002*H, wz + 0.004*H))
    wcon = bpy.context.object; wcon.name = f"Wrist_{side}"
    wcon.scale = (1.0, 0.85, 1.1)
    for p in wcon.data.polygons:
        p.use_smooth = True
    wcon.data.materials.append(mat)
    parts.append(wcon)
    # palm — flattened box overlapping the wrist connector
    palm_c = (wx, wy - 0.004*H, wz - 0.026*H)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=palm_c)
    palm = bpy.context.object; palm.name = f"Palm_{side}"
    palm.scale = (0.034*H, 0.017*H, 0.036*H)
    palm.data.materials.append(mat)
    ms = palm.modifiers.new("S", 'SUBSURF'); ms.levels = 2
    for p in palm.data.polygons:
        p.use_smooth = True
    parts.append(palm)
    # 4 fingers from palm bottom, pointing down
    base_z = wz - 0.044*H
    for i, fx in enumerate((-0.020, -0.007, 0.007, 0.020)):
        length_scale = (0.82, 1.0, 0.95, 0.78)[i]
        fl = 0.050*H * length_scale
        bx = wx + s*fx*H
        top = (bx, wy - 0.006*H, base_z - fl)
        bot = (bx, wy - 0.004*H, base_z + 0.004*H)
        parts += _tapered(f"Fin_{side}{i}", top, bot, 0.0055*H, 0.0075*H, mat, verts=8)
    # thumb — short, at inner-upper side of palm, angled down-forward
    parts += _tapered(f"Thumb_{side}",
                      (wx - s*0.030*H, wy - 0.016*H, wz - 0.048*H),
                      (wx - s*0.014*H, wy - 0.006*H, wz - 0.026*H),
                      0.006*H, 0.009*H, mat, verts=8)
    return parts

def mat_skin_v2(name="M_SkinV2"):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.949, 0.827, 0.749, 1)
    b.inputs["Roughness"].default_value = 0.5
    try:
        b.inputs["Subsurface Weight"].default_value = 0.12
        b.inputs["Subsurface Radius"].default_value = (0.35, 0.16, 0.10)
    except Exception:
        pass
    return m

FACE_TEX = {
    "y": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-face-y.png",
    "u": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-face-u.png",
    "n": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-face-n.png",
    "a": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-yuna-face-a.png",
}

def _img(path):
    for im in bpy.data.images:
        if im.filepath == path:
            return im
    return bpy.data.images.load(path)

def mat_face_v2(key):
    name = f"M_FaceV2_{key}"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.48
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    mp = nt.nodes.new("ShaderNodeMapping")
    it = nt.nodes.new("ShaderNodeTexImage")
    it.image = _img(FACE_TEX[key]); it.extension = 'EXTEND'
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
    nt.links.new(comb.outputs["Vector"], mp.inputs["Vector"])
    mp.inputs["Location"].default_value = (0.225, 0.205, 0.0)
    mp.inputs["Scale"].default_value = (0.55, 0.65, 1.0)
    nt.links.new(mp.outputs["Vector"], it.inputs["Vector"])
    nt.links.new(it.outputs["Color"], b.inputs["Base Color"])
    return m

def build_head(meta, key):
    """Shaped head (jaw/chin taper) with projected realistic face texture.
    Separate object so Generated bbox = head only."""
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]
    hc = z["headc"]
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.060*H, segments=48, ring_count=32,
                                         location=(cx, 0, hc))
    h = bpy.context.object; h.name = f"Head_{key}"
    h.scale = (0.86, 0.96, 1.10)
    # jaw/chin taper: narrow the lower half in X and pull chin slightly forward (-Y)
    r = 0.060*H
    for v in h.data.vertices:
        dz = v.co.z  # local, center 0
        if dz < 0:
            t = min(1.0, (-dz) / (r*1.10))
            v.co.x *= (1.0 - 0.35*t)      # taper jaw width
            v.co.y += (-0.10*r) * (t**1.5)  # chin forward (-Y = front)
    for p in h.data.polygons:
        p.use_smooth = True
    h.data.materials.append(mat_face_v2(key))
    return h

def mat_hair(key, rgba, rough=0.32):
    name = f"M_HairV2_{key}"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    return m

def _strand(name, pts, r, mat):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts)-1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_endpoint_u = True; sp.order_u = 3
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    return o

def hair_scalp(meta, key, mat):
    """Scalp cap on the head, front (-Y) opened for the face."""
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]; hc = z["headc"]
    r = 0.060*H
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r*1.07, segments=48, ring_count=32,
                                         location=(cx, 0.012*H, hc + 0.010*H))
    cap = bpy.context.object; cap.name = f"Scalp_{key}"
    cap.scale = (0.90, 1.0, 1.14)
    for v in cap.data.vertices:
        if v.co.y < -r*0.18:            # cut front to expose face
            v.co.y = -r*0.18
    for p in cap.data.polygons:
        p.use_smooth = True
    cap.data.materials.append(mat)
    return cap

def hair_for(meta, key, style, rgba):
    """style: 'long' | 'pony' | 'bun' | 'halfup'. Returns list of hair objs."""
    mat = mat_hair(key, rgba)
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]
    hc = z["headc"]; r = 0.060*H; tt = z["chest"]  # hair falls toward chest
    parts = [hair_scalp(meta, key, mat)]
    def S(nm, pts, rad): parts.append(_strand(nm, pts, rad, mat))
    if style == "long":
        for si, s in enumerate((1, -1)):
            S(f"H{key}_side{si}", [(cx+s*r*0.95, r*0.2, hc+r*0.5),
                (cx+s*r*1.15, r*0.5, hc-r*0.4), (cx+s*r*1.05, r*0.6, tt+0.10),
                (cx+s*r*0.85, r*0.6, tt-0.10)], r*0.42)
        S(f"H{key}_back", [(cx, r*1.0, hc+r*0.2), (cx-0.02, r*1.2, hc-r*0.6),
            (cx, r*1.0, tt+0.05), (cx+0.02, r*0.8, tt-0.15)], r*0.5)
    elif style == "pony":
        base = (cx, r*0.55, hc+r*1.0)
        S(f"H{key}_ptA", [base, (cx-r*0.3, r*1.2, hc+r*0.3),
            (cx-r*0.4, r*1.4, hc-r*0.7), (cx-r*0.25, r*1.2, tt+0.05)], r*0.45)
        S(f"H{key}_ptB", [base, (cx+r*0.3, r*1.25, hc+r*0.2),
            (cx+r*0.35, r*1.4, hc-r*0.8), (cx+r*0.2, r*1.2, tt)], r*0.42)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.28, location=base)
        tie = bpy.context.object; tie.name=f"H{key}_tie"
        for p in tie.data.polygons: p.use_smooth=True
        tie.data.materials.append(mat); parts.append(tie)
    elif style == "bun":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.5, location=(cx, r*0.15, hc+r*1.12))
        bun=bpy.context.object; bun.name=f"H{key}_bun"
        for p in bun.data.polygons: p.use_smooth=True
        bun.data.materials.append(mat); parts.append(bun)
        for si,s in enumerate((1,-1)):
            S(f"H{key}_wisp{si}", [(cx+s*r*0.9, r*0.1, hc+r*0.4),
                (cx+s*r*1.02,0,hc-r*0.3),(cx+s*r*0.85,r*0.15,hc-r*0.9)], r*0.14)
    elif style == "halfup":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.26, location=(cx, r*0.3, hc+r*0.9))
        t=bpy.context.object; t.name=f"H{key}_htie"
        for p in t.data.polygons: p.use_smooth=True
        t.data.materials.append(mat); parts.append(t)
        for si,s in enumerate((1,-1)):
            S(f"H{key}_hs{si}", [(cx+s*r*0.95, r*0.2, hc+r*0.5),
                (cx+s*r*1.18, r*0.5, hc-r*0.5), (cx+s*r*1.05, r*0.6, tt+0.05),
                (cx+s*r*0.82, r*0.6, tt-0.14)], r*0.44)
        S(f"H{key}_hback",[(cx,r*1.0,hc+r*0.1),(cx+0.02,r*1.3,hc-r*0.7),
            (cx,r*1.0,tt),(cx-0.02,r*0.8,tt-0.18)], r*0.5)
    return parts

FAB = {
    "yellow_rib": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-yellow-rib.png",
    "denim_light": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-denim-light.png",
    "lavender_sequin": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-lavender-sequin.png",
    "white_pleat": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-white-pleat.png",
    "pink_lace": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-pink-lace.png",
    "dark_denim": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-fab-dark-denim.png",
}

def mat_fab(key, tile=3.0, rough=0.7):
    name = f"M_FabV2_{key}"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (tile, tile, tile)
    it = nt.nodes.new("ShaderNodeTexImage"); it.image = _img(FAB[key])
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], it.inputs["Vector"])
    nt.links.new(it.outputs["Color"], b.inputs["Base Color"])
    return m

def mat_col(name, rgba, rough=0.4, metallic=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    return m

def _cone(name, loc, r1, r2, depth, mat, sy=0.68, verts=40):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, location=loc, vertices=verts)
    o = bpy.context.object; o.name = name; o.scale = (1.0, sy, 1.0)
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat)
    return o

def add_outfit(meta, cfg):
    """cfg keys: top(fab key), bottom('skirt'|'shorts'|'skirt2'), bottom_fab,
    shoe_color, platform(bool)."""
    cx = meta["cx"]; H = meta["H"]; z = meta["z"]
    parts = []
    # TOP — fitted band covering the bust (chest->underbust)
    topm = mat_fab(cfg["top"], tile=3.0, rough=0.55 if "sequin" in cfg["top"] or "lace" in cfg["top"] else 0.7)
    top = _cone(f"Top_{cx}", (cx, -0.016*H, (z["chest"]+z["underbust"])/2 + 0.01*H),
                0.090*H, 0.080*H, (z["chest"]-z["underbust"])+0.085*H, topm, sy=0.86)
    parts.append(top)
    # BOTTOM
    bm = mat_fab(cfg["bottom_fab"], tile=3.0,
                 rough=0.6 if "denim" in cfg["bottom_fab"] else 0.7)
    if cfg["bottom"] == "shorts":
        wrap = _cone(f"Sh_{cx}", (cx, 0, z["pelvis"]-0.05*H), 0.090*H, 0.086*H, 0.20*H, bm, sy=0.72)
        parts.append(wrap)
        for s in (1, -1):
            leg = _cone(f"ShL_{cx}_{s}", (cx+s*0.050*H, 0, z["pelvis"]-0.155*H),
                        0.050*H, 0.047*H, 0.10*H, bm, sy=0.88, verts=20)
            parts.append(leg)
    elif cfg["bottom"] == "skirt2":
        for t in range(2):
            r1 = 0.086*H*(1+t*0.16); r2 = 0.086*H*(1+(t+1)*0.20)
            h = 0.13*H; zc = z["pelvis"] - t*0.11*H - h/2 + 0.03*H
            parts.append(_cone(f"Sk2_{cx}_{t}", (cx, 0, zc), r1, r2, h, bm, sy=0.72))
    else:  # skirt
        parts.append(_cone(f"Sk_{cx}", (cx, 0, z["pelvis"]-0.09*H),
                           0.090*H, 0.122*H, 0.20*H, bm, sy=0.72))
    # SHOES
    shm = mat_col(f"M_Shoe_{cx}", cfg["shoe_color"], rough=0.4)
    fh = 0.09*H if cfg.get("platform") else 0.05*H
    for s in (1, -1):
        bpy.ops.mesh.primitive_cube_add(size=1.0,
            location=(cx+s*0.058*H, -0.05*H, fh/2))
        sh = bpy.context.object; sh.name=f"Shoe_{cx}_{s}"
        sh.scale=(0.045*H, 0.11*H, fh)
        sh.data.materials.append(shm); parts.append(sh)
        if cfg.get("platform"):
            boot = _cone(f"Boot_{cx}_{s}", (cx+s*0.058*H, 0.008*H, fh+0.11*H),
                         0.048*H, 0.044*H, 0.22*H, shm, sy=0.9, verts=20)
            parts.append(boot)
    return parts

MEMBERS = {
    "y": dict(cx=-0.95, H=1.64, hair="long",  hair_col=(0.36,0.22,0.14,1),
              top="yellow_rib", bottom="shorts", bottom_fab="denim_light",
              shoe_color=(0.95,0.95,0.95,1), platform=False),
    "u": dict(cx=-0.32, H=1.68, hair="pony",  hair_col=(0.10,0.08,0.09,1),
              top="lavender_sequin", bottom="skirt", bottom_fab="white_pleat",
              shoe_color=(0.96,0.96,0.98,1), platform=True),
    "n": dict(cx=0.32,  H=1.63, hair="bun",   hair_col=(0.42,0.30,0.18,1),
              top="dark_denim", bottom="shorts", bottom_fab="dark_denim",
              shoe_color=(0.15,0.15,0.17,1), platform=False),
    "a": dict(cx=0.98,  H=1.70, hair="halfup",hair_col=(0.91,0.76,0.46,1),
              top="pink_lace", bottom="skirt2", bottom_fab="pink_lace",
              shoe_color=(0.97,0.95,0.96,1), platform=True),
}

def build_member_v2(key):
    cfg = MEMBERS[key]
    obj, meta = _skin_body(f"BodyV2_{key}", cfg["cx"], cfg["H"])
    skin = mat_skin_v2(); obj.data.materials.append(skin)
    add_bust(meta, skin)
    add_hand(meta, "L", skin); add_hand(meta, "R", skin)
    build_head(meta, key)
    hair_for(meta, key, cfg["hair"], cfg["hair_col"])
    add_outfit(meta, cfg)
    return meta

def build_all_v2():
    for o in list(bpy.data.objects):
        if o.name in {"Camera"} or o.name.startswith(("Stage_", "L_")):
            continue
        if o.type in {'LIGHT', 'CAMERA'}:
            continue
        bpy.data.objects.remove(o, do_unlink=True)
    for k in ("y", "u", "n", "a"):
        build_member_v2(k)

def build_pilot():
    # clear previous members/bodies but keep stage/lights/camera
    for o in list(bpy.data.objects):
        if o.name in {"Camera"} or o.name.startswith(("Stage_", "L_")):
            continue
        if o.type in {'LIGHT', 'CAMERA'}:
            continue
        bpy.data.objects.remove(o, do_unlink=True)
    obj, meta = _skin_body("PILOT_Body", 0.0, 1.68)
    mat = mat_skin_v2()
    obj.data.materials.append(mat)
    busts = add_bust(meta, mat)
    hands = add_hand(meta, "L", mat) + add_hand(meta, "R", mat)
    head = build_head(meta, "u")
    hair = hair_for(meta, "u", "pony", (0.10, 0.08, 0.09, 1))
    return obj, meta, busts, hands, head, hair

ns = bpy.app.driver_namespace
ns["_skin_body"] = _skin_body
ns["mat_skin_v2"] = mat_skin_v2
ns["add_bust"] = add_bust
ns["add_hand"] = add_hand
ns["mat_face_v2"] = mat_face_v2
ns["build_head"] = build_head
ns["mat_hair"] = mat_hair
ns["hair_for"] = hair_for
ns["mat_fab"] = mat_fab
ns["add_outfit"] = add_outfit
ns["build_member_v2"] = build_member_v2
ns["build_all_v2"] = build_all_v2
ns["build_pilot"] = build_pilot
print("BODY_V2_LOADED")
