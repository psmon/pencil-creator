#!/usr/bin/env bash
# 컨테이너 진입점 — ROCm/torch 라이브러리 경로를 구성하고 gen.py 실행.
set -e

SP=$(python3 -c "import site;print(site.getsitepackages()[0])")

# torch 번들 ROCm(_rocm_sdk_*)의 모든 .so 디렉토리 + torch/lib + WSL GPU shim 을 LD 경로에 추가
LIBDIRS=$(find "$SP/_rocm_sdk_core" "$SP/_rocm_sdk_libraries_gfx1151" "$SP/torch/lib" -type d 2>/dev/null \
  | while read -r d; do ls "$d"/*.so* >/dev/null 2>&1 && echo "$d"; done | sort -u | tr '\n' ':')

# ★ WSL GPU 접근: torch 번들 libhsa 는 네이티브(KFD)용이라 /dev/dxg 를 못 쓴다.
#   호스트의 WSL 패치 ROCm 런타임(librocdxg + WSL libhsakmt)을 마운트받아 최우선으로 올린다.
#   (docker.ps1 이 아래 고정 경로로 호스트 libs 를 마운트한다)
WSL_ROCM=""
[ -d /opt/rocm-host/lib ] && WSL_ROCM="/opt/rocm-host/lib:"
[ -d /opt/wsl-hsakmt ]    && WSL_ROCM="${WSL_ROCM}/opt/wsl-hsakmt:"
export LD_LIBRARY_PATH="${WSL_ROCM}${LIBDIRS}/usr/lib/wsl/lib:${LD_LIBRARY_PATH}"

# Ollama 등이 남겼을 수 있는 장치 숨김 해제 (컨테이너엔 보통 없지만 방어적으로)
if [ "${HIP_VISIBLE_DEVICES:-}" = "-1" ] || [ -z "${HIP_VISIBLE_DEVICES:-}" ]; then
  export HIP_VISIBLE_DEVICES=0
fi

# ★ MIOpen(gfx1151): conv 성능 DB/CK 커널 누락 + WSL 커널 타이밍 실패(elapsed<=0)로
#   벤치마킹 기반 FIND 가 죽는다. immediate-fallback(FAST) 모드로 벤치마킹을 건너뛰게 한다.
export MIOPEN_FIND_MODE=${MIOPEN_FIND_MODE:-2}
export MIOPEN_DEBUG_CONV_IMMED_FALLBACK=${MIOPEN_DEBUG_CONV_IMMED_FALLBACK:-1}
# MIOpen 사용자 DB 캐시(쓰기 가능 위치) — 튜닝 결과 저장/재사용
export MIOPEN_USER_DB_PATH=${MIOPEN_USER_DB_PATH:-/root/.cache/miopen}
export MIOPEN_CUSTOM_CACHE_DIR=${MIOPEN_CUSTOM_CACHE_DIR:-/root/.cache/miopen}
mkdir -p "$MIOPEN_USER_DB_PATH" 2>/dev/null || true

# ★ gfx1151 attention(SDPA): Flash/Mem-efficient 커널이 기본 비활성 → "No available kernel".
#   AOTriton 실험 커널 활성화(DINOv2 이미지 인코더 등에서 필요).
export TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL=${TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL:-1}

# ★ custom_rasterizer(HIP)는 호스트 WSL ROCm 7.2.4(.so.7 + dev 헤더)로만 빌드 가능
#   (apt ROCm 은 .so.6 → torch 나이틀리 .so.7 과 불일치). 런타임에 빌드하고 /cr-cache 볼륨에 캐시.
build_custom_rasterizer() {
  # 이미 로드되면 스킵
  if python3 -c "import custom_rasterizer_kernel" 2>/dev/null; then return 0; fi
  if [ ! -d /opt/rocm-host ]; then
    echo "[entrypoint] /opt/rocm-host 미마운트 → custom_rasterizer 빌드 불가(형상-전용만 가능)"; return 1
  fi
  echo "[entrypoint] custom_rasterizer 빌드 (호스트 ROCm 7.2.4, ~1분)…"
  ( cd /app/Hunyuan3D-2.1/hy3dpaint/custom_rasterizer && \
    ROCM_PATH=/opt/rocm-host HIP_PATH=/opt/rocm-host PYTORCH_ROCM_ARCH=gfx1151 \
    PATH=/opt/rocm-host/bin:$PATH \
    pip3 install -e . --no-build-isolation --no-deps ) \
    || { echo "[entrypoint] custom_rasterizer 빌드 실패"; return 1; }
  # 로드 확인 (LD_LIBRARY_PATH 는 이미 최상단에서 설정됨)
  python3 -c "import custom_rasterizer_kernel" 2>/dev/null
}

if [ "${1:-}" = "--diag" ]; then
  build_custom_rasterizer || true
  python3 - <<'PY'
import torch
print("torch", torch.__version__, "hip", torch.version.hip)
print("cuda(HIP) avail:", torch.cuda.is_available(), "count:", torch.cuda.device_count())
if torch.cuda.is_available():
    print("device:", torch.cuda.get_device_name(0))
    x = torch.randn(1024,1024, device="cuda"); print("matmul OK:", float((x@x).sum()) == float((x@x).sum()))
try:
    import custom_rasterizer_kernel; print("custom_rasterizer_kernel OK")
except Exception as e:
    print("custom_rasterizer_kernel FAIL:", repr(e))
PY
  exit 0
fi

# 형상-전용(--skip-paint)이 아니면 custom_rasterizer 준비 (텍스처 파이프라인 필요)
case " $* " in
  *" --skip-paint "*) : ;;
  *) build_custom_rasterizer || echo "[entrypoint] 텍스처 불가 → gen.py 가 형상-전용 폴백할 수 있음" ;;
esac

exec python3 /app/gen.py "$@"
