# Hunyuan3D-2.1 — Linux ROCm(WSL2) Docker 이미지 (gfx1151 / Strix Halo)
# PBR 텍스처 풀 파이프라인용. 네이티브 Windows는 MSVC가 HIP 디바이스 헤더를 못 컴파일해서
# custom_rasterizer 빌드가 불가 → Linux(WSL2 Docker)에서는 hipcc로 정상 빌드된다.
#
# 런타임 GPU: torch gfx1151 나이틀리(rocm_sdk 번들, 자기완결) + --device=/dev/dxg + /usr/lib/wsl.
# 빌드 전용: custom_rasterizer(.hip)는 dev 헤더/device-libs가 필요 → apt로 ROCm dev SDK 설치.
#   (torch 번들은 런타임 전용이라 hipblas/hipsparse/thrust 헤더·bitcode가 없음)
# 레이어 순서: 무거운 torch/deps 를 먼저(캐시 안정), ROCm dev + custom_rasterizer 를 뒤에(반복 빌드 대비).
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_BREAK_SYSTEM_PACKAGES=1
ENV PIP_NO_CACHE_DIR=1

# 런타임/빌드 공통 라이브러리 (torch 로드용 libelf/libnuma/libdrm + 빌드 도구 + gnupg)
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip python3-dev python3-venv git wget ca-certificates gnupg \
      build-essential cmake \
      libelf1 libnuma1 libdrm2 libgomp1 pciutils kmod \
      libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# gfx1151 torch (self-contained ROCm 7.13 런타임). 런타임 GPU 연산은 이 번들이 담당.
RUN pip3 install --index-url https://rocm.nightlies.amd.com/v2/gfx1151/ torch torchvision
RUN pip3 install "numpy<2" ninja pybind11

# Hunyuan3D-2.1
WORKDIR /app
RUN git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git
WORKDIR /app/Hunyuan3D-2.1

# --- 형상 파이프라인 코어 의존성 (버전 민감한 것은 원본 핀 유지) ---
RUN pip3 install \
      transformers==4.46.0 diffusers==0.30.0 accelerate==1.1.1 \
      huggingface-hub==0.30.2 safetensors==0.4.4 hf_xet \
      scipy==1.14.1 einops==0.8.0 omegaconf==2.3.0 pyyaml==6.0.2 \
      tqdm==4.66.5 psutil==6.0.0 \
      trimesh==4.4.7 pygltflib==1.16.3 \
      opencv-python==4.10.0.84 imageio==2.36.0 pillow torchdiffeq

# --- 텍스처(PBR) 파이프라인 의존성 (best-effort) ---
RUN pip3 install \
      rembg onnxruntime scikit-image==0.24.0 xatlas==0.0.9 pymeshlab \
      realesrgan basicsr || echo "[warn] 일부 paint 의존성 실패(런타임에 확인)"
RUN pip3 install "numpy<2"

# --- DifferentiableRenderer (CPU pybind) — 컨테이너엔 python 심볼릭·numpy include가 없어
#     원본 compile_mesh_painter.sh 가 실패하므로 명시적 컴파일로 대체 ---
RUN cd hy3dpaint/DifferentiableRenderer && \
    c++ -O3 -Wall -shared -std=c++11 -fPIC \
      $(python3 -m pybind11 --includes) \
      -I"$(python3 -c 'import numpy;print(numpy.get_include())')" \
      mesh_inpaint_processor.cpp \
      -o "mesh_inpaint_processor$(python3-config --extension-suffix)"

# --- bpy 제거 패치: Python 3.12 엔 bpy(Blender) 휠이 없음(torch 휠이 cp312 강제) ---
# mesh_utils.py 는 bpy 를 convert_obj_to_glb(최종 OBJ→GLB)에서만 사용 → trimesh 로 대체.
# 나머지 PBR 텍스처 생성은 bpy 불필요(numpy/cv2). import bpy 를 스텁, 함수는 append 로 재정의.
RUN sed -i 's/^import bpy$/bpy = None  # stubbed: no bpy wheel for py3.12 (see append below)/' \
      hy3dpaint/DifferentiableRenderer/mesh_utils.py && \
    cat >> hy3dpaint/DifferentiableRenderer/mesh_utils.py <<'PYEOF'


def convert_obj_to_glb(obj_path, glb_path, shade_type="SMOOTH", auto_smooth_angle=60, merge_vertices=False):
    """bpy 없이 trimesh 로 OBJ(+MTL/텍스처)→GLB. baseColor 텍스처 유지(토온 렌더에 충분).
    metallic/roughness/normal 은 obj 옆 사이드카 파일로 존재(필요 시 Blender에서 결합)."""
    try:
        import trimesh
        scene = trimesh.load(obj_path, process=False)
        scene.export(glb_path)
        return True
    except Exception as e:
        print(f"[mesh_utils] trimesh OBJ->GLB failed: {e}")
        return False
PYEOF

# --- custom_rasterizer 는 이미지에 빌드하지 않는다 ---
# 이유: apt ROCm(6.4/7.2)은 libamdhip64.so.6 이지만 torch 나이틀리는 .so.7 → soname 불일치.
# 오직 호스트 WSL ROCm 7.2.4(.so.7 + 전체 dev 헤더)로 빌드해야 torch 와 일치한다.
# → entrypoint.sh 가 런타임에 마운트된 호스트 /opt/rocm-host 로 custom_rasterizer 를 빌드(1회, 캐시).
#   빌드 도구(ninja/pybind11)와 소스는 이미지에 이미 있음.

# 누락 보강: timm(shape DiT MoE), pytorch_lightning(paint 멀티뷰), kornia, open3d(메시 단순화)
RUN pip3 install timm pytorch-lightning kornia open3d
RUN apt-get update && apt-get install -y --no-install-recommends \
      libopengl0 libegl1 libgles2 libglu1-mesa && rm -rf /var/lib/apt/lists/*

# RealESRGAN 가중치 (paint 업스케일)
RUN mkdir -p hy3dpaint/ckpt && \
    wget -q https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
      -O hy3dpaint/ckpt/RealESRGAN_x4plus.pth || echo "[warn] RealESRGAN 다운로드 실패"

# COPY 두 스크립트 (단일 COPY로 캐시키 갱신) + 빈 파일/CRLF 방어
COPY entrypoint.sh gen.py /app/
RUN sed -i 's/\r$//' /app/entrypoint.sh /app/gen.py && \
    chmod +x /app/entrypoint.sh && \
    test -s /app/entrypoint.sh && test -s /app/gen.py

ENV HF_HOME=/root/.cache/huggingface
# bash 명시 실행 — 셔뱅/exec-format 이슈 회피
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
