#!/usr/bin/env python3
"""
LLaMA-Mesh FastAPI 상주 서버 — 모델을 1회 로드해 GPU에 상주, /gen 요청마다 v/f 텍스트 생성.
- 백엔드: transformers(LLaMA-3.1-8B 파인튜닝) on gfx1151 torch(HIP).
- attention: eager(정확성 우선 — gfx1151 SDPA 커널 이슈 회피).
- 출력: 어시스턴트 응답 원문(정점 v / 면 f 라인 포함) → 클라이언트(docker.ps1)가 mesh_from_llm.py 로 .obj 정리.
"""
import os
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_ID = os.environ.get("MODEL_ID", "Zhengyi/LLaMA-Mesh")
PORT = int(os.environ.get("PORT", "8080"))
HF_TOKEN = os.environ.get("HF_TOKEN")  # 게이트 모델일 때만 필요

app = FastAPI(title="llama-mesh-local")
_state = {"ready": False, "model": None, "tok": None, "err": None}


def load():
    print(f"[server] loading {MODEL_ID} …", flush=True)
    kw = {}
    if HF_TOKEN:
        kw["token"] = HF_TOKEN
    tok = AutoTokenizer.from_pretrained(MODEL_ID, **kw)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16,
        device_map="cuda",
        attn_implementation="eager",
        low_cpu_mem_usage=True,
        **kw,
    )
    model.eval()
    _state.update(model=model, tok=tok, ready=True)
    print(f"[server] ready on cuda: {torch.cuda.get_device_name(0)}", flush=True)


class GenReq(BaseModel):
    prompt: str
    max_tokens: int = 4096
    temperature: float = 0.6
    top_p: float = 0.9


@app.on_event("startup")
def _startup():
    try:
        load()
    except Exception as e:
        _state["err"] = repr(e)
        print(f"[server] LOAD FAILED: {e!r}", flush=True)


@app.get("/health")
def health():
    return {"ready": _state["ready"], "model": MODEL_ID, "error": _state["err"]}


@app.post("/gen")
def gen(req: GenReq):
    if not _state["ready"]:
        return {"ok": False, "error": _state["err"] or "model not ready"}
    tok, model = _state["tok"], _state["model"]
    user = f"Create a 3D obj file using the following description: {req.prompt}."
    messages = [{"role": "user", "content": user}]
    enc = tok.apply_chat_template(
        messages, add_generation_prompt=True, return_tensors="pt", return_dict=True
    ).to(model.device)
    in_len = enc["input_ids"].shape[-1]
    with torch.no_grad():
        out = model.generate(
            **enc,
            max_new_tokens=req.max_tokens,
            do_sample=req.temperature > 0,
            temperature=max(req.temperature, 1e-4),
            top_p=req.top_p,
            pad_token_id=tok.eos_token_id,
        )
    text = tok.decode(out[0][in_len:], skip_special_tokens=True)
    return {"ok": True, "text": text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
