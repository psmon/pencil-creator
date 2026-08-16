# LLaMA-Mesh — Linux ROCm(WSL2) Docker 이미지 (gfx1151 / Strix Halo)
# NVIDIA LLaMA-Mesh(= meta-llama/Llama-3.1-8B-Instruct 파인튜닝)를 transformers 로 GPU 추론.
# Hunyuan3D 와 달리 커스텀 HIP 커널/ MIOpen conv 불필요 — 표준 LLM 이라 훨씬 단순.
#
# 런타임 GPU: torch gfx1151 나이틀리(rocm_sdk 번들, 자기완결) + --device=/dev/dxg + /usr/lib/wsl
#   + 호스트 WSL ROCm(librocdxg/libhsakmt) 마운트(entrypoint 가 LD 경로 구성).
# 별도 프로세스: FastAPI(uvicorn) 서버로 모델을 1회 로드해 상주 → gen 요청은 HTTP 로 처리.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_BREAK_SYSTEM_PACKAGES=1
ENV PIP_NO_CACHE_DIR=1

# torch 로드용 런타임 라이브러리(libelf/libnuma/libdrm) + 기본 도구
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip python3-dev git wget curl ca-certificates \
      libelf1 libnuma1 libdrm2 libgomp1 pciutils kmod \
    && rm -rf /var/lib/apt/lists/*

# gfx1151 torch (self-contained ROCm 7.13 런타임). LLM 추론은 이 번들이 담당.
RUN pip3 install --index-url https://rocm.nightlies.amd.com/v2/gfx1151/ torch
RUN pip3 install "numpy<2"

# LLaMA-Mesh 추론 스택 (transformers LLaMA-3.1 지원 버전) + 서버
RUN pip3 install \
      "transformers>=4.45.0" accelerate safetensors \
      huggingface-hub hf_xet sentencepiece \
      fastapi "uvicorn[standard]"

# torch rocm_sdk 프리로드 런타임 의존(libatomic 등) — torch 레이어 뒤라 캐시 재사용
RUN apt-get update && apt-get install -y --no-install-recommends \
      libatomic1 && rm -rf /var/lib/apt/lists/*

# 서버 (파싱은 호스트의 scripts/mesh_from_llm.py 재사용 → 컨테이너엔 서버만)
COPY server.py entrypoint.sh /app/
RUN sed -i 's/\r$//' /app/entrypoint.sh /app/server.py && \
    chmod +x /app/entrypoint.sh && \
    test -s /app/entrypoint.sh && test -s /app/server.py

# HF 캐시(가중치)는 런타임에 G:\Models\hf-cache 를 /hfcache 로 마운트
ENV HF_HOME=/hfcache
ENV MODEL_ID=Zhengyi/LLaMA-Mesh
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
