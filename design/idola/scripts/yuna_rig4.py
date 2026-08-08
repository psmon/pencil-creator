"""Y-U-N-A 4-member rigged pipeline — headless.

Per member: idol base body (skin mod -> mesh) + humanoid armature (17 bones) +
auto skinning + SEPARATE swappable garments + V-line head w/ real-face projection
+ member hair, all rig-ready. Neck & outfit-fit refined. Dance choreography is a
LATER step; here each member is posed in a clean A-pose group.

Run: blender -b --factory-startup -P yuna_rig4.py
"""
import bpy, math
from mathutils import Vector, Euler

IMG = r"C:\code\psmon\pencil-creator\design\idola\facetex\%s.png"
OUT = r"C:\Users\psmon\infra\blender\out"
REPO_BLEND = r"C:\code\psmon\pencil-creator\design\blend\yuna-rig4.blend"
H = 1.68

def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)
def smooth(o):
    for p in o.data.polygons: p.use_smooth=True
    return o
def mat(name,rgba,rough=0.5,metallic=0.0):
    m=bpy.data.materials.get(name)
    if m: return m
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value=rgba; b.inputs["Roughness"].default_value=rough
    b.inputs["Metallic"].default_value=metallic
    return m
def mat_face(key):
    name=f"M_Face_{key}"; m=bpy.data.materials.get(name)
    if m: return m
    m=bpy.data.materials.new(name); m.use_nodes=True
    nt=m.node_tree; b=nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value=0.48
    tc=nt.nodes.new("ShaderNodeTexCoord"); sep=nt.nodes.new("ShaderNodeSeparateXYZ")
    cb=nt.nodes.new("ShaderNodeCombineXYZ"); mp=nt.nodes.new("ShaderNodeMapping")
    it=nt.nodes.new("ShaderNodeTexImage"); it.image=bpy.data.images.load(IMG%key); it.extension='EXTEND'
    nt.links.new(tc.outputs["Generated"],sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"],cb.inputs["X"]); nt.links.new(sep.outputs["Z"],cb.inputs["Y"])
    nt.links.new(cb.outputs["Vector"],mp.inputs["Vector"])
    # bust wrap: hairline pulled DOWN to ~78% of head front (no bald forehead);
    # texture neck rows flow onto the shortened neck below the chin
    # vertical identity: texture neck(bottom)->bust neck, hair(top)->crown, face auto-aligns
    mp.inputs["Location"].default_value=(0.11,0.0,0.0); mp.inputs["Scale"].default_value=(0.78,1.0,1.0)
    nt.links.new(mp.outputs["Vector"],it.inputs["Vector"])
    nt.links.new(it.outputs["Color"],b.inputs["Base Color"])
    return m

# refined landmarks (shorter neck: higher shoulder line)
L={"pelvis":(0,0,0.90),"waist":(0,0,1.05),"chest":(0,0,1.37),
   "neck":(0,0,1.45),"head":(0,0,1.52)}
def side(s):
    # shoulders OUTSIDE the torso; REST pose = open A-pose (~25 deg), never 차렷
    return {"shoulder":(s*0.112,0,1.395),"elbow":(s*0.20,0.02,1.115),
            "wrist":(s*0.30,-0.05,0.875),"hand":(s*0.315,-0.06,0.79),
            "hip":(s*0.085,0,0.90),"knee":(s*0.095,0.01,0.49),
            "ankle":(s*0.10,0.01,0.09),"toe":(s*0.10,-0.12,0.04)}

def build_base(key):
    V=[]; E=[]; R={}
    def add(co,r): V.append(co); R[len(V)-1]=r; return len(V)-1
    ip=add(L["pelvis"],(0.090,0.060)); iw=add(L["waist"],(0.054,0.050))
    ic=add(L["chest"],(0.090,0.064)); ineck=add(L["neck"],(0.033,0.033))
    ihd=add((0,0,L["neck"][2]+0.03),(0.031,0.031))
    E+=[(ip,iw),(iw,ic),(ic,ineck),(ineck,ihd)]
    for nm,s in (("L",1),("R",-1)):
        S=side(s)
        sh=add(S["shoulder"],(0.042,0.042)); el=add(S["elbow"],(0.027,0.027))   # deltoid mass
        wr=add(S["wrist"],(0.019,0.019)); hd=add(S["hand"],(0.024,0.021))
        hp=add(S["hip"],(0.064,0.064)); kn=add(S["knee"],(0.035,0.037))
        an=add(S["ankle"],(0.021,0.025)); to=add(S["toe"],(0.021,0.021))
        E+=[(ic,sh),(sh,el),(el,wr),(wr,hd),(ip,hp),(hp,kn),(kn,an),(an,to)]
    me=bpy.data.meshes.new(f"Base_{key}"); me.from_pydata(V,E,[]); me.update()
    o=bpy.data.objects.new(f"Base_{key}",me); bpy.context.collection.objects.link(o)
    sk=o.modifiers.new("Skin",'SKIN'); sk.use_smooth_shade=True
    sv=o.data.skin_vertices[0].data
    for i,r in R.items(): sv[i].radius=r
    sv[ip].use_root=True
    o.modifiers.new("Sub",'SUBSURF').levels=2
    skin=mat("M_Skin",(0.94,0.80,0.72,1),0.5); o.data.materials.append(skin)
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier="Skin"); bpy.ops.object.modifier_apply(modifier="Sub")
    busts=[]
    for s in (1,-1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.044,segments=20,ring_count=12,
            location=(s*0.042,-0.042,1.32))
        b=bpy.context.object; b.scale=(0.92,0.72,0.78); smooth(b); b.data.materials.append(skin); busts.append(b)
    bpy.ops.object.select_all(action='DESELECT')
    for b in busts: b.select_set(True)
    o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.join()
    return o

def build_armature(key):
    bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0))
    arm=bpy.context.object; arm.name=f"Rig_{key}"
    eb=arm.data.edit_bones; eb.remove(eb[0])
    def bone(n,h,t,p=None,c=False):
        b=eb.new(n); b.head=Vector(h); b.tail=Vector(t)
        if p: b.parent=p; b.use_connect=c
        return b
    hips=bone("hips",(0,0,0.90),(0,0,1.05))
    spine=bone("spine",(0,0,1.05),(0,0,1.37),hips,True)
    chest=bone("chest",(0,0,1.37),(0,0,1.45),spine,True)
    neck=bone("neck",(0,0,1.45),(0,0,1.50),chest,True)
    bone("head",(0,0,1.50),(0,0,1.63),neck,True)
    for nm,s in (("L",1),("R",-1)):
        S=side(s)
        ua=bone(f"upperarm.{nm}",S["shoulder"],S["elbow"],chest,False)
        fa=bone(f"forearm.{nm}",S["elbow"],S["wrist"],ua,True)
        bone(f"hand.{nm}",S["wrist"],S["hand"],fa,True)
        th=bone(f"thigh.{nm}",S["hip"],S["knee"],hips,False)
        sh=bone(f"shin.{nm}",S["knee"],S["ankle"],th,True)
        bone(f"foot.{nm}",S["ankle"],S["toe"],sh,True)
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm

def bind(objs,arm):
    for o in objs:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active=arm
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')

def cone(name,loc,r1,r2,d,m,sy=0.72,verts=48):
    # no subsurf (it shrinks cones); high segment count + smooth shading instead
    bpy.ops.mesh.primitive_cone_add(radius1=r1,radius2=r2,depth=d,location=loc,vertices=verts)
    o=bpy.context.object; o.name=name; o.scale=(1,sy,1); smooth(o); o.data.materials.append(m)
    return o

def build_outfit(key,cfg):
    """Tighter-fit garments. cfg: top_color, bottom('skirt'|'skirt2'|'shorts'), bottom_color."""
    parts=[]
    tm=mat(f"M_Top_{key}",cfg["top_color"],cfg.get("top_rough",0.55))
    # crop top covering bust (chest 1.37, bust ~1.32) — sized for no-subsurf
    top=cone(f"G_Top_{key}",(0,-0.014,1.33),0.112,0.104,0.26,tm,sy=0.88); parts.append(top)
    bm=mat(f"M_Bot_{key}",cfg["bottom_color"],cfg.get("bot_rough",0.65))
    bt=cfg["bottom"]
    if bt=="shorts":
        parts.append(cone(f"G_Sh_{key}",(0,0,0.87),0.108,0.102,0.22,bm,sy=0.74))
        for s in (1,-1):
            parts.append(cone(f"G_ShL_{key}_{s}",(s*0.052,0,0.74),0.060,0.056,0.13,bm,sy=0.9,verts=24))
    elif bt=="skirt2":
        for t in range(2):
            r1=0.104*(1+t*0.16); r2=0.104*(1+(t+1)*0.24); h=0.14; zc=0.92-t*0.12-h/2
            parts.append(cone(f"G_Sk2_{key}_{t}",(0,0,zc),r1,r2,h,bm,sy=0.74))
    else:
        parts.append(cone(f"G_Sk_{key}",(0,0,0.83),0.106,0.155,0.24,bm,sy=0.74))
    # shoes
    shm=mat(f"M_Shoe_{key}",cfg["shoe_color"],0.4)
    plat=cfg.get("platform",False); fh=0.09 if plat else 0.05
    for s in (1,-1):
        bpy.ops.mesh.primitive_cube_add(size=1.0,location=(s*0.10,-0.05,fh/2))
        sh=bpy.context.object; sh.name=f"G_Shoe_{key}_{s}"; sh.scale=(0.045,0.11,fh)
        sh.data.materials.append(shm); parts.append(sh)
        if plat:
            parts.append(cone(f"G_Boot_{key}_{s}",(s*0.10,0.008,fh+0.11),0.048,0.044,0.22,shm,sy=0.9,verts=20))
    return parts

def build_hair(key,style,color,hc,r):
    hm=mat(f"M_Hair_{key}",color,0.3); parts=[]
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r*1.07,segments=36,ring_count=24,location=(0,0.012,hc+0.010))
    cap=bpy.context.object; cap.name=f"Scalp_{key}"; cap.scale=(0.90,1.0,1.14)
    for v in cap.data.vertices:
        if v.co.y<-r*0.18: v.co.y=-r*0.18
    smooth(cap); cap.data.materials.append(hm); parts.append(cap)
    def strand(nm,pts,rad):
        cu=bpy.data.curves.new(nm,'CURVE'); cu.dimensions='3D'; cu.bevel_depth=rad; cu.bevel_resolution=2
        sp=cu.splines.new('NURBS'); sp.points.add(len(pts)-1)
        for i,p in enumerate(pts): sp.points[i].co=(p[0],p[1],p[2],1)
        sp.use_endpoint_u=True; sp.order_u=3
        ob=bpy.data.objects.new(nm,cu); bpy.context.collection.objects.link(ob); ob.data.materials.append(hm)
        parts.append(ob)
    tt=1.15
    if style=="pony":
        base=(0,0.35*r,hc+r)
        strand(f"P0_{key}",[base,(-0.03,1.2*r,hc),(-0.04,1.4*r,hc-0.6*r),(-0.03,1.2*r,tt)],r*0.45)
        strand(f"P1_{key}",[base,(0.03,1.25*r,hc-0.1*r),(0.04,1.4*r,hc-0.7*r),(0.03,1.2*r,tt)],r*0.42)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.28,location=base); ti=bpy.context.object
        ti.name=f"Tie_{key}"; smooth(ti); ti.data.materials.append(hm); parts.append(ti)
    elif style=="long":
        for si,s in enumerate((1,-1)):
            strand(f"Lw{si}_{key}",[(s*0.95*r,0.2*r,hc+0.5*r),(s*1.15*r,0.5*r,hc-0.5*r),
                (s*1.05*r,0.6*r,tt+0.1),(s*0.85*r,0.6*r,tt-0.12)],r*0.5)
        strand(f"Lb_{key}",[(0,1.0*r,hc+0.2*r),(0,1.2*r,hc-0.6*r),(0,1.0*r,tt+0.05),(0.02,0.8*r,tt-0.15)],r*0.5)
    elif style=="bun":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.5,location=(0,0.12*r,hc+1.12*r)); bn=bpy.context.object
        bn.name=f"Bun_{key}"; smooth(bn); bn.data.materials.append(hm); parts.append(bn)
        for si,s in enumerate((1,-1)):
            strand(f"Wp{si}_{key}",[(s*0.9*r,0.1*r,hc+0.4*r),(s*1.02*r,0,hc-0.3*r),(s*0.85*r,0.15*r,hc-0.9*r)],r*0.16)
    elif style=="halfup":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.26,location=(0,0.2*r,hc+0.9*r)); t=bpy.context.object
        t.name=f"Ht_{key}"; smooth(t); t.data.materials.append(hm); parts.append(t)
        for si,s in enumerate((1,-1)):
            strand(f"Hs{si}_{key}",[(s*0.95*r,0.2*r,hc+0.5*r),(s*1.18*r,0.5*r,hc-0.5*r),
                (s*1.05*r,0.6*r,tt+0.05),(s*0.82*r,0.6*r,tt-0.14)],r*0.46)
        strand(f"Hb_{key}",[(0,1.0*r,hc+0.1*r),(0,1.3*r,hc-0.7*r),(0,1.0*r,tt),(0,0.8*r,tt-0.18)],r*0.5)
    return parts

FAB_TEX = {
    "jeogori": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-jeogori-ivory.png",
    "y": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-chima-yellow.png",
    "u": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-chima-lavender.png",
    "n": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-chima-navy.png",
    "a": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-chima-pink.png",
    "glove": r"C:\code\psmon\pencil-creator\image\gemini\2026-08-08-hanbok-glove-ivory.png",
}

def mat_cloth(name, path, tile=1.0, rough=0.45):
    """FRONT-projected cloth (X->U, Z->V): embroidery hem stays at the hem."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); cb = nt.nodes.new("ShaderNodeCombineXYZ")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (tile, tile, tile)
    it = nt.nodes.new("ShaderNodeTexImage")
    it.image = bpy.data.images.load(path); it.extension = 'EXTEND'
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"], cb.inputs["X"])
    nt.links.new(sep.outputs["Z"], cb.inputs["Y"])
    nt.links.new(cb.outputs["Vector"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], it.inputs["Vector"])
    nt.links.new(it.outputs["Color"], b.inputs["Base Color"])
    return m

def build_leg_colliders(key):
    """Invisible smooth leg capsules — the ONLY cloth colliders besides the floor.
    Body/arms never touch the chima sim (arm-swing was shredding the silk)."""
    from mathutils import Vector
    objs = []
    for s in (1, -1):
        a = Vector((s*0.085, 0.0, 0.98)); b = Vector((s*0.10, 0.005, 0.06))
        mid = (a + b) / 2; vec = b - a
        # radius1 = thigh end (thick, encloses 0.064 leg), radius2 = ankle end (thin)
        bpy.ops.mesh.primitive_cone_add(radius1=0.072, radius2=0.042, depth=vec.length,
                                        location=mid, vertices=16)
        o = bpy.context.object; o.name = f"LegColl_{key}_{s}"
        z = Vector((0, 0, 1)); n = vec.normalized(); ax = z.cross(n)
        if ax.length > 1e-6:
            o.rotation_mode = 'AXIS_ANGLE'
            o.rotation_axis_angle = (z.angle(n), ax.x, ax.y, ax.z)
        smooth(o)
        o.hide_render = True
        objs.append(o)
    return objs

def build_arm_colliders(key):
    """Invisible forearm+hand capsules — the chima gets PUSHED by hands/arms
    instead of letting them sink into the silk."""
    from mathutils import Vector
    objs = []
    for s in (1, -1):
        a = Vector((s*0.25, -0.015, 0.995)); b = Vector((s*0.33, -0.07, 0.74))
        mid = (a + b) / 2; vec = b - a
        bpy.ops.mesh.primitive_cone_add(radius1=0.040, radius2=0.036, depth=vec.length,
                                        location=mid, vertices=12)
        o = bpy.context.object; o.name = f"ArmColl_{key}_{s}"
        z = Vector((0, 0, 1)); n = vec.normalized(); ax = z.cross(n)
        if ax.length > 1e-6:
            o.rotation_mode = 'AXIS_ANGLE'
            o.rotation_axis_angle = (z.angle(n), ax.x, ax.y, ax.z)
        smooth(o); o.hide_render = True
        objs.append(o)
    return objs

def build_hanbok(key):
    """Jeogori (fitted, bust volume kept) + long flowing chima hiding the legs."""
    parts = []
    jeo = mat_cloth("M_Jeogori", FAB_TEX["jeogori"], tile=1.6, rough=0.4)
    chi = mat_cloth(f"M_Chima_{key}", FAB_TEX[key], tile=1.0, rough=0.42)
    # jeogori: FITTED bodice — narrower than the shoulders so arms read clearly
    # SLIM fitted bodice — hugs chest->waist tightly (no hip constraint up here)
    top = cone(f"G_Jeo_{key}", (0, -0.008, 1.335), 0.066, 0.062, 0.24, jeo, sy=0.82)
    parts.append(top)
    # member INITIAL badge on the chest (Y/U/N/A) — alpha decal plane facing -Y
    initm = bpy.data.materials.new(f"M_Init_{key}"); initm.use_nodes = True
    int_nt = initm.node_tree; ib = int_nt.nodes["Principled BSDF"]
    it = int_nt.nodes.new("ShaderNodeTexImage")
    it.image = bpy.data.images.load(rf"C:\code\psmon\pencil-creator\design\idola\facetex\init_{key}.png")
    int_nt.links.new(it.outputs["Color"], ib.inputs["Base Color"])
    int_nt.links.new(it.outputs["Alpha"], ib.inputs["Alpha"])
    ib.inputs["Roughness"].default_value = 0.4
    initm.blend_method = 'CLIP'
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.076, 1.385))
    badge = bpy.context.object; badge.name = f"G_Init_{key}"
    badge.rotation_euler = (math.radians(90), 0, 0)     # face -Y (front)
    badge.scale = (0.075, 0.090, 1)                     # bigger, upper-chest
    badge.data.materials.append(initm); parts.append(badge)
    # 동정 collar band — white hanbok collar wrapping the neck base, bridges the
    # head/neck bust into the bodice so the junction reads continuous (no cut-off).
    dong = mat("M_Dongjeong", (0.98, 0.98, 0.97, 1), 0.35)
    bpy.ops.mesh.primitive_cone_add(radius1=0.062, radius2=0.050, depth=0.12,
                                    location=(0, 0.004, 1.435), vertices=24)
    col = bpy.context.object; col.name = f"G_Collar_{key}"; col.scale = (1, 0.92, 1)
    smooth(col); col.data.materials.append(dong); parts.append(col)
    # shoulder caps (deltoid puffs in jeogori silk) — arms attach to visible shoulders
    for s in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.050, segments=18, ring_count=12,
            location=(s*0.108, 0.0, 1.392))
        cap = bpy.context.object; cap.name = f"G_SlvCap_{key}_{s}"
        cap.scale = (1.0, 0.85, 0.95); smooth(cap); cap.data.materials.append(jeo)
        parts.append(cap)
    # fabric bust volume over the jeogori — soft merged curve, not two balls
    for s in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.047, segments=20, ring_count=12,
            location=(s*0.036, -0.040, 1.315))
        b = bpy.context.object; b.name = f"G_JeoBust_{key}_{s}"
        b.scale = (1.05, 0.58, 0.85); smooth(b); b.data.materials.append(jeo)
        parts.append(b)
    # chima: SLIM modern (계량) A-line — hem 0.17, waist 0.145 (was tent 0.28).
    # SKINNED to the body (not cloth sim): follows hips/legs -> never poked, stable.
    # Clears the hips (>=0.15 at hip height) so the static skirt has no leg poke.
    # slim waist (0.12, down from 0.145) flaring to a slightly wider hem (0.185)
    # so the waist reads slim while the mid-skirt still clears the hips.
    bpy.ops.mesh.primitive_cone_add(radius1=0.185, radius2=0.12, depth=1.06,
                                    location=(0, 0, 1.18 - 0.53), vertices=48,
                                    end_fill_type='NOTHING')
    ch = bpy.context.object; ch.name = f"G_Chima_{key}"
    ch.scale = (1.0, 0.92, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.subdivide(number_cuts=6)
    bpy.ops.object.mode_set(mode='OBJECT')
    smooth(ch); ch.data.materials.append(chi)
    zmin = min(v.co.z for v in ch.data.vertices); zmax = max(v.co.z for v in ch.data.vertices)
    hem = ch.vertex_groups.new(name="hem")     # for the wave-flutter falloff
    for v in ch.data.vertices:
        zn = (v.co.z - zmin) / (zmax - zmin)
        w = 1.0 - zn
        hem.add([v.index], w * w, 'REPLACE')
    parts.append(ch)
    # jeogori sleeves — hanbok baerae: widening toward the wrist, follow arm bones
    def _tube(nm, p1, p2, r1, r2, m, verts=16):
        from mathutils import Vector
        a, b = Vector(p1), Vector(p2)
        mid = (a + b) / 2; vec = b - a
        bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=vec.length,
                                        location=mid, vertices=verts)
        o = bpy.context.object; o.name = nm
        z = Vector((0, 0, 1)); n = vec.normalized()
        ax = z.cross(n)
        if ax.length > 1e-6:
            o.rotation_mode = 'AXIS_ANGLE'
            o.rotation_axis_angle = (z.angle(n), ax.x, ax.y, ax.z)
        smooth(o); o.data.materials.append(m)
        return o
    glv = mat_cloth("M_Glove", FAB_TEX["glove"], tile=2.0, rough=0.5)
    for s in (1, -1):
        sh = (s*0.112, 0, 1.395); el = (s*0.20, 0.02, 1.115); wr = (s*0.30, -0.05, 0.875)
        parts.append(_tube(f"G_SlvU_{key}_{s}", sh, el, 0.038, 0.034, jeo))
        parts.append(_tube(f"G_SlvF_{key}_{s}", el, wr, 0.035, 0.052, jeo))
        # silk GLOVE — smooth mitten cover, hides the finger-less hand stub
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.034, segments=18, ring_count=12,
            location=(s*0.315, -0.06, 0.775))
        gl = bpy.context.object; gl.name = f"G_SlvGlove_{key}_{s}"
        gl.scale = (0.85, 1.0, 1.55); smooth(gl); gl.data.materials.append(glv)
        parts.append(gl)
    # flat shoes (mostly hidden under the chima)
    shm = mat(f"M_Shoe_{key}", (0.94, 0.92, 0.90, 1), 0.5)
    for s in (1, -1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(s*0.10, -0.05, 0.025))
        sh = bpy.context.object; sh.name = f"G_Shoe_{key}_{s}"
        sh.scale = (0.045, 0.11, 0.05); sh.data.materials.append(shm); parts.append(sh)
    return parts

def build_head(key,style,color):
    """UNIFIED head+neck bust — one mesh, one wrapped texture (face+hair+neck).
    No more separate white 'cast' neck; the texture's neck skin flows onto it."""
    hc=1.465; r=0.062*H            # head lowered ~2.5cm to seat into the bodice
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r,segments=36,ring_count=26,location=(0,0,hc))
    h=bpy.context.object; h.name=f"Head_{key}"; h.scale=(0.92,0.96,1.10)
    for v in h.data.vertices:
        dz=v.co.z
        if dz<0:
            t=min(1.0,(-dz)/(r*1.10)); v.co.x*=(1-0.32*t); v.co.y+=(-0.10*r)*(t**1.5)
    smooth(h)
    # neck: extended DOWNWARD so its base plunges into the collar (no floating gap)
    bpy.ops.mesh.primitive_cone_add(radius1=0.052,radius2=0.043,depth=0.16,
                                    location=(0,0.006,1.355),vertices=24)
    neck=bpy.context.object; neck.scale=(1,0.88,1); smooth(neck)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.select_all(action='DESELECT')
    neck.select_set(True); h.select_set(True); bpy.context.view_layer.objects.active=h
    bpy.ops.object.join()                      # bust bbox = head+neck -> texture spans both
    h.data.materials.clear()
    h.data.materials.append(mat_face(key))
    return [h]

def parent_bone(objs,arm,bname):
    for o in objs:
        o.parent=arm; o.parent_type='BONE'; o.parent_bone=bname
        o.matrix_parent_inverse=(arm.matrix_world@arm.pose.bones[bname].matrix).inverted()

MEMBERS={
 "y":dict(cx=-1.45,face="y",hair=("long",(0.36,0.22,0.14,1)),
     outfit=dict(top_color=(1.0,0.90,0.55,1),bottom="shorts",bottom_color=(0.66,0.76,0.86,1),
                 shoe_color=(0.96,0.96,0.96,1),platform=False)),
 "u":dict(cx=-0.48,face="u",hair=("pony",(0.10,0.08,0.09,1)),
     outfit=dict(top_color=(0.79,0.66,0.91,1),bottom="skirt",bottom_color=(0.97,0.96,0.98,1),
                 shoe_color=(0.96,0.96,0.98,1),platform=True,top_rough=0.45)),
 "n":dict(cx=0.48,face="n",hair=("bun",(0.42,0.30,0.18,1)),
     outfit=dict(top_color=(0.22,0.22,0.25,1),bottom="shorts",bottom_color=(0.20,0.20,0.23,1),
                 shoe_color=(0.15,0.15,0.17,1),platform=False)),
 "a":dict(cx=1.45,face="a",hair=("halfup",(0.91,0.76,0.46,1)),
     outfit=dict(top_color=(0.97,0.72,0.84,1),bottom="skirt2",bottom_color=(0.98,0.80,0.90,1),
                 shoe_color=(0.97,0.95,0.96,1),platform=True,top_rough=0.5)),
}

def build_member(key):
    cfg=MEMBERS[key]
    base=build_base(key)
    arm=build_armature(key)
    garments=build_hanbok(key)   # slim chima is skinned; no cloth colliders needed
    head=build_head(key,cfg["hair"][0],cfg["hair"][1])
    bind([base]+garments,arm)
    parent_bone(head,arm,"head")
    arm.location.x=cfg["cx"]           # move whole rigged member to its slot
    return arm

def setup_scene():
    # outdoor concert stage environment (sky/stage/LED/truss/lights/lego crowd)
    import sys, importlib
    d = r"C:\Users\psmon\infra\blender"
    if d not in sys.path: sys.path.insert(0, d)
    import yuna_stageenv as env
    importlib.reload(env)
    env.build_env()
    bpy.ops.object.camera_add(); cam=bpy.context.object; bpy.context.scene.camera=cam
    return cam

def render(cam,loc,rot,lens,path,x=1200,y=1150,s=48):
    cam.location=loc; cam.rotation_euler=rot; cam.data.lens=lens
    sc=bpy.context.scene; sc.render.engine='BLENDER_EEVEE'
    sc.render.resolution_x=x; sc.render.resolution_y=y
    sc.render.image_settings.file_format='PNG'; sc.render.filepath=path
    try: sc.eevee.taa_render_samples=s
    except: pass
    import os; os.makedirs(os.path.dirname(path),exist_ok=True); bpy.ops.render.render(write_still=True)

def main():
    reset()
    for k in ("y","u","n","a"): build_member(k)
    cam=setup_scene()
    render(cam,(0,-6.0,1.0),(math.radians(90),0,0),42, OUT+r"\rig4_group_front.png")
    render(cam,(4.5,-5.0,1.05),(math.radians(88),0,math.radians(38)),44, OUT+r"\rig4_group_34.png")
    render(cam,(0,-3.0,1.45),(math.radians(90),0,0),80, OUT+r"\rig4_faces.png",1400,600)
    bpy.ops.wm.save_as_mainfile(filepath=REPO_BLEND)
    print("RIG4_DONE members=4")

main()
