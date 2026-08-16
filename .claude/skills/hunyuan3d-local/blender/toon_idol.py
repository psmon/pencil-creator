# -*- coding: utf-8 -*-
# idol-star-pbr.glb → 툰(cel-shaded) 셰이딩 + Freestyle 외곽선, 정면/3-4 뷰 렌더 (CLI 헤드리스)
# PBR baseColor 텍스처는 유지하고 라이팅만 셀 스텝으로 대체.
import bpy, math, os
from mathutils import Vector

GLB = r"C:\code\psmon\pencil-creator\design\blend\out\idol-star-pbr.glb"
OUT = r"C:\code\psmon\pencil-creator\design\blend\out"

# --- 빈 씬 (CLI 헤드리스 한정) ---
bpy.ops.wm.read_factory_settings(use_empty=True)

# --- GLB 임포트 ---
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# 임포트 메시 통합 바운딩 → 중심/스케일 파악
mins = Vector(( 1e9,  1e9,  1e9))
maxs = Vector((-1e9, -1e9, -1e9))
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        mins.x, mins.y, mins.z = min(mins.x, w.x), min(mins.y, w.y), min(mins.z, w.z)
        maxs.x, maxs.y, maxs.z = max(maxs.x, w.x), max(maxs.y, w.y), max(maxs.z, w.z)
center = (mins + maxs) * 0.5
size = (maxs - mins)
height = max(size.z, 1e-3)

# 스무스 셰이딩
for o in meshes:
    for p in o.data.polygons:
        p.use_smooth = True

# --- 툰 머티리얼 변환: baseColor 텍스처 유지 + 셀 스텝 라이팅 ---
def toonify(mat):
    if not mat.use_nodes:
        mat.use_nodes = True
    nt = mat.node_tree
    # 기존 baseColor 이미지 찾기
    img = None
    for n in nt.nodes:
        if n.type == "TEX_IMAGE" and n.image:
            img = n.image
            break
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (700, 0)
    emit = nt.nodes.new("ShaderNodeEmission");       emit.location = (500, 0)
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse");     diff.location = (-400, -200)
    s2r  = nt.nodes.new("ShaderNodeShaderToRGB");     s2r.location  = (-200, -200)
    ramp = nt.nodes.new("ShaderNodeValToRGB");        ramp.location = (0, -200)
    mul  = nt.nodes.new("ShaderNodeMixRGB");          mul.location  = (300, 0)
    tex  = nt.nodes.new("ShaderNodeTexImage");        tex.location  = (0, 200)
    if img:
        tex.image = img
    # 셀 스텝(3밴드, 상수보간)
    cr = ramp.color_ramp
    cr.interpolation = "CONSTANT"
    cr.elements[0].position = 0.0;  cr.elements[0].color = (0.55, 0.55, 0.62, 1)  # 그림자
    cr.elements[1].position = 0.5;  cr.elements[1].color = (0.85, 0.85, 0.9, 1)   # 중간
    e3 = cr.elements.new(0.82);     e3.color = (1.0, 1.0, 1.0, 1)                  # 하이라이트
    mul.blend_type = "MULTIPLY"
    mul.inputs[0].default_value = 1.0
    L = nt.links.new
    L(diff.outputs["BSDF"], s2r.inputs["Shader"])
    L(s2r.outputs["Color"], ramp.inputs["Fac"])
    L(ramp.outputs["Color"], mul.inputs[1])   # 라이팅 스텝
    L(tex.outputs["Color"],  mul.inputs[2])    # baseColor
    L(mul.outputs["Color"],  emit.inputs["Color"])
    L(emit.outputs["Emission"], out.inputs["Surface"])

for mat in list(bpy.data.materials):
    toonify(mat)

# --- 조명 (부드러운 키 + 필 + 월드 앰비언트) ---
def add_sun(name, loc, energy, angle=0.3):
    d = bpy.data.lights.new(name, "SUN"); d.energy = energy; d.angle = angle
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (math.radians(55), 0, math.radians(35))
    return o
add_sun("Key", (center.x + height, center.y - height, center.z + height*1.4), 3.0)
add_sun("Fill", (center.x - height, center.y - height, center.z + height*0.6), 1.2)
world = bpy.data.worlds.new("W"); bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.96, 0.96, 0.98, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

# --- 렌더 설정 (EEVEE + Freestyle 외곽선) ---
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = False
scene.render.resolution_x = 1080
scene.render.resolution_y = 1350
scene.render.image_settings.file_format = "PNG"
# Freestyle 검은 외곽선
scene.render.use_freestyle = True
vl = scene.view_layers[0]
vl.use_freestyle = True
fs = vl.freestyle_settings
if not fs.linesets:
    fs.linesets.new("outline")
ls = fs.linesets[0]
if ls.linestyle is None:
    ls.linestyle = bpy.data.linestyles.new("OutlineStyle")
ls.linestyle.color = (0.05, 0.05, 0.08)
ls.linestyle.thickness = 2.2

# --- 카메라 (오브젝트를 바라보게) ---
def look_at_camera(name, loc):
    cam_data = bpy.data.cameras.new(name); cam = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = loc
    direction = (center - Vector(loc))
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = 60
    return cam

dist = height * 1.9
views = {
    "front": (center.x, center.y - dist, center.z + height*0.12),
    "34":    (center.x + dist*0.72, center.y - dist*0.72, center.z + height*0.18),
}

os.makedirs(OUT, exist_ok=True)
for vname, loc in views.items():
    cam = look_at_camera("Cam_" + vname, loc)
    scene.camera = cam
    path = os.path.join(OUT, f"idol-toon-{vname}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDERED:", path)

print("DONE meshes=%d height=%.3f center=(%.2f,%.2f,%.2f)" % (len(meshes), height, center.x, center.y, center.z))
