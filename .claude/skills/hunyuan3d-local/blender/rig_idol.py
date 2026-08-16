# -*- coding: utf-8 -*-
# idol-star-pbr.glb 자동 휴머노이드 리깅 → FBX (Unity Humanoid 리타깃용)
# 치비 비율에 맞춰 바운딩박스 기반으로 뼈 배치 + 자동 웨이트. 완벽하진 않아도 모션 검증용.
import bpy, math
from mathutils import Vector

GLB = r"C:\code\psmon\pencil-creator\design\blend\out\idol-star-pbr.glb"
OUT_FBX = r"C:\code\psmon\pencil-creator\design\blend\out\idol-star-rigged.fbx"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
# 여러 메시면 합치기
if len(meshes) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for m in meshes: m.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
mesh = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
mesh.name = "IdolMesh"
# 트랜스폼 적용(원점/스케일 정규화)
bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 월드 바운즈
vs = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
minz = min(v.z for v in vs); maxz = max(v.z for v in vs)
minx = min(v.x for v in vs); maxx = max(v.x for v in vs)
cx = (minx + maxx) * 0.5
H = maxz - minz
W = maxx - minx
def Z(f): return minz + f * H     # 높이 비율 → z
sx = W * 0.10                      # 어깨 반너비
lx = W * 0.11                      # 다리 반너비

# 아마추어 생성
arm_data = bpy.data.armatures.new("IdolArmature")
arm = bpy.data.objects.new("IdolArmature", arm_data)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

def bone(name, head, tail, parent=None):
    b = eb.new(name)
    b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = parent; b.use_connect = False
    return b

# 치비 비율: 다리 짧고 머리 큼
hips   = bone("Hips",  (cx, 0, Z(0.42)), (cx, 0, Z(0.50)))
spine  = bone("Spine", (cx, 0, Z(0.50)), (cx, 0, Z(0.57)), hips)
chest  = bone("Chest", (cx, 0, Z(0.57)), (cx, 0, Z(0.64)), spine)
neck   = bone("Neck",  (cx, 0, Z(0.64)), (cx, 0, Z(0.70)), chest)
head   = bone("Head",  (cx, 0, Z(0.70)), (cx, 0, Z(1.00)), neck)
# 팔 (A-포즈: 아래-바깥). 어깨 높이 ~0.62
shz = Z(0.62)
lsh = bone("LeftShoulder",  (cx, 0, shz), (cx + sx, 0, shz), chest)
lua = bone("LeftUpperArm",  (cx + sx, 0, shz), (cx + sx + W*0.16, 0, Z(0.50)), lsh)
lla = bone("LeftLowerArm",  (cx + sx + W*0.16, 0, Z(0.50)), (cx + sx + W*0.28, 0, Z(0.40)), lua)
lha = bone("LeftHand",      (cx + sx + W*0.28, 0, Z(0.40)), (cx + sx + W*0.34, 0, Z(0.36)), lla)
rsh = bone("RightShoulder", (cx, 0, shz), (cx - sx, 0, shz), chest)
rua = bone("RightUpperArm", (cx - sx, 0, shz), (cx - sx - W*0.16, 0, Z(0.50)), rsh)
rla = bone("RightLowerArm", (cx - sx - W*0.16, 0, Z(0.50)), (cx - sx - W*0.28, 0, Z(0.40)), rua)
rha = bone("RightHand",     (cx - sx - W*0.28, 0, Z(0.40)), (cx - sx - W*0.34, 0, Z(0.36)), rla)
# 다리
lul = bone("LeftUpperLeg",  (cx + lx, 0, Z(0.42)), (cx + lx, 0, Z(0.22)), hips)
lll = bone("LeftLowerLeg",  (cx + lx, 0, Z(0.22)), (cx + lx, 0, Z(0.04)), lul)
lft = bone("LeftFoot",      (cx + lx, 0, Z(0.04)), (cx + lx, -W*0.12, Z(0.0)), lll)
rul = bone("RightUpperLeg", (cx - lx, 0, Z(0.42)), (cx - lx, 0, Z(0.22)), hips)
rll = bone("RightLowerLeg", (cx - lx, 0, Z(0.22)), (cx - lx, 0, Z(0.04)), rul)
rft = bone("RightFoot",     (cx - lx, 0, Z(0.04)), (cx - lx, -W*0.12, Z(0.0)), rll)

bpy.ops.object.mode_set(mode='OBJECT')

# 최근접-뼈 리지드 스키닝 (heat weighting이 이 메시에서 실패 → 확실한 방법)
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm_data.bones:
    mesh.vertex_groups.new(name=b.name)
segs = [(b.name, arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local) for b in arm_data.bones]
def dseg(p, a, b):
    ab = b - a; L2 = ab.length_squared
    t = 0.0 if L2 < 1e-9 else max(0.0, min(1.0, (p - a).dot(ab) / L2))
    return (p - (a + ab * t)).length
for v in mesh.data.vertices:
    p = mesh.matrix_world @ v.co
    best = min(segs, key=lambda s: dseg(p, s[1], s[2]))[0]
    mesh.vertex_groups[best].add([v.index], 1.0, 'REPLACE')
mod = mesh.modifiers.new("Armature", "ARMATURE"); mod.object = arm
mesh.parent = arm

# FBX 익스포트 (아마추어 + 메시)
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.fbx(filepath=OUT_FBX, use_selection=True, add_leaf_bones=False,
                         path_mode='COPY', embed_textures=False,
                         object_types={'ARMATURE','MESH'}, mesh_smooth_type='FACE',
                         bake_anim=False)
import os
print("RIGGED FBX:", OUT_FBX, "exists:", os.path.exists(OUT_FBX), "size:", os.path.getsize(OUT_FBX) if os.path.exists(OUT_FBX) else 0)
print("BOUNDS H=%.3f W=%.3f minz=%.3f maxz=%.3f cx=%.3f" % (H, W, minz, maxz, cx))
