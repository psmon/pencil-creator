# ROCm on Strix Halo (gfx1151) — 설치 상세 노트

이 컴퓨터: **AMD Radeon 8060S** = Ryzen AI Max+ 395 "Strix Halo", RDNA 3.5, **gfx1151**, ~96GB 통합 메모리.

## 왜 ROCm인가 (Vulkan 아님)

- Hunyuan3D-2.1 은 **PyTorch** 파이프라인(형상 DiT + 텍스처 페인트 + 커스텀 CUDA/HIP 래스터라이저).
- **PyTorch에는 이 모델을 돌릴 Vulkan 연산 백엔드가 없다.** Vulkan은 llama.cpp류 LLM 추론에만 실용적.
- AMD에서 PyTorch GPU 가속 = **ROCm/HIP**. `torch.cuda.*` API가 HIP로 투명 매핑된다
  (코드는 `cuda` 디바이스명을 그대로 쓰지만 실제로는 gfx1151에서 실행).
- 따라서 이 스킬 백엔드는 **ROCm 네이티브 Windows**.

## 사용 휠 (cp312 전용)

scottt/rocm-TheRock 의 gfx1151 Windows 휠 (ROCm 6.5.0rc, PyTorch 2.7.0a0):

```
torch-2.7.0a0+git3f903c3-cp312-cp312-win_amd64.whl
torchvision-0.22.0+9eb57cd-cp312-cp312-win_amd64.whl
torchaudio-2.6.0a0+1a8f621-cp312-cp312-win_amd64.whl
```

- **cp312 = Python 3.12 필수.** 이 PC엔 3.14/3.11만 있어 `install.ps1` 이 `uv python install 3.12` 로 3.12를 프로비저닝.
- 대안 인덱스(나이틀리): `pip install torch --index-url https://rocm.nightlies.amd.com/v2/gfx1151/`
  (버전이 바뀌면 `install.ps1` 상단 `$Wheels` 를 갱신.)

## 네이티브 Windows vs WSL2

| | 네이티브 Windows (채택) | WSL2 + ROCm |
|---|---|---|
| gfx1151 커널 | TheRock 휠에 내장 | rocm/pytorch 도커 |
| 96GB 통합메모리 | GPU가 대량 사용 가능 | **버그: 전용 GPU 메모리 idle, IOMMU None (ROCm #6022)** |
| 안정성 | 2026 기준 더 안정 | 메모리 제약 |

→ **네이티브 Windows 채택.** WSL2는 통합메모리 활용이 막혀 이 칩엔 불리.

## 알려진 gfx1151 버그 (문서화용)

1. **ROCR AsyncEventsLoop busy-spin** (TheRock #7051): 임의 GPU 연산 후 ROCR 런타임 스레드가
   CPU 코어 1개를 100% 점유한 채 상주. 나이틀리·7.14 프로덕션 휠 모두 재현.
   → 기능엔 문제 없음(성능/발열만). release-channel ROCR 1.18 이 깨끗하다는 보고.
   서버 모드에서 유휴 시 코어 점유가 거슬리면 `stop` 으로 완전 종료.
2. **segfault on VRAM access (구 나이틀리, ROCm #5853)**: 특정 나이틀리에서 VRAM 접근 시 segfault.
   → 위 고정 휠 버전 사용으로 회피. 버전 임의 상향 시 재검증 필요.
3. **bf16 관련 버그 5종 (ROCm #6034)**: gfx1151에서 bf16 정확도/성능 이슈 보고.
   → Hunyuan3D는 기본 fp16/fp32 경로 사용 권장. bf16 강제 옵션 피하기.

## 설치 순서 (install.ps1 이 자동화)

```
prereq  → 드라이버/uv/git/HIP SDK/VS BuildTools 점검
python  → uv python install 3.12
venv    → uv venv --python 3.12  (%LOCALAPPDATA%\hunyuan3d-local\venv)
torch   → gfx1151 휠 3종 --force-reinstall --no-deps
repo    → Hunyuan3D-2.1 clone + requirements(torch 제외) 설치
ops     → DifferentiableRenderer(CPU) + custom_rasterizer(HIP) 빌드
weights → RealESRGAN_x4plus.pth (+ 선택: HF 가중치 프리페치)
config  → config.json 생성
verify  → torch.cuda(HIP) 인식 + GPU matmul 확인
```

## 검증 스니펫

```python
import torch
print(torch.__version__, torch.version.hip)
print(torch.cuda.is_available(), torch.cuda.get_device_name(0))
# 기대: True, "AMD Radeon 8060S ..." (또는 gfx1151 계열 이름)
```

## 통합 메모리 팁

- Strix Halo는 VRAM이 BIOS의 "UMA/Dedicated" 설정에 영향받는다. 통합메모리라 물리 96GB를 공유.
- Hunyuan3D 2.1 풀 파이프라인(~29GB 상당)도 이 메모리로 감당 가능 → **VRAM 부족보다 소프트웨어 안정성이 관건.**
- 그래도 여유가 빠듯하면 `config.defaults.low_vram=true` 또는 `--skip-paint`(형상-전용)로 낮춘다.

## 참고 링크

- scottt/rocm-TheRock gfx1151 휠: https://github.com/scottt/rocm-TheRock/releases/v6.5.0rc-pytorch
- TheRock gfx1151 논의: https://github.com/ROCm/TheRock/discussions/655
- Hunyuan3D-2.1: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1
- Hunyuan3D-2 ROCm(리눅스) 참고 스크립트: https://github.com/yuripourre/Hunyuan3D-2-ROCm
- ComfyUI on Strix Halo(환경 참고): https://github.com/bluemoehre/comfyui-strix-halo
