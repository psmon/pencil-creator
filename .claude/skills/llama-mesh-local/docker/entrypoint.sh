#!/usr/bin/env bash
# 컨테이너 진입점 — gfx1151 torch/ROCm LD 경로를 구성하고 FastAPI 서버(또는 --diag) 실행.
set -e

SP=$(python3 -c "import site;print(site.getsitepackages()[0])")

# torch 번들 ROCm(_rocm_sdk_*)의 .so 디렉토리 + torch/lib + WSL GPU shim 을 LD 경로에 추가
LIBDIRS=$(find "$SP/_rocm_sdk_core" "$SP/_rocm_sdk_libraries_gfx1151" "$SP/torch/lib" -type d 2>/dev/null \
  | while read -r d; do ls "$d"/*.so* >/dev/null 2>&1 && echo "$d"; done | sort -u | tr '\n' ':')

# ★ WSL GPU 접근: torch 번들 libhsa 는 네이티브(KFD)용이라 /dev/dxg 를 못 쓴다.
#   호스트의 WSL 패치 ROCm(librocdxg) + WSL libhsakmt 를 마운트받아 최우선으로 올린다.
WSL_ROCM=""
[ -d /opt/rocm-host/lib ] && WSL_ROCM="/opt/rocm-host/lib:"
[ -d /opt/wsl-hsakmt ]    && WSL_ROCM="${WSL_ROCM}/opt/wsl-hsakmt:"
export LD_LIBRARY_PATH="${WSL_ROCM}${LIBDIRS}/usr/lib/wsl/lib:${LD_LIBRARY_PATH}"

# 장치 숨김 해제(Ollama 잔재 방어)
if [ "${HIP_VISIBLE_DEVICES:-}" = "-1" ] || [ -z "${HIP_VISIBLE_DEVICES:-}" ]; then
  export HIP_VISIBLE_DEVICES=0
fi

# ★ gfx1151 attention(SDPA): Flash/Mem-efficient 커널 기본 비활성 → "No available kernel".
#   AOTriton 실험 커널 활성화 + 서버는 안전하게 eager attention 사용(정확성 우선).
export TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL=${TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL:-1}

if [ "${1:-}" = "--diag" ]; then
  python3 - <<'PY'
import torch
print("torch", torch.__version__, "hip", torch.version.hip)
print("cuda(HIP) avail:", torch.cuda.is_available(), "count:", torch.cuda.device_count())
if torch.cuda.is_available():
    print("device:", torch.cuda.get_device_name(0))
    x = torch.randn(2048,2048, device="cuda")
    print("matmul OK:", float((x@x).sum()) == float((x@x).sum()))
PY
  exit 0
fi

# 상주 서버 실행
exec python3 /app/server.py
