#!/usr/bin/env python3
"""
LLaMA-Mesh LLM 출력 텍스트 → 유효 .obj 로 정리.
LLaMA-Mesh는 'v x y z'(정수 양자화 좌표)와 'f a b c'(1-index) 를 텍스트로 출력한다.
- 완전한 v/f 라인만 추출(불완전 꼬리 제거)
- 범위 밖 면 인덱스 드롭
- (기본) 좌표를 중심정렬 + 단위 스케일로 정규화 → Unity/Blender 에서 적당한 크기
"""
import argparse, re, sys
from pathlib import Path

V_RE = re.compile(r'^\s*v\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$')
F_RE = re.compile(r'^\s*f\s+(.+?)\s*$')


def parse(text):
    verts, faces = [], []
    for line in text.splitlines():
        mv = V_RE.match(line)
        if mv:
            verts.append(tuple(float(x) for x in mv.groups()))
            continue
        mf = F_RE.match(line)
        if mf:
            idx = []
            ok = True
            for tok in mf.group(1).split():
                # OBJ face token: v 또는 v/vt/vn — 앞의 정수만
                m = re.match(r'^(\d+)', tok)
                if not m:
                    ok = False; break
                idx.append(int(m.group(1)))
            if ok and len(idx) >= 3:
                faces.append(idx)
    return verts, faces


def normalize(verts, target=1.8):
    if not verts:
        return verts
    xs = [v[0] for v in verts]; ys = [v[1] for v in verts]; zs = [v[2] for v in verts]
    cx = (min(xs) + max(xs)) / 2; cy = (min(ys) + max(ys)) / 2; cz = (min(zs) + max(zs)) / 2
    ext = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs), 1e-6)
    s = target / ext
    return [((v[0] - cx) * s, (v[1] - cy) * s, (v[2] - cz) * s) for v in verts]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True, help="LLM 출력 텍스트 파일")
    ap.add_argument("--out", required=True, help="출력 .obj 경로")
    ap.add_argument("--raw", action="store_true", help="좌표 정규화 안 함(원본 정수 유지)")
    ap.add_argument("--name", default="LlamaMesh")
    args = ap.parse_args()

    text = Path(args.inp).read_text(encoding="utf-8", errors="ignore")
    verts, faces = parse(text)
    n = len(verts)
    # 범위 밖/퇴화 면 제거
    faces = [f for f in faces if all(1 <= i <= n for i in f) and len(set(f)) >= 3]
    if n < 3 or not faces:
        print(f"[mesh] 유효 지오메트리 부족 (v={n}, f={len(faces)}) — 재생성 필요", file=sys.stderr)
        sys.exit(2)

    if not args.raw:
        verts = normalize(verts)

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as o:
        o.write(f"# LLaMA-Mesh generated\no {args.name}\n")
        for v in verts:
            o.write("v %.6f %.6f %.6f\n" % v)
        for f in faces:
            o.write("f " + " ".join(str(i) for i in f) + "\n")
    print(f"[mesh] OK → {args.out}  (v={n}, f={len(faces)})")


if __name__ == "__main__":
    main()
