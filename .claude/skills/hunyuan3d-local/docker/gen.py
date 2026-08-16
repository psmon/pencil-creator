#!/usr/bin/env python3
"""
컨테이너 내부 생성 스크립트 — 참조 이미지 → 3D 메시(GLB, PBR).
repo는 /app/Hunyuan3D-2.1, 입출력은 마운트된 /work.
(text→image 는 호스트(Windows)에서 image-gen 으로 처리 후 --image 로 전달)
"""
import argparse, os, sys, time, gc
from pathlib import Path

REPO = "/app/Hunyuan3D-2.1"
os.chdir(REPO)
for p in (REPO, f"{REPO}/hy3dshape", f"{REPO}/hy3dpaint"):
    if p not in sys.path:
        sys.path.insert(0, p)


def _run(torch, fn):
    """gfx1151 GPU 커널 결함 자동 폴백: MIOpen conv → native, SDPA no-kernel → math backend."""
    try:
        return fn()
    except RuntimeError as e:
        msg = str(e).lower()
        if "miopen" in msg or "convolution" in msg:
            print(f"[gen] MIOpen conv 실패 → cudnn 비활성 후 native conv 재시도")
            torch.backends.cudnn.enabled = False
            return fn()
        if "available kernel" in msg or "aborting execution" in msg or "flash" in msg:
            print(f"[gen] SDPA 커널 없음 → math attention backend 강제 후 재시도")
            torch.backends.cuda.enable_flash_sdp(False)
            torch.backends.cuda.enable_mem_efficient_sdp(False)
            torch.backends.cuda.enable_math_sdp(True)
            return fn()
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True, help="참조 이미지 (컨테이너 경로, 보통 /work/..)")
    ap.add_argument("--out", default="/work/out.glb")
    ap.add_argument("--skip-paint", action="store_true")
    ap.add_argument("--views", type=int, default=6)
    ap.add_argument("--resolution", type=int, default=512)
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()

    import torch
    try:
        from torchvision_fix import apply_fix
        apply_fix()
    except Exception as e:
        print(f"[gen] torchvision_fix 미적용({e!r})")

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[gen] device={dev} ({torch.cuda.get_device_name(0) if dev=='cuda' else 'CPU'})")
    if args.seed is not None:
        torch.manual_seed(args.seed)
        if dev == "cuda":
            torch.cuda.manual_seed_all(args.seed)

    from PIL import Image
    from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline

    print("[gen] 형상 파이프라인 로드…")
    shape = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2.1")

    pil = Image.open(args.image)
    if pil.mode != "RGBA":
        try:
            from hy3dshape.rembg import BackgroundRemover
            print("[gen] 배경 제거…")
            pil = BackgroundRemover()(pil.convert("RGB"))
        except Exception as e:
            print(f"[gen] 배경 제거 생략({e!r})")
            pil = pil.convert("RGBA")

    print("[gen] 형상 생성(DiT)…")
    mesh = _run(torch, lambda: shape(image=pil)[0])

    out = str(Path(args.out))
    Path(out).parent.mkdir(parents=True, exist_ok=True)

    if args.skip_paint:
        mesh.export(out)
        print(f"[gen] 형상-전용 완료 → {out}")
        return

    # 형상 파이프라인 해제 후 텍스처 로드 (VRAM 절약)
    del shape
    gc.collect()
    if dev == "cuda":
        torch.cuda.empty_cache()

    from textureGenPipeline import Hunyuan3DPaintPipeline, Hunyuan3DPaintConfig
    print("[gen] 텍스처(PBR) 파이프라인 로드…")
    conf = Hunyuan3DPaintConfig(args.views, args.resolution)
    conf.realesrgan_ckpt_path = "hy3dpaint/ckpt/RealESRGAN_x4plus.pth"
    conf.multiview_cfg_path = "hy3dpaint/cfgs/hunyuan-paint-pbr.yaml"
    conf.custom_pipeline = "hy3dpaint/hunyuanpaintpbr"
    paint = Hunyuan3DPaintPipeline(conf)

    shape_tmp = f"/tmp/hy3d_shape_{int(time.time())}.glb"
    mesh.export(shape_tmp)
    print("[gen] 텍스처 생성…")
    # ★ paint 파이프라인은 output_mesh_path 를 .obj 로 받아 OBJ 저장 후 .obj→.glb 변환한다.
    #   (.glb 를 넘기면 OBJ 내용이 .glb 이름으로 저장돼 깨짐)
    out_obj = str(Path(out).with_suffix(".obj"))
    _run(torch, lambda: paint(mesh_path=shape_tmp, image_path=args.image, output_mesh_path=out_obj))
    produced_glb = out_obj[:-4] + ".glb"
    if produced_glb != out and Path(produced_glb).exists():
        import shutil
        shutil.move(produced_glb, out)
    result = out if Path(out).exists() else produced_glb
    print(f"[gen] PBR 완료 → {result}")


if __name__ == "__main__":
    main()
