# Hunyuan3D Local — 트러블슈팅 (AMD gfx1151)

## 0. 진단 우선순위

```powershell
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage verify   # GPU 인식?
pwsh -File .claude/skills/hunyuan3d-local/scripts/run.ps1 status               # 서버/VRAM 상태
```

`verify` 가 실패 → torch/ROCm 문제(§1). `verify` OK인데 generate 실패 → 커스텀 옵션(§2) 또는 가중치(§3).

---

## 1. torch.cuda(HIP) 사용 불가 / verify 실패

- **Python 버전 불일치**: 휠은 cp312 전용. `venv\Scripts\python.exe --version` 이 3.12인지 확인.
  아니면 `install.ps1 -Stage venv` 재실행.
- **드라이버**: AMD Adrenalin 최신으로. gfx1151은 비교적 최신 드라이버 필요.
- **휠 버전 드리프트**: scottt 릴리스가 갱신되면 URL이 바뀔 수 있음 → `install.ps1` 의 `$Wheels` 갱신 후 `-Stage torch`.
- **segfault on VRAM (ROCm #5853)**: 임의 나이틀리로 바꾸지 말 것. 고정 버전 유지.

---

## 2. custom_rasterizer (HIP 확장) 빌드 실패  ← AMD에서 가장 흔한 벽

`custom_rasterizer` 는 원래 CUDA 확장이라 AMD에선 HIP로 빌드해야 한다. 이게 이 스택의 **취약점**.

### 증상
- `install.ps1 -Stage ops` 에서 `pip install -e ...custom_rasterizer` 가 nvcc/hipcc 관련 오류로 실패.
- generate 시 `텍스처 파이프라인 로드 실패 → 형상-전용으로 진행` 메시지.

### ★ 실측 결과 (2026-08, gfx1151 + HIP SDK 6.4 + torch ROCm 6.5, 네이티브 Windows)
빌드를 단계적으로 밀어붙여 3개 장벽을 넘었으나 **4번째에서 구조적 벽**에 막힘:
1. `/std:c++17` 누락 → setup.py `extra_compile_args={"cxx":["/std:c++17"], ...}` 로 해결
2. `hip/hip_runtime_api.h` 못 찾음 (ninja가 "Program Files" 공백에서 include 경로 잘림)
   → `HIP_PATH` 를 8.3 단축경로(`C:\PROGRA~1\AMD\ROCm\6.4`)로 지정해 공백 제거로 해결
3. hipify 자체는 성공 (`unsupported CUDA calls: 0`, `replaced kernel launches: 3`)
4. **[해결 못 함] MSVC가 AMD HIP 디바이스 헤더를 컴파일 불가**:
   ```
   amd_hip_vector_types.h: error C3861 '__builtin_clz' 식별자 없음
   amd_hip_vector_types.h: error C2146 '__attribute__' 앞에 ';' 없음
   ```
   원인: hipify된 host `.cpp`(rasterizer_hip.cpp, grid_neighbor_hip.cpp)가 HIP 헤더를 include하는데,
   torch cpp_extension은 Windows에서 `.cpp`를 **MSVC**로 컴파일한다. MSVC는 GCC/Clang 전용 빌트인
   (`__builtin_clz`, `__attribute__`)을 못 읽어 AMD 벡터 타입 헤더 파싱 실패.
   → **네이티브 Windows에서 이 확장 빌드는 사실상 불가**. Hunyuan3D-on-AMD 성공 사례는 대부분 Linux ROCm.
   해결하려면 host `.cpp`도 hipcc/clang으로 컴파일해야 하는데 torch가 Windows에서 지원 안 함.

### 결론: PBR 텍스처가 정말 필요하면
- **(권장) 형상-전용 + Blender(blend3d) 프로시저럴 PBR** — 지금 완전 동작. 대부분의 용도에 충분.
- **Linux ROCm 경로**: WSL2/Docker(Ubuntu+ROCm)에서 빌드. 단 WSL2는 Strix Halo 96GB 통합메모리가
  idle로 잡히는 버그(ROCm #6022) 있음 → Docker + `.wslconfig` 메모리 상향으로 완화 시도.
- **대기**: ROCm Windows 확장 빌드 성숙 or Hunyuan측 Windows 지원.

### 폴백 (권장 순서)
1. **형상-전용으로 계속 쓰기** — 대부분의 Case M 자산은 형상만으로도 유용. Blender에서 텍스처/PBR 재현:
   ```powershell
   pwsh -File .../run.ps1 gen --image ref.png --out out.glb --skip-paint
   ```
   → 이후 blend3d 스킬로 프로시저럴 PBR 머티리얼 입히기.
2. **HIP SDK 설치 후 재빌드** — AMD HIP SDK for Windows 설치 → `HIP_PATH` 환경변수 확인 →
   `install.ps1 -Stage ops` 재실행.
3. **PyTorch hipify 경로** — torch가 ROCm 빌드면 `setup.py` 의 `CUDAExtension` 을 hipify가 변환.
   빌드 로그에서 `hipcc` 가 잡히는지 확인. 안 잡히면 HIP SDK bin 이 PATH에 있는지 점검.
4. **CPU 텍스처(최후)** — 매우 느리지만, paint 파이프라인을 CPU로 강제하려면 config.defaults.low_vram
   + 디바이스 강등. 실사용 비권장(수십 분).

### DifferentiableRenderer (CPU C++) 실패
- 이건 CUDA가 아니라 pybind11 CPU 모듈(`compile_mesh_painter.sh`). 실패 원인은 대개 **컴파일러 부재**.
- VS Build Tools 2022(C++ 워크로드) 설치 후 재시도. 또는 Git Bash에서 수동:
  ```bash
  cd $LOCALAPPDATA/hunyuan3d-local/Hunyuan3D-2.1/hy3dpaint/DifferentiableRenderer
  bash compile_mesh_painter.sh
  ```

---

## 3. 가중치(HuggingFace) 다운로드 문제

- 최초 generate 시 `tencent/Hunyuan3D-2.1` 가중치가 자동 다운로드(수 GB). 네트워크/디스크 확인.
- 게이트/속도 문제면 미리:
  ```powershell
  pwsh -File .../install.ps1 -Stage weights -PrefetchWeights
  ```
- HF 캐시 위치: `%USERPROFILE%\.cache\huggingface`. 용량 큰 편.
- RealESRGAN_x4plus.pth 는 `hy3dpaint/ckpt/` 에 있어야 함(`-Stage weights` 가 처리).

---

## 4. VRAM / 메모리

- Strix Halo는 통합메모리라 물리적 부족은 드묾. 그래도 다른 앱이 많이 점유하면 OOM 가능.
- **회수 확인**: `run.ps1 unload` 후 `run.ps1 status` 의 `vram.allocated_mb` 가 크게 떨어지는지 확인.
- one-shot(`gen` 서버 없이)은 프로세스 종료로 전량 반납 → 가장 확실한 회수.
- ROCR busy-spin(코어 1개 100%)이 거슬리면 유휴 시 `stop` 으로 서버 종료.

---

## 5. text→3D (t2i) 체인 문제

- `--prompt` 사용 시 config.t2i_cmd(기본: 프로젝트 image-gen.py, pythoncore-3.14)가 실행됨.
- image-gen 환경/키(Gemini 등) 문제로 실패하면 → **참조 이미지를 직접 만들어 `--image` 로 전달**.
- t2i 프롬프트는 "단일 오브젝트, 중앙, 단색 배경, 제품샷"이 3D 변환 품질에 유리(config 템플릿에 반영됨).

---

## 6. 서버가 안 뜸 / 응답 없음

- 로그: `%LOCALAPPDATA%\hunyuan3d-local\logs\server.err.log`
- 포트 충돌: config.server.port(기본 8781) 변경.
- 방화벽: localhost 루프백이라 보통 무관하나, 보안 SW가 막으면 예외 추가.

---

## 7. API 드리프트 (리포 업데이트로 함수 시그니처 변경 시)

`hy3d.py` 의 Hunyuan3D 호출부는 2025년 리포 기준:
- 형상: `Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(repo, subfolder=...)` → `pipe(image=...)[0]`
- 텍스처: `Hunyuan3DPaintPipeline(Hunyuan3DPaintConfig(max_num_view, resolution))` → `pipe(mesh_path, image_path=...)`
- 배경제거: `hy3dshape.rembg.BackgroundRemover` (있으면 사용, 없으면 생략)

리포가 바뀌어 시그니처가 달라지면 `hy3d.py` 의 `HY3DEngine.load()/generate()` 만 수정하면 된다.
(서버·CLI·회수 로직은 그대로 재사용.)
