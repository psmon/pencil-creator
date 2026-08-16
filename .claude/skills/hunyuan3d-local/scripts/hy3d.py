#!/usr/bin/env python
"""
hy3d.py — Hunyuan3D-2.1 로컬 런타임 (AMD Strix Halo / gfx1151, ROCm).

한 파일로 엔진 + 서버 + 클라이언트 + CLI 를 제공한다.
서브커맨드:
  serve                     상주 서버 기동 (config.server.port)
  load  [--skip-paint]      서버에 파이프라인 로드 (GPU)
  gen   --image|--prompt    3D 생성 (서버가 살아있으면 위임, 없으면 one-shot)
  status                    로드 상태 + VRAM
  unload                    ★ 파이프라인 해제 + VRAM 회수 (서버는 유지)
  stop                      서버 완전 종료 (프로세스 종료 = 전량 반납)

핵심 설계:
  - 무거운 import(torch, hunyuan)는 엔진 load 시점까지 지연 → status/stop 등 클라이언트 명령은 stdlib만.
  - one-shot 모드는 프로세스 종료로 자동 회수. 서버 모드는 unload 로 명시적 회수.
"""
from __future__ import annotations
import argparse, json, os, sys, gc, time, tempfile, subprocess, urllib.request, urllib.error
from pathlib import Path

# --- HIP 장치 가시성 정규화 -------------------------------------------------
# 이 시스템은 Ollama 등이 HIP_VISIBLE_DEVICES=-1(전 장치 숨김)을 걸어둘 수 있다.
# torch import 전에 gfx1151(8060S)을 다시 보이게 한다. (사용자가 유효값을 주면 존중)
def _normalize_hip_visibility():
    v = os.environ.get("HIP_VISIBLE_DEVICES")
    if v is None or v.strip() in ("", "-1"):
        os.environ["HIP_VISIBLE_DEVICES"] = "0"
_normalize_hip_visibility()

# ----------------------------------------------------------------------------- config
def default_config_path() -> Path:
    return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "hunyuan3d-local" / "config.json"

def load_config(path: Path | None = None) -> dict:
    p = path or default_config_path()
    if not p.exists():
        sys.exit(f"[hy3d] config.json 없음: {p}\n먼저 install.ps1 -Stage all 을 실행하세요.")
    return json.loads(p.read_text(encoding="utf-8"))

# ----------------------------------------------------------------------------- engine
class HY3DEngine:
    """형상(shape) + 텍스처(paint) 파이프라인을 지연 로드/해제한다."""
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.shape = None
        self.paint = None
        self._torch = None
        self._prepared = False

    # 무거운 의존성은 여기서만 import (경로/순서는 리포 demo.py 기준)
    def _prepare_env(self):
        if self._prepared:
            return
        repo = self.cfg["repo_dir"]
        # 상대경로(ckpt, cfgs yaml, custom_pipeline) 해결을 위해 리포 루트로 이동
        os.chdir(repo)
        # 패키지가 hy3dshape/hy3dshape, hy3dpaint 아래에 중첩 → 세 경로 모두 추가
        for p in (repo, str(Path(repo) / "hy3dshape"), str(Path(repo) / "hy3dpaint")):
            if p not in sys.path:
                sys.path.insert(0, p)
        import torch  # noqa
        self._torch = torch
        # 신구 torchvision(functional_tensor 이동) 호환 패치
        try:
            from torchvision_fix import apply_fix
            apply_fix()
        except Exception as e:
            print(f"[hy3d] torchvision_fix 미적용({e!r}) — 계속 진행.")
        self._prepared = True

    @property
    def device(self) -> str:
        return "cuda" if (self._torch and self._torch.cuda.is_available()) else "cpu"

    def load(self, want_paint: bool = True):
        self._prepare_env()
        t = self._torch
        if not t.cuda.is_available():
            print("[hy3d] 경고: torch.cuda(HIP) 사용 불가 → CPU로 실행(느림).")
        m = self.cfg["models"]
        if self.shape is None:
            from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline
            print("[hy3d] 형상 파이프라인 로드…")
            self.shape = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(m["shape_repo"])
        if want_paint and self.paint is None:
            try:
                from textureGenPipeline import Hunyuan3DPaintPipeline, Hunyuan3DPaintConfig
                d = self.cfg.get("defaults", {})
                print("[hy3d] 텍스처(PBR) 파이프라인 로드…")
                conf = Hunyuan3DPaintConfig(int(d.get("views", 6)), int(d.get("resolution", 512)))
                conf.realesrgan_ckpt_path = "hy3dpaint/ckpt/RealESRGAN_x4plus.pth"
                conf.multiview_cfg_path   = "hy3dpaint/cfgs/hunyuan-paint-pbr.yaml"
                conf.custom_pipeline      = "hy3dpaint/hunyuanpaintpbr"
                self.paint = Hunyuan3DPaintPipeline(conf)
            except Exception as e:
                print(f"[hy3d] 텍스처 파이프라인 로드 실패({e!r}) → 형상-전용으로 진행.")
                print("       custom_rasterizer(HIP) 빌드 여부를 troubleshooting.md 로 확인하세요.")
                self.paint = None
        return self.status()

    def unload(self) -> dict:
        """파이프라인 해제 + VRAM 회수. (사용자 요청: 다 쓰고 회수)"""
        self.shape = None
        self.paint = None
        gc.collect()
        if self._torch is not None and self._torch.cuda.is_available():
            self._torch.cuda.empty_cache()
            try:
                self._torch.cuda.ipc_collect()
            except Exception:
                pass
        gc.collect()
        print("[hy3d] 파이프라인 해제 + VRAM 회수 완료.")
        return self.status()

    def status(self) -> dict:
        vram = {}
        if self._torch is not None and self._torch.cuda.is_available():
            vram = {
                "allocated_mb": round(self._torch.cuda.memory_allocated() / 1e6, 1),
                "reserved_mb":  round(self._torch.cuda.memory_reserved() / 1e6, 1),
                "device": self._torch.cuda.get_device_name(0),
            }
        return {
            "shape_loaded": self.shape is not None,
            "paint_loaded": self.paint is not None,
            "device": self.device if self._torch else "unknown",
            "vram": vram,
        }

    def generate(self, image_path: str, out_path: str, skip_paint: bool = False,
                 seed: int | None = None) -> str:
        """참조 이미지 → 3D 메시(GLB). skip_paint면 형상-전용."""
        self.load(want_paint=not skip_paint)
        t = self._torch
        if seed is not None:
            try:
                t.manual_seed(seed)
                if t.cuda.is_available():
                    t.cuda.manual_seed_all(seed)
            except Exception:
                pass

        from PIL import Image
        # 형상은 PIL 이미지 입력(demo.py 기준). 알파가 없으면 배경 제거로 RGBA 확보.
        pil = Image.open(image_path)
        if pil.mode != "RGBA":
            try:
                from hy3dshape.rembg import BackgroundRemover  # type: ignore
                print("[hy3d] 배경 제거 적용…")
                pil = BackgroundRemover()(pil.convert("RGB"))
            except Exception as e:
                print(f"[hy3d] 배경 제거 생략({e!r}) — RGBA 변환만.")
                pil = pil.convert("RGBA")

        print("[hy3d] 형상 생성(DiT)…")
        mesh = self.shape(image=pil)[0]

        out_path = str(Path(out_path).resolve())
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)

        if skip_paint or self.paint is None:
            print(f"[hy3d] 형상-전용 내보내기 → {out_path}")
            mesh.export(out_path)
            return out_path

        # 텍스처 파이프라인은 mesh 파일 경로 + 참조 이미지 경로 → 출력 GLB 경로 반환
        shape_tmp = str(Path(tempfile.gettempdir()) / f"hy3d_shape_{int(time.time())}.glb")
        mesh.export(shape_tmp)
        print("[hy3d] 텍스처(PBR) 생성…")
        produced = self.paint(
            mesh_path=shape_tmp,
            image_path=str(Path(image_path).resolve()),
            output_mesh_path=out_path,
        )
        result = produced if isinstance(produced, str) and Path(produced).exists() else out_path
        print(f"[hy3d] 완료 → {result}")
        return result

# ----------------------------------------------------------------------------- text→image (t2i) 체인
def run_t2i(cfg: dict, prompt: str) -> str:
    tmpl = cfg.get("t2i_cmd")
    if not tmpl:
        sys.exit("[hy3d] --prompt 를 주었지만 config.t2i_cmd 가 없습니다. --image 로 참조 이미지를 직접 주세요.")
    image_out = str(Path(tempfile.gettempdir()) / f"hy3d_t2i_{int(time.time())}.png")
    cmd = [str(a).replace("{prompt}", prompt).replace("{image_out}", image_out) for a in tmpl]
    print(f"[hy3d] t2i 실행: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    if not Path(image_out).exists():
        sys.exit(f"[hy3d] t2i 산출 이미지 없음: {image_out}")
    return image_out

# ----------------------------------------------------------------------------- HTTP 서버
def serve(cfg: dict):
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    engine = HY3DEngine(cfg)
    host = cfg["server"]["host"]; port = int(cfg["server"]["port"])

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):  # 조용히
            pass
        def _send(self, obj, code=200):
            body = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def _read(self) -> dict:
            n = int(self.headers.get("Content-Length", 0) or 0)
            return json.loads(self.rfile.read(n) or b"{}")
        def do_GET(self):
            if self.path == "/status":
                self._send(engine.status())
            elif self.path == "/ping":
                self._send({"ok": True})
            else:
                self._send({"error": "not found"}, 404)
        def do_POST(self):
            try:
                data = self._read()
                if self.path == "/load":
                    self._send(engine.load(want_paint=not data.get("skip_paint", False)))
                elif self.path == "/unload":
                    self._send(engine.unload())
                elif self.path == "/generate":
                    out = engine.generate(
                        image_path=data["image"], out_path=data["out"],
                        skip_paint=data.get("skip_paint", False), seed=data.get("seed"),
                    )
                    self._send({"out": out, "status": engine.status()})
                elif self.path == "/shutdown":
                    self._send({"ok": True})
                    import threading
                    threading.Thread(target=self.server.shutdown, daemon=True).start()
                else:
                    self._send({"error": "not found"}, 404)
            except Exception as e:
                self._send({"error": repr(e)}, 500)

    srv = ThreadingHTTPServer((host, port), Handler)
    print(f"[hy3d] 서버 기동 http://{host}:{port}  (load/generate/unload/status/shutdown)")
    try:
        srv.serve_forever()
    finally:
        engine.unload()
        print("[hy3d] 서버 종료 — VRAM 반납 완료.")

# ----------------------------------------------------------------------------- 클라이언트
def _url(cfg: dict, path: str) -> str:
    s = cfg["server"]
    return f"http://{s['host']}:{int(s['port'])}{path}"

def server_up(cfg: dict) -> bool:
    try:
        with urllib.request.urlopen(_url(cfg, "/ping"), timeout=1.0) as r:
            return r.status == 200
    except Exception:
        return False

def call(cfg: dict, path: str, payload: dict | None = None, method="POST", timeout=3600):
    data = json.dumps(payload or {}).encode("utf-8") if method == "POST" else None
    req = urllib.request.Request(_url(cfg, path), data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read() or b"{}")

# ----------------------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser(prog="hy3d", description="Hunyuan3D-2.1 로컬 런타임 (gfx1151/ROCm)")
    ap.add_argument("--config", type=Path, default=None)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("serve")
    p_load = sub.add_parser("load");   p_load.add_argument("--skip-paint", action="store_true")
    sub.add_parser("status")
    sub.add_parser("unload")
    sub.add_parser("stop")

    p_gen = sub.add_parser("gen")
    p_gen.add_argument("--image")
    p_gen.add_argument("--prompt")
    p_gen.add_argument("--out", default="out.glb")
    p_gen.add_argument("--skip-paint", action="store_true")
    p_gen.add_argument("--seed", type=int, default=None)
    p_gen.add_argument("--no-server", action="store_true", help="서버 무시하고 one-shot 실행")

    args = ap.parse_args()
    cfg = load_config(args.config)

    if args.cmd == "serve":
        serve(cfg); return

    if args.cmd == "status":
        print(json.dumps(call(cfg, "/status", method="GET") if server_up(cfg)
                         else {"server": "down"}, indent=2, ensure_ascii=False)); return

    if args.cmd == "load":
        if not server_up(cfg):
            sys.exit("[hy3d] 서버가 없습니다. 먼저 'serve' 로 기동하세요.")
        print(json.dumps(call(cfg, "/load", {"skip_paint": args.skip_paint}), indent=2, ensure_ascii=False)); return

    if args.cmd == "unload":
        if not server_up(cfg):
            print("[hy3d] 서버 없음 — 회수할 상주 모델 없음(one-shot은 종료 시 자동 회수)."); return
        print(json.dumps(call(cfg, "/unload"), indent=2, ensure_ascii=False)); return

    if args.cmd == "stop":
        if not server_up(cfg):
            print("[hy3d] 서버 없음."); return
        call(cfg, "/shutdown"); print("[hy3d] 서버 종료 요청 완료."); return

    if args.cmd == "gen":
        if not args.image and not args.prompt:
            sys.exit("[hy3d] --image 또는 --prompt 중 하나는 필요합니다.")
        image = args.image or run_t2i(cfg, args.prompt)

        use_server = server_up(cfg) and not args.no_server
        if use_server:
            print("[hy3d] 상주 서버로 위임(모델 재사용).")
            res = call(cfg, "/generate", {
                "image": str(Path(image).resolve()), "out": args.out,
                "skip_paint": args.skip_paint, "seed": args.seed,
            })
            print(json.dumps(res, indent=2, ensure_ascii=False))
        else:
            print("[hy3d] one-shot 실행(종료 시 자동 회수).")
            eng = HY3DEngine(cfg)
            try:
                out = eng.generate(image, args.out, skip_paint=args.skip_paint, seed=args.seed)
                print(json.dumps({"out": out}, indent=2, ensure_ascii=False))
            finally:
                eng.unload()
        return

if __name__ == "__main__":
    main()
