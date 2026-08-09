"""Motion library -> state-machine 군무 preview.
Retargets each Bandai BVH clip onto our rig as an ACTION, then sequences the
states on all 4 members via NLA with crossfade transitions + per-member phase
offset. Verifies smooth motion-to-motion transitions.

Run: blender -b --factory-startup -P yuna_motionlib.py
"""
import bpy, math, os, sys
BLEND = r"C:\code\psmon\pencil-creator\design\blend\yuna-rig4.blend"
LIB = r"C:\code\psmon\pencil-creator\design\idola\mocap"
OUT = r"C:\Users\psmon\infra\blender\out\motionlib"
FPS = 24

# state -> bvh file
CLIPS = {
    "IDLE":      "dataset-1_dance-short_normal_001.bvh",
    "DANCE":     "dataset-1_dance-long_normal_001.bvh",
    "WAVE":      "dataset-1_byebye_musical_001.bvh",
    "WALK":      "dataset-1_walk_musical_001.bvh",
    "GESTURE":   "dataset-1_guide_feminine_001.bvh",
}
MAP = [("Hips","hips"),("Spine","spine"),("Chest","chest"),("Neck","neck"),("Head","head"),
    ("UpperArm_L","upperarm.L"),("LowerArm_L","forearm.L"),("Hand_L","hand.L"),
    ("UpperArm_R","upperarm.R"),("LowerArm_R","forearm.R"),("Hand_R","hand.R"),
    ("UpperLeg_L","thigh.L"),("LowerLeg_L","shin.L"),("Foot_L","foot.L"),
    ("UpperLeg_R","thigh.R"),("LowerLeg_R","shin.R"),("Foot_R","foot.R")]
ORDER = ["hips","spine","chest","neck","head","upperarm.L","forearm.L","hand.L",
         "upperarm.R","forearm.R","hand.R","thigh.L","shin.L","foot.L","thigh.R","shin.R","foot.R"]

def retarget_to_action(our, bvh_path, action_name):
    """Import a BVH, retarget onto `our`, return a baked Action (frames start at 1)."""
    bpy.ops.import_anim.bvh(filepath=bvh_path, axis_forward='-Z', axis_up='Y')
    bvh = bpy.context.object; bvh.location=(0,0,0); bvh.scale=(0.0132,)*3
    bpy.context.view_layer.update()
    sc = bpy.context.scene
    f0, f1 = sc.frame_start, sc.frame_end
    our_map = {u:b for b,u in MAP}
    opb, bpb = our.pose.bones, bvh.pose.bones
    MW, MWi = our.matrix_world, our.matrix_world.inverted()
    # clear our action
    if our.animation_data: our.animation_data.action = None
    for u in ORDER: opb[u].rotation_mode='QUATERNION'
    # rest ref = bvh frame f0 (neutral)
    sc.frame_set(f0); off={}
    for b,u in MAP:
        if u in opb and b in bpb:
            rq=(bvh.matrix_world@bpb[b].matrix).to_quaternion()
            orq=(MW@our.data.bones[u].matrix_local).to_quaternion()
            off[u]=rq.inverted()@orq
    for f in range(f0, f1+1):
        sc.frame_set(f)
        for u in ORDER:
            if u not in off: continue
            q=(bvh.matrix_world@bpb[our_map[u]].matrix).to_quaternion()@off[u]
            pbb=opb[u]; hw=(MW@pbb.matrix).to_translation()
            wm=q.to_matrix().to_4x4(); wm.translation=hw
            pbb.matrix=MWi@wm
            pbb.keyframe_insert("rotation_quaternion", frame=f-f0+1)  # action starts at 1
    act = our.animation_data.action
    act.name = action_name
    act.use_fake_user = True
    our.animation_data.action = None
    bpy.data.objects.remove(bvh, do_unlink=True)
    return act, (f1-f0+1)

def import_clip(path):
    """Import a BVH (hidden), return (obj, f0, f1)."""
    bpy.ops.import_anim.bvh(filepath=path, axis_forward='-Z', axis_up='Y')
    o = bpy.context.object; o.location=(0,0,0); o.scale=(0.0132,)*3
    bpy.context.view_layer.update()
    sc = bpy.context.scene
    return o, sc.frame_start, sc.frame_end

def bake_slot(member, clip, tl_start, dur_frames, phase, step=1):
    """Retarget `clip` (bvh, f0,f1) directly onto `member` timeline [tl_start..],
    time-scaled to dur_frames. Writes rotation_quaternion keys. Slerp-crossfade
    with whatever is already keyed in the first BLEND_F frames (smooth transition)."""
    bvh, f0, f1 = clip
    sc = bpy.context.scene
    our_map = {u:b for b,u in MAP}
    opb, bpb = member.pose.bones, bvh.pose.bones
    MW, MWi = member.matrix_world, member.matrix_world.inverted()
    for u in ORDER: opb[u].rotation_mode='QUATERNION'
    # rest ref = clip f0
    sc.frame_set(f0); off={}
    for b,u in MAP:
        if u in opb and b in bpb:
            rq=(bvh.matrix_world@bpb[b].matrix).to_quaternion()
            orq=(MW@member.data.bones[u].matrix_local).to_quaternion()
            off[u]=rq.inverted()@orq
    n = f1 - f0
    BLEND_F = 8
    ks = list(range(0, dur_frames + 1, step))
    if ks[-1] != dur_frames: ks.append(dur_frames)   # always key the slot end
    for k in ks:
        T = tl_start + k
        src = f0 + (k / max(1, dur_frames)) * n     # resample source
        sc.frame_set(int(round(src)))
        w = min(1.0, k / BLEND_F) if k < BLEND_F else 1.0   # crossfade in
        for u in ORDER:
            if u not in off: continue
            q = (bvh.matrix_world@bpb[our_map[u]].matrix).to_quaternion() @ off[u]
            pbb = opb[u]
            if w < 1.0:
                # crossfade in WORLD space (same frame as q). Mixing q(world) with
                # the LOCAL rotation_quaternion tips/flips the rig -> read prev as world.
                prev_w = (MW@pbb.matrix).to_quaternion()   # held pose from previous slot
                q = prev_w.slerp(q, w)                     # slerp = shortest path
            hw = (MW@pbb.matrix).to_translation()
            wm = q.to_matrix().to_4x4(); wm.translation = hw
            pbb.matrix = MWi @ wm
            # CRITICAL: propagate this bone's pose before setting/keying its children.
            # Without it the child's LOCAL rotation_quaternion is computed against a
            # STALE parent -> error compounds on large rotations -> rig flips on render.
            bpy.context.view_layer.update()
            pbb.keyframe_insert("rotation_quaternion", frame=T)

def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    sc = bpy.context.scene; sc.render.fps=FPS
    # import each unique clip once (hidden)
    clips = {}
    for st, fn in CLIPS.items():
        clips[st] = import_clip(os.path.join(LIB, fn))
        print("imported", st)

    SEQ = [("IDLE",4),("DANCE",8),("WAVE",4),("GESTURE",4),("WALK",5),("IDLE",4)]
    OVERLAP = 8
    members = ["y","u","n","a"]
    offs = {"y":0,"u":4,"n":8,"a":12}
    total = int(sum(d for _,d in SEQ)*FPS)
    for key in members:
        arm = bpy.data.objects.get(f"Rig_{key}")
        if not arm: continue
        if arm.animation_data: arm.animation_data.action = None
        t = 1 + offs[key]
        for st, dur in SEQ:
            dframes = int(dur*FPS)
            bake_slot(arm, clips[st], t, dframes, 0)
            t += dframes - OVERLAP     # next clip overlaps -> slerp crossfade in bake_slot
        print("sequenced", key)
    sc.frame_start=1; sc.frame_end=total + max(offs.values())

    # 3) render group preview
    os.makedirs(OUT, exist_ok=True)
    for o in bpy.data.objects:
        if o.type=='MESH' and (o.name.startswith("Aud_") or o.name.startswith("Stage_") or o.name in ("Ground","SkyPlate")):
            o.hide_render=True
    cam=sc.camera; cam.location=(0,-5.6,1.2); cam.rotation_euler=(math.radians(90),0,0); cam.data.lens=40
    sc.render.engine='BLENDER_EEVEE'; sc.render.resolution_x=900; sc.render.resolution_y=620
    try: sc.eevee.taa_render_samples=10
    except: pass
    sc.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"motionlib.blend"))
    if QUICK:   # fast validation: one still per state
        for f in (50,180,320,410,500,620):
            sc.frame_set(f); sc.render.filepath=os.path.join(OUT,"q_%04d.png"%f)
            bpy.ops.render.render(write_still=True)
        print("MOTIONLIB_QUICK_DONE")
    else:
        sc.render.filepath=os.path.join(OUT,"m_")
        bpy.ops.render.render(animation=True)
        print("MOTIONLIB_DONE total %d frames" % total)

if __name__ == "__main__":
    QUICK = "--quick" in sys.argv
    main()
